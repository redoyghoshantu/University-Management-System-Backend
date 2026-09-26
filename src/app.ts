import express from "express";
import cors from "cors";
import { AuthRoutes } from "./modules/auth/auth.routes.js";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import AppError from "./utils/AppError.js";
import { DepartmentRoutes } from "./modules/department/department.routes.js";
import { CourseRoutes } from "./modules/course/course.routes.js";
import { SemesterRoutes } from "./modules/semester/semester.routes.js";
import { CourseOfferingRoutes } from "./modules/courseOffering/courseOffering.routes.js";
import { EnrollmentRoutes } from "./modules/enrollment/enrollment.routes.js";
import { PaymentRoutes } from "./modules/payment/payment.routes.js";
import { PaymentControllers } from "./modules/payment/payment.controller.js";

const app = express();

app.use(cors());

app.post("/api/v1/payments/webhook", express.raw({ type: "application/json" }), PaymentControllers.webhook);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ success: true, message: "University Management System is running" });
});

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/departments", DepartmentRoutes);
app.use("/api/v1/courses", CourseRoutes);
app.use("/api/v1/semesters", SemesterRoutes);
app.use("/api/v1/course-offerings", CourseOfferingRoutes);
app.use("/api/v1/enrollments", EnrollmentRoutes);
app.use("/api/v1/payments", PaymentRoutes);

app.use((req, res, next) => {
  next(new AppError(404, "Route not found"));
});

app.use(globalErrorHandler);

export default app;