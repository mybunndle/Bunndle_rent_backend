import mongoose from "mongoose";
import assetModel from "../../models/assetModel.js";
import userModel from "../../models/userModel.js";
import wishlistModel from "../../models/wishlistModel.js";

import { uploadAssetFile, deleteAssetFile } from "./img_upload.service.js";

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

export const addAssetService = async ({ userId, body = {}, files = [] }) => {
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
    throw createError(400, "Model, category, and purchase year are required.");
  }

  // 4. Validate uploaded files
  if (!Array.isArray(files) || files.length === 0) {
    throw createError(400, "At least 1 asset image is required.");
  }

  // 5. Check whether user exists
  const user = await userModel.findById(userId).select("_id name email");

  if (!user) {
    throw createError(404, "User not found.");
  }

  let uploadedFiles = [];

  try {
    // 6. Upload all asset images
    uploadedFiles = await Promise.all(
      files.map((file) => uploadAssetFile(file)),
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
          const fileId = file.fileId || file.publicId || file.public_id;

          if (fileId) {
            await deleteAssetFile(fileId);
          }
        }),
      );
    }

    throw error;
  }
};

const ASSETS_PER_PAGE = 10;

export const getAssetsService = async ({ page = 1 }) => {
  const currentPage = Number.parseInt(page, 10);

  if (!Number.isInteger(currentPage) || currentPage < 1) {
    throw createError(400, "Page must be a positive integer.");
  }

  const skip = (currentPage - 1) * ASSETS_PER_PAGE;

  const [assets, totalAssets] = await Promise.all([
    assetModel
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(ASSETS_PER_PAGE)
      .lean(),

    assetModel.countDocuments({}),
  ]);

  const totalPages = Math.ceil(totalAssets / ASSETS_PER_PAGE);

  return {
    assets,
    pagination: {
      currentPage,
      assetsPerPage: ASSETS_PER_PAGE,
      totalAssets,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      previousPage: currentPage > 1 ? currentPage - 1 : null,
    },
  };
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
      "Asset not found or you are not allowed to edit it.",
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
        throw createError(400, `${field} cannot be empty.`);
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
        files.map((file) => uploadAssetFile(file)),
      );

      // New images will replace existing images
      updateData.files = newlyUploadedFiles;
    }

    // 8. Check whether user sent anything to update
    if (Object.keys(updateData).length === 0) {
      throw createError(400, "Provide at least one field or image to update.");
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
      },
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
          const fileId = file.fileId || file.publicId || file.public_id;

          if (fileId) {
            await deleteAssetFile(fileId);
          }
        }),
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
          const fileId = file.fileId || file.publicId || file.public_id;

          if (fileId) {
            await deleteAssetFile(fileId);
          }
        }),
      );
    }

    throw error;
  }
};

export const deleteAssetService = async ({ assetId, userId }) => {
  // 1. Check logged-in user
  if (!userId) {
    throw createError(401, "Unauthorized user.");
  }

  // 2. Validate asset ID
  if (!assetId || !mongoose.Types.ObjectId.isValid(assetId)) {
    throw createError(400, "Invalid asset ID.");
  }

  // 3. Find asset
  const asset = await assetModel.findById(assetId);

  if (!asset) {
    throw createError(404, "Asset not found.");
  }

  // 4. Check asset ownership
  if (!asset.userId || String(asset.userId) !== String(userId)) {
    throw createError(403, "You are not allowed to delete this asset.");
  }

  // 5. Store asset response before deleting
  const deletedAssetData = asset.toObject();

  // 6. Delete asset from MongoDB
  await assetModel.deleteOne({
    _id: assetId,
    userId,
  });

  // 7. Delete asset images from storage
  if (Array.isArray(asset.files) && asset.files.length > 0) {
    const deletionResults = await Promise.allSettled(
      asset.files.map(async (file) => {
        const fileId = file.fileId || file.publicId || file.public_id;

        if (fileId) {
          await deleteAssetFile(fileId);
        }
      }),
    );

    const failedDeletions = deletionResults.filter(
      (result) => result.status === "rejected",
    );

    if (failedDeletions.length > 0) {
      console.error("Some asset images could not be deleted:", failedDeletions);
    }
  }

  // 8. Return deleted asset
  return deletedAssetData;
};





const validateObjectId = (id, fieldName) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw createError(400, `Invalid ${fieldName}`);
  }
};

/**
 * Add asset to the logged-in user's wishlist.
 * updateOne + upsert makes this API idempotent:
 * already wishlisted asset will not be added twice.
 */
export async function addToWishlist_Service(userId, assetId) {
  validateObjectId(userId, "user ID");
  validateObjectId(assetId, "asset ID");

  const assetExists = await assetModel.exists({
    _id: assetId,
  });

  if (!assetExists) {
    throw createError(404, "Asset not found");
  }

  await wishlistModel.updateOne(
    {
      userId,
      assetId,
    },
    {
      $setOnInsert: {
        userId,
        assetId,
      },
    },
    {
      upsert: true,
    }
  );

  return {
    success: true,
    message: "Asset added to wishlist successfully",
    data: {
      assetId,
      isWishlisted: true,
    },
  };
}

