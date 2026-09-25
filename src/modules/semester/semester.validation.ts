import { z } from "zod";

export const createSemesterSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Name must be at least 3 characters"), // e.g. "Fall 2026"
    startDate: z.string().datetime("Invalid start date"),
    endDate: z.string().datetime("Invalid end date"),
  }),
});

export const updateSemesterSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
  }),
});