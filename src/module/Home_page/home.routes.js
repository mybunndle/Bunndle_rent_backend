import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { uploadHomeImage } from "../../middleware/upload.js";
import {
  addTrendingAssetController,
  addRecommendedAssetController,
  getTrendingAssetsController,
  getRecommendedAssetsController,
  addLimitedTimeOfferController,
  getLimitedTimeOffersController,
  addHomeDealController,
  getHomeDealsController,
  deleteTrendingRecommendedController,
  deleteLimitedTimeOfferController, 
  deleteHomeDealController,
  updateTrendingRecommendedController,
  updateLimitedTimeOfferController,
} from "./home.controller.js";

const router = express.Router();

router.post(
  "/add_trending",
  authenticate,
  uploadHomeImage.single("image"),
  addTrendingAssetController,
);

// Fetch trending assets
router.get("/get_trending", getTrendingAssetsController);

router.post(
  "/add_recommended",
  authenticate,
  uploadHomeImage.single("image"),
  addRecommendedAssetController,
); // same as trending only path is different

// Fetch recommended assets
router.get("/get_recommended", getRecommendedAssetsController);

router.delete( 
  "/delete_trending_recommended/:assetId", 
  authenticate, 
  deleteTrendingRecommendedController, 
);

router.post(
  "/add_limitedtimeoffer",
  authenticate,
  uploadHomeImage.single("image"),
  addLimitedTimeOfferController,
);

router.get("/get_limitedtimeoffer", getLimitedTimeOffersController);

router.delete( 
  "/delete_limitedtimeoffer/:assetId", 
  authenticate, 
  deleteLimitedTimeOfferController, 
);

router.post(
  "/add_home_deal",
  authenticate,
  uploadHomeImage.single("images"),
  addHomeDealController,
);

router.get("/get_home_deals", getHomeDealsController);

router.delete( 
  "/delete_home_deal/:assetId", 
  authenticate, 
  deleteHomeDealController, 
);

router.patch(
  "/update_trending_recommended/:assetId",
  authenticate,
  uploadHomeImage.single("image"),
  updateTrendingRecommendedController,
);

router.patch(
  "/update_limitedtimeoffer/:offerId",
  authenticate,
  uploadHomeImage.single("image"),
  updateLimitedTimeOfferController,
);

export default router;
