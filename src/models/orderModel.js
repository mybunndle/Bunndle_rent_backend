import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
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
    // ASSET
    // ---------------------------------------

    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },

    // ---------------------------------------
    // PAYMENT AMOUNT
    // ---------------------------------------

    // Amount in rupees
    totalAmount: {
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
    // RENTAL PERIOD
    // ---------------------------------------

    rentalDurationDays: {
      type: Number,
      default: 30,
      min: 1,
      required: true,
    },

    /*
     * Set these only AFTER successful payment.
     */

    rentalStartDate: {
      type: Date,
      default: null,
    },

    rentalEndDate: {
      type: Date,
      default: null,
    },

    // ---------------------------------------
    // RAZORPAY
    // ---------------------------------------

    razorpayOrderId: {
      type: String,
      default: undefined,
    },

    // ---------------------------------------
    // PAYMENT ORDER EXPIRY
    // ---------------------------------------

    /*
     * Example:
     * Razorpay payment attempt must be completed
     * within 15 minutes.
     *
     * Do NOT use MongoDB TTL here because
     * production payment/order records should
     * normally be retained for audit/history.
     */

    expiresAt: {
      type: Date,
      required: true,
    },

    // ---------------------------------------
    // ORDER STATUS
    // ---------------------------------------

    status: {
      type: String,

      enum: [
        "PENDING_PAYMENT",
        "PAYMENT_SUCCESS",
        "COMPLETED",
        "FAILED",
        "EXPIRED",
        "CANCELLED",
        "REFUNDED",
      ],

      default: "PENDING_PAYMENT",

      required: true,
    },
  },

  {
    // Store normal Date timestamps.
    timestamps: true,

    versionKey: false,
  }
);

// ---------------------------------------
// INDEXES
// ---------------------------------------

// My orders:
// Order.find({ userId }).sort({ createdAt: -1 })

orderSchema.index({
  userId: 1,
  createdAt: -1,
});

// Admin / asset order queries

orderSchema.index({
  assetId: 1,
  createdAt: -1,
});

// Find active/pending orders for an asset

orderSchema.index({
  assetId: 1,
  status: 1,
});

// Order expiry worker

orderSchema.index({
  status: 1,
  expiresAt: 1,
});

// ---------------------------------------
// UNIQUE RAZORPAY ORDER ID
// ---------------------------------------

orderSchema.index(
  {
    razorpayOrderId: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      razorpayOrderId: {
        $type: "string",
      },
    },
  }
);

export default mongoose.model(
  "Order",
  orderSchema
);