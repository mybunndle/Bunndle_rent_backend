import mongoose from "mongoose";

import homeTrendRecomModel from "../../models/homeTrend&RecomModel.js";
import limitedTimeOfferModel from "../../models/limitedtimeofferModel.js";
import homeDealsModel from "../../models/homeDealsModel.js";
import { uploadHomeFiles, deleteHomeFiles } from "./img_service.js";

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const cleanValue = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  const cleanedValue = String(value).trim();
  return cleanedValue || null;
};

const validateObjectId = (
  id,
  fieldName = "ID",
) => {
  if (!id) {
    throw createError(
      400,
      `${fieldName} is required.`,
    );
  }

  if (!mongoose.isValidObjectId(id)) {
    throw createError(
      400,
      `Invalid ${fieldName}.`,
    );
  }
};

export const addHomeAssetService = async ({
  body = {},
  file = null,
  assetType,
}) => {
  const assetName = cleanValue(body.assetName);
  const category = cleanValue(body.category);
  const brand = cleanValue(body.brand);
  const model = cleanValue(body.model);

  const price =
    body.price !== undefined && body.price !== null && body.price !== ""
      ? Number(body.price)
      : null;

  const rank =
    body.rank !== undefined && body.rank !== null && body.rank !== ""
      ? Number(body.rank)
      : null;

  const normalizedType = cleanValue(assetType)?.toLowerCase();

  if (
    !normalizedType ||
    !["trending", "recommended"].includes(normalizedType)
  ) {
    throw createError(400, "Type must be either trending or recommended.");
  }

  if (!file) {
    throw createError(400, "Asset image is required.");
  }

  let uploadedImage = null;

  try {
    uploadedImage = await uploadHomeFiles(file);

    const asset = await homeTrendRecomModel.create({
      assetName,
      type: normalizedType,
      category,
      brand,
      model,
      price,
      rank,
      image: {
        url: uploadedImage.url,
        fileId: uploadedImage.fileId,
      },
    });

    return {
      message: `${
        normalizedType === "trending" ? "Trending" : "Recommended"
      } asset added successfully.`,
      data: asset,
    };
  } catch (error) {
    /*
     * ImageKit upload successful hua lekin MongoDB save fail hua,
     * toh uploaded image delete kar denge.
     */
    if (uploadedImage?.fileId) {
      await deleteHomeFiles(uploadedImage.fileId).catch((deleteError) => {
        console.error("IMAGE CLEANUP ERROR:", deleteError.message);
      });
    }

    throw error;
  }
};

export const getTrendingAssetsService = async () => {
  const trendingAssets = await homeTrendRecomModel
    .find({
      type: "trending",
    })
    .sort({
      rank: 1,
      createdAt: -1,
    })
    .lean();

  return trendingAssets;
};

export const getRecommendedAssetsService = async () => {
  const recommendedAssets = await homeTrendRecomModel
    .find({
      type: "recommended",
    })
    .sort({
      rank: 1,
      createdAt: -1,
    })
    .lean();

  return recommendedAssets;
};

export const deleteTrendingRecommendedService = async (
  assetId,
) => {
  validateObjectId(assetId, "Asset ID");

  const asset =
    await homeTrendRecomModel.findById(assetId);

  if (!asset) {
    throw createError(
      404,
      "Trending or recommended asset not found.",
    );
  }

  const imageFileId =
    asset.image?.fileId || null;

  const assetType =
    asset.type === "trending"
      ? "Trending"
      : "Recommended";

  await homeTrendRecomModel.deleteOne({
    _id: asset._id,
  });

  let warning = null;

  if (imageFileId) {
    try {
      await deleteHomeFiles(imageFileId);
    } catch (error) {
      console.error(
        "TRENDING/RECOMMENDED IMAGE DELETE ERROR:",
        error.message,
      );

      warning =
        "Asset was deleted from the database, but its image could not be deleted from ImageKit.";
    }
  }

  return {
    message: `${assetType} asset deleted permanently.`,
    data: {
      _id: asset._id,
      assetName: asset.assetName || null,
      type: asset.type,
    },
    warning,
  };
};
export const addLimitedTimeOfferService = async ({
  body = {},
  file = null,
}) => {
  const title = cleanValue(body.title);
  const category = cleanValue(body.category);

  const discountPercentage =
    body.discountPercentage !== undefined &&
    body.discountPercentage !== null &&
    body.discountPercentage !== ""
      ? Number(body.discountPercentage)
      : null;

  const discountPrice =
    body.discountPrice !== undefined &&
    body.discountPrice !== null &&
    body.discountPrice !== ""
      ? Number(body.discountPrice)
      : null;

  const rank =
    body.rank !== undefined && body.rank !== null && body.rank !== ""
      ? Number(body.rank)
      : null;

  if (!title) {
    throw createError(400, "Limited-time offer title is required.");
  }
  if (!category) {
    throw createError(400, "Limited-time offer category is required.");
  }

  if (discountPercentage === null || Number.isNaN(discountPercentage)) {
    throw createError(400, "Valid discount percentage is required.");
  }

  if (discountPercentage < 0 || discountPercentage > 100) {
    throw createError(400, "Discount percentage must be between 0 and 100.");
  }

  if (discountPrice === null || Number.isNaN(discountPrice)) {
    throw createError(400, "Valid discount price is required.");
  }

  if (discountPrice < 0) {
    throw createError(400, "Discount price cannot be negative.");
  }

  if (rank === null || Number.isNaN(rank)) {
    throw createError(400, "Valid rank is required.");
  }

  if (!Number.isInteger(rank)) {
    throw createError(400, "Rank must be a whole number.");
  }

  if (rank < 1) {
    throw createError(400, "Rank must be at least 1.");
  }

  if (!file) {
    throw createError(400, "Limited-time offer image is required.");
  }

  let uploadedImage = null;

  try {
    uploadedImage = await uploadHomeFiles(file);

    const limitedTimeOffer = await limitedTimeOfferModel.create({
      title,
      category,
      discountPercentage,
      discountPrice,
      rank,

      image: {
        url: uploadedImage.url,
        fileId: uploadedImage.fileId,
        filename: uploadedImage.filename,
      },
    });

    return limitedTimeOffer;
  } catch (error) {
    // Image upload ho gayi but MongoDB save fail hua
    if (uploadedImage?.fileId) {
      await deleteHomeFiles(uploadedImage.fileId).catch((deleteError) => {
        console.error(
          "LIMITED OFFER IMAGE CLEANUP ERROR:",
          deleteError.message,
        );
      });
    }

    throw error;
  }
};

