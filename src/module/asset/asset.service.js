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

// export const addAssetService = async ({ userId, body = {}, files = [] }) => {
//   // 1. Check authentication
//   if (!userId) {
//     throw createError(401, "Unauthorized user.");
//   }

//   // 2. Clean request values
//   const model = cleanValue(body.model);
//   const brand = cleanValue(body.brand);
//   const category = cleanValue(body.category);
//   const subCategory = cleanValue(body.subCategory);
//   const assetName = cleanValue(body.assetName);
//   const purchaseYear = cleanValue(body.purchaseYear);
//   const price = cleanValue(body.price);

//   // 3. Validate required fields
//   if (!model || !category || !purchaseYear) {
//     throw createError(400, "Model, category, and purchase year are required.");
//   }

//   // 4. Validate uploaded files
//   if (!Array.isArray(files) || files.length === 0) {
//     throw createError(400, "At least 1 asset image is required.");
//   }

//   // 5. Check whether user exists
//   const user = await userModel.findById(userId).select("_id name email");

//   if (!user) {
//     throw createError(404, "User not found.");
//   }

//   let uploadedFiles = [];

//   try {
//     // 6. Upload all asset images
//     uploadedFiles = await Promise.all(
//       files.map((file) => uploadAssetFile(file)),
//     );

//     // 7. Create asset in MongoDB
//     const asset = await assetModel.create({
//       userId: user._id,
//       model,
//       brand,
//       category,
//       subCategory,
//       assetName,
//       purchaseYear,
//       price,
//       files: uploadedFiles,
//     });

//     return {
//       success: true,
//       message: "Asset added successfully.",
//       asset,
//     };
//   } catch (error) {
//     // Uploaded images delete karo agar database save fail ho jaye
//     if (uploadedFiles.length > 0) {
//       await Promise.allSettled(
//         uploadedFiles.map(async (file) => {
//           const fileId = file.fileId || file.publicId || file.public_id;

//           if (fileId) {
//             await deleteAssetFile(fileId);
//           }
//         }),
//       );
//     }

//     throw error;
//   }
// };

export const addAssetService = async ({
  userId,
  body = {},
  files = [],
}) => {
  // ---------------------------------------
  // 1. CHECK AUTHENTICATION
  // ---------------------------------------

  if (!userId) {
    throw createError(401, "Unauthorized user.");
  }

  // ---------------------------------------
  // 2. CLEAN BASIC VALUES
  // ---------------------------------------

  const model = cleanValue(body.model);
  const brand = cleanValue(body.brand);
  const category = cleanValue(body.category);
  const subCategory = cleanValue(body.subCategory);
  const assetName = cleanValue(body.assetName);
  const purchaseYear = cleanValue(body.purchaseYear);
  const price = cleanValue(body.price);

  // ---------------------------------------
  // 3. PARSE RENTAL PRICING
  // ---------------------------------------

  let rentalPricingObject = {};

  if (typeof body.rentalPricing === "string") {
    try {
      rentalPricingObject = JSON.parse(body.rentalPricing);
    } catch {
      rentalPricingObject = {};
    }
  } else if (
    body.rentalPricing &&
    typeof body.rentalPricing === "object"
  ) {
    rentalPricingObject = body.rentalPricing;
  }

  // ---------------------------------------
  // SUPPORT MULTIPLE FORM-DATA FORMATS
  // ---------------------------------------

  const zeroToThreeRaw =
    rentalPricingObject.zeroToThreeMonths ??
    body["rentalPricing.zeroToThreeMonths"] ??
    body["rentalPricing[zeroToThreeMonths]"];

  const threeToSixRaw =
    rentalPricingObject.threeToSixMonths ??
    body["rentalPricing.threeToSixMonths"] ??
    body["rentalPricing[threeToSixMonths]"];

  const sixMonthsPlusRaw =
    rentalPricingObject.sixMonthsPlus ??
    body["rentalPricing.sixMonthsPlus"] ??
    body["rentalPricing[sixMonthsPlus]"];

  // ---------------------------------------
  // 4. BUILD OPTIONAL RENTAL PRICING
  // ---------------------------------------

  const rentalPricing = {};

  if (
    zeroToThreeRaw !== undefined &&
    zeroToThreeRaw !== null &&
    String(zeroToThreeRaw).trim() !== ""
  ) {
    const value = Number(zeroToThreeRaw);

    if (!Number.isFinite(value) || value < 0) {
      throw createError(
        400,
        "Invalid 0-3 months rental price.",
      );
    }

    rentalPricing.zeroToThreeMonths = value;
  }

  if (
    threeToSixRaw !== undefined &&
    threeToSixRaw !== null &&
    String(threeToSixRaw).trim() !== ""
  ) {
    const value = Number(threeToSixRaw);

    if (!Number.isFinite(value) || value < 0) {
      throw createError(
        400,
        "Invalid 3-6 months rental price.",
      );
    }

    rentalPricing.threeToSixMonths = value;
  }

  if (
    sixMonthsPlusRaw !== undefined &&
    sixMonthsPlusRaw !== null &&
    String(sixMonthsPlusRaw).trim() !== ""
  ) {
    const value = Number(sixMonthsPlusRaw);

    if (!Number.isFinite(value) || value < 0) {
      throw createError(
        400,
        "Invalid 6+ months rental price.",
      );
    }

    rentalPricing.sixMonthsPlus = value;
  }

  // ---------------------------------------
  // 5. VALIDATE BASIC REQUIRED FIELDS
  // ---------------------------------------

  if (!model || !brand || !category || !purchaseYear) {
    throw createError(
      400,
      "Model, brand, category, and purchase year are required.",
    );
  }

  // ---------------------------------------
  // 6. VALIDATE FILES
  // ---------------------------------------

  if (!Array.isArray(files) || files.length === 0) {
    throw createError(
      400,
      "At least 1 asset image is required.",
    );
  }

  // ---------------------------------------
  // 7. CHECK USER EXISTS
  // ---------------------------------------

  const user = await userModel
    .findById(userId)
    .select("_id name email");

  if (!user) {
    throw createError(404, "User not found.");
  }

  let uploadedFiles = [];

  try {
    // ---------------------------------------
    // 8. UPLOAD ASSET IMAGES
    // ---------------------------------------

    uploadedFiles = await Promise.all(
      files.map((file) => uploadAssetFile(file)),
    );

    // ---------------------------------------
    // 9. CREATE ASSET
    // ---------------------------------------

    const assetData = {
      userId: user._id,

      model,
      brand,
      price,

      assetName,
      category,
      subCategory,
      purchaseYear,

      files: uploadedFiles,
    };

    // Only save rentalPricing if at least one field exists
    if (Object.keys(rentalPricing).length > 0) {
      assetData.rentalPricing = rentalPricing;
    }

    const asset = await assetModel.create(assetData);

    // ---------------------------------------
    // 10. RESPONSE
    // ---------------------------------------

    return {
      success: true,
      message: "Asset added successfully.",
      asset,
    };
  } catch (error) {
    // ---------------------------------------
    // DELETE UPLOADED FILES IF SAVE FAILS
    // ---------------------------------------

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
        }),
      );
    }

    throw error;
  }
};

