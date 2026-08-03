// import jwt from "jsonwebtoken";

// import userModel from "../models/userModel.js";
// import tokenBlacklistModel from "../models/tokenBlacklistModel.js";
// import { hashToken } from "../utils/token.util.js";

// export const authenticate = async (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (
//       !authHeader ||
//       !authHeader.startsWith("Bearer ")
//     ) {
//       return res.status(401).json({
//         success: false,
//         message: "Access token is required.",
//       });
//     }

//     const token = authHeader.slice(7).trim();

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: "Access token is required.",
//       });
//     }

//     const decoded = jwt.verify(
//       token,
//       process.env.JWT_SECRET
//     );

//     const userId = decoded.userId || decoded.id;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid token payload.",
//       });
//     }

//     const tokenHash = hashToken(token);

//     const blacklistedToken =
//       await tokenBlacklistModel.exists({
//         tokenHash,
//       });

//     if (blacklistedToken) {
//       return res.status(401).json({
//         success: false,
//         message:
//           "This session has been logged out. Please login again.",
//       });
//     }

//     const user = await userModel
//       .findById(userId)
//       .select("_id role isBlocked");

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "User account not found.",
//       });
//     }

//     if (user.isBlocked) {
//       return res.status(403).json({
//         success: false,
//         message:
//           "Your account has been blocked. Please contact support.",
//       });
//     }

//     req.user = {
//       id: user._id,
//       role: user.role,
//     };

//     req.token = token;
//     req.tokenPayload = decoded;

//     next();
//   } catch (error) {
//     if (error.name === "TokenExpiredError") {
//       return res.status(401).json({
//         success: false,
//         message:
//           "Access token has expired. Please login again.",
//       });
//     }

//     if (error.name === "JsonWebTokenError") {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid access token.",
//       });
//     }

//     console.error("AUTHENTICATION ERROR:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Unable to authenticate user.",
//     });
//   }
// };

import jwt from "jsonwebtoken";

import userModel from "../models/userModel.js";
import tokenBlacklistModel from "../models/tokenBlacklistModel.js";
import { hashToken } from "../utils/token.util.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Access token is required.",
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is required.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload.",
      });
    }

    const tokenHash = hashToken(token);

    const blacklistedToken =
      await tokenBlacklistModel.exists({
        tokenHash,
      });

    if (blacklistedToken) {
      return res.status(401).json({
        success: false,
        message:
          "This session has been logged out. Please login again.",
      });
    }

    // Use the exact database field names
    const user = await userModel
      .findById(userId)
      .select("_id name type isBlocked");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been blocked. Please contact support.",
      });
    }

    // Same names as MongoDB document
    req.user = {
      _id: user._id,
      name: user.name,
      type: user.type,
    };

    req.token = token;
    req.tokenPayload = decoded;

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message:
          "Access token has expired. Please login again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid access token.",
      });
    }

    console.error("AUTHENTICATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to authenticate user.",
    });
  }
};