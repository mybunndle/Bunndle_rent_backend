import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { uploadHomeImage } from "../../middleware/upload.js";
import { 
    addTrendingAssetController ,
    getTrendingAssetsController,
    getRecommendedAssetsController,
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
  addTrendingAssetController,
); // same as trending only path is different

// Fetch recommended assets
router.get("/get_recommended", getRecommendedAssetsController);

export default router;
