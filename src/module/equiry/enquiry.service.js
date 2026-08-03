import mongoose from "mongoose";

import enquiryModel from "../../models/enquiryModel.js";
import AssetModel from "../../models/assetModel.js";
import userModel from "../../models/userModel.js";

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateObjectId = (id, fieldName) => {
  if (!id) {
    throw createError(400, `${fieldName} is required`);
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(400, `Invalid ${fieldName}`);
  }
};

/**
 * Add, remove or reactivate an enquiry.
 */
export const toggleEnquiry_Service = async ({
  assetId,
  userId,
}) => {
  validateObjectId(assetId, "Asset ID");
  validateObjectId(userId, "User ID");

  const assetExists = await AssetModel.exists({
    _id: assetId,
  });

  if (!assetExists) {
    throw createError(404, "Asset not found");
  }

  const existingEnquiry = await enquiryModel.findOne({
    assetId,
    userId,
  });

  // Create new enquiry
  if (!existingEnquiry) {
    const enquiry = await enquiryModel.create({
      assetId,
      userId,
      status: "active",
    });

    const populatedEnquiry = await enquiryModel
      .findById(enquiry._id)
      .populate("assetId")
      .populate("userId", "name email phone");

    return {
      isActive: true,
      statusCode: 201,
      message: "Enquiry added successfully",
      data: populatedEnquiry,
    };
  }

  // Remove existing active enquiry
  if (existingEnquiry.status === "active") {
    existingEnquiry.status = "removed";
    await existingEnquiry.save();

    return {
      isActive: false,
      statusCode: 200,
      message: "Enquiry removed successfully",
      data: {
        enquiryId: existingEnquiry._id,
        assetId: existingEnquiry.assetId,
        status: existingEnquiry.status,
      },
    };
  }

  // Reactivate removed enquiry
  existingEnquiry.status = "active";
  await existingEnquiry.save();

  const reactivatedEnquiry = await enquiryModel
    .findById(existingEnquiry._id)
    .populate("assetId")
    .populate("userId", "name email phone");

  return {
    isActive: true,
    statusCode: 200,
    message: "Enquiry reactivated successfully",
    data: reactivatedEnquiry,
  };
};

/**
 * Get logged-in user's active enquired assets.
 */
export const getMyEnquiredAssets_Service = async (
  userId,
) => {
  validateObjectId(userId, "User ID");

  const enquiries = await enquiryModel
    .find({
      userId,
      status: "active",
    })
    .populate({
      path: "assetId",
      populate: {
        path: "userId",
        select: "name email phone profileImage",
      },
    })
    .sort({
      createdAt: -1,
    });

  const assets = enquiries
    .filter((item) => item.assetId)
    .map((item) => {
      const asset = item.assetId.toObject();

      return {
        ...asset,
        enquiryId: item._id,
        enquiryStatus: item.status,
        adminRemarks: item.adminRemarks,
        enquiredAt: item.createdAt,
      };
    });

  return {
    total: assets.length,
    data: assets,
  };
};

/**
 * Get all assets and their active enquiries.
 */
export const getAllEnquiries_Service = async () => {
  const assets = await AssetModel.find()
    .populate(
      "userId",
      "name email phone profileImage",
    )
    .sort({
      createdAt: -1,
    })
    .lean();

  if (assets.length === 0) {
    return {
      totalAssets: 0,
      totalEnquiries: 0,
      data: [],
    };
  }

  const assetIds = assets.map((asset) => asset._id);

  const enquiries = await enquiryModel
    .find({
      assetId: {
        $in: assetIds,
      },
      status: "active",
    })
    .populate(
      "userId",
      "name email phone profileImage",
    )
    .populate(
      "adminRemarks.updatedBy",
      "name email phone role",
    )
    .sort({
      createdAt: -1,
    })
    .lean();

  const enquiryMap = new Map();

  enquiries.forEach((enquiry) => {
    const assetId = enquiry.assetId?.toString();

    if (!assetId) return;

    if (!enquiryMap.has(assetId)) {
      enquiryMap.set(assetId, []);
    }

    enquiryMap.get(assetId).push({
      enquiryId: enquiry._id,
      status: enquiry.status,
      user: enquiry.userId,

      adminRemarks: enquiry.adminRemarks.map(
        (remarkItem) => ({
          remarkId: remarkItem._id,
          remark: remarkItem.remark,
          updatedBy: remarkItem.updatedBy,
          updatedByName: remarkItem.updatedByName,
          updatedAt: remarkItem.updatedAt,
        }),
      ),

      createdAt: enquiry.createdAt,
      updatedAt: enquiry.updatedAt,
    });
  });

  const assetsWithEnquiries = assets.map((asset) => {
    const assetEnquiries =
      enquiryMap.get(asset._id.toString()) || [];

    return {
      assetId: asset._id,
      assetName: asset.assetName,
      model: asset.model,
      brand: asset.brand,
      category: asset.category,
      subCategory: asset.subCategory,
      price: asset.price,
      purchaseYear: asset.purchaseYear,
      isapproved: asset.isapproved,

      // According to your asset schema
      assetFiles: asset.assetFiles || [],

      assetOwner: asset.userId,
      totalEnquiries: assetEnquiries.length,
      enquiries: assetEnquiries,

      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
  });

  return {
    totalAssets: assetsWithEnquiries.length,
    totalEnquiries: enquiries.length,
    data: assetsWithEnquiries,
  };
};

/**
 * Get active enquired asset IDs of logged-in user.
 */
export const getMyEnquiryAssetIds_Service = async (
  userId,
) => {
  validateObjectId(userId, "User ID");

  const enquiries = await enquiryModel
    .find({
      userId,
      status: "active",
    })
    .select("assetId -_id")
    .sort({
      createdAt: -1,
    })
    .lean();

  const assetIds = enquiries
    .map((item) => item.assetId)
    .filter(Boolean);

  return {
    total: assetIds.length,
    data: assetIds,
  };
};

/**
 * Add admin remark to an enquiry.
 */
export const addAdminRemark_Service = async ({
  enquiryId,
  remark,
  adminId,
}) => {
  validateObjectId(enquiryId, "Enquiry ID");
  validateObjectId(adminId, "Admin ID");

  if (!remark || !remark.trim()) {
    throw createError(
      400,
      "Admin remark is required."
    );
  }

  const admin = await userModel
    .findById(adminId)
    .select("name type")
    .lean();

  if (!admin) {
    throw createError(
      404,
      "Admin account not found."
    );
  }

  if (admin.type !== "ADMIN") {
    throw createError(
      403,
      "Only an admin can add remarks."
    );
  }

  const enquiry = await enquiryModel
    .findByIdAndUpdate(
      enquiryId,
      {
        $push: {
          adminRemarks: {
            remark: remark.trim(),
            updatedBy: adminId,
            updatedByName: admin.name || "Admin",
            updatedAt: new Date(),
          },
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    )
    .populate(
      "userId",
      "name email phone profileImage type"
    )
    .populate(
      "adminRemarks.updatedBy",
      "name email phone type profileImage"
    );

  if (!enquiry) {
    throw createError(
      404,
      "Enquiry not found."
    );
  }

  return enquiry;
};