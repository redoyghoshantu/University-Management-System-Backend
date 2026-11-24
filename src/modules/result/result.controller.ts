import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { ResultServices } from "./result.service.js";

const createExam = catchAsync(async (req, res) => {
  const result = await ResultServices.createExam(req.user!, req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Exam created successfully", data: result });
});

const getExamsByOffering = catchAsync(async (req, res) => {
  const result = await ResultServices.getExamsByOffering(req.params.offeringId as string, req.user!);
  sendResponse(res, { statusCode: 200, success: true, message: "Exams retrieved successfully", data: result });
});

const upsertResult = catchAsync(async (req, res) => {
  const result = await ResultServices.upsertResult(req.user!, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Result saved successfully", data: result });
});

const getMyResults = catchAsync(async (req, res) => {
  const result = await ResultServices.getMyResults(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Your results retrieved successfully", data: result });
});

export const ResultControllers = { createExam, getExamsByOffering, upsertResult, getMyResults };
