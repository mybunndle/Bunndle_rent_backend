
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

function generateToken(user) {
  if (!JWT_SECRET) {
    throw createError(500, "JWT_SECRET is missing");
  }

  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
}

const normalizeEmail = (email) => {
  return String(email || "").trim().toLowerCase();
};

const normalizePhone = (phone) => {
  return String(phone || "").replace(/\D/g, "");
};

export async function registerUser_Service({
  name,
  email,
  phone,
  password,
}) {
  const cleanName = String(name || "").trim();
  const cleanEmail = normalizeEmail(email);
  const cleanPhone = normalizePhone(phone);

  if (!cleanName || !cleanEmail || !cleanPhone || !password) {
    throw createError(
      400,
      "Name, email, phone and password are required"
    );
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        {
          email: cleanEmail,
        },
        {
          phone: cleanPhone,
        },
      ],
    },
    select: {
      id: true,
      email: true,
      phone: true,
    },
  });

  if (existingUser) {
    if (existingUser.email === cleanEmail) {
      throw createError(409, "Email already registered");
    }

    if (existingUser.phone === cleanPhone) {
      throw createError(409, "Phone number already registered");
    }

    throw createError(409, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    const token = generateToken(user);

    return {
      token,
      message: "User registered successfully",
      user,
    };
  } catch (error) {
    if (error.code === "P2002") {
      const target = error.meta?.target;

      if (Array.isArray(target) && target.includes("email")) {
        throw createError(409, "Email already registered");
      }

      if (Array.isArray(target) && target.includes("phone")) {
        throw createError(409, "Phone number already registered");
      }

      throw createError(409, "User already exists");
    }

    throw error;
  }
}

export async function loginUser_Service({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (user.isBlocked) {
    const error = new Error('Your account has been blocked');
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  return {
    token,
    message: 'Login successful',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getUserProfile_Service(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      isBlocked: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
}

export async function changePassword_Service(userId, oldPassword, newPassword) {
  const user = await prisma.user.findUnique({ 
    where: {
      id: userId,
    },
   });

    //Check if user exists
    if (!user) {
       throw {
        statusCode: 404,
        message: 'User not found',
      };
    }

    //Check if old password is correct
    const isPasswordCorrect =  await bcrypt.compare(
      oldPassword,
      user.password
    );
    if (!isPasswordCorrect) {
      throw {
        statusCode: 400,
        message: 'Old password is incorrect',
      };
    }
      //. hash the new password
       const hashedPassword = await bcrypt.hash(newPassword, 10);

      //Update the user's password
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          password: hashedPassword,
        },
      });
      

      // Return a success message
      return {
        message: 'Password changed successfully',
      };
}

export async function updateProfile_Service(userId, data) {
  // Current user  database se fetch karo
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  });

  if (!user) {
    throw createError(404, "User not found");
  }

  const updateData = {};

  // Name normalize
  if (data.name !== undefined) {
    const cleanName = String(data.name).trim();

    if (cleanName.length < 2) {
      throw createError(400, "Name must be at least 2 characters");
    }

    updateData.name = cleanName;
  }

  // Email normalize and uniqueness check
  if (data.email !== undefined) {
    const cleanEmail = normalizeEmail(data.email);

    if (cleanEmail !== user.email) {
      const existingEmailUser = await prisma.user.findUnique({
        where: {
          email: cleanEmail,
        },
        select: {
          id: true,
        },
      });

      if (existingEmailUser && existingEmailUser.id !== userId) {
        throw createError(409, "Email already in use");
      }
    }

    updateData.email = cleanEmail;
  }

  // Phone normalize and uniqueness check
  if (data.phone !== undefined) {
    const cleanPhone = normalizePhone(data.phone);

    if (cleanPhone.length < 10) {
      throw createError(
        400,
        "Phone number must be at least 10 digits"
      );
    }

    if (cleanPhone !== user.phone) {
      const existingPhoneUser = await prisma.user.findUnique({
        where: {
          phone: cleanPhone,
        },
        select: {
          id: true,
        },
      });

      if (existingPhoneUser && existingPhoneUser.id !== userId) {
        throw createError(409, "Phone number already in use");
      }
    }

    updateData.phone = cleanPhone;
  }

  if (Object.keys(updateData).length === 0) {
    throw createError(400, "No profile fields provided");
  }

  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    };
  } catch (error) {
    if (error.code === "P2002") {
      throw createError(
        409,
        "Email or phone number is already in use"
      );
    }

    throw error;
  }
}