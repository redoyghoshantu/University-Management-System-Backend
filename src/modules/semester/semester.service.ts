import prisma from "../../config/db.js";
import AppError from "../../utils/AppError.js";
import { createAuditLog } from "../../utils/auditLog.js";

const createSemester = async (payload: { name: string; startDate: string; endDate: string }) => {
  const existing = await prisma.semester.findFirst({ where: { name: payload.name } });
  if (existing) throw new AppError(409, "Semester with this name already exists");

  if (new Date(payload.startDate) >= new Date(payload.endDate)) {
    throw new AppError(400, "Start date must be before end date");
  }

  return prisma.semester.create({
    data: {
      name: payload.name,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
    },
  });
};

const getAllSemesters = async () => {
  return prisma.semester.findMany({ where: { deletedAt: null }, orderBy: { startDate: "desc" } });
};

const getSingleSemester = async (id: string) => {
  const semester = await prisma.semester.findFirst({ where: { id, deletedAt: null } });
  if (!semester) throw new AppError(404, "Semester not found");
  return semester;
};

const updateSemester = async (
  id: string,
  payload: { name?: string; startDate?: string; endDate?: string; isActive?: boolean }
) => {
  await getSingleSemester(id);
  const data: any = { ...payload };
  if (payload.startDate) data.startDate = new Date(payload.startDate);
  if (payload.endDate) data.endDate = new Date(payload.endDate);
  return prisma.semester.update({ where: { id }, data });
};

const deleteSemester = async (id: string, userId: string) => {
  await getSingleSemester(id);
  const result = await prisma.semester.update({ where: { id }, data: { deletedAt: new Date() } });
  await createAuditLog(userId, "SOFT_DELETE", "Semester", id);
  return result;
};

export const SemesterServices = {
  createSemester, getAllSemesters, getSingleSemester, updateSemester, deleteSemester,
};