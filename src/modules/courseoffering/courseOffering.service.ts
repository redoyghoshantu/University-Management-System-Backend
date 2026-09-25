import prisma from "../../config/db.js";
import AppError from "../../utils/AppError.js";
import { createAuditLog } from "../../utils/auditLog.js";

const createOffering = async (payload: {
  courseId: string; semesterId: string; facultyId: string; capacity?: number;
}) => {
  const course = await prisma.course.findFirst({ where: { id: payload.courseId, deletedAt: null } });
  if (!course) throw new AppError(404, "Course not found");

  const semester = await prisma.semester.findFirst({ where: { id: payload.semesterId, deletedAt: null } });
  if (!semester) throw new AppError(404, "Semester not found");

  const faculty = await prisma.user.findFirst({ where: { id: payload.facultyId, deletedAt: null } });
  if (!faculty) throw new AppError(404, "Faculty user not found");
  if (faculty.role !== "FACULTY") throw new AppError(400, "Assigned user must have the FACULTY role");

  const existing = await prisma.courseOffering.findFirst({
    where: { courseId: payload.courseId, semesterId: payload.semesterId, facultyId: payload.facultyId },
  });
  if (existing) throw new AppError(409, "This exact course-semester-faculty offering already exists");

  return prisma.courseOffering.create({
    data: {
      courseId: payload.courseId,
      semesterId: payload.semesterId,
      facultyId: payload.facultyId,
      capacity: payload.capacity ?? 40,
    },
  });
};

const getAllOfferings = async (query: { semesterId?: string; facultyId?: string; page?: string; limit?: string }) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const where: any = { deletedAt: null };
  if (query.semesterId) where.semesterId = query.semesterId;
  if (query.facultyId) where.facultyId = query.facultyId;

  const [offerings, total] = await Promise.all([
    prisma.courseOffering.findMany({
      where, skip, take: limit,
      include: {
        course: { select: { title: true, code: true, credits: true } },
        semester: { select: { name: true } },
        faculty: { select: { name: true, email: true } },
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.courseOffering.count({ where }),
  ]);

  return { meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, data: offerings };
};

const getSingleOffering = async (id: string) => {
  const offering = await prisma.courseOffering.findFirst({
    where: { id, deletedAt: null },
    include: { course: true, semester: true, faculty: { select: { name: true, email: true } } },
  });
  if (!offering) throw new AppError(404, "Course offering not found");
  return offering;
};

const updateOffering = async (id: string, payload: { facultyId?: string; capacity?: number }) => {
  await getSingleOffering(id);

  if (payload.facultyId) {
    const faculty = await prisma.user.findFirst({ where: { id: payload.facultyId, deletedAt: null } });
    if (!faculty || faculty.role !== "FACULTY") throw new AppError(400, "Invalid faculty user");
  }

  return prisma.courseOffering.update({ where: { id }, data: payload });
};

const deleteOffering = async (id: string, userId: string) => {
  await getSingleOffering(id);
  const result = await prisma.courseOffering.update({ where: { id }, data: { deletedAt: new Date() } });
  await createAuditLog(userId, "SOFT_DELETE", "CourseOffering", id);
  return result;
};

// Bonus: "my-offerings" for a logged-in faculty member
const getMyOfferings = async (facultyId: string) => {
  return prisma.courseOffering.findMany({
    where: { facultyId, deletedAt: null },
    include: { course: true, semester: true, _count: { select: { enrollments: true } } },
  });
};

export const CourseOfferingServices = {
  createOffering, getAllOfferings, getSingleOffering, updateOffering, deleteOffering, getMyOfferings,
};