import express from "express";
import {authenticate} from "../../middleware/auth.middleware.js";
import { uploadAssetImages } from "../../middleware/upload.js";
import { addAssetController , getAssetsController , editAssetController} from "./asset.controller.js";

const router = express.Router();

router.post(
  "/add_asset",
  authenticate,
  uploadAssetImages.array("files", 5),
  addAssetController
);
router.get("/get_assets",authenticate, getAssetsController)

router.patch(
  "/edit_asset/:id",
  authenticate,
  uploadAssetImages.array("files", 5),
  editAssetController
);



export default router;