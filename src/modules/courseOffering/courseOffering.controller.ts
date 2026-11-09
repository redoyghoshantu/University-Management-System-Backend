import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { CourseOfferingServices } from "./courseOffering.service.js";

const createOffering = catchAsync(async (req, res) => {
  const result = await CourseOfferingServices.createOffering(req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Course offering created successfully", data: result });
});

const getAllOfferings = catchAsync(async (req, res) => {
  const result = await CourseOfferingServices.getAllOfferings(req.query as any);
  sendResponse(res, { statusCode: 200, success: true, message: "Course offerings retrieved successfully", data: result });
});

const getSingleOffering = catchAsync(async (req, res) => {
  const result = await CourseOfferingServices.getSingleOffering(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Course offering retrieved successfully", data: result });
});

const updateOffering = catchAsync(async (req, res) => {
  const result = await CourseOfferingServices.updateOffering(req.params.id as string, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Course offering updated successfully", data: result });
});

const deleteOffering = catchAsync(async (req, res) => {
  const result = await CourseOfferingServices.deleteOffering(req.params.id as string, req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Course offering deleted successfully", data: result });
});

const getMyOfferings = catchAsync(async (req, res) => {
  const result = await CourseOfferingServices.getMyOfferings(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Your offerings retrieved successfully", data: result });
});

export const CourseOfferingControllers = {
  createOffering, getAllOfferings, getSingleOffering, updateOffering, deleteOffering, getMyOfferings,
};