export const getLimitedTimeOffersService = async () => {
  const limitedTimeOffers = await limitedTimeOfferModel
    .find({})
    .sort({
      createdAt: -1,
      rank: 1,
    })
    .lean();

  return limitedTimeOffers;
};

export const deleteLimitedTimeOfferService = async (
  offerId,
) => {
  validateObjectId(
    offerId,
    "Limited-time offer ID",
  );

  const limitedTimeOffer =
    await limitedTimeOfferModel.findById(
      offerId,
    );

  if (!limitedTimeOffer) {
    throw createError(
      404,
      "Limited-time offer not found.",
    );
  }

  const imageFileId =
    limitedTimeOffer.image?.fileId || null;

  await limitedTimeOfferModel.deleteOne({
    _id: limitedTimeOffer._id,
  });

  let warning = null;

  if (imageFileId) {
    try {
      await deleteHomeFiles(imageFileId);
    } catch (error) {
      console.error(
        "LIMITED-TIME OFFER IMAGE DELETE ERROR:",
        error.message,
      );

      warning =
        "Limited-time offer was deleted from the database, but its image could not be deleted from ImageKit.";
    }
  }

  return {
    message:
      "Limited-time offer deleted permanently.",
    data: {
      _id: limitedTimeOffer._id,
      title: limitedTimeOffer.title || null,
    },
    warning,
  };
};

export const addHomeDealService = async ({ file = null }) => {
  let uploadedImage = null;

  try {
    if (!file) {
      throw createError(
        400,
        "Home deal image is required."
      );
    }

    uploadedImage = await uploadHomeFiles(file);

    const homeDeal = await homeDealsModel.create({
      images: [
        {
          url: uploadedImage.url,
          fileId: uploadedImage.fileId,
          filename: uploadedImage.filename,
        },
      ],
    });

    return homeDeal;
  } catch (error) {
    // ImageKit upload successful ho gaya lekin MongoDB save fail hua
    if (uploadedImage?.fileId) {
      await deleteHomeFiles(uploadedImage.fileId).catch(
        (deleteError) => {
          console.error(
            "Failed to delete uploaded image:",
            deleteError.message
          );
        }
      );
    }

    throw error;
  }
};

export const getHomeDealsService = async () => {
  const homeDeals = await homeDealsModel
    .find({})
    .sort({
      createdAt: -1,
    })
    .lean();

  return homeDeals;
};

export const deleteHomeDealService = async (
  dealId,
) => {
  validateObjectId(dealId, "Home deal ID");

  const homeDeal =
    await homeDealsModel.findById(dealId);

  if (!homeDeal) {
    throw createError(
      404,
      "Home deal not found.",
    );
  }

  const imageFileIds = Array.isArray(
    homeDeal.images,
  )
    ? homeDeal.images
        .map((image) => image?.fileId)
        .filter(Boolean)
    : [];

  await homeDealsModel.deleteOne({
    _id: homeDeal._id,
  });

  let failedImageCount = 0;

  for (const fileId of imageFileIds) {
    try {
      await deleteHomeFiles(fileId);
    } catch (error) {
      failedImageCount += 1;

      console.error(
        "HOME DEAL IMAGE DELETE ERROR:",
        error.message,
      );
    }
  }

  return {
    message: "Home deal deleted permanently.",
    data: {
      _id: homeDeal._id,
      totalImages: imageFileIds.length,
      deletedImages:
        imageFileIds.length -
        failedImageCount,
    },
    warning:
      failedImageCount > 0
        ? `${failedImageCount} home deal image(s) could not be deleted from ImageKit.`
        : null,
  };
};
