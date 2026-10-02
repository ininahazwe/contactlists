import { z } from "zod";

export const staffEmploymentTypeEnum = z.enum(["full_time", "part_time", "contract", "intern"]);
export const staffStatusEnum = z.enum(["active", "former"]);
export const engagementTypeEnum = z.enum(["training", "meeting", "conference", "travel"]);

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu: YYYY-MM-DD");

export const createStaffSchema = z.object({
  fullName: z.string().min(1).max(255),
  jobTitle: z.string().max(255).optional(),
  // Reste optionnel : non déductible de façon fiable depuis l'import historique,
  // curé manuellement -- voir le fichier MIGRATION_NOTES livré avec ce module.
  department: z.string().max(100).optional(),
  employmentType: staffEmploymentTypeEnum,
  nationality: z.string().max(100).optional(),
  yearJoined: z.coerce.number().int().min(1950).max(2100).optional(),
  recruitedAs: z.string().max(255).optional(),
  status: staffStatusEnum.default("active"),
  exitDate: isoDate.optional(),
  cvUpdated: z.boolean().optional(),
  employeeInfoSheet: z.boolean().optional(),
});

export const updateStaffSchema = createStaffSchema.partial();

export const listStaffQuerySchema = z.object({
  search: z.string().optional(),
  status: staffStatusEnum.optional(),
  employmentType: staffEmploymentTypeEnum.optional(),
  department: z.string().optional(),
  country: z.string().optional(),
  yearJoinedFrom: z.coerce.number().int().min(1950).max(2100).optional(),
  yearJoinedTo: z.coerce.number().int().min(1950).max(2100).optional(),
  engagementType: engagementTypeEnum.optional(),
  engagementCountry: z.string().optional(),
  engagementYear: z.coerce.number().int().min(1950).max(2100).optional(),
  sort: z.enum(["name", "recent"]).default("name"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

// Un engagement (voyage/réunion/formation/conférence) ajouté à la main après l'import --
// voir modules/staff/import.ts pour l'import initial en masse depuis "Staff engages 2026".
export const createEngagementSchema = z.object({
  engagementType: engagementTypeEnum,
  country: z.string().max(100).optional(),
  place: z.string().max(255).optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  dateText: z.string().max(100).optional(),
  purpose: z.string().max(2000).optional(),
  roleInEngagement: z.string().max(100).optional(),
});


// staff_welfare : table séparée de staff_sensitive.welfare_notes (voir
// sql/005_add_staff_welfare_and_engagement_mutability.sql) -- entrées structurées (nom,
// date, montant) ajoutées au fil de l'eau, plutôt que le récit en texte libre importé.
export const createWelfareSchema = z.object({
  eventName: z.string().min(1).max(255),
  eventDate: isoDate.optional(),
  amount: z.coerce.number().min(0).optional(),
  currency: z.string().max(10).optional(),
  notes: z.string().max(500).optional(),
});


// Fiche staff_sensitive : table séparée, route et permission dédiées (voir routes.ts).
export const updateStaffSensitiveSchema = z.object({
  emergencyContactName: z.string().max(255).optional(),
  emergencyContactPhone: z.string().max(50).optional(),
  welfareNotes: z.string().max(5000).optional(),
  exitTermsNotes: z.string().max(2000).optional(),
  exitInterviewUrl: z.string().url().max(500).optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type ListStaffQuery = z.infer<typeof listStaffQuerySchema>;
export type UpdateStaffSensitiveInput = z.infer<typeof updateStaffSensitiveSchema>;
export type CreateEngagementInput = z.infer<typeof createEngagementSchema>;
export type CreateWelfareInput = z.infer<typeof createWelfareSchema>;
