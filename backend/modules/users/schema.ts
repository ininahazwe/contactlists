import { z } from "zod";

export const updateUserSchema = z
  .object({
    role: z.enum(["admin", "editor", "read_only"]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.role !== undefined || data.isActive !== undefined, {
    message: "Provide role and/or isActive",
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
