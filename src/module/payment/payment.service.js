import mongoose from "mongoose";
import createError from "http-errors";
import { createHmac, timingSafeEqual } from "node:crypto";
import razorpayInstance from "../../config/rajorpay.js";
import rentalHistoryModel from "../../models/rentHistoryModel.js";
import orderModel from "../../models/orderModel.js";
import paymentModel from "../../models/paymentModel.js";
import assetModel from "../../models/assetModel.js";

export const createPaymentOrder_Service = async ({
  userId,
  assetId,
  amount,
  duration,
}) => {
  // ---------------------------------------
  // VALIDATION
  // ---------------------------------------

  if (!userId) {
    throw createError(401, "User authentication is required.");
  }

  if (!mongoose.Types.ObjectId.isValid(assetId)) {
    throw createError(400, "Invalid Asset ID.");
  }

  if (amount === undefined || amount === null || amount === "") {
    throw createError(400, "Rental amount is required.");
  }

  if (duration === undefined || duration === null || duration === "") {
    throw createError(400, "Rental duration is required.");
  }

  // ---------------------------------------
  // NORMALIZE VALUES
  // ---------------------------------------

  const totalAmount = Number(amount);

  const rentalDurationMonths = Number(duration);

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw createError(400, "Invalid rental amount.");
  }

  if (!Number.isInteger(rentalDurationMonths) || rentalDurationMonths <= 0) {
    throw createError(400, "Rental duration must be a valid number of months.");
  }

  // Optional maximum rental duration
  if (rentalDurationMonths > 36) {
    throw createError(400, "Rental duration cannot exceed 36 months.");
  }

  // ---------------------------------------
  // GET ASSET
  // ---------------------------------------

  const asset = await assetModel.findById(assetId).lean();

  if (!asset) {
    throw createError(404, "Asset not found.");
  }

  // ---------------------------------------
  // RENTAL DATE CALCULATION
  // ---------------------------------------

  const rentalStartDate = new Date();

  const rentalEndDate = new Date(rentalStartDate);

  rentalEndDate.setMonth(rentalEndDate.getMonth() + rentalDurationMonths);

  // ---------------------------------------
  // RAZORPAY AMOUNT
  // ---------------------------------------

  // Razorpay amount must be in paise
  const amountInPaise = Math.round(totalAmount * 100);

  // ---------------------------------------
  // PAYMENT ORDER EXPIRY
  // 15 minutes
  // ---------------------------------------

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  let internalOrder = null;

  try {
    // ---------------------------------------
    // CREATE INTERNAL ORDER
    // ---------------------------------------

    internalOrder = await orderModel.create({
      userId,

      assetId,

      totalAmount,

      currency: "INR",

      rentalDurationMonths,

      rentalStartDate,

      rentalEndDate,

      expiresAt,

      status: "PENDING_PAYMENT",
    });

    // ---------------------------------------
    // CREATE RAZORPAY ORDER
    // ---------------------------------------

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: amountInPaise,

      currency: "INR",

      receipt: `rent_${internalOrder._id}`,

      notes: {
        app: "BUNNDLE_RENT",

        internalOrderId: internalOrder._id.toString(),

        userId: userId.toString(),

        assetId: assetId.toString(),

        durationMonths: rentalDurationMonths.toString(),

        paymentType: "ASSET_RENT",
      },
    });

    // ---------------------------------------
    // SAVE RAZORPAY ORDER ID
    // ---------------------------------------

    internalOrder.razorpayOrderId = razorpayOrder.id;

    await internalOrder.save();

    // ---------------------------------------
    // CREATE PAYMENT RECORD
    // ---------------------------------------

    const payment = await paymentModel.create({
      userId,

      orderId: internalOrder._id,

      assetId,

      razorpayOrderId: razorpayOrder.id,

      amount: totalAmount,

      currency: "INR",

      status: "PENDING",

      webhookVerified: false,
    });

    // ---------------------------------------
    // RESPONSE
    // ---------------------------------------

    return {
      success: true,

      message: "Payment order created successfully.",

      data: {
        orderId: internalOrder._id,

        paymentId: payment._id,

        razorpayOrderId: razorpayOrder.id,

        keyId: process.env.RAZORPAY_KEY_ID,

        // Paise - Razorpay Checkout
        amount: razorpayOrder.amount,

        // Rupees - display
        displayAmount: totalAmount,

        currency: razorpayOrder.currency,

        duration: rentalDurationMonths,

        durationUnit: "MONTH",

        rentalStartDate,

        rentalEndDate,

        expiresAt,

        asset: {
          _id: asset._id,

          assetName: asset.assetName,

          brand: asset.brand,

          model: asset.model,
        },
      },
    };
  } catch (error) {
    // ---------------------------------------
    // MARK ORDER FAILED
    // ---------------------------------------

    if (internalOrder?._id) {
      await orderModel.findByIdAndUpdate(internalOrder._id, {
        status: "FAILED",
      });
    }

    throw error;
  }
};

