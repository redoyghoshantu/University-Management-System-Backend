import { z } from "zod";

export const createOfferingSchema = z.object({
  body: z.object({
    courseId: z.string().uuid("Invalid course ID"),
    semesterId: z.string().uuid("Invalid semester ID"),
    facultyId: z.string().uuid("Invalid faculty ID"),
    capacity: z.number().int().min(1).optional(),
  }),
});

export const updateOfferingSchema = z.object({
  body: z.object({
    facultyId: z.string().uuid().optional(),
    capacity: z.number().int().min(1).optional(),
  }),
});