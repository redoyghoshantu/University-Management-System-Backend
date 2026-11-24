import { Router } from "express";
import { ResultControllers } from "./result.controller.js";
import { auth } from "../../middlewares/auth.middleware.js";

export const ExamRoutes = Router();
ExamRoutes.post("/", auth("FACULTY"), ResultControllers.createExam);
ExamRoutes.get("/offering/:offeringId", auth("FACULTY", "ADMIN"), ResultControllers.getExamsByOffering);

export const ResultRoutes = Router();
ResultRoutes.post("/", auth("FACULTY"), ResultControllers.upsertResult);
ResultRoutes.get("/my-results", auth("STUDENT"), ResultControllers.getMyResults);
