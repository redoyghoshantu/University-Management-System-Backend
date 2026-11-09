import { Router } from "express";
import { CourseOfferingControllers } from "./courseOffering.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/", auth("ADMIN"), CourseOfferingControllers.createOffering);
router.get("/", CourseOfferingControllers.getAllOfferings);
router.get("/my-offerings", auth("FACULTY"), CourseOfferingControllers.getMyOfferings); // ⚠️ এই route অবশ্যই /:id এর আগে বসাতে হবে
router.get("/:id", CourseOfferingControllers.getSingleOffering);
router.patch("/:id", auth("ADMIN"), CourseOfferingControllers.updateOffering);
router.delete("/:id", auth("ADMIN"), CourseOfferingControllers.deleteOffering);

export const CourseOfferingRoutes = router;