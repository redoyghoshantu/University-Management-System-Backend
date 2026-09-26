import { Router } from "express";
import { PaymentControllers } from "./payment.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/initiate", auth("STUDENT"), PaymentControllers.initiatePayment);
router.get("/my-payments", auth("STUDENT"), PaymentControllers.getMyPayments);
router.get("/success", PaymentControllers.paymentSuccess); 
router.get("/:id", auth(), PaymentControllers.getPaymentById);

export const PaymentRoutes = router;
