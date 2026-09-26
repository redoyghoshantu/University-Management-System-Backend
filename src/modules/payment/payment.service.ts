import prisma from "../../config/db.js";
import AppError from "../../utils/AppError.js";
import stripe from "../../utils/stripe.js";
import { createAuditLog } from "../../utils/auditLog.js";
import Stripe from "stripe";

const FEE_PER_CREDIT_CENTS = 5000; // $50 per credit — adjust as you like

const initiatePayment = async (studentId: string, enrollmentId: string) => {
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, studentId, deletedAt: null },
    include: { offering: { include: { course: true } } },
  });
  if (!enrollment) throw new AppError(404, "Enrollment not found");
  if (enrollment.paymentStatus === "PAID") throw new AppError(400, "This enrollment is already paid");

  const amountCents = enrollment.offering.course.credits * FEE_PER_CREDIT_CENTS;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: `Course Fee: ${enrollment.offering.course.title}` },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.CLIENT_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: process.env.CLIENT_CANCEL_URL,
    metadata: { enrollmentId, studentId },
  });

  const payment = await prisma.payment.create({
    data: {
      studentId,
      enrollmentId,
      amount: amountCents / 100,
      stripeSessionId: session.id,
      status: "PENDING",
    },
  });

  return { checkoutUrl: session.url, paymentId: payment.id };
};

const handleWebhook = async (rawBody: Buffer, signature: string) => {
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err: any) {
    throw new AppError(400, `Webhook signature verification failed: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const payment = await prisma.payment.findUnique({ where: { stripeSessionId: session.id } });
    if (!payment) return; // unknown session, ignore

    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "PAID" } }),
      prisma.enrollment.update({
        where: { id: payment.enrollmentId as string },
        data: { status: "CONFIRMED", paymentStatus: "PAID" },
      }),
    ]);

    await createAuditLog(payment.studentId, "PAYMENT_SUCCESS", "Payment", payment.id);
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const payment = await prisma.payment.findUnique({ where: { stripeSessionId: session.id } });
    if (payment) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    }
  }
};

const getPaymentById = async (id: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { enrollment: { include: { offering: { include: { course: true } } } } },
  });
  if (!payment) throw new AppError(404, "Payment not found");
  return payment;
};

const getMyPayments = async (studentId: string) => {
  return prisma.payment.findMany({
    where: { studentId },
    include: { enrollment: { include: { offering: { include: { course: true } } } } },
    orderBy: { createdAt: "desc" },
  });
};

const verifyAndConfirmPayment = async (sessionId: string) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const payment = await prisma.payment.findUnique({ where: { stripeSessionId: sessionId } });
  if (!payment) throw new AppError(404, "Payment record not found");

  if (payment.status === "PAID") {
    return { payment, alreadyConfirmed: true };
  }

  if (session.payment_status === "paid") {
    const [updatedPayment] = await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: "PAID" } }),
      prisma.enrollment.update({
        where: { id: payment.enrollmentId as string },
        data: { status: "CONFIRMED", paymentStatus: "PAID" },
      }),
    ]);
    await createAuditLog(payment.studentId, "PAYMENT_SUCCESS", "Payment", payment.id);
    return { payment: updatedPayment, alreadyConfirmed: false };
  }

  return { payment, alreadyConfirmed: false, notYetPaid: true };
};

export const PaymentServices = {
  initiatePayment, handleWebhook, getPaymentById, getMyPayments, verifyAndConfirmPayment,
};