import prisma from "../../config/db.js";
import AppError from "../../utils/AppError.js";
import { createAuditLog } from "../../utils/auditLog.js";

const createDepartment = async (payload: { name: string; code: string }) => {
  const existing = await prisma.department.findFirst({
    where: { OR: [{ name: payload.name }, { code: payload.code }] },
  });
  if (existing) throw new AppError(409, "Department with this name or code already exists");

  return prisma.department.create({ data: payload });
};

const getAllDepartments = async () => {
  return prisma.department.findMany({ where: { deletedAt: null } });
};

const getSingleDepartment = async (id: string) => {
  const department = await prisma.department.findFirst({ where: { id, deletedAt: null } });
  if (!department) throw new AppError(404, "Department not found");
  return department;
};

const updateDepartment = async (id: string, payload: { name?: string; code?: string }) => {
  await getSingleDepartment(id);
  return prisma.department.update({ where: { id }, data: payload });
};

const deleteDepartment = async (id: string, userId: string) => {
  await getSingleDepartment(id);
  const result = await prisma.department.update({ where: { id }, data: { deletedAt: new Date() } });
  await createAuditLog(userId, "SOFT_DELETE", "Department", id);
  return result;
};

export const DepartmentServices = {
  createDepartment, getAllDepartments, getSingleDepartment, updateDepartment, deleteDepartment,
};