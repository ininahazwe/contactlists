import { z } from "zod";

export const grantStatusEnum = z.enum(["ongoing", "ended", "unknown"]);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected format: YYYY-MM-DD");
const year = z.coerce.number().int().min(1900).max(2100);

export const createDonorSchema = z.object({
  name: z.string().min(1).max(255),
  notes: z.string().max(5000).nullable().optional(),
});
export const updateDonorSchema = createDonorSchema.partial();

export const createGrantSchema = z.object({
  donorId: z.coerce.number().int().positive(),
  grantLabel: z.string().max(150).nullable().optional(),
  projectName: z.string().max(255).nullable().optional(),
  keyObjectives: z.string().max(5000).nullable().optional(),
  implementedBy: z.string().max(150).nullable().optional(),
  budgetAmount: z.coerce.number().min(0).nullable().optional(),
  budgetCurrency: z.string().max(10).nullable().optional(),
  budgetLabel: z.string().max(100).nullable().optional(),
  startLabel: z.string().max(100).nullable().optional(),
  startDate: isoDate.nullable().optional(),
  startYear: year.nullable().optional(),
  endLabel: z.string().max(100).nullable().optional(),
  endDate: isoDate.nullable().optional(),
  endYear: year.nullable().optional(),
  reportingCycle: z.string().max(150).nullable().optional(),
  status: grantStatusEnum.default("unknown"),
  comment: z.string().max(5000).nullable().optional(),
});
export const updateGrantSchema = createGrantSchema.partial();

export const listGrantsQuerySchema = z.object({
  search: z.string().optional(),
  donorId: z.coerce.number().int().positive().optional(),
  status: grantStatusEnum.optional(),
});

export type CreateDonorInput = z.infer<typeof createDonorSchema>;
export type UpdateDonorInput = z.infer<typeof updateDonorSchema>;
export type CreateGrantInput = z.infer<typeof createGrantSchema>;
export type UpdateGrantInput = z.infer<typeof updateGrantSchema>;
export type ListGrantsQuery = z.infer<typeof listGrantsQuerySchema>;
