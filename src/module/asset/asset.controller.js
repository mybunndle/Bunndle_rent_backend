import { 
  addAssetService ,
  getAssetsService ,
  editAssetService ,
  deleteAssetService ,
  addToWishlist_Service,
  removeFromWishlist_Service,
  getWishlist_Service,
  checkWishlist_Service,
  getAssetsWith_wishlist_Service

} from "./asset.service.js";




const getLoggedInUserId = (req) => {
  return (
    req.userId ||
    req.user?.userId ||
    req.user?._id ||
    req.user?.id
  );
};


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
    const page = req.query.page || 1;

    const result = await getAssetsService({
      page,
    });

    return res.status(200).json({
      success: true,
      message: "Assets fetched successfully.",
      count: result.assets.length,
      data: result.assets,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("GET ASSETS ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Unable to fetch assets.",
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



/**
 * Different authentication middlewares may store the user ID
 * in different properties. This helper supports common formats.
 */



const sendErrorResponse = (res, error) => {
  console.error("Wishlist error:", error);

  return res
    .status(error.status || error.statusCode || 500)
    .json({
      success: false,
      message:
        error.message || "Internal server error",
    });
};

export async function addToWishlist_Controller(
  req,
  res
) {
  try {
    const userId = getLoggedInUserId(req);
    const { assetId } = req.params;

    const result = await addToWishlist_Service(
      userId,
      assetId
    );

    return res.status(200).json(result);
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

export async function removeFromWishlist_Controller(
  req,
  res
) {
  try {
    const userId = getLoggedInUserId(req);
    const { assetId } = req.params;

    const result = await removeFromWishlist_Service(
      userId,
      assetId
    );

    return res.status(200).json(result);
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

export async function getWishlist_Controller(
  req,
  res
) {
  try {
    const userId = getLoggedInUserId(req);

    const {
      page = 1,
      limit = 10,
    } = req.query;

    const result = await getWishlist_Service(
      userId,
      page,
      limit
    );

    return res.status(200).json(result);
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}

export async function checkWishlist_Controller(
  req,
  res
) {
  try {
    const userId = getLoggedInUserId(req);
    const { assetId } = req.params;

    const result = await checkWishlist_Service(
      userId,
      assetId
    );

    return res.status(200).json(result);
  } catch (error) {
    return sendErrorResponse(res, error);
  }
}



export async function getAssetsWith_wishlist_Controller(
  req,
  res
) {
  try {
    const userId = getLoggedInUserId(req);

    const page = req.query.page || 1;

    const result = await getAssetsWith_wishlist_Service(
      userId,
      page
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error(
      "Get assets error:",
      error
    );

    return res
      .status(
        error.status ||
          error.statusCode ||
          500
      )
      .json({
        success: false,
        message:
          error.message ||
          "Internal server error",
      });
  }
}
