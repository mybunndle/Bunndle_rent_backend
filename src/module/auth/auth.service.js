import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import userModel from "../../models/userModel.js";
import passwordResetOtpModel from "../../models/passwordResetOtpModel.js";
import { sendForgotPasswordOtp } from "../../utils/email.js";

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
    throw createError(
      400,
      "Name, email, phone and password are required"
    );
  }

  if (cleanName.length < 2) {
    throw createError(
      400,
      "Name must be at least 2 characters"
    );
  }

  if (cleanPhone.length < 10) {
    throw createError(
      400,
      "Phone number must be at least 10 digits"
    );
  }

  if (cleanPassword.length < 6) {
    throw createError(
      400,
      "Password must be at least 6 characters"
    );
  }

  const existingUser = await userModel
    .findOne({
      $or: [
        { email: cleanEmail },
        { phone: cleanPhone },
      ],
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
    // MongoDB duplicate-key error
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
    throw createError(
      400,
      "Email and password are required"
    );
  }

  // +password needed when password has select: false in schema
  const user = await userModel
    .findOne({
      email: cleanEmail,
    })
    .select("+password");

  if (!user) {
    throw createError(
      401,
      "Invalid email or password"
    );
  }

  if (user.isBlocked) {
    throw createError(
      403,
      "Your account has been blocked"
    );
  }

  const isPasswordValid = await bcrypt.compare(
    cleanPassword,
    user.password
  );

  if (!isPasswordValid) {
    throw createError(
      401,
      "Invalid email or password"
    );
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
    .select(
      "name email phone role isVerified isBlocked createdAt updatedAt"
    );

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

export async function changePassword_Service(
  userId,
  oldPassword,
  newPassword
) {
  if (!userId) {
    throw createError(400, "User ID is required");
  }

  if (!oldPassword || !newPassword) {
    throw createError(
      400,
      "Old password and new password are required"
    );
  }

  if (String(newPassword).length < 6) {
    throw createError(
      400,
      "New password must be at least 6 characters"
    );
  }

  const user = await userModel
    .findById(userId)
    .select("+password");

  if (!user) {
    throw createError(404, "User not found");
  }

  const isOldPasswordCorrect = await bcrypt.compare(
    oldPassword,
    user.password
  );

  if (!isOldPasswordCorrect) {
    throw createError(
      400,
      "Old password is incorrect"
    );
  }

  const isSamePassword = await bcrypt.compare(
    newPassword,
    user.password
  );

  if (isSamePassword) {
    throw createError(
      400,
      "New password cannot be the same as old password"
    );
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

export async function updateProfile_Service(
  userId,
  data = {}
) {
  if (!userId) {
    throw createError(400, "User ID is required");
  }

  const user = await userModel
    .findById(userId)
    .select("name email phone");

  if (!user) {
    throw createError(404, "User not found");
  }

  const updateData = {};

  // Name update
  if (data.name !== undefined) {
    const cleanName = String(data.name || "").trim();

    if (cleanName.length < 2) {
      throw createError(
        400,
        "Name must be at least 2 characters"
      );
    }

    updateData.name = cleanName;
  }

  // Email update
  if (data.email !== undefined) {
    const cleanEmail = normalizeEmail(data.email);

    if (!cleanEmail) {
      throw createError(
        400,
        "Email cannot be empty"
      );
    }

    if (cleanEmail !== user.email) {
      const existingEmailUser = await userModel.exists({
        email: cleanEmail,
        _id: {
          $ne: userId,
        },
      });

      if (existingEmailUser) {
        throw createError(
          409,
          "Email already in use"
        );
      }
    }

    updateData.email = cleanEmail;
  }

  // Phone update
  if (data.phone !== undefined) {
    const cleanPhone = normalizePhone(data.phone);

    if (cleanPhone.length < 10) {
      throw createError(
        400,
        "Phone number must be at least 10 digits"
      );
    }

    if (cleanPhone !== user.phone) {
      const existingPhoneUser = await userModel.exists({
        phone: cleanPhone,
        _id: {
          $ne: userId,
        },
      });

      if (existingPhoneUser) {
        throw createError(
          409,
          "Phone number already in use"
        );
      }
    }

    updateData.phone = cleanPhone;
  }

  if (Object.keys(updateData).length === 0) {
    throw createError(
      400,
      "No profile fields provided"
    );
  }

  try {
    const updatedUser = await userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        }
      )
      .select(
        "name email phone role isVerified isBlocked createdAt updatedAt"
      );

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
        throw createError(
          409,
          "Email already in use"
        );
      }

      if (error.keyPattern?.phone || error.keyValue?.phone) {
        throw createError(
          409,
          "Phone number already in use"
        );
      }

      throw createError(
        409,
        "Email or phone number is already in use"
      );
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
    throw createError(
      400,
      "Email is required"
    );
  }

  // 1. Check whether user exists
  const user = await userModel
    .findOne({
      email: cleanEmail,
    })
    .select("name email");

  if (!user) {
    throw createError(
      404,
      "User not found"
    );
  }

  // 2. Generate secure 6-digit OTP
  const otp = crypto
    .randomInt(100000, 1000000)
    .toString();

  // 3. Set OTP expiry to 10 minutes
  const expiresAt = new Date(
    Date.now() + 10 * 60 * 1000
  );

  // 4. Delete previous password-reset OTPs
  await passwordResetOtpModel.deleteMany({
    email: cleanEmail,
  });

  // 5. Save new OTP
  await passwordResetOtpModel.create({
    email: cleanEmail,
    otp,
    expiresAt,
  });

  try {
    // 6. Send OTP through email
    await sendForgotPasswordOtp(
      user.email,
      user.name,
      otp
    );
  } catch (error) {
    // Email fail hone par unused OTP remove kar do
    await passwordResetOtpModel.deleteMany({
      email: cleanEmail,
    });

    throw createError(
      500,
      "Unable to send OTP email"
    );
  }

  return {
    success: true,
    message: "OTP sent successfully",
  };
}