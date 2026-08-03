import express from "express";

import {
  toggleEnquiry,
  getMyEnquiredAssets,
  getMyEnquiryAssetIds,
  getAllEnquiries,
  addAdminRemark,
} from "./enquiry.controller.js";

import { authenticate } from "../../middleware/auth.middleware.js";

const router = express.Router();

// User routes
router.post(
  "/toggle/:assetId",
  authenticate,
  toggleEnquiry
);

router.get(
  "/my_enquiries",
  authenticate,
  getMyEnquiredAssets
);

router.get(
  "/my-enquiry-asset-ids",
  authenticate,
  getMyEnquiryAssetIds
);

// Admin routes
// Admin role is checked inside controllers
router.get(
  "/all",
  authenticate,
  getAllEnquiries
);

router.patch(
  "/admin_remark/:enquiryId",
  authenticate,
  addAdminRemark
);

export default router;