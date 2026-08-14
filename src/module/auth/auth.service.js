import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";
import { uploadProfilePicture, deleteProfilePicture } from "./img_service.js";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import tokenBlacklistModel from "../../models/tokenBlacklistModel.js";
import { hashToken } from "../../utils/token.util.js";
import { generateToken } from "../../utils/generate.token.js";
import assetModel from "../../models/assetModel.js";
import corporateRequestModel from "../../models/corporateRequestModel.js";
import { normalizePhone } from "../../utils/phoneNormilise.js";

import { sendOtpSms } from "./sms_service.js";
import otpModel from "../../models/otpModel.js";
import userModel from "../../models/userModel.js";

import adminCorporateRequestTemplate from "../../utils/adminCorporateRequestTemplate.js";

import userCorporateRequestTemplate from "../../utils/userCorporateRequestTemplate.js";

import { sendForgotPasswordOtp, sendEmail } from "../../utils/email.js";

import passwordResetOtpModel from "../../models/passwordResetOtp.model.js";
// import { sendForgotPasswordOtp } from "../../utils/email.js";
import { verifyAppleToken } from "../../utils/apple_Auth.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/* =========================================================
   COMMON HELPERS
========================================================= */

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

/* =========================================================
   REGISTER USER
========================================================= */

export async function registerUser_Service({ name, email, phone, password }) {
  const cleanName = String(name || "").trim();
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password || "");

  /* ==============================
     BASIC VALIDATION
  ============================== */

  if (!cleanName || !cleanEmail || !phone || !cleanPassword) {
    throw createError(400, "Name, email, phone and password are required");
  }

  if (cleanName.length < 2) {
    throw createError(400, "Name must be at least 2 characters");
  }

  if (cleanPassword.length < 6) {
    throw createError(400, "Password must be at least 6 characters");
  }

  /* ==============================
     NORMALIZE PHONE
  ============================== */

  // Example input:
  // +919876543210
  // +14155552671
  // +447911123456

  const normalizedPhone = normalizePhone(phone);

  /*
    normalizedPhone = {
      phone: "9876543210",
      countryCode: "+91",
      country: "IN",
      fullPhone: "+919876543210"
    }
  */

  /* ==============================
     CHECK EXISTING USER
  ============================== */

  const existingUser = await userModel
    .findOne({
      $or: [
        {
          email: cleanEmail,
        },
        {
          fullPhone: normalizedPhone.fullPhone,
        },
      ],
    })
    .select("email phone fullPhone countryCode country")
    .lean();

  if (existingUser) {
    if (existingUser.email === cleanEmail) {
      throw createError(409, "Email already registered");
    }

    if (existingUser.fullPhone === normalizedPhone.fullPhone) {
      throw createError(409, "Phone number already registered");
    }

    throw createError(409, "User already exists");
  }

  /* ==============================
     HASH PASSWORD
  ============================== */

  const hashedPassword = await bcrypt.hash(cleanPassword, 12);

  /* ==============================
     CREATE USER
  ============================== */

  try {
    const user = await userModel.create({
      name: cleanName,

      email: cleanEmail,

      phone: normalizedPhone.phone,

      countryCode: normalizedPhone.countryCode,

      country: normalizedPhone.country,

      fullPhone: normalizedPhone.fullPhone,

      password: hashedPassword,

      authProvider: "local",
    });

    /* ==============================
       GENERATE JWT
    ============================== */

    const token = generateToken(user);

    /* ==============================
       RESPONSE
    ============================== */

    return {
      success: true,

      message: "User registered successfully",

      token,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        // National number
        phone: user.phone,

        // +91, +1, +44 etc.
        countryCode: user.countryCode,

        // IN, US, GB etc.
        country: user.country,

        // Complete international number
        fullPhone: user.fullPhone,

        type: user.type,

        createdAt: user.createdAt,
      },
    };
  } catch (error) {
    /* ==============================
       MONGODB UNIQUE ERROR
    ============================== */

    if (error.code === 11000) {
      if (error.keyPattern?.email || error.keyValue?.email) {
        throw createError(409, "Email already registered");
      }

      if (error.keyPattern?.fullPhone || error.keyValue?.fullPhone) {
        throw createError(409, "Phone number already registered");
      }

      throw createError(409, "User already exists");
    }

    throw error;
  }
}

/* =========================================================
   LOGIN USER
========================================================= */

// export async function loginUser_Service({ email, password }) {
//   const cleanEmail = normalizeEmail(email);
//   const cleanPassword = String(password || "");

