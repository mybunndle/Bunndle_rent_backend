import prisma from "../../config/prisma.js";
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
  if (value === undefined || value === null) return undefined;

  const stringValue = String(value).trim();

  return stringValue || undefined;
};

export const addAssetService = async ({ userId, body, files }) => {
  if (!userId) {
    throw createError(401, "Unauthorized user.");
  }

  const model = cleanValue(body.model);
  const brand = cleanValue(body.brand);
  const category = cleanValue(body.category);
  const subCategory = cleanValue(body.subCategory);
  const assetName = cleanValue(body.assetName);
  const purchaseYear = cleanValue(body.purchaseYear);
  const price = cleanValue(body.price);

  if (!model || !category || !purchaseYear) {
    throw createError(400, "Model, category, and purchase year are required.");
  }

  if (!files || files.length === 0) {
    throw createError(400, "At least 1 asset image is required.");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: String(userId),
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    throw createError(404, "User not found.");
  }

  let uploadedFiles = [];

  try {
    uploadedFiles = await Promise.all(
      files.map((file) => uploadAssetFile(file))
    );

    const asset = await prisma.asset.create({
      data: {
        userId: user.id,
        model,
        brand,
        category,
        subCategory,
        assetName,
        purchaseYear,
        price,
        files: uploadedFiles,
      },
    });

    return asset;
  } catch (error) {
    if (uploadedFiles.length > 0) {
      await Promise.allSettled(
        uploadedFiles.map((file) => deleteAssetFile(file.fileId))
      );
    }

    throw error;
  }
};