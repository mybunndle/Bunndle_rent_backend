import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

wishlistSchema.index(
  { userId: 1, assetId: 1 },
  { unique: true }
);

export default mongoose.model("Wishlist", wishlistSchema);