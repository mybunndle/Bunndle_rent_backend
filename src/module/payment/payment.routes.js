import express from "express";
import { orderController, verifyPaymentController, getUserPaymentsController } from "./payment.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
const router = express.Router();



router.post("/create-order", authenticate, orderController);
router.post("/verify-payment", authenticate, verifyPaymentController);
router.get(
  "/my-payments",
  authenticate,
  getUserPaymentsController
);

export default router;