const ASSETS_PER_PAGE = 10;

// export const getAssetsService = async ({ page = 1 }) => {
//   const currentPage = Number.parseInt(page, 10);

//   if (!Number.isInteger(currentPage) || currentPage < 1) {
//     throw createError(400, "Page must be a positive integer.");
//   }

//   const skip = (currentPage - 1) * ASSETS_PER_PAGE;

//   const [assets, totalAssets] = await Promise.all([
//     assetModel
//       .find({})
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(ASSETS_PER_PAGE)
//       .lean(),

//     assetModel.countDocuments({}),
//   ]);

//   const totalPages = Math.ceil(totalAssets / ASSETS_PER_PAGE);

//   return {
//     assets,
//     pagination: {
//       currentPage,
//       assetsPerPage: ASSETS_PER_PAGE,
//       totalAssets,
//       totalPages,
//       hasNextPage: currentPage < totalPages,
//       hasPreviousPage: currentPage > 1,
//       nextPage: currentPage < totalPages ? currentPage + 1 : null,
//       previousPage: currentPage > 1 ? currentPage - 1 : null,
//     },
//   };
// };


export const getAssetsService = async () => {
  const assets = await assetModel
    .find({})
    .sort({ createdAt: -1 })
    .lean();

  return {
    assets,
  };
};


// export const editAssetService = async ({
//   assetId,
//   userId,
//   body = {},
//   files = [],
// }) => {
//   let newlyUploadedFiles = [];

//   // 1. Check logged-in user
//   if (!userId) {
//     throw createError(401, "Unauthorized user.");
//   }

//   // 2. Validate asset ID
//   if (!assetId || !mongoose.Types.ObjectId.isValid(assetId)) {
//     throw createError(400, "Invalid asset ID.");
//   }

//   // 3. Find the asset belonging to the logged-in user
//   const existingAsset = await assetModel.findOne({
//     _id: assetId,
//     userId,
//   });

//   if (!existingAsset) {
//     throw createError(
//       404,
//       "Asset not found or you are not allowed to edit it.",
//     );
//   }

//   // 4. Prepare partial update data
//   const updateData = {};

//   const allowedFields = [
//     "model",
//     "brand",
//     "category",
//     "subCategory",
//     "assetName",
//     "purchaseYear",
//     "price",
//     "rentalPricing"
//   ];

//   for (const field of allowedFields) {
//     if (body[field] !== undefined) {
//       const cleanedValue = cleanValue(body[field]);

//       if (cleanedValue === undefined) {
//         throw createError(400, `${field} cannot be empty.`);
//       }

//       updateData[field] = cleanedValue;
//     }
//   }

//   // 5. Required fields cannot become empty

//   // 6. Validate uploaded files
//   if (!Array.isArray(files)) {
//     throw createError(400, "Invalid uploaded files.");
//   }

