import { Router } from "express";
import { CourseControllers } from "./course.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/", auth("ADMIN"), CourseControllers.createCourse);
router.get("/", CourseControllers.getAllCourses);
router.get("/:id", CourseControllers.getSingleCourse);
router.patch("/:id", auth("ADMIN"), CourseControllers.updateCourse);
router.delete("/:id", auth("ADMIN"), CourseControllers.deleteCourse);

export const CourseRoutes = router;