//   if (!cleanEmail || !cleanPassword) {
//     throw createError(400, "Email and password are required");
//   }

//   const user = await userModel
//     .findOne({
//       email: cleanEmail,
//     })
//     .select("+password");

//   if (!user) {
//     throw createError(401, "Invalid email or password");
//   }

//   if (user.isBlocked) {
//     throw createError(403, "Your account has been blocked");
//   }

//   const isPasswordValid = await bcrypt.compare(cleanPassword, user.password);

//   if (!isPasswordValid) {
//     throw createError(401, "Invalid email or password");
//   }

//   const token = generateToken(user);

//   return {
//     success: true,
//     message: "Login successful",
//     token,
//     user: {
//       id: user._id,
//       name: user.name,
//       email: user.email,
//       phone: user.phone,
//       role: user.role,
//       type: user.type
//     },
//   };
// }

export const loginUser_Service = async ({ email, password }) => {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  const enteredPassword = String(password || "");

  if (!normalizedEmail) {
    throw createError(400, "Email is required");
  }

  if (!enteredPassword) {
    throw createError(400, "Password is required");
  }

  // +password required if password has select: false in schema
  const user = await userModel
    .findOne({
      email: normalizedEmail,
    })
    .select("+password");

  if (!user) {
    throw createError(404, "No account found with this email address");
  }

  if (user.isBlocked) {
    throw createError(
      403,
      "Your account has been blocked. Please contact support",
    );
  }

  // bcrypt.compare se pehle password existence check
  if (!user.password) {
    throw createError(
      400,
      "Your password is not set. Please set your password and log in again",
    );
  }

  const isPasswordCorrect = await bcrypt.compare(
    enteredPassword,
    user.password,
  );

  if (!isPasswordCorrect) {
    throw createError(401, "Invalid email or password");
  }

  const token = generateToken(user._id);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      type: user.type,
      profileImage: user.profileImage,
      kycStatus: user.kycStatus,
    },
  };
};

/* =========================================================
   GET USER PROFILE
========================================================= */

export async function getUserProfile_Service(userId) {
  if (!userId) {
    throw createError(400, "User ID is required");
  }

  const user = await userModel
    .findById(userId)
    .select(
      "name email phone countryCode country fullPhone dob type authProvider profileImage profileImageId kycStatus isKycVerified kycVerifiedAt createdAt updatedAt",
    )
    .lean();

  if (!user) {
    throw createError(404, "User not found");
  }

  const formatDate = (date) => {
    if (!date) return null;

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    const day = String(parsedDate.getUTCDate()).padStart(2, "0");
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, "0");
    const year = parsedDate.getUTCFullYear();

    return `${day}-${month}-${year}`;
  };

  user.dob = formatDate(user.dob);
  user.kycVerifiedAt = formatDate(user.kycVerifiedAt);
  user.createdAt = formatDate(user.createdAt);
  user.updatedAt = formatDate(user.updatedAt);

  return {
    success: true,
    message: "User profile fetched successfully",
    data: user,
  };
}

/* =========================================================
   CHANGE PASSWORD
========================================================= */

export async function changePassword_Service(userId, oldPassword, newPassword) {
  if (!userId) {
    throw createError(400, "User ID is required");
  }

  if (!oldPassword || !newPassword) {
    throw createError(400, "Old password and new password are required");
  }

  if (String(newPassword).length < 6) {
    throw createError(400, "New password must be at least 6 characters");
  }

  const user = await userModel.findById(userId).select("+password");

  if (!user) {
    throw createError(404, "User not found");
  }

  const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);

  if (!isOldPasswordCorrect) {
    throw createError(400, "Old password is incorrect");
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    throw createError(400, "New password cannot be the same as old password");
  }

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();

  return {
    success: true,
    message: "Password changed successfully",
  };
}

/* =========================================================
   UPDATE PROFILE
========================================================= */

