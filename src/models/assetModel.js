import mongoose from "mongoose";

const assetFileSchema = new mongoose.Schema(
  {
    url: String,
    filename: String,
    fileId: String,
  },
  {
    _id: false,
  },
);
const assetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    model: {
      type: String,
      required: true,
    },

    brand: {
      type: String,
      required: true,
    },

    price: {
      type: String,
    },
    
    rentalPricing: {
      zeroToThreeMonths: {
        type: Number,
        min: 0,
        default: 0,
      },

      threeToSixMonths: {
        type: Number,
        min: 0,
        default:0,
      },

      sixMonthsPlus: {
        type: Number,
        min: 0,
        default:0,
      },
    },




    assetName: {
      type: String,
    },

    category: {
      type: String,
      required: true,
    },

    subCategory: {
      type: String,
    },

    purchaseYear: {
      type: String,
      required: true,
    },

    isapproved: {
      type: String,
      enum: ["approved", "rejected", "pending", "approvedButNotInApp"],
      default: "pending",
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },


    deleteRequest: {
      type: Boolean,
      default: false,
    },

    deleteRequestAt: {
      type: Date,
    },

    files: [assetFileSchema],
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Asset", assetSchema);
