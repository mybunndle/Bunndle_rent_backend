import homeTrendRecomModel  from "../../models/homeTrend&RecomModel.js";
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