//   try {
//     // 7. Upload new images when provided
//     if (files.length > 0) {
//       newlyUploadedFiles = await Promise.all(
//         files.map((file) => uploadAssetFile(file)),
//       );

//       // New images will replace existing images
//       updateData.files = newlyUploadedFiles;
//     }

//     // 8. Check whether user sent anything to update
//     if (Object.keys(updateData).length === 0) {
//       throw createError(400, "Provide at least one field or image to update.");
//     }

//     // 9. Update only provided fields
//     const updatedAsset = await assetModel.findOneAndUpdate(
//       {
//         _id: assetId,
//         userId,
//       },
//       {
//         $set: updateData,
//       },
//       {
//         new: true,
//         runValidators: true,
//       },
//     );

//     if (!updatedAsset) {
//       throw createError(404, "Asset could not be updated.");
//     }

//     // 10. Delete old images only after DB update succeeds
//     if (
//       newlyUploadedFiles.length > 0 &&
//       Array.isArray(existingAsset.files) &&
//       existingAsset.files.length > 0
//     ) {
//       await Promise.allSettled(
//         existingAsset.files.map(async (file) => {
//           const fileId = file.fileId || file.publicId || file.public_id;

//           if (fileId) {
//             await deleteAssetFile(fileId);
//           }
//         }),
//       );
//     }

//     return updatedAsset;
//   } catch (error) {
//     /*
//      * If new images were uploaded but the database update failed,
//      * remove the newly uploaded images.
//      */
//     if (newlyUploadedFiles.length > 0) {
//       await Promise.allSettled(
//         newlyUploadedFiles.map(async (file) => {
//           const fileId = file.fileId || file.publicId || file.public_id;

//           if (fileId) {
//             await deleteAssetFile(fileId);
//           }
//         }),
//       );
//     }

//     throw error;
//   }
// };


// // ---------------------------------------
// // 8. CHECK WHETHER USER SENT ANYTHING TO UPDATE


// export const editAssetService = async ({
//   assetId,
//   userId,
//   body = {},
//   files = [],
// }) => {
//   let newlyUploadedFiles = [];

//   // ---------------------------------------
//   // 1. CHECK LOGGED-IN USER
//   // ---------------------------------------

//   if (!userId) {
//     throw createError(401, "Unauthorized user.");
//   }

//   // ---------------------------------------
//   // 2. VALIDATE ASSET ID
//   // ---------------------------------------

//   if (!assetId || !mongoose.Types.ObjectId.isValid(assetId)) {
//     throw createError(400, "Invalid asset ID.");
//   }

//   // ---------------------------------------
//   // 3. FIND USER ASSET
//   // ---------------------------------------

//   const existingAsset = await assetModel.findOne({
//     _id: assetId,
//     userId,
//   });

//   if (!existingAsset) {
//     throw createError(
//       404,
//       "Asset not found or you are not allowed to edit it.",
//     );
//   }

//   // ---------------------------------------
//   // 4. PREPARE UPDATE DATA
//   // ---------------------------------------

//   const updateData = {};

//   const allowedFields = [
//     "model",
//     "brand",
//     "category",
//     "subCategory",
//     "assetName",
//     "purchaseYear",
//     "price",
//     "isAvailable",
//   ];

//   for (const field of allowedFields) {
//     if (body[field] !== undefined) {
//       const cleanedValue = cleanValue(body[field]);

//       // If empty/null value sent,
//       // simply skip it instead of throwing error
//       if (cleanedValue !== undefined) {
//         updateData[field] = cleanedValue;
//       }
//     }
//   }

//   // ---------------------------------------
//   // 5. HANDLE RENTAL PRICING
//   // ---------------------------------------

//   if (body.rentalPricing !== undefined) {
//     let rentalPricing = body.rentalPricing;

//     // multipart/form-data may send JSON as string
//     if (typeof rentalPricing === "string") {
//       try {
//         rentalPricing = JSON.parse(rentalPricing);
//       } catch (error) {
//         throw createError(
//           400,
//           "rentalPricing must be a valid JSON object.",
//         );
//       }
//     }

//     if (
//       rentalPricing &&
//       typeof rentalPricing === "object" &&
//       !Array.isArray(rentalPricing)
//     ) {
//       const allowedRentalFields = [
//         "zeroToThreeMonths",
//         "threeToSixMonths",
//         "sixMonthsPlus",
//       ];

//       for (const field of allowedRentalFields) {
//         if (
//           rentalPricing[field] !== undefined &&
//           rentalPricing[field] !== null &&
//           rentalPricing[field] !== ""
//         ) {
//           const value = Number(rentalPricing[field]);

//           if (!Number.isFinite(value) || value < 0) {
//             throw createError(
//               400,
//               `${field} must be a valid number greater than or equal to 0.`,
//             );
//           }

//           updateData[`rentalPricing.${field}`] = value;
//         }
//       }
//     }
//   }

//   // ---------------------------------------
//   // 6. VALIDATE FILES
//   // ---------------------------------------

