import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { CourseServices } from "./course.service.js";

const createCourse = catchAsync(async (req, res) => {
  const result = await CourseServices.createCourse(req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Course created successfully", data: result });
});

const getAllCourses = catchAsync(async (req, res) => {
  const result = await CourseServices.getAllCourses(req.query as any);
  sendResponse(res, { statusCode: 200, success: true, message: "Courses retrieved successfully", data: result });
});

const getSingleCourse = catchAsync(async (req, res) => {
  const result = await CourseServices.getSingleCourse(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Course retrieved successfully", data: result });
});

const updateCourse = catchAsync(async (req, res) => {
  const result = await CourseServices.updateCourse(req.params.id as string, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Course updated successfully", data: result });
});

const deleteCourse = catchAsync(async (req, res) => {
  const result = await CourseServices.deleteCourse(req.params.id as string, req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Course deleted successfully", data: result });
});

export const CourseControllers = { createCourse, getAllCourses, getSingleCourse, updateCourse, deleteCourse };