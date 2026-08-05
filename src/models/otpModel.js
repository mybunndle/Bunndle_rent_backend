import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },

    otp: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["LOGIN", "REGISTER", "RESET_PASSWORD"],
      default: "LOGIN",
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// MongoDB document ko expiresAt ke time automatically delete karega
otpSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const otpModel =
  mongoose.models.Otp ||
  mongoose.model("Otp", otpSchema);

export default otpModel;