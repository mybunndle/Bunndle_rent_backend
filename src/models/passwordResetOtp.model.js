import mongoose from "mongoose";

const passwordResetOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      index: true,
    },

    otp: {
      type: String,
      required: [true, "OTP is required"],
    },

    expiresAt: {
      type: Date,
      required: [true, "OTP expiry is required"],

      // OTP document expiry ke baad automatically delete hoga
      index: {
        expires: 0,
      },
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const passwordResetOtpModel =
  mongoose.models.PasswordResetOtp ||
  mongoose.model(
    "PasswordResetOtp",
    passwordResetOtpSchema
  );

export default passwordResetOtpModel;