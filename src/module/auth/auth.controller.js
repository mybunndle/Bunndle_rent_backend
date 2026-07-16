import { registerSchema, loginSchema } from './auth.validation.js';
import { registerUser_Service, loginUser_Service, getUserProfile_Service } from './auth.service.js';

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
        message: 'Validation failed',
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
  try{
    const userId = req.user.id; 
    const userProfile = await getUserProfile_Service(userId);
    return res.status(200).json({ 
      message: 'User profile fetched successfully',
      user: userProfile });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ message: err.message });
  }
}


export async function changePassword(req, res) {
  
}