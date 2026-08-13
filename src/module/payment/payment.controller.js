import {
  createPaymentOrder_Service,
  verifyPaymentOrder_Service,
  getUserPayments_Service,
  getPaymentForadmin_Service,
} from "./payment.service.js";

export const orderController = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    const { assetId, amount, duration } = req.body;

    const result = await createPaymentOrder_Service({
      userId,
      assetId,
      amount,
      duration,
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const verifyPaymentController = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const result = await verifyPaymentOrder_Service({
      userId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getUserPaymentsController = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    const { status1, status2 } = req.query;

    const result = await getUserPayments_Service({
      userId,
      status1,
      status2,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


import createError from "http-errors";


export const getPaymentForadmin_Controller = async (
  req,
  res,
  next
) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const result = await getPaymentForadmin_Service({
      page,
      limit,
      status,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
