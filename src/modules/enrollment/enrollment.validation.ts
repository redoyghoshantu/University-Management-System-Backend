import { z } from "zod";

export const createEnrollmentSchema = z.object({
  body: z.object({
    offeringId: z.string().uuid("Invalid course offering ID"),
  }),
});