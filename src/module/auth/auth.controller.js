import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  forgotPasswordSchema,
} from "./auth.validation.js";

import sendEmail from "../../utils/email.js";

import adminQuickConnectTemplate from
  "../../utils/adminQuickConnectTemplate.js";

import userEmailTemplate from
  "../../utils/userQuickConnectTemplate.js";

import {
  registerUser_Service,
  loginUser_Service,
  getUserProfile_Service,
  changePassword_Service,
  updateProfile_Service,
  forgotPassword_Service,
  verifyResetOtp_Service,
  resetPassword_Service,
  googleAuthService,
  appleLoginService,
  logoutService,
  deleteAccountService,
} from "./auth.service.js";

export async function register(req, res) {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await registerUser_Service(parsed.data);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      ...result,
    });
  } catch (err) {
    console.error("REGISTER CONTROLLER ERROR:", err);

    if (err.code === "P2002") {
      const target = err.meta?.target;

      if (Array.isArray(target) && target.includes("email")) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }

      if (Array.isArray(target) && target.includes("phone")) {
        return res.status(409).json({
          success: false,
          message: "Phone number already registered",
        });
      }

      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Unable to register user",
    });
  }
}

export async function login(req, res) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
 
    const result = await loginUser_Service(parsed.data);
   
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
}
export const getCurrentUser = async (
  req,
  res,
  next
) => {
  try {
    const userId =
      req.user?._id ||
      req.user?.id ||
      req.user?.userId;

    const result = await getUserProfile_Service(userId);

    const formatDOB = (dob) => {
      if (!dob) {
        return null;
      }

      // Agar DOB already DD-MM-YYYY format mein hai
      if (
        typeof dob === "string" &&
        /^\d{2}-\d{2}-\d{4}$/.test(dob)
      ) {
        return dob;
      }

      const parsedDate = new Date(dob);

      if (Number.isNaN(parsedDate.getTime())) {
        return null;
      }

      const day = String(
        parsedDate.getUTCDate()
      ).padStart(2, "0");

      const month = String(
        parsedDate.getUTCMonth() + 1
      ).padStart(2, "0");

      const year = parsedDate.getUTCFullYear();

      return `${day}-${month}-${year}`;
    };

    const userData = {
      ...result.data,
      dob: formatDOB(result.data?.dob),
    };

    return res.status(200).json({
      success: true,
      message: result.message,
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

export async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const result = await changePassword_Service(
      userId,
      oldPassword,
      newPassword,
    );

    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      message: err.message,
    });
  }
}


export const updateProfile = async (
  req,
  res,
  next
) => {
  try {
    const userId =
      req.user?._id ||
      req.user?.id ||
      req.user?.userId;

    
    const updatedUser =
      await updateProfile_Service({
        userId,
        body: req.body,
        file: req.file,
      });

   

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
export async function forgotPassword(req, res) {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const result = await forgotPassword_Service(parsed.data.email);

    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Unable to process forgot password",
    });
  }
}

export async function verifyResetOtp(req, res) {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required",
      });
    }

    // Authorization header get karo
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Reset token is required in Bearer authorization",
      });
    }

    // "Bearer token" me se sirf token extract karo
    const resetToken = authorization.split(" ")[1];

    if (!resetToken) {
      return res.status(401).json({
        success: false,
        message: "Reset token is required",
      });
    }

    const result = await verifyResetOtp_Service({
      otp,
      resetToken,
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Unable to verify OTP",
    });
  }
}

export async function resetPassword(req, res) {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Verified token is required",
      });
    }

    const verifiedToken = authorization.split(" ")[1];

    if (!verifiedToken) {
      return res.status(401).json({
        success: false,
        message: "Verified token is required",
      });
    }

    const result = await resetPassword_Service({
      newPassword,
      verifiedToken,
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Unable to reset password",
    });
  }
}

// export const googleAuthController = async (req, res) => {
//   try {
//     const { idToken } = req.body;

//     const result = await googleAuthService(idToken);

//     return res.status(200).json({
//       success: true,
//       ...result,
//     });
//   } catch (error) {
//     return res.status(error.statusCode || 500).json({
//       success: false,
//       message: error.message || "Google authentication failed",
//     });
//   }
// };

export const googleAuthController = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google ID token is required",
      });
    }

    const result = await googleAuthService(idToken);

    return res.status(200).json({
      success: true,
      message: result.message,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error("GOOGLE AUTH ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Google authentication failed",
    });
  }
};

export const appleLogin = async (req, res) => {
  try {
    const { identityToken, email, fullName } = req.body;

    if (!identityToken) {
      return res.status(400).json({
        success: false,
        message: "Apple identity token is required",
      });
    }

    const result = await appleLoginService({
      identityToken,
      email,
      fullName,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("APPLE LOGIN ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Apple authentication failed",
    });
  }
};

export const logoutController = async (
  req,
  res
) => {
  try {
    const userId = req.user?.id;

    const result = await logoutService({
      userId,
      token: req.token,
      tokenPayload: req.tokenPayload,
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully."
    });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message || "Unable to logout.",
    });
  }
};

export const deleteAccountController = async (
  req,
  res
) => {
  try {
    const userId = req.user?.id;

    const {
      currentPassword,
      confirmation,
    } = req.body || {};

    const result = await deleteAccountService({
      userId,
      currentPassword,
      confirmation,
    });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully.",
      data: result,
    });
  } catch (error) {
    console.error(
      "DELETE ACCOUNT ERROR:",
      error
    );

    return res
      .status(error.statusCode || 500)
      .json({
        success: false,
        message:
          error.message ||
          "Unable to delete account.",
      });
  }
};



const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cleanValue = (value) => {
  return typeof value === "string"
    ? value.trim()
    : "";
};

export const quickConnect = async (
  req,
  res,
  next
) => {
  try {
    const name = cleanValue(req.body.name);

    const email = cleanValue(
      req.body.email
    ).toLowerCase();

    const message = cleanValue(
      req.body.message
    );

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and message are required.",
      });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address.",
      });
    }

    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Name cannot exceed 100 characters.",
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message:
          "Message cannot exceed 2000 characters.",
      });
    }

    if (!process.env.EMAIL_FROM) {
      const error = new Error(
        "EMAIL_FROM is not configured."
      );

      error.statusCode = 500;
      throw error;
    }

    const adminEmailResult =
      await sendEmail({
        to: process.env.EMAIL_FROM,

        subject:
          `New Quick Connect Request - ${name}`,

        replyTo: email,

        html: adminQuickConnectTemplate({
          name,
          email,
          message,
        }),
      });

    const userEmailResult =
      await sendEmail({
        to: email,

        subject:
          "We received your Quick Connect request",

        html: userEmailTemplate({
          name,
          email,
          message,
        }),
      });

    console.log(
      "✅ QUICK CONNECT SUBMITTED:",
      {
        name,
        email,
        adminMessageId:
          adminEmailResult.messageId,
        userMessageId:
          userEmailResult.messageId,
      }
    );

    return res.status(200).json({
      success: true,

      message:
        "Request submitted successfully. We will contact you soon.",

      data: {
        name,
        email,
      },
    });
  } catch (error) {
    console.error(
      "❌ QUICK CONNECT ERROR:",
      error.message
    );

    next(error);
  }
};