//   if (!Array.isArray(files)) {
//     throw createError(400, "Invalid uploaded files.");
//   }

//   try {
//     // ---------------------------------------
//     // 7. UPLOAD NEW IMAGES
//     // ---------------------------------------

//     if (files.length > 0) {
//       newlyUploadedFiles = await Promise.all(
//         files.map((file) => uploadAssetFile(file)),
//       );

//       updateData.files = newlyUploadedFiles;
//     }

//     // ---------------------------------------
//     // 8. NOTHING PROVIDED
//     // ---------------------------------------

//     if (Object.keys(updateData).length === 0) {
//       throw createError(
//         400,
//         "Provide at least one field or image to update.",
//       );
//     }

//     // ---------------------------------------
//     // 9. UPDATE ASSET
//     // ---------------------------------------

//     const updatedAsset = await assetModel.findOneAndUpdate(
//       {
//         _id: assetId,
//         userId,
//       },
//       {
//         $set: updateData,
//       },
//       {
//         new: true,
//         runValidators: true,
//       },
//     );

//     if (!updatedAsset) {
//       throw createError(404, "Asset could not be updated.");
//     }

//     // ---------------------------------------
//     // 10. DELETE OLD IMAGES
//     // ---------------------------------------

//     if (
//       newlyUploadedFiles.length > 0 &&
//       Array.isArray(existingAsset.files) &&
//       existingAsset.files.length > 0
//     ) {
//       await Promise.allSettled(
//         existingAsset.files.map(async (file) => {
//           const fileId =
//             file.fileId ||
//             file.publicId ||
//             file.public_id;

//           if (fileId) {
//             await deleteAssetFile(fileId);
//           }
//         }),
//       );
//     }

//     return updatedAsset;
//   } catch (error) {
//     // ---------------------------------------
//     // REMOVE NEW FILES IF UPDATE FAILED
//     // ---------------------------------------

//     if (newlyUploadedFiles.length > 0) {
//       await Promise.allSettled(
//         newlyUploadedFiles.map(async (file) => {
//           const fileId =
//             file.fileId ||
//             file.publicId ||
//             file.public_id;

//           if (fileId) {
//             await deleteAssetFile(fileId);
//           }
//         }),
//       );
//     }

//     throw error;
//   }
// };



