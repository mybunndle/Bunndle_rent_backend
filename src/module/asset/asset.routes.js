import express from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { uploadAssetImages } from "../../middleware/upload.js";
import {
  addAssetController,
  getAssetsController,
  editAssetController,
  deleteAssetController,
  toggleWishlist_Controller,
  removeFromWishlist_Controller,
  getWishlist_Controller,
  checkWishlist_Controller,
  getAssetsWith_wishlist_Controller,
} from "./asset.controller.js";

const router = express.Router();

router.post(
  "/add_asset",
  authenticate,
  uploadAssetImages.array("files", 5),
  addAssetController,
);
router.get("/get_assets", authenticate, getAssetsController);

router.patch(
  "/edit_asset/:id",
  authenticate,
  uploadAssetImages.array("files", 5),
  editAssetController,
);

router.delete("/delete_asset/:id", authenticate, deleteAssetController);

router.put("/toggle_wishlist/:assetId", authenticate, toggleWishlist_Controller);
router.delete(
  "/remove_from_wishlist/:assetId",
  authenticate,
  removeFromWishlist_Controller,
);

router.get("/get_wishlist", authenticate, getWishlist_Controller);
router.get("/check/:assetId", authenticate, checkWishlist_Controller);

//assets with wishlist item for aeach users

router.get(
  "/get_assets_with_wishlist/:category/:subCategory",
  authenticate,
  getAssetsWith_wishlist_Controller
);

router.get(
  "/get_assets_with_wishlist/:category",
  authenticate,
  getAssetsWith_wishlist_Controller
);

router.get(
  "/get_assets_with_wishlist",
  authenticate,
  getAssetsWith_wishlist_Controller
);

export default router;
