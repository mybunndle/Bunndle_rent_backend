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