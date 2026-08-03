import {
  toggleEnquiry_Service,
  getMyEnquiredAssets_Service,
  getAllEnquiries_Service,
  getMyEnquiryAssetIds_Service,
  addAdminRemark_Service,
} from "./enquiry.service.js";

import AssetModel from "../../models/assetModel.js";


const handleControllerError = (
  error,
  res,
  controllerName
) => {
  console.error(`${controllerName}:`, error);

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message:
        "An enquiry already exists for this asset.",
    });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message:
      error.message || "Internal server error.",
  });
};

/**
 * User: Add, remove or reactivate enquiry
 */
export const toggleEnquiry = async (req, res) => {
  try {
    const { assetId } = req.params;

    // authenticate middleware provides req.user.id
    const userId = req.user?.id;

    const result = await toggleEnquiry_Service({
      assetId,
      userId,
    });

    return res.status(result.statusCode).json({
      success: true,
      message: result.message,
      isEnquired: result.isActive,
      data: result.data,
    });
  } catch (error) {
    return handleControllerError(
      error,
      res,
      "Toggle enquiry error"
    );
  }
};

/**
 * User: Get all actively enquired assets
 */
export const getMyEnquiredAssets = async (
  req,
  res
) => {
  try {
    const userId = req.user?.id;

    const result =
      await getMyEnquiredAssets_Service(userId);

    return res.status(200).json({
      success: true,
      message:
        result.total > 0
          ? "Enquired assets fetched successfully."
          : "No active enquiries found.",
      total: result.total,
      data: result.data,
    });
  } catch (error) {
    return handleControllerError(
      error,
      res,
      "Get my enquired assets error"
    );
  }
};

/**
 * User: Get only actively enquired asset IDs
 */
export const getMyEnquiryAssetIds = async (
  req,
  res
) => {
  try {
    const userId = req.user?.id;

    const result =
      await getMyEnquiryAssetIds_Service(userId);

    return res.status(200).json({
      success: true,
      message:
        result.total > 0
          ? "Enquired asset IDs fetched successfully."
          : "No active enquiries found.",
      total: result.total,
      data: result.data,
    });
  } catch (error) {
    return handleControllerError(
      error,
      res,
      "Get enquiry asset IDs error"
    );
  }
};

/**
 * Admin: Get all enquiries
 */
export const getAllEnquiries = async (req, res) => {
  try {
    // Admin check using authenticate middleware role
    console.log(req.user);
    if (req.user?.type !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Admin permission is required.",
      });
    }

    const result =
      await getAllEnquiries_Service();

    return res.status(200).json({
      success: true,
      message:
        "All enquiries fetched successfully.",
      totalAssets: result.totalAssets,
      totalEnquiries: result.totalEnquiries,
      data: result.data,
    });
  } catch (error) {
    return handleControllerError(
      error,
      res,
      "Get all enquiries error"
    );
  }
};

/**
 * Admin: Add remark to enquiry
 */
export const addAdminRemark = async (req, res) => {
  try {
    if (req.user?.type !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Admin permission is required.",
      });
    }

    const { enquiryId } = req.params;
    const { remark } = req.body;

    const adminId = req.user?._id;
    console.log(adminId)

    const result = await addAdminRemark_Service({
      enquiryId,
      remark,
      adminId,
    });

    return res.status(200).json({
      success: true,
      message:
        "Admin remark added successfully.",
      data: result,
    });
  } catch (error) {
    return handleControllerError(
      error,
      res,
      "Add admin remark error"
    );
  }
};