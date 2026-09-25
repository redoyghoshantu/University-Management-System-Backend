import prisma from "../../config/db.js";
import AppError from "../../utils/AppError.js";
import { createAuditLog } from "../../utils/auditLog.js";

const createCourse = async (payload: {
  title: string; code: string; credits: number; departmentId: string;
}) => {
  const department = await prisma.department.findFirst({
    where: { id: payload.departmentId, deletedAt: null },
  });
  if (!department) throw new AppError(404, "Department not found");

  const existing = await prisma.course.findUnique({ where: { code: payload.code } });
  if (existing) throw new AppError(409, "Course code already exists");

  return prisma.course.create({ data: payload });
};

const getAllCourses = async (query: {
  page?: string; limit?: string; search?: string; departmentId?: string;
}) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { code: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.departmentId) where.departmentId = query.departmentId;

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where, skip, take: limit,
      include: { department: { select: { name: true, code: true } } },
      orderBy: { title: "asc" },
    }),
    prisma.course.count({ where }),
  ]);

  return { meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, data: courses };
};

const getSingleCourse = async (id: string) => {
  const course = await prisma.course.findFirst({
    where: { id, deletedAt: null },
    include: { department: true },
  });
  if (!course) throw new AppError(404, "Course not found");
  return course;
};

const updateCourse = async (id: string, payload: { title?: string; credits?: number }) => {
  await getSingleCourse(id);
  return prisma.course.update({ where: { id }, data: payload });
};

const deleteCourse = async (id: string, userId: string) => {
  await getSingleCourse(id);
  const result = await prisma.course.update({ where: { id }, data: { deletedAt: new Date() } });
  await createAuditLog(userId, "SOFT_DELETE", "Course", id);
  return result;
};

export const CourseServices = { createCourse, getAllCourses, getSingleCourse, updateCourse, deleteCourse };