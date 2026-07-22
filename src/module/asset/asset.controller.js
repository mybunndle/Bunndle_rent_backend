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


export const deleteAssetController = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAsset = await deleteAssetService(id);
    return res.status(200).json({
      success: true,
      message: "Asset deleted successfully.",
      data: deletedAsset,
    });
  } catch (error) {
    console.error("DELETE ASSET ERROR:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to delete asset.",
    });
  }
};