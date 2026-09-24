import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import AppError from "../utils/AppError.js";


declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

export const auth = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError(401, "You are not authorized");
      }

      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET as string);

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        throw new AppError(403, "You do not have permission for this action");
      }

      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};