import mongoose from "mongoose";

const corporateRequestSchema =
  new mongoose.Schema(
    {
      companyName: {
        type: String,
        required: [
          true,
          "Company name is required",
        ],
        trim: true,
        maxlength: 150,
      },

      contactName: {
        type: String,
        required: [
          true,
          "Contact name is required",
        ],
        trim: true,
        maxlength: 120,
      },

      designation: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null,
      },

      phone: {
        type: String,
        required: [
          true,
          "Phone number is required",
        ],
        trim: true,
      },

      email: {
        type: String,
        required: [
          true,
          "Email is required",
        ],
        trim: true,
        lowercase: true,
        match: [
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          "Enter a valid email address",
        ],
      },

      locationCity: {
        type: String,
        required: [
          true,
          "City is required",
        ],
        trim: true,
      },

      locationState: {
        type: String,
        required: [
          true,
          "State is required",
        ],
        trim: true,
      },

      numberOfCars: {
        type: Number,
        required: [
          true,
          "Number of cars is required",
        ],
        min: [
          1,
          "Number of cars must be at least 1",
        ],
      },

      seatingCapacity: {
        type: Number,
        required: [
          true,
          "Seating capacity is required",
        ],
        min: [
          1,
          "Seating capacity must be at least 1",
        ],
      },

      preferredVehicleType: {
        type: String,
        required: [
          true,
          "Preferred vehicle type is required",
        ],
        trim: true,
        maxlength: 80,
      },

      message: {
        type: String,
        trim: true,
        default: null,
        maxlength: 2000,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "contacted",
          "quotation_sent",
          "converted",
          "rejected",
        ],
        default: "pending",
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

corporateRequestSchema.index({
  status: 1,
  createdAt: -1,
});

const CorporateRequest =
  mongoose.model(
    "CorporateRequest",
    corporateRequestSchema
  );

export default CorporateRequest;