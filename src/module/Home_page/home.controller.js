import {
  addHomeAssetService,
  getTrendingAssetsService,
  getRecommendedAssetsService,
  addLimitedTimeOfferService,
  getLimitedTimeOffersService,
  addHomeDealService,
  getHomeDealsService,
  deleteTrendingRecommendedService,
  deleteLimitedTimeOfferService,
  deleteHomeDealService,
  updateTrendingRecommendedService,
} from "./home.service.js";

export const addTrendingAssetController = async (req, res) => {
  try {
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
    console.error("ADD TRENDING ASSET ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to add trending asset.",
    });
  }
};

export const addRecommendedAssetController = async (req, res) => {
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
    console.error("ADD RECOMMENDED ASSET ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to add recommended asset.",
    });
  }
};

export const getTrendingAssetsController = async (req, res) => {
  try {
    const trendingAssets = await getTrendingAssetsService();

    return res.status(200).json({
      success: true,
      message: "Trending assets fetched successfully.",
      count: trendingAssets.length,
      data: trendingAssets,
    });
  } catch (error) {
    console.error("GET TRENDING ASSETS ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch trending assets.",
    });
  }
};

export const getRecommendedAssetsController = async (req, res) => {
  try {
    const recommendedAssets = await getRecommendedAssetsService();

    return res.status(200).json({
      success: true,
      message: "Recommended assets fetched successfully.",
      count: recommendedAssets.length,
      data: recommendedAssets,
    });
  } catch (error) {
    console.error("GET RECOMMENDED ASSETS ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch recommended assets.",
    });
  }
};

export const deleteTrendingRecommendedController = async (req, res) => {
  try {
    const { assetId } = req.params;
    console.log("assetId to delete:", assetId);
    const result = await deleteTrendingRecommendedService(assetId);
    return res
      .status(200)
      .json({
        success: true,
        message: result.message,
        data: result.data,
        ...(result.warning && { warning: result.warning }),
      });
  } catch (error) {
    console.error("DELETE TRENDING RECOMMENDED ERROR:", error);
    return res
      .status(error.statusCode || 500)
      .json({
        success: false,
        message:
          error.message || "Failed to delete trending or recommended asset.",
      });
  }
};

export const updateTrendingRecommendedController = async (req, res) => {
    try {
      const result =
        await updateTrendingRecommendedService({
          assetId: req.params.assetId,
          body: req.body,
          file: req.file,
        });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        ...(result.warning && {
          warning: result.warning,
        }),
      });
    } catch (error) {
      console.error(
        "UPDATE TRENDING/RECOMMENDED ERROR:",
        error,
      );

      return res
        .status(error.statusCode || 500)
        .json({
          success: false,
          message:
            error.message ||
            "Failed to update trending or recommended asset.",
        });
    }
  };

export const addLimitedTimeOfferController = async (req, res) => {
  try {
    const limitedTimeOffer = await addLimitedTimeOfferService({
      body: req.body,
      file: req.file,
    });

    return res.status(201).json({
      success: true,
      message: "Limited-time offer added successfully.",
      data: limitedTimeOffer,
    });
  } catch (error) {
    console.error("ADD LIMITED-TIME OFFER ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to add limited-time offer.",
    });
  }
};

export const getLimitedTimeOffersController = async (req, res) => {
  try {
    const limitedTimeOffers = await getLimitedTimeOffersService();

    return res.status(200).json({
      success: true,
      message: "Limited-time offers fetched successfully.",
      count: limitedTimeOffers.length,
      data: limitedTimeOffers,
    });
  } catch (error) {
    console.error("GET LIMITED-TIME OFFERS ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch limited-time offers.",
    });
  }
};

export const deleteLimitedTimeOfferController = async (req, res) => {
  try {
    const { assetId } = req.params;
    const result = await deleteLimitedTimeOfferService(assetId);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
      ...(result.warning && { warning: result.warning }),
    });
  } catch (error) {
    console.error("DELETE LIMITED-TIME OFFER ERROR:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete limited-time offer.",
    });
  }
};

export const updateLimitedTimeOfferController = async (
  req,
  res,
) => {
  try {
    const result =
      await updateLimitedTimeOfferService({
        offerId: req.params.offerId,
        body: req.body,
        file: req.file,
      });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
      ...(result.warning && {
        warning: result.warning,
      }),
    });
  } catch (error) {
    console.error(
      "UPDATE LIMITED-TIME OFFER ERROR:",
      error,
    );

    return res
      .status(error.statusCode || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Failed to update limited-time offer.",
      });
  }
}; 

export const addHomeDealController = async (req, res) => {
  try {
    const homeDeal = await addHomeDealService({
      file: req.file,
    });

    return res.status(201).json({
      success: true,
      message: "Home deal added successfully.",
      data: homeDeal,
    });
  } catch (error) {
    console.error("ADD HOME DEAL ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to add home deal.",
    });
  }
};

export const getHomeDealsController = async (req, res) => {
  try {
    const homeDeals = await getHomeDealsService();

    return res.status(200).json({
      success: true,
      message: "Home deals fetched successfully.",
      count: homeDeals.length,
      data: homeDeals,
    });
  } catch (error) {
    console.error("GET HOME DEALS ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch home deals.",
    });
  }
};

export const deleteHomeDealController = async (req, res) => {
  try {
    const { assetId } = req.params;
    const result = await deleteHomeDealService(assetId);
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
      ...(result.warning && { warning: result.warning }),
    });
  } catch (error) {
    console.error("DELETE HOME DEAL ERROR:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete home deal.",
    });
  }
};
