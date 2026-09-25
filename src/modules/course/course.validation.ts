import { z } from "zod";

export const createCourseSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    code: z.string().min(2),
    credits: z.number().int().min(1).max(6),
    departmentId: z.string().uuid("Invalid department ID"),
  }),
});

export const updateCourseSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    credits: z.number().int().min(1).max(6).optional(),
  }),
});