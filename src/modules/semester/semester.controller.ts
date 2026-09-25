import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { SemesterServices } from "./semester.service.js";

const createSemester = catchAsync(async (req, res) => {
  const result = await SemesterServices.createSemester(req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Semester created successfully", data: result });
});

const getAllSemesters = catchAsync(async (req, res) => {
  const result = await SemesterServices.getAllSemesters();
  sendResponse(res, { statusCode: 200, success: true, message: "Semesters retrieved successfully", data: result });
});

const getSingleSemester = catchAsync(async (req, res) => {
  const result = await SemesterServices.getSingleSemester(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Semester retrieved successfully", data: result });
});

const updateSemester = catchAsync(async (req, res) => {
  const result = await SemesterServices.updateSemester(req.params.id as string, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Semester updated successfully", data: result });
});

const deleteSemester = catchAsync(async (req, res) => {
  const result = await SemesterServices.deleteSemester(req.params.id as string, req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Semester deleted successfully", data: result });
});

export const SemesterControllers = {
  createSemester, getAllSemesters, getSingleSemester, updateSemester, deleteSemester,
};