export const updateProfile_Service = async ({
  userId,
  body = {},
  file = null,
}) => {
  if (!userId) {
    throw createError(401, "Unauthorized user.");
  }

  const user = await userModel.findById(userId);

  if (!user) {
    throw createError(404, "User not found.");
  }

  const oldProfileImageId = user.profileImageId;

  let uploadedProfile = null;
  let updateSuccessful = false;
  let hasUpdate = false;

  try {
    // Update name
    if (Object.prototype.hasOwnProperty.call(body, "name")) {
      const name = String(body.name ?? "").trim();

      if (!name) {
        throw createError(400, "Name cannot be empty.");
      }

      user.name = name;
      hasUpdate = true;
    }

    // Update DOB
    if (Object.prototype.hasOwnProperty.call(body, "dob")) {
      const dobValue = body.dob;

      if (dobValue === null || dobValue === "" || dobValue === "null") {
        user.dob = null;
      } else {
        const parsedDob = new Date(dobValue);

        if (Number.isNaN(parsedDob.getTime())) {
          throw createError(400, "Invalid DOB. Use YYYY-MM-DD format.");
        }

        if (parsedDob > new Date()) {
          throw createError(400, "Date of birth cannot be in the future.");
        }

        user.dob = parsedDob;
      }

      hasUpdate = true;
    }

    // Upload new profile image
    if (file) {
      uploadedProfile = await uploadProfilePicture(file);

      if (!uploadedProfile?.url || !uploadedProfile?.fileId) {
        throw createError(500, "Profile image upload failed.");
      }

      // Schema fields are separate strings
      user.profileImage = uploadedProfile.url;
      user.profileImageId = uploadedProfile.fileId;

      hasUpdate = true;
    }

    if (!hasUpdate) {
      throw createError(400, "Please provide name, dob, or profile image.");
    }

    // Save updated user
    const updatedUser = await user.save();

    updateSuccessful = true;

    // Delete old image after successful database update
    if (
      uploadedProfile?.fileId &&
      oldProfileImageId &&
      oldProfileImageId !== uploadedProfile.fileId
    ) {
      try {
        await deleteProfilePicture(oldProfileImageId);
      } catch (deleteError) {
        console.error(
          "Old profile image deletion failed:",
          deleteError.message,
        );
      }
    }

    // Convert Mongoose document into plain object
    const userData = updatedUser.toObject({
      versionKey: false,
    });

    // Clean DOB response: YYYY-MM-DD
    userData.dob = userData.dob
      ? new Date(userData.dob).toISOString().split("T")[0]
      : null;

    // Remove sensitive fields
    delete userData.password;
    delete userData.resetOtpHash;
    delete userData.resetOtpExpiry;

    return userData;
  } catch (error) {
    // Delete newly uploaded image only when database update failed
    if (uploadedProfile?.fileId && !updateSuccessful) {
      try {
        await deleteProfilePicture(uploadedProfile.fileId);
      } catch (rollbackError) {
        console.error("Profile image rollback failed:", rollbackError.message);
      }
    }

    throw error;
  }
};
/* =========================================================
   FORGOT PASSWORD
========================================================= */

export async function forgotPassword_Service(email) {
  const cleanEmail = normalizeEmail(email);

  if (!cleanEmail) {
    throw createError(400, "Email is required");
  }

  const user = await userModel
    .findOne({
      email: cleanEmail,
    })
    .select("name email");

  if (!user) {
    throw createError(404, "User not found");
  }

  // Generate six-digit OTP
  const otp = crypto.randomInt(100000, 1000000).toString();

  // OTP expiry: 10 minutes
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // Delete previous OTP
  await passwordResetOtpModel.deleteMany({
    email: cleanEmail,
  });

  // Save new OTP
  await passwordResetOtpModel.create({
    email: cleanEmail,
    otp,
    expiresAt,
    isVerified: false,
  });

  try {
    await sendForgotPasswordOtp(user.email, user.name, otp);
  } catch (error) {
    await passwordResetOtpModel.deleteMany({
      email: cleanEmail,
    });

    throw createError(500, "Unable to send OTP email");
  }

  // Token used only for OTP verification
  const resetToken = jwt.sign(
    {
      email: cleanEmail,
      purpose: "password-reset",
    },
    JWT_SECRET,
    {
      expiresIn: "10m",
    },
  );

  return {
    success: true,
    message: "OTP sent successfully",
    resetToken,
  };
}

