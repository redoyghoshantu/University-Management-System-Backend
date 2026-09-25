import prisma from "../config/db.js";

export const createAuditLog = async (
  userId: string,
  action: string,
  entityType: string,
  entityId: string
) => {
  await prisma.auditLog.create({
    data: { userId, action, entityType, entityId },
  });
};