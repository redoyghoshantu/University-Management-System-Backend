import prisma from "../../config/db.js";
import AppError from "../../utils/AppError.js";

const createEnrollment = async (studentId: string, offeringId: string) => {
  return prisma.$transaction(async (tx) => {
    const offering = await tx.courseOffering.findFirst({
      where: { id: offeringId, deletedAt: null },
    });
    if (!offering) throw new AppError(404, "Course offering not found");

    const currentCount = await tx.enrollment.count({
      where: { offeringId, status: { in: ["PENDING", "CONFIRMED"] } },
    });
    if (currentCount >= offering.capacity) {
      throw new AppError(400, "This course offering is full");
    }

    const existing = await tx.enrollment.findUnique({
      where: { studentId_offeringId: { studentId, offeringId } },
    });
    if (existing) throw new AppError(409, "You are already enrolled in this course offering");

    return tx.enrollment.create({
      data: { studentId, offeringId, status: "PENDING", paymentStatus: "PENDING" },
    });
  });
};

const getMyEnrollments = async (studentId: string) => {
  return prisma.enrollment.findMany({
    where: { studentId, deletedAt: null },
    include: {
      offering: {
        include: { course: true, semester: true, faculty: { select: { name: true } } },
      },
    },
  });
};

const getSingleEnrollment = async (id: string) => {
  const enrollment = await prisma.enrollment.findFirst({
    where: { id, deletedAt: null },
    include: { offering: { include: { course: true, semester: true } }, student: { select: { name: true, email: true } } },
  });
  if (!enrollment) throw new AppError(404, "Enrollment not found");
  return enrollment;
};

const cancelEnrollment = async (id: string, studentId: string) => {
  const enrollment = await prisma.enrollment.findFirst({ where: { id, studentId, deletedAt: null } });
  if (!enrollment) throw new AppError(404, "Enrollment not found");
  if (enrollment.paymentStatus === "PAID") {
    throw new AppError(400, "Cannot cancel a paid enrollment");
  }
  return prisma.enrollment.update({ where: { id }, data: { status: "CANCELLED" } });
};

export const EnrollmentServices = {
  createEnrollment, getMyEnrollments, getSingleEnrollment, cancelEnrollment,
};