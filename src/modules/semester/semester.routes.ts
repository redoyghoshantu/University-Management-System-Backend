import { Router } from "express";
import { SemesterControllers } from "./semester.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/", auth("ADMIN"), SemesterControllers.createSemester);
router.get("/", SemesterControllers.getAllSemesters);
router.get("/:id", SemesterControllers.getSingleSemester);
router.patch("/:id", auth("ADMIN"), SemesterControllers.updateSemester);
router.delete("/:id", auth("ADMIN"), SemesterControllers.deleteSemester);

export const SemesterRoutes = router;