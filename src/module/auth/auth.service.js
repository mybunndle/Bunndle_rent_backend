import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



import userModel from "../../models/userModel.js";
import passwordResetOtpModel from "../../models/passwordResetOtp.model.js";
import { sendForgotPasswordOtp } from "../../utils/email.js";
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
  return String(email || "").trim().toLowerCase();
};

const normalizePhone = (phone) => {
  return String(phone || "").replace(/\D/g, "");
};

function generateToken(user) {
  if (!JWT_SECRET) {
    throw createError(500, "JWT_SECRET is missing");
  }

  return jwt.sign(
    {
      id: user._id || user.id,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
}

/* =========================================================
   REGISTER USER
========================================================= */

export async function registerUser_Service({
  name,
  email,
  phone,
  password,
}) {
  const cleanName = String(name || "").trim();
  const cleanEmail = normalizeEmail(email);
  const cleanPhone = normalizePhone(phone);
  const cleanPassword = String(password || "");

  if (!cleanName || !cleanEmail || !cleanPhone || !cleanPassword) {
    throw createError(400, "Name, email, phone and password are required");
  }

  if (cleanName.length < 2) {
    throw createError(400, "Name must be at least 2 characters");
  }

  if (cleanPhone.length < 10) {
    throw createError(400, "Phone number must be at least 10 digits");
  }

  if (cleanPassword.length < 6) {
    throw createError(400, "Password must be at least 6 characters");
  }

  const existingUser = await userModel
    .findOne({
      $or: [{ email: cleanEmail }, { phone: cleanPhone }],
    })
    .select("email phone");

  if (existingUser) {
    if (existingUser.email === cleanEmail) {
      throw createError(409, "Email already registered");
    }

    if (existingUser.phone === cleanPhone) {
      throw createError(409, "Phone number already registered");
    }

    throw createError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(cleanPassword, 12);

  try {
    const user = await userModel.create({
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password: hashedPassword,
    });

    const token = generateToken(user);

    return {
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern?.email || error.keyValue?.email) {
        throw createError(409, "Email already registered");
      }

      if (error.keyPattern?.phone || error.keyValue?.phone) {
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

export async function loginUser_Service({ email, password }) {
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password || "");

  if (!cleanEmail || !cleanPassword) {
    throw createError(400, "Email and password are required");
  }

  const user = await userModel
    .findOne({
      email: cleanEmail,
    })
    .select("+password");

  if (!user) {
    throw createError(401, "Invalid email or password");
  }

  if (user.isBlocked) {
    throw createError(403, "Your account has been blocked");
  }

  const isPasswordValid = await bcrypt.compare(cleanPassword, user.password);

  if (!isPasswordValid) {
    throw createError(401, "Invalid email or password");
  }

  const token = generateToken(user);

  return {
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  };
}

/* =========================================================
   GET USER PROFILE
========================================================= */

export async function getUserProfile_Service(userId) {
  if (!userId) {
    throw createError(400, "User ID is required");
  }

  const user = await userModel
    .findById(userId)
    .select("name email phone role isVerified isBlocked createdAt updatedAt");

  if (!user) {
    throw createError(404, "User not found");
  }

  return {
    success: true,
    message: "User profile fetched successfully",
    user,
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

export async function updateProfile_Service(userId, data = {}) {
  if (!userId) {
    throw createError(400, "User ID is required");
  }

  const user = await userModel.findById(userId).select("name email phone");

  if (!user) {
    throw createError(404, "User not found");
  }

  const updateData = {};

  if (data.name !== undefined) {
    const cleanName = String(data.name || "").trim();

    if (cleanName.length < 2) {
      throw createError(400, "Name must be at least 2 characters");
    }

    updateData.name = cleanName;
  }

  if (data.email !== undefined) {
    const cleanEmail = normalizeEmail(data.email);

    if (!cleanEmail) {
      throw createError(400, "Email cannot be empty");
    }

    if (cleanEmail !== user.email) {
      const existingEmailUser = await userModel.exists({
        email: cleanEmail,
        _id: { $ne: userId },
      });

      if (existingEmailUser) {
        throw createError(409, "Email already in use");
      }
    }

    updateData.email = cleanEmail;
  }

  if (data.phone !== undefined) {
    const cleanPhone = normalizePhone(data.phone);

    if (cleanPhone.length < 10) {
      throw createError(400, "Phone number must be at least 10 digits");
    }

    if (cleanPhone !== user.phone) {
      const existingPhoneUser = await userModel.exists({
        phone: cleanPhone,
        _id: { $ne: userId },
      });

      if (existingPhoneUser) {
        throw createError(409, "Phone number already in use");
      }
    }

    updateData.phone = cleanPhone;
  }

  if (Object.keys(updateData).length === 0) {
    throw createError(400, "No profile fields provided");
  }

  try {
    const updatedUser = await userModel
      .findByIdAndUpdate(
        userId,
        { $set: updateData },
        {
          new: true,
          runValidators: true,
        }
      )
      .select("name email phone role isVerified isBlocked createdAt updatedAt");

    if (!updatedUser) {
      throw createError(404, "User not found");
    }

    return {
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    };
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern?.email || error.keyValue?.email) {
        throw createError(409, "Email already in use");
      }

      if (error.keyPattern?.phone || error.keyValue?.phone) {
        throw createError(409, "Phone number already in use");
      }

      throw createError(409, "Email or phone number is already in use");
    }

    throw error;
  }
}

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
  const expiresAt = new Date(
    Date.now() + 10 * 60 * 1000
  );

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
    await sendForgotPasswordOtp(
      user.email,
      user.name,
      otp
    );
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
    }
  );

  return {
    success: true,
    message: "OTP sent successfully",
    resetToken,
  };
}

export async function verifyResetOtp_Service({
  otp,
  resetToken,
}) {
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
    throw createError(
      401,
      "Invalid or expired reset token"
    );
  }

  // Check token correct purpose ke liye bana hai
  if (decoded.purpose !== "password-reset") {
    throw createError(
      401,
      "Invalid reset token purpose"
    );
  }

  // Email token ke andar se milega
  const cleanEmail = normalizeEmail(decoded.email);

  if (!cleanEmail) {
    throw createError(
      401,
      "Email is missing from reset token"
    );
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
    throw createError(
      400,
      "Invalid or expired OTP"
    );
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
    }
  );

  return {
    success: true,
    message: "OTP verified and token verified successfully",
    verifiedToken,
  };
}
export async function resetPassword_Service({
  newPassword,
  verifiedToken,
}) {
  if (!newPassword) {
    throw createError(400, "New password is required");
  }

  if (String(newPassword).length < 6) {
    throw createError(
      400,
      "New password must be at least 6 characters"
    );
  }

  if (!verifiedToken) {
    throw createError(401, "Verified token is required");
  }

  let decoded;

  try {
    decoded = jwt.verify(verifiedToken, JWT_SECRET);
  } catch (error) {
    throw createError(
      401,
      "Invalid or expired verified token"
    );
  }

  if (decoded.purpose !== "otp-verified") {
    throw createError(
      401,
      "OTP verification is required"
    );
  }

  const cleanEmail = normalizeEmail(decoded.email);

  if (!cleanEmail) {
    throw createError(
      401,
      "Email is missing from verified token"
    );
  }

  const otpRecord = await passwordResetOtpModel.findOne({
    email: cleanEmail,
    isVerified: true,
    expiresAt: {
      $gt: new Date(),
    },
  });

  if (!otpRecord) {
    throw createError(
      400,
      "OTP verification has expired"
    );
  }

  const user = await userModel.findOne({
    email: cleanEmail,
  });

  if (!user) {
    throw createError(404, "User not found");
  }

  user.password = await bcrypt.hash(
    String(newPassword),
    12
  );

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
      "Google account did not provide the required information"
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
    $or: [
      { googleId },
      { email: normalizedEmail },
    ],
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





export const googleAndroidAuthService = async ({
  idToken,
}) => {
  let ticket;

  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_ANDROID_SERVER_CLIENT_ID,
    });
  } catch (error) {
    console.error("GOOGLE TOKEN VERIFY ERROR:", error);

    const authError = new Error(
      "Invalid or expired Google ID token."
    );
    authError.statusCode = 401;
    throw authError;
  }

  const payload = ticket.getPayload();

  if (!payload) {
    const error = new Error(
      "Unable to read Google account information."
    );
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
    const error = new Error(
      "Google account information is incomplete."
    );
    error.statusCode = 400;
    throw error;
  }

  if (!emailVerified) {
    const error = new Error(
      "Google email is not verified."
    );
    error.statusCode = 401;
    throw error;
  }

  const normalizedEmail = email
    .trim()
    .toLowerCase();

  let user = await userModel.findOne({
    $or: [
      { googleId },
      { email: normalizedEmail },
    ],
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
    }
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





export const appleLoginService = async ({
  identityToken,
  fullName,
  bodyEmail,
}) => {
  if (!identityToken) {
    const error = new Error("Apple identity token required");
    error.statusCode = 400;
    throw error;
  }

  const appleData = await verifyAppleToken(identityToken);

  const appleId = appleData.appleId;
  const email = appleData.email || bodyEmail || undefined;

  if (!appleId) {
    const error = new Error("Invalid Apple token");
    error.statusCode = 401;
    throw error;
  }

  let user = await userModel.findOne({ appleId });

  if (!user && email) {
    user = await userModel.findOne({
      email: email.toLowerCase().trim(),
    });
  }

  if (user) {
    if (!user.appleId) {
      user.appleId = appleId;
    }

    user.authProvider = "apple";

    if (!user.email && email) {
      user.email = email.toLowerCase().trim();
    }

    if (!user.name || user.name === "Apple User") {
      user.name = fullName?.trim() || user.name || "Apple User";
    }

    await user.save();
  } else {
    user = await userModel.create({
      name: fullName?.trim() || "Apple User",
      ...(email
        ? {
            email: email.toLowerCase().trim(),
          }
        : {}),
      appleId,
      authProvider: "apple",
    });
  }

  const token = jwt.sign(
    {
      id: user._id,
      email: user.email || null,
    },
    config.jwtSecret,
    {
      expiresIn: "30d",
    }
  );

  return {
    token,
    user,
  };
};


