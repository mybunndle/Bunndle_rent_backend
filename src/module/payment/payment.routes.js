import express from "express";
import { orderController, verifyPaymentController, getUserPaymentsController , getPaymentForadmin_Controller} from "./payment.controller.js";
import { authenticate } from "../../middleware/auth.middleware.js";
const router = express.Router();



router.post("/create-order", authenticate, orderController);
router.post("/verify-payment", authenticate, verifyPaymentController);
router.get(
  "/my-payments",
  authenticate,
  getUserPaymentsController
);


router.get(
  "/admin/payments",
  authenticate,
  getPaymentForadmin_Controller
);

export default router;