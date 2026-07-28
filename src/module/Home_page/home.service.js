import homeTrendRecomModel  from "../../models/homeTrend&RecomModel.js";
import limitedTimeOfferModel from "../../models/limitedtimeofferModel.js";
import {
  uploadHomeFiles,
  deleteHomeFiles,
} from "./img_service.js";




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
    body.price !== undefined &&
    body.price !== null &&
    body.price !== ""
      ? Number(body.price)
      : null;

  const rank =
    body.rank !== undefined &&
    body.rank !== null &&
    body.rank !== ""
      ? Number(body.rank)
      : null;

  const normalizedType = cleanValue(assetType)?.toLowerCase();

  if (
    !normalizedType ||
    !["trending", "recommended"].includes(normalizedType)
  ) {
    throw createError(
      400,
      "Type must be either trending or recommended."
    );
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
        normalizedType === "trending"
          ? "Trending"
          : "Recommended"
      } asset added successfully.`,
      data: asset,
    };
  } catch (error) {
    /*
     * ImageKit upload successful hua lekin MongoDB save fail hua,
     * toh uploaded image delete kar denge.
     */
    if (uploadedImage?.fileId) {
      await deleteHomeFiles(
        uploadedImage.fileId
      ).catch((deleteError) => {
        console.error(
          "IMAGE CLEANUP ERROR:",
          deleteError.message
        );
      });
    }

    throw error;
  }
};


export const getTrendingAssetsService = async () => {
  const trendingAssets =
    await homeTrendRecomModel
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

export const getRecommendedAssetsService =
  async () => {
    const recommendedAssets =
      await homeTrendRecomModel
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


export const addLimitedTimeOfferService = async ({
  body = {},
  file = null,
}) => {
  const title = cleanValue(body.title);

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
    body.rank !== undefined &&
    body.rank !== null &&
    body.rank !== ""
      ? Number(body.rank)
      : null;

  if (!title) {
    throw createError(
      400,
      "Limited-time offer title is required."
    );
  }

  if (
    discountPercentage === null ||
    Number.isNaN(discountPercentage)
  ) {
    throw createError(
      400,
      "Valid discount percentage is required."
    );
  }

  if (
    discountPercentage < 0 ||
    discountPercentage > 100
  ) {
    throw createError(
      400,
      "Discount percentage must be between 0 and 100."
    );
  }

  if (
    discountPrice === null ||
    Number.isNaN(discountPrice)
  ) {
    throw createError(
      400,
      "Valid discount price is required."
    );
  }

  if (discountPrice < 0) {
    throw createError(
      400,
      "Discount price cannot be negative."
    );
  }

  if (
  rank === null ||
  Number.isNaN(rank)
) {
  throw createError(
    400,
    "Valid rank is required."
  );
}

if (!Number.isInteger(rank)) {
  throw createError(
    400,
    "Rank must be a whole number."
  );
}

if (rank < 1) {
  throw createError(
    400,
    "Rank must be at least 1."
  );
}

  if (!file) {
    throw createError(
      400,
      "Limited-time offer image is required."
    );
  }

  let uploadedImage = null;

  try {
    uploadedImage = await uploadHomeFiles(file);

    const limitedTimeOffer =
      await limitedTimeOfferModel.create({
        title,
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
      await deleteHomeFiles(
        uploadedImage.fileId
      ).catch((deleteError) => {
        console.error(
          "LIMITED OFFER IMAGE CLEANUP ERROR:",
          deleteError.message
        );
      });
    }

    throw error;
  }
};

export const getLimitedTimeOffersService =
  async () => {
    const limitedTimeOffers =
      await limitedTimeOfferModel
        .find({})
        .sort({
          createdAt: -1,
          rank: 1,
        })
        .lean();

    return limitedTimeOffers;
  };