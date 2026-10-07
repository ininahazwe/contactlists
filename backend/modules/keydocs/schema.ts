import { z } from "zod";

export const keyDocStatusEnum = z.enum(["available", "outdated", "in_review", "missing"]);
export const membershipStatusEnum = z.enum([
  "active",
  "renewal_due",
  "lapsed",
  "not_applicable",
  "unknown",
]);
export const feePeriodEnum = z.enum(["annual", "multi_year", "one_time"]);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu: YYYY-MM-DD");
const year = z.coerce.number().int().min(1900).max(2100);

export const createKeyDocumentSchema = z.object({
  categoryId: z.coerce.number().int().positive(),
  title: z.string().min(1).max(255),
  status: keyDocStatusEnum.default("missing"),
  yearLabel: z.string().max(50).nullable().optional(),
  producedLabel: z.string().max(100).nullable().optional(),
  producedYear: year.nullable().optional(),
  reviewedOn: isoDate.nullable().optional(),
  reviewedYear: year.nullable().optional(),
  reviewLabel: z.string().max(150).nullable().optional(),
  nextReviewDue: isoDate.nullable().optional(),
  driveUrl: z.string().url().max(500).nullable().optional(),
  comment: z.string().max(5000).nullable().optional(),
  ownerStaffId: z.coerce.number().int().positive().nullable().optional(),
});
export const updateKeyDocumentSchema = createKeyDocumentSchema.partial();

const flag = z.enum(["1", "true"]).optional();

export const listKeyDocumentsQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  status: keyDocStatusEnum.optional(),
  noLink: flag, // documents déclarés existants mais sans lien
  overdue: flag, // date de revue dépassée
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(150),
});

export const createActionSchema = z.object({
  text: z.string().min(1).max(500),
  dueDate: isoDate.nullable().optional(),
});
export const updateActionSchema = z.object({
  text: z.string().min(1).max(500).optional(),
  done: z.boolean().optional(),
  dueDate: isoDate.nullable().optional(),
});

export const createMembershipSchema = z.object({
  institution: z.string().min(1).max(255),
  yearCommenced: year.nullable().optional(),
  lastRenewedYear: year.nullable().optional(),
  renewedLabel: z.string().max(100).nullable().optional(),
  status: membershipStatusEnum.default("unknown"),
  reportingCycle: z.string().max(100).nullable().optional(),
  renewalCycle: z.string().max(150).nullable().optional(),
  feeAmount: z.coerce.number().min(0).nullable().optional(),
  feeCurrency: z.string().max(10).optional(),
  feePeriod: feePeriodEnum.nullable().optional(),
  renewalDueOn: isoDate.nullable().optional(),
  lastReportOn: isoDate.nullable().optional(),
  organizationId: z.coerce.number().int().positive().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});
export const updateMembershipSchema = createMembershipSchema.partial();

export const listMembershipsQuerySchema = z.object({
  search: z.string().optional(),
  status: membershipStatusEnum.optional(),
});

export type CreateKeyDocumentInput = z.infer<typeof createKeyDocumentSchema>;
export type UpdateKeyDocumentInput = z.infer<typeof updateKeyDocumentSchema>;
export type ListKeyDocumentsQuery = z.infer<typeof listKeyDocumentsQuerySchema>;
export type CreateActionInput = z.infer<typeof createActionSchema>;
export type UpdateActionInput = z.infer<typeof updateActionSchema>;
export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;
export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>;
export type ListMembershipsQuery = z.infer<typeof listMembershipsQuerySchema>;