export async function verifyResetOtp_Service({ otp, resetToken }) {
  if (!otp) {
    throw createError(400, "OTP is required");
  }

  if (!resetToken) {
    throw createError(401, "Reset token is required");
  }

  let decoded;

  // Reset token verify karo
  try {
    decoded = jwt.verify(resetToken, JWT_SECRET);
  } catch (error) {
    throw createError(401, "Invalid or expired reset token");
  }

  // Check token correct purpose ke liye bana hai
  if (decoded.purpose !== "password-reset") {
    throw createError(401, "Invalid reset token purpose");
  }

  // Email token ke andar se milega
  const cleanEmail = normalizeEmail(decoded.email);

  if (!cleanEmail) {
    throw createError(401, "Email is missing from reset token");
  }

  // Database me valid OTP find karo
  const otpRecord = await passwordResetOtpModel.findOne({
    email: cleanEmail,
    otp: String(otp),
    expiresAt: {
      $gt: new Date(),
    },
  });

  if (!otpRecord) {
    throw createError(400, "Invalid or expired OTP");
  }

  // OTP ko verified mark karo
  otpRecord.isVerified = true;
  await otpRecord.save();

  // Final password reset ke liye verified token generate karo
  const verifiedToken = jwt.sign(
    {
      email: cleanEmail,
      purpose: "otp-verified",
    },
    JWT_SECRET,
    {
      expiresIn: "10m",
    },
  );

  return {
    success: true,
    message: "OTP verified and token verified successfully",
    verifiedToken,
  };
}
export async function resetPassword_Service({ newPassword, verifiedToken }) {
  if (!newPassword) {
    throw createError(400, "New password is required");
  }

  if (String(newPassword).length < 6) {
    throw createError(400, "New password must be at least 6 characters");
  }

  if (!verifiedToken) {
    throw createError(401, "Verified token is required");
  }

  let decoded;

  try {
    decoded = jwt.verify(verifiedToken, JWT_SECRET);
  } catch (error) {
    throw createError(401, "Invalid or expired verified token");
  }

  if (decoded.purpose !== "otp-verified") {
    throw createError(401, "OTP verification is required");
  }

  const cleanEmail = normalizeEmail(decoded.email);

  if (!cleanEmail) {
    throw createError(401, "Email is missing from verified token");
  }

  const otpRecord = await passwordResetOtpModel.findOne({
    email: cleanEmail,
    isVerified: true,
    expiresAt: {
      $gt: new Date(),
    },
  });

  if (!otpRecord) {
    throw createError(400, "OTP verification has expired");
  }

  const user = await userModel.findOne({
    email: cleanEmail,
  });

  if (!user) {
    throw createError(404, "User not found");
  }

  user.password = await bcrypt.hash(String(newPassword), 12);

  await user.save();

  await passwordResetOtpModel.deleteMany({
    email: cleanEmail,
  });

  return {
    success: true,
    message: "Password reset successfully",
  };
}

export const googleAuthService = async (idToken) => {
  if (!idToken) {
    const error = new Error("Google ID token is required");
    error.statusCode = 400;
    throw error;
  }

  let ticket;

  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (error) {
    const authError = new Error("Invalid or expired Google ID token");
    authError.statusCode = 401;
    throw authError;
  }

  const payload = ticket.getPayload();

  if (!payload) {
    const error = new Error("Unable to read Google user information");
    error.statusCode = 401;
    throw error;
  }

  const {
    sub: googleId,
    email,
    name,
    picture,
    email_verified: emailVerified,
  } = payload;

  if (!googleId || !email) {
    const error = new Error(
      "Google account did not provide the required information",
    );
    error.statusCode = 400;
    throw error;
  }

  if (!emailVerified) {
    const error = new Error("Google email is not verified");
    error.statusCode = 401;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();

  let user = await userModel.findOne({
    $or: [{ googleId }, { email: normalizedEmail }],
  });

  if (user) {
    if (user.isBlocked) {
      const error = new Error("Your account has been blocked");
      error.statusCode = 403;
      throw error;
    }

    let shouldSave = false;

    if (!user.googleId) {
      user.googleId = googleId;
      shouldSave = true;
    }

    if (!user.profileImage && picture) {
      user.profileImage = picture;
      shouldSave = true;
    }

    if (!user.isVerified) {
      user.isVerified = true;
      shouldSave = true;
    }

    if (user.authProvider !== "google") {
      user.authProvider = "google";
      shouldSave = true;
    }

    if (shouldSave) {
      await user.save();
    }
  } else {
    user = await userModel.create({
      name: name || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      googleId,
      profileImage: picture || null,
      authProvider: "google",
      isVerified: true,
    });
  }

  const token = generateToken(user._id.toString());

  return {
    message: "Google authentication successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      authProvider: user.authProvider,
      isVerified: user.isVerified,
    },
  };
};

