import mongoose from "mongoose";

const homeDealsSchema = new mongoose.Schema(
  {
    
    images: [
      {
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
    ],
  },
  {
    timestamps: true,
  }
);

const homeDealsModel = mongoose.model(
  "HomeDeal",
  homeDealsSchema
);

export default homeDealsModel;