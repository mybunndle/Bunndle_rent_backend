// import multer from "multer";
// export const uploadAssetImages = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB per file
//     files: 5                   // max 5 files
//   },


//   // ✅ HERE is your fileFilter
//   fileFilter: (req, file, cb) => {
//     if (!file.mimetype.startsWith("image/")) {
//       return cb(new Error("Only image files are allowed"), false);
//     }
//     cb(null, true);
//   }
// });


import multer from "multer";
import path from "path";

export const uploadAssetImages = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
  },

  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
    ];

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    console.log("Uploaded file:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      extension,
    });

    const validMimeType =
      allowedMimeTypes.includes(file.mimetype);

    const validExtension =
      allowedExtensions.includes(extension);

    // Some clients send images as application/octet-stream
    if (
      validMimeType ||
      (
        file.mimetype === "application/octet-stream" &&
        validExtension
      )
    ) {
      return cb(null, true);
    }

    return cb(
      new Error(
        `Only JPG, JPEG, PNG and WEBP images are allowed. Received: ${file.mimetype}`,
      ),
      false,
    );
  },
});

export const uploadUserProfile = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5* 1024 * 1024, // 5MB per file
    files: 1                   // max 5 files
  },


  // ✅ HERE is your fileFilter
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  }
});



export const uploadHomeImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 5MB per file
    files: 5                 // max 5 files
  },


  // ✅ HERE is your fileFilter
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
  }
});