export const googleAndroidAuthService = async ({ idToken }) => {
  let ticket;

  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_ANDROID_SERVER_CLIENT_ID,
    });
  } catch (error) {
    console.error("GOOGLE TOKEN VERIFY ERROR:", error);

    const authError = new Error("Invalid or expired Google ID token.");
    authError.statusCode = 401;
    throw authError;
  }

  const payload = ticket.getPayload();

  if (!payload) {
    const error = new Error("Unable to read Google account information.");
    error.statusCode = 401;
    throw error;
  }

  const {
    sub: googleId,
    email,
    name,
    picture,
    email_verified: emailVerified,
  } = payload;

  if (!email || !googleId) {
    const error = new Error("Google account information is incomplete.");
    error.statusCode = 400;
    throw error;
  }

  if (!emailVerified) {
    const error = new Error("Google email is not verified.");
    error.statusCode = 401;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();

  let user = await userModel.findOne({
    $or: [{ googleId }, { email: normalizedEmail }],
  });

  if (!user) {
    user = await userModel.create({
      name: name || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      googleId,
      profileImage: picture || null,
      authProvider: "google",
      isVerified: true,
    });
  } else {
    let shouldSave = false;

    if (!user.googleId) {
      user.googleId = googleId;
      shouldSave = true;
    }

    if (!user.profileImage && picture) {
      user.profileImage = picture;
      shouldSave = true;
    }

    if (!user.isVerified) {
      user.isVerified = true;
      shouldSave = true;
    }

    if (shouldSave) {
      await user.save();
    }
  }

  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
    },
  };
};

export const appleLoginService = async ({ identityToken, email, fullName }) => {
  const appleData = await verifyAppleToken(identityToken);

  const normalizedRequestEmail =
    typeof email === "string" ? email.trim().toLowerCase() : null;

  const resolvedEmail = appleData.email || normalizedRequestEmail;

  const normalizedName = getAppleFullName(fullName);

  let user = await userModel.findOne({
    appleId: appleData.appleId,
  });

  if (!user && resolvedEmail) {
    user = await userModel.findOne({
      email: resolvedEmail,
    });
  }

  if (user) {
    if (user.isBlocked) {
      const error = new Error("Your account has been blocked");

      error.statusCode = 403;
      throw error;
    }

    let shouldSave = false;

    if (!user.appleId) {
      user.appleId = appleData.appleId;

      shouldSave = true;
    }

    if (normalizedName && (!user.name || user.name.trim() === "")) {
      user.name = normalizedName;
      shouldSave = true;
    }

    if (!user.email && resolvedEmail) {
      user.email = resolvedEmail;
      shouldSave = true;
    }

    if (user.authProvider !== "apple") {
      user.authProvider = "apple";
      shouldSave = true;
    }

    if (!user.isVerified && appleData.emailVerified) {
      user.isVerified = true;
      shouldSave = true;
    }

    if (shouldSave) {
      await user.save();
    }
  } else {
    user = await userModel.create({
      name: normalizedName || resolvedEmail?.split("@")[0] || "Apple User",

      email: resolvedEmail || undefined,

      appleId: appleData.appleId,

      authProvider: "apple",

      isVerified: appleData.emailVerified,
    });
  }

  const token = generateToken(user._id.toString());

  return {
    message: "Apple authentication successful",

    token,

    user: {
      id: user._id,
      name: user.name,
      email: user.email || null,
      profileImage: user.profileImage || null,
      authProvider: user.authProvider,
      isVerified: user.isVerified,
    },
  };
};

const getAppleFullName = (fullName) => {
  if (!fullName) {
    return "";
  }

  if (typeof fullName === "string") {
    return fullName.trim();
  }

  if (typeof fullName === "object" && !Array.isArray(fullName)) {
    const givenName =
      typeof fullName.givenName === "string" ? fullName.givenName.trim() : "";

    const familyName =
      typeof fullName.familyName === "string" ? fullName.familyName.trim() : "";

    return [givenName, familyName].filter(Boolean).join(" ");
  }

  return "";
};

export const logoutService = async ({ userId, token, tokenPayload }) => {
  if (!userId) {
    throw createError(401, "Unauthorized user.");
  }

  if (!token) {
    throw createError(401, "Access token is required.");
  }

  const userExists = await userModel.exists({
    _id: userId,
  });

  if (!userExists) {
    throw createError(404, "User not found.");
  }

  /*
   * authenticate middleware decoded payload bhej raha hai.
   * Fallback ke liye token decode bhi kar rahe hain.
   */
  const decoded = tokenPayload || jwt.decode(token);

  if (!decoded?.exp) {
    throw createError(400, "Token expiry information is missing.");
  }

  const tokenHash = hashToken(token);
  const expiresAt = new Date(decoded.exp * 1000);

  /*
   * Agar token already blacklist hai to logout ko
   * idempotent rakhte hue error nahi denge.
   */
  await tokenBlacklistModel.updateOne(
    {
      tokenHash,
    },
    {
      $setOnInsert: {
        userId,
        tokenHash,
        expiresAt,
        reason: "logout",
      },
    },
    {
      upsert: true,
    },
  );

  return {
    loggedOut: true,
  };
};