export const editAssetService = async ({
  assetId,
  userId,
  body = {},
  files = [],
}) => {
  let newlyUploadedFiles = [];

  // ---------------------------------------
  // 1. CHECK LOGGED-IN USER
  // ---------------------------------------

  if (!userId) {
    throw createError(401, "Unauthorized user.");
  }

  // ---------------------------------------
  // 2. VALIDATE ASSET ID
  // ---------------------------------------

  if (!assetId || !mongoose.Types.ObjectId.isValid(assetId)) {
    throw createError(400, "Invalid asset ID.");
  }

  // ---------------------------------------
  // 3. FIND USER ASSET
  // ---------------------------------------

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

  // ---------------------------------------
  // 4. PREPARE UPDATE DATA
  // ---------------------------------------

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

  // ---------------------------------------
  // 5. HANDLE NORMAL FIELDS
  // ---------------------------------------

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      const cleanedValue = cleanValue(body[field]);

      // No field is mandatory.
      // Empty fields will simply be ignored.
      if (cleanedValue !== undefined) {
        updateData[field] = cleanedValue;
      }
    }
  }

  // ---------------------------------------
  // 6. HANDLE IS AVAILABLE
  // ---------------------------------------

  if (
    body.isAvailable !== undefined &&
    body.isAvailable !== null &&
    body.isAvailable !== ""
  ) {
    if (
      body.isAvailable === true ||
      body.isAvailable === "true"
    ) {
      updateData.isAvailable = true;
    } else if (
      body.isAvailable === false ||
      body.isAvailable === "false"
    ) {
      updateData.isAvailable = false;
    } else {
      throw createError(
        400,
        "isAvailable must be true or false.",
      );
    }
  }

  // ---------------------------------------
  // 7. HANDLE RENTAL PRICING
  // ---------------------------------------

  const rentalFields = [
    "zeroToThreeMonths",
    "threeToSixMonths",
    "sixMonthsPlus",
  ];

  /*
   * Supports:
   *
   * JSON:
   * rentalPricing: {
   *   zeroToThreeMonths: 70000
   * }
   *
   * Form-data:
   * rentalPricing[zeroToThreeMonths]: 70000
   */

  let rentalPricing = {};

  // ---------------------------------------
  // CASE 1: body.rentalPricing
  // ---------------------------------------

  if (body.rentalPricing !== undefined) {
    if (typeof body.rentalPricing === "string") {
      try {
        const parsedRentalPricing = JSON.parse(
          body.rentalPricing,
        );

        if (
          parsedRentalPricing &&
          typeof parsedRentalPricing === "object" &&
          !Array.isArray(parsedRentalPricing)
        ) {
          rentalPricing = {
            ...rentalPricing,
            ...parsedRentalPricing,
          };
        }
      } catch (error) {
        // If it isn't JSON, don't immediately fail because
        // bracket-style form-data may still have been provided.
      }
    } else if (
      body.rentalPricing &&
      typeof body.rentalPricing === "object" &&
      !Array.isArray(body.rentalPricing)
    ) {
      rentalPricing = {
        ...rentalPricing,
        ...body.rentalPricing,
      };
    }
  }

  // ---------------------------------------
  // CASE 2: FORM-DATA BRACKET NOTATION
  // ---------------------------------------

  for (const field of rentalFields) {
    const bracketKey = `rentalPricing[${field}]`;

    if (body[bracketKey] !== undefined) {
      rentalPricing[field] = body[bracketKey];
    }
  }

  // ---------------------------------------
  // VALIDATE + ADD RENTAL PRICING
  // ---------------------------------------

  for (const field of rentalFields) {
    const rawValue = rentalPricing[field];

    // Nothing mandatory
    if (
      rawValue === undefined ||
      rawValue === null ||
      rawValue === ""
    ) {
      continue;
    }

    const value = Number(rawValue);

    if (!Number.isFinite(value) || value < 0) {
      throw createError(
        400,
        `${field} must be a valid number greater than or equal to 0.`,
      );
    }

    // Dot notation means only this specific
    // rental field will be updated.
    updateData[`rentalPricing.${field}`] = value;
  }

  // ---------------------------------------
  // 8. VALIDATE FILES
  // ---------------------------------------

  if (!Array.isArray(files)) {
    throw createError(400, "Invalid uploaded files.");
  }

  try {
    // ---------------------------------------
    // 9. UPLOAD NEW IMAGES
    // ---------------------------------------

    if (files.length > 0) {
      newlyUploadedFiles = await Promise.all(
        files.map((file) => uploadAssetFile(file)),
      );

      // New images replace existing images
      updateData.files = newlyUploadedFiles;
    }

    // ---------------------------------------
    // 10. NOTHING PROVIDED TO UPDATE
    // ---------------------------------------

    if (Object.keys(updateData).length === 0) {
      throw createError(
        400,
        "Provide at least one field or image to update.",
      );
    }

    // ---------------------------------------
    // 11. UPDATE ASSET
    // ---------------------------------------

    const updatedAsset = await assetModel.findOneAndUpdate(
      {
        _id: assetId,
        userId,
      },
      {
        $set: updateData,
      },
      {
        returnDocument: "after",
        runValidators: true,
      },
    );

    if (!updatedAsset) {
      throw createError(
        404,
        "Asset could not be updated.",
      );
    }

    // ---------------------------------------
    // 12. DELETE OLD IMAGES
    // ---------------------------------------

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
        }),
      );
    }

    return updatedAsset;
  } catch (error) {
    // ---------------------------------------
    // 13. CLEAN NEW FILES IF UPDATE FAILED
    // ---------------------------------------

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
export async function toggleWishlist_Service(userId, assetId) {
  validateObjectId(userId, "User ID");
  validateObjectId(assetId, "Asset ID");

  const assetExists = await assetModel.exists({
    _id: assetId,
  });

  if (!assetExists) {
    throw createError(404, "Asset not found");
  }

  // Remove from wishlist if already present
  const removedWishlist = await wishlistModel.findOneAndDelete({
    userId,
    assetId,
  });

  if (removedWishlist) {
    return {
      success: true,
      message: "Asset removed from wishlist successfully",
      data: {
        assetId,
        isWishlisted: false,
      },
    };
  }

  // Add to wishlist if not present
  const wishlist = await wishlistModel.create({
    userId,
    assetId,
  });

  return {
    success: true,
    message: "Asset added to wishlist successfully",
    data: {
      wishlistId: wishlist._id,
      assetId: wishlist.assetId,
      isWishlisted: true,
    },
  };
}

/**
 * Remove asset from the logged-in user's wishlist.
 */
export async function removeFromWishlist_Service(userId, assetId) {
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
export async function getWishlist_Service(userId) {
  validateObjectId(userId, "User ID");

  const wishlistItems = await wishlistModel
    .find({
      userId,
    })
    .populate({
      path: "assetId",
    })
    .sort({
      createdAt: -1,
    })
    .lean();

  // Remove wishlist records whose assets have been deleted
  const assets = wishlistItems
    .filter((item) => item.assetId)
    .map((item) => ({
      ...item.assetId,
      wishlistId: item._id,
      isWishlisted: true,
      wishlistedAt: item.createdAt,
    }));

  return {
    success: true,
    message: "Wishlist fetched successfully",
    data: assets,
    totalItems: assets.length,
  };
}



/**
 * Optional API: check a single asset's wishlist status.
 */
export async function checkWishlist_Service(userId, assetId) {
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

const ALLOWED_CATEGORIES = [
  "4-Wheeler",
  "Heavy-Vehicle",
  "Heavy-Machinery",
  "Construction-Equipment",
  "Medical-Equipment",
  "Office-Equipment",
  "Others",
];

const HEAVY_MACHINERY_SUBCATEGORIES = [
  "Agriculture-Machine",
  "Concrete & road Machinery",
  "Cranes & Lifting",
  "Mining Machinery",
  "Power Equipment",
  "Warehouse Equipment",
];

const getMatchingValue = (receivedValue, allowedValues) => {
  if (!receivedValue) {
    return null;
  }

  const normalizedValue = receivedValue.trim().toLowerCase();

  return (
    allowedValues.find((value) => value.toLowerCase() === normalizedValue) ||
    null
  );
};

// export const getAssetsWith_wishlist_Service = async ({
//   userId,
//   page = 1,
//   category,
//   subCategory,
// }) => {
//   const currentPage = Number.parseInt(page, 10);

//   if (!Number.isInteger(currentPage) || currentPage < 1) {
//     throw createError(400, "Page must be a positive integer.");
//   }

//   const filter = {};

//   let validCategory = null;
//   let validSubCategory = null;

//   /*
//    * Category is optional.
//    * When category is not passed, all assets are returned.
//    */
//   if (category) {
//     validCategory = getMatchingValue(
//       category,
//       ALLOWED_CATEGORIES
//     );

//     if (!validCategory) {
//       throw createError(
//         400,
//         `Invalid category. Allowed categories are: ${ALLOWED_CATEGORIES.join(
//           ", "
//         )}`
//       );
//     }

//     filter.category = validCategory;
//   }

//   /*
//    * Subcategory cannot be passed without category.
//    */
//   if (subCategory && !validCategory) {
//     throw createError(
//       400,
//       "Category is required when subcategory is provided."
//     );
//   }

//   /*
//    * Subcategory is only available for Heavy-Machinery.
//    */
//   if (
//     subCategory &&
//     validCategory !== "Heavy-Machinery"
//   ) {
//     throw createError(
//       400,
//       "Subcategory is only available for Heavy-Machinery."
//     );
//   }

//   if (
//     validCategory === "Heavy-Machinery" &&
//     subCategory
//   ) {
//     validSubCategory = getMatchingValue(
//       subCategory,
//       HEAVY_MACHINERY_SUBCATEGORIES
//     );

//     if (!validSubCategory) {
//       throw createError(
//         400,
//         `Invalid subcategory. Allowed subcategories are: ${HEAVY_MACHINERY_SUBCATEGORIES.join(
//           ", "
//         )}`
//       );
//     }

//     filter.subCategory = validSubCategory;
//   }

//   const skip = (currentPage - 1) * ASSETS_PER_PAGE;

//   const [assets, totalAssets] = await Promise.all([
//     assetModel
//       .find(filter)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(ASSETS_PER_PAGE)
//       .lean(),

//     assetModel.countDocuments(filter),
//   ]);

//   const assetIds = assets.map((asset) => asset._id);

//   let wishlistedAssetIds = new Set();

//   if (
//     userId &&
//     mongoose.Types.ObjectId.isValid(userId) &&
//     assetIds.length > 0
//   ) {
//     const wishlistItems = await wishlistModel
//       .find({
//         userId,
//         assetId: {
//           $in: assetIds,
//         },
//       })
//       .select("assetId -_id")
//       .lean();

//     wishlistedAssetIds = new Set(
//       wishlistItems.map((item) =>
//         item.assetId.toString()
//       )
//     );
//   }

//   const assetsWithWishlist = assets.map((asset) => ({
//     ...asset,
//     isWishlisted: wishlistedAssetIds.has(
//       asset._id.toString()
//     ),
//   }));

//   const totalPages = Math.ceil(
//     totalAssets / ASSETS_PER_PAGE
//   );

//   return {
//     success: true,
//     message: "Assets fetched successfully.",
//     count: assetsWithWishlist.length,
//     data: assetsWithWishlist,
//     filters: {
//       category: validCategory,
//       subCategory: validSubCategory,
//     },
//     pagination: {
//       currentPage,
//       assetsPerPage: ASSETS_PER_PAGE,
//       totalAssets,
//       totalPages,
//       hasNextPage: currentPage < totalPages,
//       hasPreviousPage: currentPage > 1,
//       nextPage:
//         currentPage < totalPages
//           ? currentPage + 1
//           : null,
//       previousPage:
//         currentPage > 1
//           ? currentPage - 1
//           : null,
//     },
//   };
// };

// export const getAssetsWith_wishlist_Service = async ({
//   userId,
//   category,
//   subCategory,
// }) => {
//   const filter = {};

//   let validCategory = null;
//   let validSubCategory = null;

//   /*
//    * Category is optional.
//    * When category is not passed, all assets are returned.
//    */
//   if (category) {
//     validCategory = getMatchingValue(category, ALLOWED_CATEGORIES);

//     if (!validCategory) {
//       throw createError(
//         400,
//         `Invalid category. Allowed categories are: ${ALLOWED_CATEGORIES.join(
//           ", ",
//         )}`,
//       );
//     }

//     filter.category = validCategory;
//   }

//   /*
//    * Subcategory cannot be passed without category.
//    */
//   if (subCategory && !validCategory) {
//     throw createError(
//       400,
//       "Category is required when subcategory is provided.",
//     );
//   }

//   /*
//    * Subcategory is only available for Heavy-Machinery.
//    */
//   if (subCategory && validCategory !== "Heavy-Machinery") {
//     throw createError(
//       400,
//       "Subcategory is only available for Heavy-Machinery.",
//     );
//   }

//   if (validCategory === "Heavy-Machinery" && subCategory) {
//     validSubCategory = getMatchingValue(
//       subCategory,
//       HEAVY_MACHINERY_SUBCATEGORIES,
//     );

//     if (!validSubCategory) {
//       throw createError(
//         400,
//         `Invalid subcategory. Allowed subcategories are: ${HEAVY_MACHINERY_SUBCATEGORIES.join(
//           ", ",
//         )}`,
//       );
//     }

//     filter.subCategory = validSubCategory;
//   }

//   /*
//    * Fetch all matching assets without pagination.
//    */
//   const assets = await assetModel.find(filter).sort({ createdAt: -1 }).lean();

//   const assetIds = assets.map((asset) => asset._id);

//   let wishlistedAssetIds = new Set();

//   if (
//     userId &&
//     mongoose.Types.ObjectId.isValid(userId) &&
//     assetIds.length > 0
//   ) {
//     const wishlistItems = await wishlistModel
//       .find({
//         userId,
//         assetId: {
//           $in: assetIds,
//         },
//       })
//       .select("assetId -_id")
//       .lean();

//     wishlistedAssetIds = new Set(
//       wishlistItems.map((item) => item.assetId.toString()),
//     );
//   }

//   const assetsWithWishlist = assets.map((asset) => ({
//     ...asset,
//     isWishlisted: wishlistedAssetIds.has(asset._id.toString()),
//   }));

//   return {
//     success: true,
//     message: "Assets fetched successfully.",
//     count: assetsWithWishlist.length,
//     data: assetsWithWishlist,
//     filters: {
//       category: validCategory,
//       subCategory: validSubCategory,
//     },
//   };
// };



// export const getAssetsWith_wishlist_Service = async ({
//   userId,
//   category,
//   subCategory,
// }) => {
//   const filter = {};

//   let validCategory = null;
//   let validSubCategory = null;

//   /*
//    * Category is optional.
//    * When category is not passed, all assets are returned.
//    */
//   if (category) {
//     validCategory = getMatchingValue(category, ALLOWED_CATEGORIES);

//     if (!validCategory) {
//       throw createError(
//         400,
//         `Invalid category. Allowed categories are: ${ALLOWED_CATEGORIES.join(
//           ", ",
//         )}`,
//       );
//     }

//     filter.category = validCategory;
//   }

//   /*
//    * Subcategory cannot be passed without category.
//    */
//   if (subCategory && !validCategory) {
//     throw createError(
//       400,
//       "Category is required when subcategory is provided.",
//     );
//   }

//   /*
//    * Subcategory is only available for Heavy-Machinery.
//    */
//   if (subCategory && validCategory !== "Heavy-Machinery") {
//     throw createError(
//       400,
//       "Subcategory is only available for Heavy-Machinery.",
//     );
//   }

//   if (validCategory === "Heavy-Machinery" && subCategory) {
//     validSubCategory = getMatchingValue(
//       subCategory,
//       HEAVY_MACHINERY_SUBCATEGORIES,
//     );

//     if (!validSubCategory) {
//       throw createError(
//         400,
//         `Invalid subcategory. Allowed subcategories are: ${HEAVY_MACHINERY_SUBCATEGORIES.join(
//           ", ",
//         )}`,
//       );
//     }

//     filter.subCategory = validSubCategory;
//   }

//   /*
//    * Fetch all matching assets without pagination.
//    */
//   const assets = await assetModel.find(filter).lean();

//   // Sort price Low -> High
//   assets.sort((a, b) => {
//     const getPrice = (price) => {
//       if (!price) return 0;

//       const value = String(price)
//         .split("-")[0]
//         .replace(/[₹,\s]/g, "")
//         .toUpperCase();

//       const number = parseFloat(value) || 0;

//       if (value.includes("CR")) return number * 10000000;
//       if (value.includes("L")) return number * 100000;
//       if (value.includes("K")) return number * 1000;

//       return number;
//     };

//     return getPrice(a.price) - getPrice(b.price);
//   });

//   const assetIds = assets.map((asset) => asset._id);

//   let wishlistedAssetIds = new Set();

//   if (
//     userId &&
//     mongoose.Types.ObjectId.isValid(userId) &&
//     assetIds.length > 0
//   ) {
//     const wishlistItems = await wishlistModel
//       .find({
//         userId,
//         assetId: {
//           $in: assetIds,
//         },
//       })
//       .select("assetId -_id")
//       .lean();

//     wishlistedAssetIds = new Set(
//       wishlistItems.map((item) => item.assetId.toString()),
//     );
//   }

//   const assetsWithWishlist = assets.map((asset) => ({
//     ...asset,
//     isWishlisted: wishlistedAssetIds.has(asset._id.toString()),
//   }));

//   return {
//     success: true,
//     message: "Assets fetched successfully.",
//     count: assetsWithWishlist.length,
//     data: assetsWithWishlist,
//     filters: {
//       category: validCategory,
//       subCategory: validSubCategory,
//     },
//   };
// };


export const getAssetsWith_wishlist_Service = async ({
  userId,
  category,
  subCategory,
}) => {
  const filter = {};

  let validCategory = null;
  let validSubCategory = null;

  // ---------------------------------------
  // CATEGORY FILTER
  // ---------------------------------------

  if (category) {
    validCategory = getMatchingValue(
      category,
      ALLOWED_CATEGORIES,
    );

    if (!validCategory) {
      throw createError(
        400,
        `Invalid category. Allowed categories are: ${ALLOWED_CATEGORIES.join(
          ", ",
        )}`,
      );
    }

    filter.category = validCategory;
  }

  // ---------------------------------------
  // SUBCATEGORY VALIDATION
  // ---------------------------------------

  if (subCategory && !validCategory) {
    throw createError(
      400,
      "Category is required when subcategory is provided.",
    );
  }

  if (
    subCategory &&
    validCategory !== "Heavy-Machinery"
  ) {
    throw createError(
      400,
      "Subcategory is only available for Heavy-Machinery.",
    );
  }

  if (
    validCategory === "Heavy-Machinery" &&
    subCategory
  ) {
    validSubCategory = getMatchingValue(
      subCategory,
      HEAVY_MACHINERY_SUBCATEGORIES,
    );

    if (!validSubCategory) {
      throw createError(
        400,
        `Invalid subcategory. Allowed subcategories are: ${HEAVY_MACHINERY_SUBCATEGORIES.join(
          ", ",
        )}`,
      );
    }

    filter.subCategory = validSubCategory;
  }

  // ---------------------------------------
  // OPTIONAL:
  // Only show available assets
  // Uncomment if required
  // ---------------------------------------

  // filter.isAvailable = true;

  // ---------------------------------------
  // FETCH ASSETS
  // ---------------------------------------

  const assets = await assetModel
    .find(filter)
    .lean();

  // ---------------------------------------
  // PRICE CONVERTER
  // Handles:
  // ₹1.5 L
  // ₹50 K
  // ₹1 CR
  // ₹150000
  // ---------------------------------------

  const getPrice = (price) => {
    if (!price) return 0;

    const value = String(price)
      .split("-")[0]
      .replace(/[₹,\s]/g, "")
      .toUpperCase();

    const number = parseFloat(value) || 0;

    if (value.includes("CR")) {
      return number * 10000000;
    }

    if (value.includes("L")) {
      return number * 100000;
    }

    if (value.includes("K")) {
      return number * 1000;
    }

    return number;
  };

  // ---------------------------------------
  // SORT PRICE LOW -> HIGH
  // ---------------------------------------

  assets.sort((a, b) => {
    return getPrice(a.price) - getPrice(b.price);
  });

  // ---------------------------------------
  // ASSET IDS
  // ---------------------------------------

  const assetIds = assets.map(
    (asset) => asset._id,
  );

  // ---------------------------------------
  // WISHLIST
  // ---------------------------------------

  let wishlistedAssetIds = new Set();

  if (
    userId &&
    mongoose.Types.ObjectId.isValid(userId) &&
    assetIds.length > 0
  ) {
    const wishlistItems =
      await wishlistModel
        .find({
          userId,

          assetId: {
            $in: assetIds,
          },
        })
        .select("assetId -_id")
        .lean();

    wishlistedAssetIds = new Set(
      wishlistItems.map((item) =>
        item.assetId.toString(),
      ),
    );
  }

  // ---------------------------------------
  // FINAL RESPONSE DATA
  // ---------------------------------------

  const assetsWithWishlist = assets.map(
    (asset) => ({
      ...asset,

      // -----------------------------------
      // NEW RENTAL PRICING FIELDS
      // -----------------------------------

      rentalPricing: {
        zeroToThreeMonths:
          asset.rentalPricing
            ?.zeroToThreeMonths ?? null,

        threeToSixMonths:
          asset.rentalPricing
            ?.threeToSixMonths ?? null,

        sixMonthsPlus:
          asset.rentalPricing
            ?.sixMonthsPlus ?? null,
      },

      // -----------------------------------
      // AVAILABILITY
      // -----------------------------------

      isAvailable:
        asset.isAvailable ?? true,

      // -----------------------------------
      // WISHLIST
      // -----------------------------------

      isWishlisted:
        wishlistedAssetIds.has(
          asset._id.toString(),
        ),
    }),
  );

  // ---------------------------------------
  // RESPONSE
  // ---------------------------------------

  return {
    success: true,

    message:
      "Assets fetched successfully.",

    count: assetsWithWishlist.length,

    data: assetsWithWishlist,

    filters: {
      category: validCategory,
      subCategory: validSubCategory,
    },
  };
};
