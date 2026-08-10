import mongoose from "mongoose";

const getIndianTime = () => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  return new Date(Date.now() + istOffset);
};

const rentalHistorySchema =
  new mongoose.Schema(
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

      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
        index: true,
      },

      paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
        required: true,
      },

      rentalStartDate: {
        type: Date,
        required: true,
      },

      rentalEndDate: {
        type: Date,
        required: true,
      },

      totalAmount: {
        type: Number,
        required: true,
        min: 0,
      },

      currency: {
        type: String,
        default: "INR",
      },

      paymentStatus: {
        type: String,
        enum: [
          "PENDING",
          "SUCCESS",
          "FAILED",
          "REFUNDED",
        ],
        default: "PENDING",
      },

      rentalStatus: {
        type: String,
        enum: [
          "UPCOMING",
          "ACTIVE",
          "COMPLETED",
          "CANCELLED",
        ],
        default: "UPCOMING",
      },

      // Razorpay details
      razorpayOrderId: {
        type: String,
        default: null,
      },

      razorpayPaymentId: {
        type: String,
        default: null,
      },

      razorpaySignature: {
        type: String,
        default: null,
      },

      transactionReference: {
        type: String,
        default: null,
      },

      paidAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: {
        currentTime: getIndianTime,
      },
    }
  );

rentalHistorySchema.index({
  userId: 1,
  createdAt: -1,
});



export default mongoose.model(
  "RentalHistory",
  rentalHistorySchema
);