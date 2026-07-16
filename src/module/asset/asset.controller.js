import { addAssetService } from "./asset.service.js";

export const addAssetController = async (req, res) => {
  try {
    const userId = req.user?.id;

    const asset = await addAssetService({
      userId,
      body: req.body,
      files: req.files,
    });

    return res.status(201).json({
      success: true,
      message: "Asset created successfully.",
      data: asset,
    });
  } catch (error) {
    console.error("ADD ASSET ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to create asset.",
    });
  }
};