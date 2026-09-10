import { z } from "zod";

export const createCaseSchema = z.object({
  title: z.string().min(1).max(255),
  reference: z.string().max(100).optional(),
  description: z.string().optional(),
});

export const updateCaseSchema = createCaseSchema.partial().extend({
  status: z.enum(["open", "on_hold", "closed"]).optional(),
});

export const addMemberSchema = z.object({
  userId: z.number().int().positive(),
});

export const addContactSchema = z.object({
  contactId: z.number().int().positive(),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
