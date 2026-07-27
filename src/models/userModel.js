import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },

    password: {
      type: String,
      select: false,
    },
    type: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    profileImage: {
      url: {
        type: String,
        default: null,
      },
      fileId: {
        type: String,
        default: null,
      },
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    appleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    authProvider: {
      type: String,
      enum: ["local", "google", "apple"],
      default: "local",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const userModel = mongoose.model("User", userSchema);

export default userModel;
