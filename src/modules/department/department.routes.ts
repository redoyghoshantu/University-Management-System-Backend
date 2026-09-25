import { Router } from "express";
import { DepartmentControllers } from "./department.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/", auth("ADMIN"), DepartmentControllers.createDepartment);
router.get("/", DepartmentControllers.getAllDepartments);
router.get("/:id", DepartmentControllers.getSingleDepartment);
router.patch("/:id", auth("ADMIN"), DepartmentControllers.updateDepartment);
router.delete("/:id", auth("ADMIN"), DepartmentControllers.deleteDepartment);

export const DepartmentRoutes = router;