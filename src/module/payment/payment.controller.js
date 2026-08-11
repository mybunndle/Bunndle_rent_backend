import {createPaymentOrder_Service, verifyPaymentOrder_Service } from "./payment.service.js"

export const orderController = async (req, res, next) => {
  try {
    const userId = req.user?._id;


    const { assetId ,amount,duration} = req.body;

    const result = await createPaymentOrder_Service({
      userId,
      assetId,
      amount,
      duration
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
