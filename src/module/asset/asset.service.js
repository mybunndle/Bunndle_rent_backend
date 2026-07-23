import mongoose from "mongoose";
import assetModel from "../../models/assetModel.js";
import userModel from "../../models/userModel.js";

import {
  uploadAssetFile,
  deleteAssetFile,
} from "./img_upload.service.js";

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const cleanValue = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const stringValue = String(value).trim();

  return stringValue || undefined;
};

export const addAssetService = async ({
  userId,
  body = {},
  files = [],
}) => {
  // 1. Check authentication
  if (!userId) {
    throw createError(401, "Unauthorized user.");
  }

  // 2. Clean request values
  const model = cleanValue(body.model);
  const brand = cleanValue(body.brand);
  const category = cleanValue(body.category);
  const subCategory = cleanValue(body.subCategory);
  const assetName = cleanValue(body.assetName);
  const purchaseYear = cleanValue(body.purchaseYear);
  const price = cleanValue(body.price);

  // 3. Validate required fields
  if (!model || !category || !purchaseYear) {
    throw createError(
      400,
      "Model, category, and purchase year are required."
    );
  }

  // 4. Validate uploaded files
  if (!Array.isArray(files) || files.length === 0) {
    throw createError(
      400,
      "At least 1 asset image is required."
    );
  }
 
  // 5. Check whether user exists
  const user = await userModel
    .findById(userId)
    .select("_id name email");
  
  

  if (!user) {
    throw createError(404, "User not found.");
  }

  let uploadedFiles = [];

  try {
    // 6. Upload all asset images
    uploadedFiles = await Promise.all(
      files.map((file) => uploadAssetFile(file))
    );

    // 7. Create asset in MongoDB
    const asset = await assetModel.create({
      userId: user._id,
      model,
      brand,
      category,
      subCategory,
      assetName,
      purchaseYear,
      price,
      files: uploadedFiles,
    });

    return {
      success: true,
      message: "Asset added successfully.",
      asset,
    };
  } catch (error) {
    // Uploaded images delete karo agar database save fail ho jaye
    if (uploadedFiles.length > 0) {
      await Promise.allSettled(
        uploadedFiles.map(async (file) => {
          const fileId =
            file.fileId ||
            file.publicId ||
            file.public_id;

          if (fileId) {
            await deleteAssetFile(fileId);
          }
        })
      );
    }

    throw error;
  }
};




export const getAssetsService = async ({ _id }) => {
  try {
    const assets = await assetModel
      .find({ userId: _id })
      .sort({ createdAt: -1 });

    return assets;
  } catch (error) {
    throw error;
  }
};


export const editAssetService = async ({
  assetId,
  userId,
  body = {},
  files = [],
}) => {
  let newlyUploadedFiles = [];

  // 1. Check logged-in user
  if (!userId) {
    throw createError(401, "Unauthorized user.");
  }

  // 2. Validate asset ID
  if (!assetId || !mongoose.Types.ObjectId.isValid(assetId)) {
    throw createError(400, "Invalid asset ID.");
  }

  // 3. Find the asset belonging to the logged-in user
  const existingAsset = await assetModel.findOne({
    _id: assetId,
    userId,
  });

  if (!existingAsset) {
    throw createError(
      404,
      "Asset not found or you are not allowed to edit it."
    );
  }

  // 4. Prepare partial update data
  const updateData = {};

  const allowedFields = [
    "model",
    "brand",
    "category",
    "subCategory",
    "assetName",
    "purchaseYear",
    "price",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      const cleanedValue = cleanValue(body[field]);

      if (cleanedValue === undefined) {
        throw createError(
          400,
          `${field} cannot be empty.`
        );
      }

      updateData[field] = cleanedValue;
    }
  }

  // 5. Required fields cannot become empty
  

  // 6. Validate uploaded files
  if (!Array.isArray(files)) {
    throw createError(400, "Invalid uploaded files.");
  }

  try {
    // 7. Upload new images when provided
    if (files.length > 0) {
      newlyUploadedFiles = await Promise.all(
        files.map((file) => uploadAssetFile(file))
      );

      // New images will replace existing images
      updateData.files = newlyUploadedFiles;
    }

    // 8. Check whether user sent anything to update
    if (Object.keys(updateData).length === 0) {
      throw createError(
        400,
        "Provide at least one field or image to update."
      );
    }

    // 9. Update only provided fields
    const updatedAsset = await assetModel.findOneAndUpdate(
      {
        _id: assetId,
        userId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedAsset) {
      throw createError(404, "Asset could not be updated.");
    }

    // 10. Delete old images only after DB update succeeds
    if (
      newlyUploadedFiles.length > 0 &&
      Array.isArray(existingAsset.files) &&
      existingAsset.files.length > 0
    ) {
      await Promise.allSettled(
        existingAsset.files.map(async (file) => {
          const fileId =
            file.fileId ||
            file.publicId ||
            file.public_id;

          if (fileId) {
            await deleteAssetFile(fileId);
          }
        })
      );
    }

    return updatedAsset;
  } catch (error) {
    /*
     * If new images were uploaded but the database update failed,
     * remove the newly uploaded images.
     */
    if (newlyUploadedFiles.length > 0) {
      await Promise.allSettled(
        newlyUploadedFiles.map(async (file) => {
          const fileId =
            file.fileId ||
            file.publicId ||
            file.public_id;

          if (fileId) {
            await deleteAssetFile(fileId);
          }
        })
      );
    }

    throw error;
  }
};