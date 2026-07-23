import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  forgotPasswordSchema,
} from "./auth.validation.js";
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
export async function getCurrentUser(req, res) {
  try {
    const userId = req.user.id;
    const userProfile = await getUserProfile_Service(userId);

    return res.status(200).json({
      message: "User profile fetched successfully",
      user: userProfile.user,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
}

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

export async function updateProfile(req, res) {
  try {
    // Validate request body
    const parsed = updateProfileSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    // Get logged-in user's ID
    const userId = req.user.id;

    // Call service
    const updatedProfile = await updateProfile_Service(userId, parsed.data);

    // Send success response
    return res.status(200).json(updatedProfile);
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      message: err.message || "Internal Server Error",
    });
  }
}

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
