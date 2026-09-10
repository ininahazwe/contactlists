import { z } from "zod";

export const contactCategoryEnum = z.enum([
  "personal",
  "diplomatic_corps",
  "media",
  "civil_society",
  "state_institution",
  "academia",
  "political_party",
  "stakeholder",
  "company",
  "other",
]);

export const contactGenderEnum = z.enum(["male", "female", "other"]);

export const createContactSchema = z.object({
  firstName: z.string().min(1).max(150),
  lastName: z.string().min(1).max(150),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  gender: contactGenderEnum.optional(),
  country: z.string().max(100).optional(),
  category: contactCategoryEnum.optional(),
  facebook: z.string().max(255).optional(),
  twitter: z.string().max(255).optional(),
  organizationId: z.number().int().positive().optional(),
  roleTitle: z.string().max(150).optional(),
  notes: z.string().optional(),
});

export const updateContactSchema = createContactSchema.partial().extend({
  status: z.enum(["active", "archived"]).optional(),
});

export const listContactsQuerySchema = z.object({
  search: z.string().optional(),
  organizationId: z.coerce.number().int().positive().optional(),
  category: contactCategoryEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const importContactsSchema = z.object({
  organizationId: z.coerce.number().int().positive().optional(),
  eventId: z.coerce.number().int().positive().optional(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;
export type ImportContactsInput = z.infer<typeof importContactsSchema>;
