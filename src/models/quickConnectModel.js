import mongoose from "mongoose";

const remarkSchema = new mongoose.Schema(
  {
    remark: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // User/admin ka MongoDB ObjectId
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // User name ka snapshot
    changedByName: {
      type: String,
      trim: true,
      default: null,
    },

    // Optional: admin, user, system etc.
    changedByRole: {
      type: String,
      trim: true,
      default: null,
    },

    // Optional remark category
    type: {
      type: String,
      trim: true,
      default: null,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
  }
);

const quickConnectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    type: {
      type: String,
      trim: true,
      default: null,
    },

    remarks: {
      type: [remarkSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const quickConnectModel = mongoose.model(
  "QuickConnect",
  quickConnectSchema
);

export default quickConnectModel;