export const deleteAccountService = async ({
  userId,
  currentPassword,
  confirmation,
}) => {
  // 1. Authentication check
  if (!userId) {
    throw createError(401, "Unauthorized user.");
  }

  // 2. Accidental deletion prevent karo
  if (confirmation !== "DELETE") {
    throw createError(400, 'Type "DELETE" to confirm account deletion.');
  }

  // 3. User password ke saath find karo
  const user = await userModel
    .findById(userId)
    .select("+password name email phone authProvider profileImage");

  if (!user) {
    throw createError(404, "User account not found.");
  }

  /*
   * 4. Local account password verification
   */
  if (user.authProvider === "local") {
    if (!currentPassword) {
      throw createError(400, "Current password is required.");
    }

    if (!user.password) {
      throw createError(400, "Password is not configured for this account.");
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordCorrect) {
      throw createError(401, "Current password is incorrect.");
    }
  }

  /*
   * Google/Apple users ke liye production me
   * OTP or recent-login verification add karo.
   */

  // 5. User ke assets find karo
  const assets = await assetModel
    .find({
      userId: user._id,
    })
    .select("files")
    .lean();

  // 6. Asset image IDs collect karo
  const assetFileIds = [];

  for (const asset of assets) {
    if (!Array.isArray(asset.files)) {
      continue;
    }

    for (const file of asset.files) {
      const fileId = file.fileId || file.publicId || file.public_id;

      if (fileId) {
        assetFileIds.push(fileId);
      }
    }
  }

  const uniqueFileIds = [...new Set(assetFileIds)];

  /*
   * 7. Related database records delete karo
   */

  await assetModel.deleteMany({
    userId: user._id,
  });

  /*
   * Wishlist model add hone ke baad:
   *
   * await wishlistModel.deleteMany({
   *   userId: user._id,
   * });
   *
   * Notifications, enquiries, sessions aur
   * other user-linked records bhi remove karo.
   */

  // Old blacklist records clean karo
  await tokenBlacklistModel.deleteMany({
    userId: user._id,
  });

  // 8. User account permanently delete karo
  await userModel.findByIdAndDelete(user._id);

  /*
   * 9. Database deletion ke baad
   * ImageKit files delete karo
   */
  if (uniqueFileIds.length > 0) {
    const imageDeletionResults = await Promise.allSettled(
      uniqueFileIds.map((fileId) => deleteAssetFile(fileId)),
    );

    const failedImageDeletions = imageDeletionResults.filter(
      (result) => result.status === "rejected",
    );

    if (failedImageDeletions.length > 0) {
      console.error(
        "Some account images could not be deleted:",
        failedImageDeletions,
      );
    }
  }

  return {
    deletedUserId: String(user._id),
  };
};

const corporateEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const corporatePhoneRegex = /^\+?[0-9]{8,15}$/;

