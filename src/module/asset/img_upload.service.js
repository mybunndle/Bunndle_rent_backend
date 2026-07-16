import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

export const uploadAssetFile = async (file) => {
  try {
    const result = await imagekit.upload({
      file: file.buffer,
      fileName: `asset-${Date.now()}-${file.originalname}`,
      folder: "Bunndle_Rent/assets",   // ✅ separate folder
      useUniqueFileName: true,
    });

    return {
      url: result.url,
      fileId: result.fileId,
      filename: result.name
    };

  } catch (err) {
    throw new Error("Asset upload failed: " + err.message);
  }
};



export const deleteAssetFile = async (fileId) => {
  try {

    // ✅ Prevent ImageKit error
    if (!fileId) {
      console.log(
        "Skipping delete because fileId is missing"
      );
      return false;
    }

    await imagekit.deleteFile(fileId);

    console.log("Image deleted successfully");

    return true;

  } catch (err) {

    console.error(
      "ImageKit delete failed:",
      err.message
    );

    return false;
  }
};