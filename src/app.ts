import express from "express";
import cors from "cors";
import { AuthRoutes } from "./modules/auth/auth.routes.js";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import AppError from "./utils/AppError.js";
import { DepartmentRoutes } from "./modules/department/department.routes.js";
import { CourseRoutes } from "./modules/course/course.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ success: true, message: "University Management System is running" });
});

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/departments", DepartmentRoutes);
app.use("/api/v1/courses", CourseRoutes);

app.use((req, res, next) => {
  next(new AppError(404, "Route not found"));
});

app.use(globalErrorHandler);

export default app;