import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError.js";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = "Something went wrong";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err?.code === "P2002") {
    statusCode = 409;
    message = `Duplicate value for field: ${err.meta?.target}`;
  } else if (err?.message) {
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: err?.errors ?? [],
  });
};

export default globalErrorHandler;