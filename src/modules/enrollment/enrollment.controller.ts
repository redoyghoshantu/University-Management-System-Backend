import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { EnrollmentServices } from "./enrollment.service.js";

const createEnrollment = catchAsync(async (req, res) => {
  const result = await EnrollmentServices.createEnrollment(req.user!.id, req.body.offeringId);
  sendResponse(res, { statusCode: 201, success: true, message: "Enrollment request created — proceed to payment", data: result });
});

const getMyEnrollments = catchAsync(async (req, res) => {
  const result = await EnrollmentServices.getMyEnrollments(req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Your enrollments retrieved successfully", data: result });
});

const getSingleEnrollment = catchAsync(async (req, res) => {
  const result = await EnrollmentServices.getSingleEnrollment(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Enrollment retrieved successfully", data: result });
});

const cancelEnrollment = catchAsync(async (req, res) => {
  const result = await EnrollmentServices.cancelEnrollment(req.params.id as string, req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Enrollment cancelled successfully", data: result });
});

export const EnrollmentControllers = { createEnrollment, getMyEnrollments, getSingleEnrollment, cancelEnrollment };