/**
 * Remove asset from the logged-in user's wishlist.
 */
export async function removeFromWishlist_Service(
  userId,
  assetId
) {
  validateObjectId(userId, "user ID");
  validateObjectId(assetId, "asset ID");

  await wishlistModel.deleteOne({
    userId,
    assetId,
  });

  return {
    success: true,
    message: "Asset removed from wishlist successfully",
    data: {
      assetId,
      isWishlisted: false,
    },
  };
}

/**
 * Get logged-in user's complete wishlist with asset details.
 */
export async function getWishlist_Service(
  userId,
  page = 1,
  limit = 10
) {
  validateObjectId(userId, "user ID");

  const currentPage = Math.max(
    Number.parseInt(page, 10) || 1,
    1
  );

  const pageLimit = Math.min(
    Math.max(Number.parseInt(limit, 10) || 10, 1),
    50
  );

  const skip = (currentPage - 1) * pageLimit;

  const filter = {
    userId,
  };

  const [wishlistItems, totalItems] = await Promise.all([
    wishlistModel
      .find(filter)
      .populate({
        path: "assetId",
      })
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(pageLimit)
      .lean(),

    wishlistModel.countDocuments(filter),
  ]);

  /*
   * assetId null ho sakta hai agar asset delete ho gaya ho
   * aur related wishlist record cleanup nahi hua.
   */
  const assets = wishlistItems
    .filter((item) => item.assetId)
    .map((item) => ({
      ...item.assetId,
      wishlistId: item._id,
      isWishlisted: true,
      wishlistedAt: item.createdAt,
    }));

  const totalPages = Math.ceil(
    totalItems / pageLimit
  );

  return {
    success: true,
    message: "Wishlist fetched successfully",
    data: assets,
    pagination: {
      currentPage,
      itemsPerPage: pageLimit,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      nextPage:
        currentPage < totalPages
          ? currentPage + 1
          : null,
      previousPage:
        currentPage > 1
          ? currentPage - 1
          : null,
    },
  };
}

/**
 * Optional API: check a single asset's wishlist status.
 */
export async function checkWishlist_Service(
  userId,
  assetId
) {
  validateObjectId(userId, "user ID");
  validateObjectId(assetId, "asset ID");

  const wishlistExists = await wishlistModel.exists({
    userId,
    assetId,
  });

  return {
    success: true,
    message: "Wishlist status fetched successfully",
    data: {
      assetId,
      isWishlisted: Boolean(wishlistExists),
    },
  };
}






export async function getAssetsWith_wishlist_Service(
  userId,
  page = 1
) {
  if (!userId) {
    throw createError(
      401,
      "Authentication is required"
    );
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw createError(400, "Invalid user ID");
  }

  const currentPage = Number.parseInt(page, 10);

  if (
    Number.isNaN(currentPage) ||
    currentPage < 1
  ) {
    throw createError(
      400,
      "Page must be a positive integer"
    );
  }

  const skip =
    (currentPage - 1) * ASSETS_PER_PAGE;

  const assetFilter = {};

  /*
   * Only approved assets dikhane hain toh:
   *
   * const assetFilter = {
   *   isapproved: "approved",
   * };
   */

  const [assets, totalAssets] =
    await Promise.all([
      assetModel
        .find(assetFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(ASSETS_PER_PAGE)
        .lean(),

      assetModel.countDocuments(assetFilter),
    ]);

  /*
   * Current page ke sabhi asset IDs.
   */
  const assetIds = assets.map(
    (asset) => asset._id
  );

  let wishlistedIds = new Set();

  /*
   * Current user ne current page ke kaunse
   * assets wishlist kiye hain.
   *
   * Ye ek hi database query hai.
   */
  if (assetIds.length > 0) {
    const wishlistItems =
      await wishlistModel
        .find({
          userId,
          assetId: {
            $in: assetIds,
          },
        })
        .select({
          assetId: 1,
          _id: 0,
        })
        .lean();

    wishlistedIds = new Set(
      wishlistItems.map((item) =>
        item.assetId.toString()
      )
    );
  }

  /*
   * Har asset ke saath user-specific
   * isWishlisted true/false add hoga.
   */
  const assetsWithWishlistStatus =
    assets.map((asset) => ({
      ...asset,

      isWishlisted: wishlistedIds.has(
        asset._id.toString()
      ),
    }));

  const totalPages = Math.ceil(
    totalAssets / ASSETS_PER_PAGE
  );

  return {
    
    success: true,
    message: "Assets fetched successfully",
    count: assets.length,
    data: assetsWithWishlistStatus,

    pagination: {
      currentPage,
      assetsPerPage: ASSETS_PER_PAGE,
      totalAssets,
      totalPages,

      hasNextPage:
        currentPage < totalPages,

      hasPreviousPage:
        currentPage > 1,

      nextPage:
        currentPage < totalPages
          ? currentPage + 1
          : null,

      previousPage:
        currentPage > 1
          ? currentPage - 1
          : null,
    },
  };
}
