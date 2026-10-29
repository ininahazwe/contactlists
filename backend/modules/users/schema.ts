import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  name: z.string().trim().min(1).max(255).optional(),
  role: z.enum(["admin", "editor", "read_only"]).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    role: z.enum(["admin", "editor", "read_only"]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.role !== undefined || data.isActive !== undefined, {
    message: "Provide role and/or isActive",
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
