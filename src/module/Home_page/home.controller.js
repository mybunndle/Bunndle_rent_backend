import {
  addHomeAssetService,
  getTrendingAssetsService,
  getRecommendedAssetsService,
} from "./home.service.js";

export const addTrendingAssetController = async (
  req,
  res
) => {
  try {
    console.log("req.file",req.file)
    const result = await addHomeAssetService({
      body: req.body,
      file: req.file,
      assetType: "trending",
    });

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error(
      "ADD TRENDING ASSET ERROR:",
      error
    );

    return res
      .status(error.statusCode || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to add trending asset.",
      });
  }
};





export const addRecommendedAssetController = async (
  req,
  res
) => {
  try {
    const result = await addHomeAssetService({
      body: req.body,
      file: req.file,
      assetType: "recommended",
    });

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    console.error(
      "ADD RECOMMENDED ASSET ERROR:",
      error
    );

    return res
      .status(error.statusCode || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to add recommended asset.",
      });
  }
};


export const getTrendingAssetsController = async (
  req,
  res
) => {
  try {
    const trendingAssets =
      await getTrendingAssetsService();

    return res.status(200).json({
      success: true,
      message:
        "Trending assets fetched successfully.",
      count: trendingAssets.length,
      data: trendingAssets,
    });
  } catch (error) {
    console.error(
      "GET TRENDING ASSETS ERROR:",
      error
    );

    return res
      .status(error.statusCode || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to fetch trending assets.",
      });
  }
};

export const getRecommendedAssetsController =
  async (req, res) => {
    try {
      const recommendedAssets =
        await getRecommendedAssetsService();

      return res.status(200).json({
        success: true,
        message:
          "Recommended assets fetched successfully.",
        count: recommendedAssets.length,
        data: recommendedAssets,
      });
    } catch (error) {
      console.error(
        "GET RECOMMENDED ASSETS ERROR:",
        error
      );

      return res
        .status(error.statusCode || 500)
        .json({
          success: false,
          message:
            error.message ||
            "Failed to fetch recommended assets.",
        });
    }
  };