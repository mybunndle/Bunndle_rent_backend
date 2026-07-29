import mongoose from "mongoose";

const limitedTimeOfferSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      default: null,
      trim: true,
    },

    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    rank: {
      type: Number,
      default: true,
      min: 1,
    },

    discountPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    image: {
      url: {
        type: String,
        required: true,
        trim: true,
      },

      fileId: {
        type: String,
        required: true,
        trim: true,
      },

      filename: {
        type: String,
        default: null,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

const limitedTimeOfferModel = mongoose.model(
  "LimitedTimeOffer",
  limitedTimeOfferSchema,
);

export default limitedTimeOfferModel;
