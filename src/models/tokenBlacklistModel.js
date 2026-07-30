import mongoose from "mongoose";

const tokenBlacklistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      enum: ["logout", "account-deleted", "security"],
      default: "logout",
    },
  },
  {
    timestamps: true,
  }
);

/*
 * JWT expire hone ke baad blacklist record
 * MongoDB automatically remove kar dega.
 */
tokenBlacklistSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

const tokenBlacklistModel = mongoose.model(
  "TokenBlacklist",
  tokenBlacklistSchema
);

export default tokenBlacklistModel;