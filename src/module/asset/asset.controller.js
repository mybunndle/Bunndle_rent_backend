import { 
  addAssetService ,
  getAssetsService ,
  editAssetService ,
  deleteAssetService ,
} from "./asset.service.js";

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
    const assetId = req.params.id;
    const userId = req.user?.id;

    const deletedAsset = await deleteAssetService({
      assetId,
      userId,
    });

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


export const getAssetsController = async (req, res) => {
  try {
    const assets = await getAssetsService(req.user);

    return res.status(200).json({
      success: true,
      message: "Assets fetched successfully",
      data: assets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const editAssetController = async (req, res) => {
  try {
    const userId = req.user?.id;
    const assetId = req.params.id;

    const updatedAsset = await editAssetService({
      assetId,
      userId,
      body: req.body,
      files: req.files || [],
    });

    return res.status(200).json({
      success: true,
      message: "Asset updated successfully.",
      data: updatedAsset,
    });
  } catch (error) {
    console.error("EDIT ASSET ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to update asset.",
    });
  }
};
