import express from "express";
import {authenticate } from "../../middleware/auth.middleware.js";
import {uploadHomeImage}  from "../../middleware/upload.js";
import { addTrendingAssetController } from "./home.controller.js";


const router = express.Router();


router.post("/add_trending", authenticate,uploadHomeImage.single("image"), addTrendingAssetController)

router.post("/add_recommended", authenticate,uploadHomeImage.single("image"),  addTrendingAssetController)// same as trending only path is different






export default router;