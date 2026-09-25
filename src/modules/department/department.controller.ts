import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { DepartmentServices } from "./department.service.js";

const createDepartment = catchAsync(async (req, res) => {
  const result = await DepartmentServices.createDepartment(req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Department created successfully", data: result });
});

const getAllDepartments = catchAsync(async (req, res) => {
  const result = await DepartmentServices.getAllDepartments();
  sendResponse(res, { statusCode: 200, success: true, message: "Departments retrieved successfully", data: result });
});

const getSingleDepartment = catchAsync(async (req, res) => {
  const result = await DepartmentServices.getSingleDepartment(req.params.id as string);
  sendResponse(res, { statusCode: 200, success: true, message: "Department retrieved successfully", data: result });
});

const updateDepartment = catchAsync(async (req, res) => {
  const result = await DepartmentServices.updateDepartment(req.params.id as string, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Department updated successfully", data: result });
});

const deleteDepartment = catchAsync(async (req, res) => {
  const result = await DepartmentServices.deleteDepartment(req.params.id as string, req.user!.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Department deleted successfully", data: result });
});

export const DepartmentControllers = {
  createDepartment, getAllDepartments, getSingleDepartment, updateDepartment, deleteDepartment,
};