export async function createCorporateRequest_Service({
  companyName,
  contactName,
  designation,
  phone,
  email,
  locationCity,
  locationState,
  numberOfCars,
  seatingCapacity,
  preferredVehicleType,
  message,
  createdBy = null,
}) {
  const cleanCompanyName = String(companyName || "").trim();

  const cleanContactName = String(contactName || "").trim();

  const cleanPhone = String(phone || "")
    .replace(/[\s-]/g, "")
    .trim();

  const cleanEmail = String(email || "")
    .trim()
    .toLowerCase();

  const cleanCity = String(locationCity || "").trim();

  const cleanState = String(locationState || "").trim();

  const cleanVehicleType = String(preferredVehicleType || "").trim();

  const cleanDesignation = designation ? String(designation).trim() : null;

  const cleanMessage = message ? String(message).trim() : null;

  const carsCount = Number(numberOfCars);
  const capacity = Number(seatingCapacity);

  if (!cleanCompanyName) {
    throw createError(400, "Company name is required");
  }

  if (!cleanContactName) {
    throw createError(400, "Point of contact is required");
  }

  if (!cleanPhone) {
    throw createError(400, "Mobile number is required");
  }

  if (!corporatePhoneRegex.test(cleanPhone)) {
    throw createError(400, "Enter a valid mobile number");
  }

  if (!cleanEmail) {
    throw createError(400, "Email is required");
  }

  if (!corporateEmailRegex.test(cleanEmail)) {
    throw createError(400, "Enter a valid email address");
  }

  if (!cleanCity) {
    throw createError(400, "City is required");
  }

  if (!cleanState) {
    throw createError(400, "State is required");
  }

  if (!Number.isInteger(carsCount) || carsCount < 1) {
    throw createError(400, "Number of cars must be at least 1");
  }

  if (!Number.isInteger(capacity) || capacity < 1) {
    throw createError(400, "Seating capacity must be at least 1");
  }

  if (!cleanVehicleType) {
    throw createError(400, "Preferred vehicle type is required");
  }

  /*
   * First save request in MongoDB.
   */
  const record = await corporateRequestModel.create({
    companyName: cleanCompanyName,
    contactName: cleanContactName,
    designation: cleanDesignation,
    phone: cleanPhone,
    email: cleanEmail,
    locationCity: cleanCity,
    locationState: cleanState,
    numberOfCars: carsCount,
    seatingCapacity: capacity,
    preferredVehicleType: cleanVehicleType,
    message: cleanMessage,
    createdBy,
  });

  const requestData = record.toObject();

  /*
   * Send admin and user emails through
   * existing Brevo SMTP/Nodemailer utility.
   */
  const emailResults = await Promise.allSettled([
    sendEmail({
      to: process.env.ADMIN_EMAIL || "info@bunndle.in",

      subject: `New Corporate Leasing Request - ${record.companyName}`,

      html: adminCorporateRequestTemplate(requestData),

      replyTo: record.email,
    }),

    sendEmail({
      to: record.email,

      subject: "Your Corporate Leasing Request Has Been Received",

      html: userCorporateRequestTemplate(requestData),
    }),
  ]);

  const adminEmailResult = emailResults[0];

  const userEmailResult = emailResults[1];

  const adminEmailSent = adminEmailResult.status === "fulfilled";

  const userEmailSent = userEmailResult.status === "fulfilled";

  if (!adminEmailSent) {
    console.error(
      "❌ CORPORATE ADMIN EMAIL ERROR:",
      adminEmailResult.reason?.message || adminEmailResult.reason,
    );
  }

  if (!userEmailSent) {
    console.error(
      "❌ CORPORATE USER EMAIL ERROR:",
      userEmailResult.reason?.message || userEmailResult.reason,
    );
  }

  return {
    success: true,

    message:
      adminEmailSent && userEmailSent
        ? "Corporate request submitted successfully. Confirmation email sent."
        : "Corporate request saved successfully, but one or more emails could not be sent.",

    data: record,

    emailStatus: {
      adminEmailSent,
      userEmailSent,

      adminMessageId: adminEmailSent ? adminEmailResult.value.messageId : null,

      userMessageId: userEmailSent ? userEmailResult.value.messageId : null,
    },
  };
}

const cleanLoginPhone = (phoneValue) => {
  let phone = String(phoneValue ?? "")
    .replace(/\D/g, "")
    .trim();

  // +91 / 91 remove
  if (
    phone.length === 12 &&
    phone.startsWith("91")
  ) {
    phone = phone.slice(2);
  }

  // Optional leading 0 remove
  if (
    phone.length === 11 &&
    phone.startsWith("0")
  ) {
    phone = phone.slice(1);
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    throw createError(
      400,
      "Please enter a valid 10-digit mobile number",
    );
  }

  return phone;
};


const findUserByPhone = async (phone) => {
  return userModel.findOne({
    $or: [
      // Current / old phone field
      {
        phone: {
          $in: [
            phone,
            `91${phone}`,
            `+91${phone}`,
          ],
        },
      },

      // New international field
      {
        fullPhone: `+91${phone}`,
      },
    ],
  });
};


