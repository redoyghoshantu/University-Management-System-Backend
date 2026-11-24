import { Router } from "express";
import { AuthControllers } from "./auth.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", AuthControllers.register);
router.post("/login", AuthControllers.login);
router.post("/refresh-token", AuthControllers.refreshToken);
router.get("/me", auth(), AuthControllers.getMe);
router.patch("/me", auth(), AuthControllers.updateMe);
router.get("/google", AuthControllers.googleRedirect);
router.get("/google/callback", AuthControllers.googleCallback);

export const AuthRoutes = router;