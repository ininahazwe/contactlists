import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  notes: z.string().optional(),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
