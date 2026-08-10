import express from "express";
import { orderController, verifyPaymentController } from "./payment.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
const router = express.Router();





router.post("/create-order", authenticate, orderController);
router.post("/verify-payment", authenticate, verifyPaymentController);

export default router;