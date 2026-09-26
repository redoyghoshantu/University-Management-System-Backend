import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { PaymentServices } from "./payment.service.js";
import AppError from "../../utils/AppError.js";

const initiatePayment = catchAsync(async (req, res) => {
  const result = await PaymentServices.initiatePayment(req.user!.id, req.body.enrollmentId);
  sendResponse(res, { statusCode: 200, success: true, message: "Payment session created", data: result });
});

// NOTE: this one does NOT use catchAsync/sendResponse — Stripe needs a specific raw response
const webhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  try {
    await PaymentServices.handleWebhook(req.body, signature);
    res.status(200).json({ received: true });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(400).json({ success: false, message: "Webhook error" });
    }
  }
};

const getPaymentById = catchAsync(async (req, res) => {
  const result = await PaymentServices.getPaymentById(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Payment retrieved successfully", data: result });
});

const getMyPayments = catchAsync(async (req, res) => {
  const result = await PaymentServices.getMyPayments(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Your payments retrieved successfully", data: result });
});

const paymentSuccess = async (req: Request, res: Response) => {
  const sessionId = req.query.session_id as string;
  if (!sessionId) {
    return res.status(400).json({ success: false, message: "Missing session_id" });
  }
  try {
    const result = await PaymentServices.verifyAndConfirmPayment(sessionId);
    res.status(200).json({
      success: true,
      message: result.notYetPaid ? "Payment not completed yet" : "Payment confirmed successfully",
      data: result.payment,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: "Something went wrong verifying payment" });
    }
  }
};

export const PaymentControllers = {
  initiatePayment, webhook, getPaymentById, getMyPayments, paymentSuccess,
};