import { z } from "zod";

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    code: z.string().min(2, "Code must be at least 2 characters"),
  }),
});

export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    code: z.string().min(2).optional(),
  }),
});