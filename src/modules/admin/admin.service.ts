import prisma from "../../config/db.js";
import AppError from "../../utils/AppError.js";
import { createAuditLog } from "../../utils/auditLog.js";

const ROLES = ["STUDENT", "FACULTY", "ADMIN"] as const;

const paginate = (page?: string, limit?: string) => {
  const p = Math.max(Number(page) || 1, 1);
  const l = Math.min(Math.max(Number(limit) || 10, 1), 100);
  return { page: p, limit: l, skip: (p - 1) * l };
};

const getUsers = async (q: Record<string, string | undefined>) => {
  const { page, limit, skip } = paginate(q.page, q.limit);
  const where: any = { deletedAt: null };

  if (q.role && (ROLES as readonly string[]).includes(q.role)) where.role = q.role;
  if (q.search) {
    where.OR = [
      { name: { contains: q.search, mode: "insensitive" } },
      { email: { contains: q.search, mode: "insensitive" } },
    ];
  }

  const sortBy = ["createdAt", "name", "email"].includes(q.sortBy ?? "") ? q.sortBy! : "createdAt";
  const order = q.order === "asc" ? "asc" : "desc";

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
      select: { id: true, name: true, email: true, role: true, isVerified: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return { meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, data };
};

const updateUserRole = async (adminId: string, targetId: string, role: string) => {
  if (!(ROLES as readonly string[]).includes(role)) {
    throw new AppError(400, "Invalid role. Use STUDENT, FACULTY or ADMIN");
  }
  if (adminId === targetId) throw new AppError(400, "You cannot change your own role");

  const user = await prisma.user.findFirst({ where: { id: targetId, deletedAt: null } });
  if (!user) throw new AppError(404, "User not found");

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { role: role as any },
    select: { id: true, name: true, email: true, role: true },
  });

  await createAuditLog(adminId, "UPDATE_ROLE", "User", targetId);
  return updated;
};

const softDeleteUser = async (adminId: string, targetId: string) => {
  if (adminId === targetId) throw new AppError(400, "You cannot delete yourself");

  const user = await prisma.user.findFirst({ where: { id: targetId, deletedAt: null } });
  if (!user) throw new AppError(404, "User not found");

  await prisma.user.update({ where: { id: targetId }, data: { deletedAt: new Date() } });
  await createAuditLog(adminId, "DELETE_USER", "User", targetId);
};

const getAuditLogs = async (q: Record<string, string | undefined>) => {
  const { page, limit, skip } = paginate(q.page, q.limit);
  const where: any = {};
  if (q.action) where.action = q.action;
  if (q.userId) where.userId = q.userId;

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { meta: { page, limit, total, totalPages: Math.ceil(total / limit) }, data };
};

const getDashboardStats = async () => {
  const [students, faculty, admins, courses, offerings, enrollments, paid] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT", deletedAt: null } }),
    prisma.user.count({ where: { role: "FACULTY", deletedAt: null } }),
    prisma.user.count({ where: { role: "ADMIN", deletedAt: null } }),
    prisma.course.count({ where: { deletedAt: null } }),
    prisma.courseOffering.count({ where: { deletedAt: null } }),
    prisma.enrollment.count({ where: { deletedAt: null } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true }, _count: true }),
  ]);

  return {
    users: { students, faculty, admins },
    courses,
    offerings,
    enrollments,
    payments: { paidCount: paid._count, totalRevenue: paid._sum.amount ?? 0 },
  };
};

export const AdminServices = {
  getUsers,
  updateUserRole,
  softDeleteUser,
  getAuditLogs,
  getDashboardStats,
};