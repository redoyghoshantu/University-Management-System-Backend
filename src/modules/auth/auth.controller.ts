import AppError from "../../utils/AppError.js";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { AuthServices } from "./auth.service.js";

const register = catchAsync(async (req, res) => {
  const result = await AuthServices.registerUser(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

const login = catchAsync(async (req, res) => {
  const result = await AuthServices.loginUser(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Login successful",
    data: result,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const result = await AuthServices.refreshAccessToken(req.body.refreshToken);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Access token refreshed",
    data: result,
  });
});

const googleRedirect = catchAsync(async (req, res) => {
  res.redirect(AuthServices.getGoogleAuthUrl());
});

const googleCallback = catchAsync(async (req, res) => {
  const { code, error } = req.query;

  if (error || typeof code !== "string") {
    throw new AppError(400, "Google login was cancelled or failed");
  }

  const result = await AuthServices.googleLogin(code);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Google login successful",
    data: result,
  });
});

export const AuthControllers = {
  register,
  login,
  refreshToken,
  googleRedirect,
  googleCallback,
};