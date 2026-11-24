import prisma from "../../config/db.js";
import AppError from "../../utils/AppError.js";
import { createAuditLog } from "../../utils/auditLog.js";

export const calculateGrade = (marks: number, total: number): string => {
  const pct = (marks / total) * 100;
  if (pct >= 80) return "A+";
  if (pct >= 70) return "A";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
};

const assertOwnsOffering = async (offeringId: string, user: { id: string; role: string }) => {
  const offering = await prisma.courseOffering.findFirst({ where: { id: offeringId, deletedAt: null } });
  if (!offering) throw new AppError(404, "Course offering not found");
  if (user.role === "FACULTY" && offering.facultyId !== user.id) {
    throw new AppError(403, "You can only manage exams for your own offerings");
  }
  return offering;
};

const createExam = async (
  user: { id: string; role: string },
  payload: { offeringId: string; type: string; totalMarks: number }
) => {
  const type = String(payload.type ?? "").toUpperCase();
  if (!["MIDTERM", "FINAL"].includes(type)) throw new AppError(400, "Exam type must be MIDTERM or FINAL");
  if (!Number.isInteger(payload.totalMarks) || payload.totalMarks < 1) {
    throw new AppError(400, "Total marks must be a positive integer");
  }
  await assertOwnsOffering(payload.offeringId, user);

  const existing = await prisma.exam.findFirst({ where: { offeringId: payload.offeringId, type } });
  if (existing) throw new AppError(409, `A ${type} exam already exists for this offering`);

  const exam = await prisma.exam.create({
    data: { offeringId: payload.offeringId, type, totalMarks: payload.totalMarks },
  });
  await createAuditLog(user.id, "CREATE_EXAM", "Exam", exam.id);
  return exam;
};

const getExamsByOffering = async (offeringId: string, user: { id: string; role: string }) => {
  await assertOwnsOffering(offeringId, user);
  return prisma.exam.findMany({ where: { offeringId }, orderBy: { type: "asc" } });
};

const upsertResult = async (
  user: { id: string; role: string },
  payload: { examId: string; enrollmentId: string; marksObtained: number }
) => {
  const exam = await prisma.exam.findUnique({ where: { id: payload.examId } });
  if (!exam) throw new AppError(404, "Exam not found");
  await assertOwnsOffering(exam.offeringId, user);

  if (typeof payload.marksObtained !== "number" || payload.marksObtained < 0 || payload.marksObtained > exam.totalMarks) {
    throw new AppError(400, `Marks must be between 0 and ${exam.totalMarks}`);
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { id: payload.enrollmentId, offeringId: exam.offeringId, deletedAt: null, status: "CONFIRMED" },
  });
  if (!enrollment) throw new AppError(404, "Confirmed enrollment not found for this offering");

  const grade = calculateGrade(payload.marksObtained, exam.totalMarks);
  const result = await prisma.result.upsert({
    where: { examId_enrollmentId: { examId: payload.examId, enrollmentId: payload.enrollmentId } },
    create: { examId: payload.examId, enrollmentId: payload.enrollmentId, marksObtained: payload.marksObtained, grade },
    update: { marksObtained: payload.marksObtained, grade },
  });
  await createAuditLog(user.id, "SAVE_RESULT", "Result", result.id);
  return result;
};

const getMyResults = async (studentId: string) => {
  return prisma.result.findMany({
    where: { enrollment: { studentId, deletedAt: null } },
    include: {
      exam: true,
      enrollment: { include: { offering: { include: { course: true, semester: true } } } },
    },
    orderBy: { id: "asc" },
  });
};

export const ResultServices = { createExam, getExamsByOffering, upsertResult, getMyResults };
