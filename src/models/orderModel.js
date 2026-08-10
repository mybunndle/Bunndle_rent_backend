import mongoose from "mongoose";

const getIndianTime = () => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(Date.now() + istOffset);
};

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
      index: true,
    },

    // Final rental amount to be paid
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    rentalStartDate: {
      type: Date,
      required: true,
    },

    rentalEndDate: {
      type: Date,
      required: true,
    },

    // Razorpay order generated for this rental
    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "PENDING_PAYMENT",
        "PAYMENT_SUCCESS",
        "COMPLETED",
        "FAILED",
        "EXPIRED",
        "CANCELLED",
      ],
      default: "PENDING_PAYMENT",
      index: true,
    },
  },
  {
    timestamps: {
      currentTime: getIndianTime,
    },
  }
);

orderSchema.index({
  userId: 1,
  createdAt: -1,
});

orderSchema.index({
  assetId: 1,
  status: 1,
});

export default mongoose.model(
  "Order",
  orderSchema
);