import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // ---------------------------------------
    // USER
    // ---------------------------------------

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ---------------------------------------
    // INTERNAL ORDER
    // ---------------------------------------

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    // ---------------------------------------
    // ASSET
    // ---------------------------------------

    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },

    // ---------------------------------------
    // RAZORPAY DETAILS
    // ---------------------------------------

    razorpayOrderId: {
      type: String,
      required: true,
      trim: true,
    },

    /*
     * Do NOT use default: null.
     *
     * This field should simply not exist
     * while payment is PENDING.
     */
    razorpayPaymentId: {
      type: String,
      trim: true,
    },

    razorpaySignature: {
      type: String,
      trim: true,
    },

    // ---------------------------------------
    // PAYMENT AMOUNT
    // ---------------------------------------

    // Stored in rupees
    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      enum: ["INR"],
      default: "INR",
      required: true,
    },

    // ---------------------------------------
    // PAYMENT STATUS
    // ---------------------------------------

    status: {
      type: String,

      enum: [
        "PENDING",
        "SUCCESS",
        "FAILED",
        "REFUNDED",
      ],

      default: "PENDING",
      required: true,
    },

    // ---------------------------------------
    // WEBHOOK
    // ---------------------------------------

    webhookVerified: {
      type: Boolean,
      default: false,
    },

    webhookVerifiedAt: {
      type: Date,
      default: null,
    },

    // ---------------------------------------
    // PAYMENT SUCCESS
    // ---------------------------------------

    paidAt: {
      type: Date,
      default: null,
    },

    // ---------------------------------------
    // PAYMENT FAILURE
    // ---------------------------------------

    failureReason: {
      type: String,
      default: null,
      trim: true,
    },

    failedAt: {
      type: Date,
      default: null,
    },

    // ---------------------------------------
    // REFUND
    // ---------------------------------------

    refundedAt: {
      type: Date,
      default: null,
    },

    refundAmount: {
      type: Number,
      default: null,
      min: 0,
    },

    razorpayRefundId: {
      type: String,
      default: null,
      trim: true,
    },
  },

  {
    timestamps: true,
    versionKey: false,
  }
);

// ---------------------------------------
// UNIQUE RAZORPAY ORDER
// ---------------------------------------

paymentSchema.index(
  {
    razorpayOrderId: 1,
  },
  {
    unique: true,
  }
);

// ---------------------------------------
// UNIQUE RAZORPAY PAYMENT
//
// Only applies when Razorpay payment ID
// actually exists as a string.
// ---------------------------------------

paymentSchema.index(
  {
    razorpayPaymentId: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      razorpayPaymentId: {
        $type: "string",
      },
    },
  }
);

// ---------------------------------------
// USER PAYMENT HISTORY
// ---------------------------------------

paymentSchema.index({
  userId: 1,
  createdAt: -1,
});

// ---------------------------------------
// ORDER LOOKUP
// ---------------------------------------

paymentSchema.index({
  orderId: 1,
});

// ---------------------------------------
// ASSET PAYMENT HISTORY
// ---------------------------------------

paymentSchema.index({
  assetId: 1,
  createdAt: -1,
});

// ---------------------------------------
// ADMIN PAYMENT FILTERING
// ---------------------------------------

paymentSchema.index({
  status: 1,
  createdAt: -1,
});

export default mongoose.model(
  "Payment",
  paymentSchema
);