export const sendLoginOtpService = async (
  phoneValue,
) => {
  /* ==============================
     CLEAN PHONE
  ============================== */

  const cleanPhone =
    cleanLoginPhone(phoneValue);

  /* ==============================
     FIND USER
  ============================== */

  const user =
    await findUserByPhone(cleanPhone);

  if (!user) {
    throw createError(
      404,
      "No account found with this phone number",
    );
  }

  /* ==============================
     GENERATE OTP
  ============================== */

  const otp = Math.floor(
    100000 + Math.random() * 900000,
  ).toString();

  const otpExpiresAt = new Date(
    Date.now() + 5 * 60 * 1000,
  );

  /* ==============================
     DELETE OLD OTP
  ============================== */

  await otpModel.deleteMany({
    phone: cleanPhone,
    purpose: "LOGIN",
  });

  /* ==============================
     CREATE OTP
  ============================== */

  const otpRecord =
    await otpModel.create({
      phone: cleanPhone,

      userId: user._id,

      otp,

      purpose: "LOGIN",

      expiresAt:
        otpExpiresAt,

      isVerified: false,
    });

  const isRealSmsEnabled =
    process.env.USE_REAL_SMS === "true";

  /* ==============================
     SEND OTP
  ============================== */

  try {
    if (isRealSmsEnabled) {
      await sendOtpSms({
        // 10 digit number only
        phone: cleanPhone,
        otp,
      });
    } else {
      console.log(
        `Development login OTP for ${cleanPhone}: ${otp}`,
      );
    }
  } catch (error) {
    await otpModel.deleteOne({
      _id: otpRecord._id,
    });

    throw error;
  }

  /* ==============================
     RESPONSE
  ============================== */

  return {
    phone: cleanPhone,

    expiresAt:
      otpExpiresAt,

    ...(isRealSmsEnabled
      ? {}
      : {
          developmentOtp: otp,
        }),
  };
};

export const verifyLoginOtpService = async ({
  phone,
  otp,
}) => {
  /* ==============================
     CLEAN PHONE
  ============================== */

  // Same helper used in sendLoginOtpService
  // +919876543210 -> 9876543210
  // 919876543210  -> 9876543210
  // 9876543210    -> 9876543210
  const cleanPhone = cleanLoginPhone(phone);

  const cleanOtp = String(otp ?? "").trim();

  /* ==============================
     VALIDATE OTP
  ============================== */

  if (!cleanOtp) {
    throw createError(
      400,
      "OTP is required",
    );
  }

  if (!/^\d{6}$/.test(cleanOtp)) {
    throw createError(
      400,
      "Please enter a valid 6-digit OTP",
    );
  }

  /* ==============================
     FIND OTP
  ============================== */

  const otpRecord = await otpModel
    .findOne({
      phone: cleanPhone,
      purpose: "LOGIN",
    })
    .sort({
      createdAt: -1,
    });

  if (!otpRecord) {
    throw createError(
      400,
      "OTP not found. Please request a new OTP",
    );
  }

  /* ==============================
     CHECK EXPIRY
  ============================== */

  if (
    new Date(
      otpRecord.expiresAt,
    ).getTime() <= Date.now()
  ) {
    await otpModel.deleteOne({
      _id: otpRecord._id,
    });

    throw createError(
      400,
      "OTP has expired. Please request a new OTP",
    );
  }

  /* ==============================
     VERIFY OTP
  ============================== */

  if (
    String(otpRecord.otp) !== cleanOtp
  ) {
    throw createError(
      400,
      "Invalid OTP. Please try again",
    );
  }

  /* ==============================
     FIND USER
  ============================== */

  const user =
    await findUserByPhone(cleanPhone);

  if (!user) {
    throw createError(
      404,
      "No account found with this phone number",
    );
  }

  /* ==============================
     BLOCKED USER CHECK
  ============================== */

  if (user.isBlocked) {
    throw createError(
      403,
      "Your account has been blocked. Please contact support",
    );
  }

  /* ==============================
     DELETE OTP
  ============================== */

  await otpModel.deleteOne({
    _id: otpRecord._id,
  });

  /* ==============================
     UPDATE OLD PHONE FORMAT
  ============================== */

  // Old DB values:
  // +919876543210
  // 919876543210
  //
  // Convert them into new structure:
  // phone       -> 9876543210
  // countryCode -> +91
  // fullPhone   -> +919876543210

  let shouldUpdateUser = false;

  if (user.phone !== cleanPhone) {
    user.phone = cleanPhone;
    shouldUpdateUser = true;
  }

  if (!user.countryCode) {
    user.countryCode = "+91";
    shouldUpdateUser = true;
  }

  if (!user.country) {
    user.country = "IN";
    shouldUpdateUser = true;
  }

  if (!user.fullPhone) {
    user.fullPhone = `+91${cleanPhone}`;
    shouldUpdateUser = true;
  }

  if (shouldUpdateUser) {
    await user.save();
  }

  /* ==============================
     RETURN USER
  ============================== */

  return user;
};