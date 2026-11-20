import { Request, Response, NextFunction } from "express";
import { AdminServices } from "./admin.service.js";

const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminServices.getUsers(req.query as Record<string, string>);
    res.json({ success: true, message: "Users retrieved successfully", ...result });
  } catch (err) { next(err); }
};

const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await AdminServices.updateUserRole(req.user!.id, req.params.id as string, req.body.role);
    res.json({ success: true, message: "User role updated successfully", data });
  } catch (err) { next(err); }
};

const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AdminServices.softDeleteUser(req.user!.id, req.params.id as string);
    res.json({ success: true, message: "User deleted successfully", data: null });
  } catch (err) { next(err); }
};

const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AdminServices.getAuditLogs(req.query as Record<string, string>);
    res.json({ success: true, message: "Audit logs retrieved successfully", ...result });
  } catch (err) { next(err); }
};

const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await AdminServices.getDashboardStats();
    res.json({ success: true, message: "Dashboard stats retrieved successfully", data });
  } catch (err) { next(err); }
};

export const AdminControllers = { getUsers, updateUserRole, deleteUser, getAuditLogs, getDashboardStats };