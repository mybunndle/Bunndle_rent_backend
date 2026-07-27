import express from "express";
import {authenticate} from "../../middleware/auth.middleware.js";
import { uploadAssetImages } from "../../middleware/upload.js";
import { addAssetController , getAssetsController , editAssetController , deleteAssetController} from "./asset.controller.js";

const router = express.Router();

router.post(
  "/add_asset",

  uploadAssetImages.array("files", 5),
  addAssetController
);
router.get("/get_assets" , getAssetsController)


router.patch(
  "/edit_asset/:id",

  uploadAssetImages.array("files", 5),
  editAssetController
);


router.delete(
  "/delete_asset/:id",

  deleteAssetController
);



export default router;