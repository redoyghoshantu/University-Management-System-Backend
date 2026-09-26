import { Router } from "express";
import { EnrollmentControllers } from "./enrollment.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/", auth("STUDENT"), EnrollmentControllers.createEnrollment);
router.get("/my-enrollments", auth("STUDENT"), EnrollmentControllers.getMyEnrollments); // must be before /:id
router.get("/:id", auth(), EnrollmentControllers.getSingleEnrollment);
router.patch("/:id/cancel", auth("STUDENT"), EnrollmentControllers.cancelEnrollment);

export const EnrollmentRoutes = router;