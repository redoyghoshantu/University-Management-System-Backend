import { Router } from "express";
import { AdminControllers } from "./admin.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.use(auth("ADMIN"));

router.get("/users", AdminControllers.getUsers);
router.patch("/users/:id/role", AdminControllers.updateUserRole);
router.delete("/users/:id", AdminControllers.deleteUser);
router.get("/audit-logs", AdminControllers.getAuditLogs);
router.get("/dashboard-stats", AdminControllers.getDashboardStats);

export const AdminRoutes = router;