import {
  addHomeAssetService,
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