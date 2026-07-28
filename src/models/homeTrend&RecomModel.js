import mongoose from "mongoose";

const homeTrendRecomSchema = new mongoose.Schema(
  {
    assetName: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["trending", "recommended"],
      required: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      default: null,
      trim: true,
    },

    brand: {
      type: String,
      default: null,
      trim: true,
    },

    model: {
      type: String,
      default: null,
      trim: true,
    },

    price: {
      type: Number,
      default: null,
      min: 0,
    },

    rank: {
      type: Number,
      default: null,
      min: 1,
    },

    image: {
      url: {
        type: String,
        default: null,
      },

      fileId: {
        type: String,
        default: null,
      },
      filename:{
        type: String,
        default: null
      },
    },
  },
  {
    timestamps: true,
  }
);

const homeTrendRecomModel = mongoose.model(
  "HomeTrendRecommendation",
  homeTrendRecomSchema
);

export default homeTrendRecomModel;