export const verifyPaymentOrder_Service = async ({
  userId,
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  // ---------------------------------------
  // VALIDATION
  // ---------------------------------------

  if (!userId) {
    throw createError(401, "User authentication is required.");
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw createError(400, "Razorpay payment details are required.");
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw createError(500, "Razorpay configuration is missing.");
  }

  // ---------------------------------------
  // FIND PAYMENT FROM DATABASE
  // ---------------------------------------

  const payment = await paymentModel.findOne({
    razorpayOrderId: razorpay_order_id,
    userId,
  });

  if (!payment) {
    throw createError(404, "Payment order not found.");
  }

  // ---------------------------------------
  // IDEMPOTENT CHECK
  // Already successfully verified
  // ---------------------------------------

  if (payment.status === "SUCCESS") {
    if (payment.razorpayPaymentId === razorpay_payment_id) {
      return {
        success: true,

        message: "Payment already verified successfully.",

        data: {
          orderId: payment.orderId,

          paymentId: payment._id,

          razorpayOrderId: payment.razorpayOrderId,

          razorpayPaymentId: payment.razorpayPaymentId,

          paymentStatus: payment.status,
        },
      };
    }

    throw createError(
      409,
      "This order has already been paid using another payment.",
    );
  }

  // ---------------------------------------
  // GET INTERNAL ORDER
  // ---------------------------------------

  const internalOrder = await orderModel.findOne({
    _id: payment.orderId,
    userId,
  });

  if (!internalOrder) {
    throw createError(404, "Internal order not found.");
  }

  // ---------------------------------------
  // SERVER STORED RAZORPAY ORDER ID
  // ---------------------------------------

  const serverOrderId = payment.razorpayOrderId;

  if (!serverOrderId) {
    throw createError(400, "Razorpay order ID is missing from payment record.");
  }

  // Frontend order must match server order
  if (razorpay_order_id !== serverOrderId) {
    throw createError(400, "Razorpay order mismatch.");
  }

  // ---------------------------------------
  // CREATE EXPECTED SIGNATURE
  //
  // order_id|payment_id
  // ---------------------------------------

  const generatedSignature = createHmac(
    "sha256",
    process.env.RAZORPAY_KEY_SECRET,
  )
    .update(`${serverOrderId}|${razorpay_payment_id}`)
    .digest("hex");

  // ---------------------------------------
  // SECURE SIGNATURE COMPARISON
  // ---------------------------------------

  const generatedBuffer = Buffer.from(generatedSignature, "utf8");

  const receivedBuffer = Buffer.from(razorpay_signature, "utf8");

  const isSignatureValid =
    generatedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(generatedBuffer, receivedBuffer);

  if (!isSignatureValid) {
    throw createError(400, "Payment signature verification failed.");
  }

  // ---------------------------------------
  // FETCH PAYMENT DIRECTLY FROM RAZORPAY
  // ---------------------------------------

  let razorpayPayment;

  try {
    razorpayPayment =
      await razorpayInstance.payments.fetch(razorpay_payment_id);
  } catch (error) {
    throw createError(400, "Unable to fetch payment details from Razorpay.");
  }

  if (!razorpayPayment) {
    throw createError(400, "Unable to verify payment with Razorpay.");
  }

  // ---------------------------------------
  // VERIFY PAYMENT ID
  // ---------------------------------------

  if (razorpayPayment.id !== razorpay_payment_id) {
    throw createError(400, "Razorpay payment ID mismatch.");
  }

  // ---------------------------------------
  // VERIFY ORDER ID
  // ---------------------------------------

  if (razorpayPayment.order_id !== serverOrderId) {
    throw createError(400, "Payment does not belong to this order.");
  }

  // ---------------------------------------
  // VERIFY AMOUNT
  //
  // MongoDB amount = rupees
  // Razorpay amount = paise
  // ---------------------------------------

  const expectedAmountInPaise = Math.round(Number(payment.amount) * 100);

  if (Number(razorpayPayment.amount) !== expectedAmountInPaise) {
    throw createError(400, "Payment amount mismatch.");
  }

  // ---------------------------------------
  // VERIFY CURRENCY
  // ---------------------------------------

  if (razorpayPayment.currency !== payment.currency) {
    throw createError(400, "Payment currency mismatch.");
  }

  // ---------------------------------------
  // VERIFY CAPTURE
  // ---------------------------------------

  if (razorpayPayment.status !== "captured") {
    throw createError(
      400,
      `Payment is not captured. Current status: ${razorpayPayment.status}`,
    );
  }

  // ---------------------------------------
  // CALCULATE ACTUAL RENTAL PERIOD
  //
  // Start rental AFTER payment succeeds.
  // ---------------------------------------

  const rentalStartDate = new Date();

  const rentalEndDate = new Date(rentalStartDate);

  rentalEndDate.setMonth(
    rentalEndDate.getMonth() + internalOrder.rentalDurationMonths,
  );

  const paidAt = new Date();

  // ---------------------------------------
  // DATABASE TRANSACTION
  // ---------------------------------------

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // ---------------------------------------
    // UPDATE PAYMENT
    // ---------------------------------------

    const updatedPayment = await paymentModel.findOneAndUpdate(
      {
        _id: payment._id,

        status: {
          $ne: "SUCCESS",
        },
      },

      {
        $set: {
          razorpayPaymentId: razorpay_payment_id,

          razorpaySignature: razorpay_signature,

          status: "SUCCESS",

          paidAt,

          failureReason: null,
        },
      },

      {
        session,
        returnDocument: "after",
      },
    );

    // ---------------------------------------
    // ANOTHER REQUEST ALREADY VERIFIED IT
    // ---------------------------------------

    if (!updatedPayment) {
      await session.abortTransaction();

      const existingPayment = await paymentModel.findById(payment._id);

      return {
        success: true,

        message: "Payment already verified.",

        data: {
          orderId: existingPayment.orderId,

          paymentId: existingPayment._id,

          razorpayOrderId: existingPayment.razorpayOrderId,

          razorpayPaymentId: existingPayment.razorpayPaymentId,

          paymentStatus: existingPayment.status,
        },
      };
    }

    // ---------------------------------------
    // UPDATE INTERNAL ORDER
    //
    // Rental starts after payment success.
    // ---------------------------------------

    const updatedOrder = await orderModel.findByIdAndUpdate(
      internalOrder._id,

      {
        $set: {
          status: "PAYMENT_SUCCESS",

          rentalStartDate,

          rentalEndDate,
        },
      },

      {
        session,
        returnDocument: "after",
      },
    );

    if (!updatedOrder) {
      throw createError(500, "Unable to update rental order.");
    }

    // ---------------------------------------
    // CREATE RENTAL HISTORY
    // ---------------------------------------

    const rentalHistory = await rentalHistoryModel.findOneAndUpdate(
      {
        orderId: internalOrder._id,
      },

      {
        $setOnInsert: {
          userId,

          assetId: internalOrder.assetId,

          orderId: internalOrder._id,

          paymentId: updatedPayment._id,

          rentalStartDate,

          rentalEndDate,

          totalAmount: internalOrder.totalAmount,

          currency: internalOrder.currency || "INR",

          paymentStatus: "SUCCESS",

          rentalStatus: "ACTIVE",

          razorpayOrderId: serverOrderId,

          razorpayPaymentId: razorpay_payment_id,

          razorpaySignature: razorpay_signature,

          transactionReference: razorpay_payment_id,

          paidAt,
        },
      },

      {
        upsert: true,
        session,
        returnDocument: "after",
      },
    );

    // ---------------------------------------
    // COMMIT EVERYTHING
    // ---------------------------------------

    await session.commitTransaction();

    // ---------------------------------------
    // RESPONSE
    // ---------------------------------------

    return {
      success: true,

      message: "Payment verified and rental activated successfully.",

      data: {
        orderId: updatedOrder._id,

        paymentId: updatedPayment._id,

        rentalHistoryId: rentalHistory._id,

        razorpayOrderId: serverOrderId,

        razorpayPaymentId: razorpay_payment_id,

        amount: updatedPayment.amount,

        currency: updatedPayment.currency,

        duration: updatedOrder.rentalDurationMonths,

        durationUnit: "MONTH",

        rentalStartDate: updatedOrder.rentalStartDate,

        rentalEndDate: updatedOrder.rentalEndDate,

        paymentStatus: updatedPayment.status,

        orderStatus: updatedOrder.status,

        rentalStatus: rentalHistory.rentalStatus,
      },
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    throw error;
  } finally {
    await session.endSession();
  }
};
export const getUserPayments_Service = async ({
  userId,
  status1,
  status2,
}) => {
  if (!userId) {
    throw createError(
      401,
      "User authentication is required."
    );
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw createError(
      400,
      "Invalid User ID."
    );
  }

  const allowedStatuses = [
    "PENDING",
    "SUCCESS",
    "FAILED",
    "REFUNDED",
  ];

  // ---------------------------------------
  // NORMALIZE STATUS
  // ---------------------------------------

  const normalizeStatus = (
    value,
    fieldName
  ) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return null;
    }

    const rawValue =
      Array.isArray(value)
        ? value[0]
        : value;

    if (typeof rawValue !== "string") {
      throw createError(
        400,
        `${fieldName} must be a valid string.`
      );
    }

    const normalized =
      rawValue
        .trim()
        .toUpperCase();

    if (
      !allowedStatuses.includes(normalized)
    ) {
      throw createError(
        400,
        `Invalid ${fieldName}: ${rawValue}`
      );
    }

    return normalized;
  };

  const normalizedStatus1 =
    normalizeStatus(
      status1,
      "status1"
    );

  const normalizedStatus2 =
    normalizeStatus(
      status2,
      "status2"
    );

  // ---------------------------------------
  // BUILD FILTER
  // ---------------------------------------

  const filter = {
    userId,
  };

  const statuses = [];

  if (normalizedStatus1) {
    statuses.push(
      normalizedStatus1
    );
  }

  if (normalizedStatus2) {
    statuses.push(
      normalizedStatus2
    );
  }

  if (statuses.length > 0) {
    filter.status = {
      $in: [
        ...new Set(statuses),
      ],
    };
  }

  // ---------------------------------------
  // GET PAYMENTS
  // ---------------------------------------

  const payments =
    await paymentModel
      .find(filter)
      .select("-razorpaySignature")
      .populate({
        path: "assetId",
        select:
          "assetName brand model category subCategory price files",
      })
      .populate({
        path: "orderId",
        select:
          "totalAmount currency rentalDurationMonths rentalStartDate rentalEndDate status createdAt",
      })
      .sort({
        createdAt: -1,
      })
      .lean();

  // ---------------------------------------
  // RESPONSE
  // ---------------------------------------

  return {
    success: true,

    message:
      "Payment history fetched successfully.",

    totalPayments:
      payments.length,

    data:
      payments,
  };
};