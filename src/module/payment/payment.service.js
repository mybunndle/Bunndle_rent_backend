import crypto from "node:crypto";
import mongoose from "mongoose";
import createError from "http-errors";

import razorpayInstance from "../../config/rajorpay.js";

import orderModel from "../../models/orderModel.js";
import paymentModel from "../../models/paymentModel.js";
import rentalHistoryModel from "../../models/rentHistoryModel.js";
import assetModel from "../../models/assetModel.js";


export const createPaymentOrder_Service = async ({
  userId,
  assetId,
}) => {

  // ---------------------------------------
  // VALIDATION
  // ---------------------------------------

  if (!userId) {
    throw createError(
      401,
      "User authentication is required."
    );
  }

  if (!mongoose.Types.ObjectId.isValid(assetId)) {
    throw createError(
      400,
      "Invalid Asset ID."
    );
  }

  // ---------------------------------------
  // GET ASSET
  // ---------------------------------------

  const asset = await assetModel
    .findById(assetId)
    .lean();

  if (!asset) {
    throw createError(
      404,
      "Asset not found."
    );
  }

  // ---------------------------------------
  // RENTAL DATE CALCULATION
  // ---------------------------------------

  const rentalStartDate = new Date();

  const rentalEndDate = new Date(
    rentalStartDate.getTime() +
      30 * 24 * 60 * 60 * 1000
  );

  // ---------------------------------------
  // AMOUNT
  // ---------------------------------------

  const totalAmount = Number(asset.price);

  if (
    !Number.isFinite(totalAmount) ||
    totalAmount <= 0
  ) {
    throw createError(
      400,
      "Invalid asset rental amount."
    );
  }

  // Razorpay amount is in paise
  const amountInPaise = Math.round(
    totalAmount * 100
  );

  // ---------------------------------------
  // ORDER EXPIRY - 15 MINUTES
  // ---------------------------------------

  const expiresAt = new Date(
    Date.now() + 15 * 60 * 1000
  );

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

    const razorpayOrder =
      await razorpayInstance.orders.create({
        amount: amountInPaise,

        currency: "INR",

        receipt: `rent_${internalOrder._id}`,

        notes: {
          app: "BUNNDLE_RENT",

          internalOrderId:
            internalOrder._id.toString(),

          userId:
            userId.toString(),

          assetId:
            assetId.toString(),

          paymentType:
            "ASSET_RENT",
        },
      });

    // ---------------------------------------
    // SAVE RAZORPAY ORDER ID
    // ---------------------------------------

    internalOrder.razorpayOrderId =
      razorpayOrder.id;

    await internalOrder.save();

    // ---------------------------------------
    // CREATE PAYMENT RECORD
    // ---------------------------------------

    const payment =
      await paymentModel.create({
        userId,

        orderId:
          internalOrder._id,

        assetId,

        razorpayOrderId:
          razorpayOrder.id,

        amount:
          totalAmount,

        currency:
          "INR",

        status:
          "PENDING",

        webhookVerified:
          false,
      });

    // ---------------------------------------
    // RESPONSE
    // ---------------------------------------

    return {
      success: true,

      message:
        "Payment order created successfully.",

      data: {

        orderId:
          internalOrder._id,

        paymentId:
          payment._id,

        razorpayOrderId:
          razorpayOrder.id,

        keyId:
          process.env.RAZORPAY_KEY_ID,

        // Paise
        amount:
          razorpayOrder.amount,

        // Rupees
        displayAmount:
          totalAmount,

        currency:
          razorpayOrder.currency,

        rentalStartDate,
        rentalEndDate,

        expiresAt,

        asset: {
          _id:
            asset._id,

          assetName:
            asset.assetName,

          brand:
            asset.brand,

          model:
            asset.model,
        },
      },
    };

  } catch (error) {

    // ---------------------------------------
    // MARK ORDER FAILED
    // ---------------------------------------

    if (internalOrder?._id) {
      await orderModel.findByIdAndUpdate(
        internalOrder._id,
        {
          status: "FAILED",
        }
      );
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
    throw createError(
      401,
      "User authentication is required."
    );
  }

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    throw createError(
      400,
      "Razorpay payment details are required."
    );
  }

  // ---------------------------------------
  // FIND PAYMENT
  // ---------------------------------------

  const payment = await paymentModel.findOne({
    razorpayOrderId: razorpay_order_id,
    userId,
  });

  if (!payment) {
    throw createError(
      404,
      "Payment order not found."
    );
  }

  // ---------------------------------------
  // ALREADY VERIFIED
  // ---------------------------------------

  if (payment.status === "SUCCESS") {
    if (
      payment.razorpayPaymentId ===
      razorpay_payment_id
    ) {
      return {
        success: true,
        message:
          "Payment already verified successfully.",

        data: {
          orderId: payment.orderId,
          paymentId: payment._id,

          razorpayOrderId:
            payment.razorpayOrderId,

          razorpayPaymentId:
            payment.razorpayPaymentId,

          status:
            payment.status,
        },
      };
    }

    throw createError(
      409,
      "This order has already been paid using another payment."
    );
  }

  // ---------------------------------------
  // GET INTERNAL ORDER
  // ---------------------------------------

  const internalOrder =
    await orderModel.findOne({
      _id: payment.orderId,
      userId,
    });

  if (!internalOrder) {
    throw createError(
      404,
      "Internal order not found."
    );
  }

  if (
    internalOrder.status === "FAILED" ||
    internalOrder.status === "EXPIRED"
  ) {
    throw createError(
      400,
      `Order cannot be verified because its status is ${internalOrder.status}.`
    );
  }

  // ---------------------------------------
  // SERVER-SIDE RAZORPAY ORDER ID
  // ---------------------------------------

  const serverOrderId =
    payment.razorpayOrderId;

  if (
    razorpay_order_id !==
    serverOrderId
  ) {
    throw createError(
      400,
      "Razorpay order mismatch."
    );
  }

  // ---------------------------------------
  // GENERATE EXPECTED SIGNATURE
  //
  // order_id|payment_id
  // ---------------------------------------

  const generatedSignature =
    crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${serverOrderId}|${razorpay_payment_id}`
      )
      .digest("hex");

  // ---------------------------------------
  // SECURE SIGNATURE COMPARISON
  // ---------------------------------------

  const generatedBuffer =
    Buffer.from(
      generatedSignature,
      "utf8"
    );

  const receivedBuffer =
    Buffer.from(
      razorpay_signature,
      "utf8"
    );

  const isSignatureValid =
    generatedBuffer.length ===
      receivedBuffer.length &&
    crypto.timingSafeEqual(
      generatedBuffer,
      receivedBuffer
    );

  if (!isSignatureValid) {
    throw createError(
      400,
      "Payment signature verification failed."
    );
  }

  // ---------------------------------------
  // FETCH PAYMENT FROM RAZORPAY
  // ---------------------------------------

  const razorpayPayment =
    await razorpayInstance.payments.fetch(
      razorpay_payment_id
    );

  if (!razorpayPayment) {
    throw createError(
      400,
      "Unable to verify payment with Razorpay."
    );
  }

  // Razorpay supports fetching a payment by
  // its payment ID from the Payments API.
  // ---------------------------------------

  // ---------------------------------------
  // VERIFY ORDER
  // ---------------------------------------

  if (
    razorpayPayment.order_id !==
    serverOrderId
  ) {
    throw createError(
      400,
      "Payment does not belong to this order."
    );
  }

  // ---------------------------------------
  // VERIFY PAYMENT ID
  // ---------------------------------------

  if (
    razorpayPayment.id !==
    razorpay_payment_id
  ) {
    throw createError(
      400,
      "Razorpay payment ID mismatch."
    );
  }

  // ---------------------------------------
  // VERIFY AMOUNT
  // ---------------------------------------

  const expectedAmountInPaise =
    Math.round(
      Number(payment.amount) * 100
    );

  if (
    Number(razorpayPayment.amount) !==
    expectedAmountInPaise
  ) {
    throw createError(
      400,
      "Payment amount mismatch."
    );
  }

  // ---------------------------------------
  // VERIFY CURRENCY
  // ---------------------------------------

  if (
    razorpayPayment.currency !== "INR"
  ) {
    throw createError(
      400,
      "Payment currency mismatch."
    );
  }

  // ---------------------------------------
  // VERIFY CAPTURE STATUS
  // ---------------------------------------

  if (
    razorpayPayment.status !== "captured"
  ) {
    throw createError(
      400,
      `Payment is not captured yet. Current status: ${razorpayPayment.status}`
    );
  }

  // ---------------------------------------
  // DATABASE TRANSACTION
  // ---------------------------------------

  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    const paidAt = new Date();

    // ---------------------------------------
    // UPDATE PAYMENT
    // ---------------------------------------

    const updatedPayment =
      await paymentModel.findOneAndUpdate(
        {
          _id: payment._id,

          status: {
            $ne: "SUCCESS",
          },
        },

        {
          $set: {
            razorpayPaymentId:
              razorpay_payment_id,

            razorpaySignature:
              razorpay_signature,

            status:
              "SUCCESS",

            paidAt,
          },
        },

        {
          returnDocument: "after",
          session,
        }
      );

    // ---------------------------------------
    // DUPLICATE VERIFY REQUEST
    // ---------------------------------------

    if (!updatedPayment) {
      await session.abortTransaction();

      const existingPayment =
        await paymentModel.findById(
          payment._id
        );

      return {
        success: true,

        message:
          "Payment already verified.",

        data: {
          orderId:
            existingPayment.orderId,

          paymentId:
            existingPayment._id,

          razorpayOrderId:
            existingPayment.razorpayOrderId,

          razorpayPaymentId:
            existingPayment.razorpayPaymentId,

          status:
            existingPayment.status,
        },
      };
    }

    // ---------------------------------------
    // UPDATE INTERNAL ORDER
    // ---------------------------------------

    const updatedOrder =
      await orderModel.findByIdAndUpdate(
        internalOrder._id,

        {
          $set: {
            status:
              "PAYMENT_SUCCESS",
          },
        },

        {
          returnDocument: "after",
          session,
        }
      );

    if (!updatedOrder) {
      throw createError(
        404,
        "Unable to update internal order."
      );
    }

    // ---------------------------------------
    // CREATE RENTAL HISTORY
    // ---------------------------------------

    const rentalHistory =
      await rentalHistoryModel.findOneAndUpdate(
        {
          orderId:
            internalOrder._id,
        },

        {
          $setOnInsert: {
            userId,

            assetId:
              internalOrder.assetId,

            orderId:
              internalOrder._id,

            paymentId:
              updatedPayment._id,

            rentalStartDate:
              internalOrder.rentalStartDate,

            rentalEndDate:
              internalOrder.rentalEndDate,

            totalAmount:
              internalOrder.totalAmount,

            currency:
              internalOrder.currency ||
              "INR",

            paymentStatus:
              "SUCCESS",

            rentalStatus:
              "UPCOMING",

            razorpayOrderId:
              serverOrderId,

            razorpayPaymentId:
              razorpay_payment_id,

            razorpaySignature:
              razorpay_signature,

            transactionReference:
              razorpay_payment_id,

            paidAt,
          },
        },

        {
          upsert: true,
          returnDocument: "after",
          session,
        }
      );

    // ---------------------------------------
    // COMMIT
    // ---------------------------------------

    await session.commitTransaction();

    // ---------------------------------------
    // RESPONSE
    // ---------------------------------------

    return {
      success: true,

      message:
        "Payment verified successfully.",

      data: {
        orderId:
          updatedOrder._id,

        paymentId:
          updatedPayment._id,

        rentalHistoryId:
          rentalHistory._id,

        razorpayOrderId:
          serverOrderId,

        razorpayPaymentId:
          razorpay_payment_id,

        amount:
          updatedPayment.amount,

        currency:
          updatedPayment.currency,

        paymentStatus:
          updatedPayment.status,

        orderStatus:
          updatedOrder.status,

        rentalStartDate:
          internalOrder.rentalStartDate,

        rentalEndDate:
          internalOrder.rentalEndDate,
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