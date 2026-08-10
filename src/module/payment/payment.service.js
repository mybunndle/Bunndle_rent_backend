import crypto from "crypto";
import mongoose from "mongoose";
import createError from "http-errors";
import razorpayInstance from "../../config/rajorpay.js";

import orderModel from "../../models/orderModel.js";
import paymentModel from "../../models/paymentModel.js";
import rentalHistoryModel from "../../models/rentHistoryModel.js";

import assetModel from "../../models/assetModel.js";

export const createPaymentOrder_Service = async ({ userId, assetId }) => {
  // ---------------------------------------
  // VALIDATION
  // ---------------------------------------

  if (!userId) {
    throw createError(401, "User authentication is required.");
  }

  if (!mongoose.Types.ObjectId.isValid(assetId)) {
    throw createError(400, "Invalid Asset ID.");
  }

 
  // GET ASSET


  const asset = await assetModel.findById(assetId).lean();

  if (!asset) {
    throw createError(404, "Asset not found.");
  }



  // ---------------------------------------
  // RENTAL DATE CALCULATION
  // ---------------------------------------

  // Current backend date/time
  const rentalStartDate = new Date();

  // Exactly 30 days after start date
  const rentalEndDate = new Date(
    rentalStartDate.getTime() + 30 * 24 * 60 * 60 * 1000,
  );

  // ---------------------------------------
  // AMOUNT CALCULATION
  // ---------------------------------------

  const totalAmount = Number(asset.price);

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw createError(400, "Invalid asset rental amount.");
  }

  // Razorpay requires amount in paise
  const amountInPaise = Math.round(totalAmount * 100);

  // ---------------------------------------
  // PAYMENT ORDER EXPIRY
  // Internal pending order expiry = 15 mins
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

        // Paise - use this in Razorpay checkout
        amount: razorpayOrder.amount,

        // Rupees - display purpose
        displayAmount: totalAmount,

        currency: razorpayOrder.currency,

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
    // MARK INTERNAL ORDER FAILED
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
  if (!userId) {
    throw createError(401, "User authentication is required.");
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw createError(400, "Razorpay payment details are required.");
  }

  // ---------------------------------------
  // FIND PAYMENT USING RAZORPAY ORDER ID
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
  // ---------------------------------------

  if (payment.status === "SUCCESS") {
    if (payment.razorpayPaymentId === razorpay_payment_id) {
      return {
        success: true,

        message: "Payment already verified successfully.",

        data: {
          orderId: payment.orderId,

          paymentId: payment._id,

          razorpayPaymentId: payment.razorpayPaymentId,

          status: payment.status,
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
  // IMPORTANT
  // Use order ID stored on SERVER
  // ---------------------------------------

  const serverOrderId = payment.razorpayOrderId;

  // Optional additional tampering check
  if (razorpay_order_id !== serverOrderId) {
    throw createError(400, "Razorpay order mismatch.");
  }

  // ---------------------------------------
  // CREATE EXPECTED SIGNATURE
  //
  // order_id|payment_id
  // ---------------------------------------

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${serverOrderId}|${razorpay_payment_id}`)
    .digest("hex");

  // ---------------------------------------
  // SECURE SIGNATURE COMPARISON
  // ---------------------------------------

  const generatedBuffer = Buffer.from(generatedSignature, "utf8");

  const receivedBuffer = Buffer.from(razorpay_signature, "utf8");

  const isSignatureValid =
    generatedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(generatedBuffer, receivedBuffer);

  if (!isSignatureValid) {
    /*
     * Do NOT change payment to FAILED here.
     *
     * Someone could intentionally call
     * verify API with a wrong signature.
     */

    throw createError(400, "Payment signature verification failed.");
  }

  // ---------------------------------------
  // VERIFY PAYMENT WITH RAZORPAY
  // ---------------------------------------

  const razorpayPayment =
    await razorpayInstance.payments.fetch(razorpay_payment_id);

  if (!razorpayPayment) {
    throw createError(400, "Unable to verify payment with Razorpay.");
  }

  // Payment must belong to our order

  if (razorpayPayment.order_id !== serverOrderId) {
    throw createError(400, "Payment does not belong to this order.");
  }

  // ---------------------------------------
  // VERIFY AMOUNT
  // ---------------------------------------

  const expectedAmountInPaise = Math.round(payment.amount * 100);

  if (Number(razorpayPayment.amount) !== expectedAmountInPaise) {
    throw createError(400, "Payment amount mismatch.");
  }

  // ---------------------------------------
  // VERIFY CURRENCY
  // ---------------------------------------

  if (razorpayPayment.currency !== "INR") {
    throw createError(400, "Payment currency mismatch.");
  }

  /*
   * With Razorpay auto-capture enabled,
   * successful payments should generally
   * reach captured status.
   */

  if (razorpayPayment.status !== "captured") {
    throw createError(
      400,
      `Payment is not captured yet. Current status: ${razorpayPayment.status}`,
    );
  }

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

          paidAt: new Date(),
        },
      },
      {
        returnDocument: "after",
        session,
      },
    );

    /*
     * Another request may already have
     * completed this payment.
     */

    if (!updatedPayment) {
      await session.abortTransaction();

      const existingPayment = await paymentModel.findById(payment._id);

      return {
        success: true,

        message: "Payment already verified.",

        data: {
          orderId: existingPayment.orderId,

          paymentId: existingPayment._id,

          razorpayPaymentId: existingPayment.razorpayPaymentId,

          status: existingPayment.status,
        },
      };
    }

    // ---------------------------------------
    // UPDATE INTERNAL ORDER
    // ---------------------------------------

    await orderModel.findByIdAndUpdate(
      payment.orderId,
      {
        $set: {
          status: "PAYMENT_SUCCESS",
        },
      },
      {
        session,
      },
    );

    // ---------------------------------------
    // CREATE RENTAL HISTORY
    // ---------------------------------------

    await rentalHistoryModel.findOneAndUpdate(
      {
        orderId: internalOrder._id,
      },

      {
        $setOnInsert: {
          userId,

          assetId: internalOrder.assetId,

          orderId: internalOrder._id,

          paymentId: updatedPayment._id,

          rentalStartDate: internalOrder.rentalStartDate,

          rentalEndDate: internalOrder.rentalEndDate,

          totalAmount: internalOrder.totalAmount,

          currency: internalOrder.currency || "INR",

          paymentStatus: "SUCCESS",

          rentalStatus: "UPCOMING",

          razorpayOrderId: serverOrderId,

          razorpayPaymentId: razorpay_payment_id,

          razorpaySignature: razorpay_signature,

          transactionReference: razorpay_payment_id,

          paidAt: new Date(),
        },
      },

      {
        upsert: true,
        returnDocument: "after",
        session,
      },
    );

    await session.commitTransaction();

    return {
      success: true,

      message: "Payment verified successfully.",

      data: {
        orderId: internalOrder._id,

        paymentId: updatedPayment._id,

        razorpayOrderId: serverOrderId,

        razorpayPaymentId: razorpay_payment_id,

        amount: updatedPayment.amount,

        currency: updatedPayment.currency,

        paymentStatus: "SUCCESS",

        orderStatus: "PAYMENT_SUCCESS",
      },
    };
  } catch (error) {
    await session.abortTransaction();

    throw error;
  } finally {
    await session.endSession();
  }
};
