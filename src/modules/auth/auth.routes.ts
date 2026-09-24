import { Router } from "express";
import { AuthControllers } from "./auth.controller.js";

const router = Router();

router.post("/register", AuthControllers.register);
router.post("/login", AuthControllers.login);
router.post("/refresh-token", AuthControllers.refreshToken);

export const AuthRoutes = router;