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
    // RENTAL DURATION
    // ---------------------------------------

    // Example:
    // 1 = 1 month
    // 3 = 3 months
    // 6 = 6 months
    // 12 = 12 months
    rentalDurationMonths: {
      type: Number,
      required: true,
      min: 1,
      max: 36,
    },

    // ---------------------------------------
    // RENTAL PERIOD
    // ---------------------------------------

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
    timestamps: true,
    versionKey: false,
  }
);

// ---------------------------------------
// INDEXES
// ---------------------------------------

orderSchema.index({
  userId: 1,
  createdAt: -1,
});

orderSchema.index({
  assetId: 1,
  createdAt: -1,
});

orderSchema.index({
  assetId: 1,
  status: 1,
});

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