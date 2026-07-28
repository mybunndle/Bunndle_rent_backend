import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

export const uploadHomeFiles = async (file) => {
  try {
    if (!file) {
      const error = new Error("Image file is required.");
      error.statusCode = 400;
      throw error;
    }

    if (!file.buffer) {
      const error = new Error(
        "File buffer is missing. Use multer memoryStorage."
      );
      error.statusCode = 400;
      throw error;
    }

    const result = await imagekit.upload({
      file: file.buffer.toString("base64"),
      fileName: `asset-${Date.now()}-${file.originalname}`,
      folder: "/Bunndle_Rent/Home_assets",
      useUniqueFileName: true,
    });

    return {
      url: result.url,
      fileId: result.fileId,
      filename: result.name,
    };
  } catch (error) {
    console.error("IMAGEKIT UPLOAD ERROR:", error);

    const uploadError = new Error(
      error.message || "Asset image upload failed."
    );

    uploadError.statusCode = error.statusCode || 500;

    throw uploadError;
  }
};

export const deleteHomeFiles = async (fileId) => {
  console.log("called")
  try {
    if (!fileId) {
      console.log(
        "Skipping ImageKit deletion because fileId is missing."
      );

      return {
        success: false,
        message: "ImageKit fileId is missing.",
      };
    }

    await imagekit.deleteFile(fileId);

    return {
      success: true,
      message: "Image deleted successfully from ImageKit.",
    };
  } catch (error) {
    console.error(
      "IMAGEKIT DELETE ERROR:",
      error.message
    );

    return {
      success: false,
      message:
        error.message ||
        "Failed to delete image from ImageKit.",
    };
  }
};