import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1).max(255),
  eventType: z.enum(["event", "training", "other"]).default("event"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu: YYYY-MM-DD"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu: YYYY-MM-DD")
    .optional(),
  location: z.string().max(255).optional(),
  description: z.string().optional(),
  organizationIds: z.array(z.number().int().positive()).optional(),
});

export const updateEventSchema = createEventSchema.partial().omit({ organizationIds: true });

export const listEventsQuerySchema = z.object({
  search: z.string().optional(),
  year: z.coerce.number().int().min(1900).max(2200).optional(),
  organizationId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const addEventContactSchema = z.object({
  contactId: z.number().int().positive(),
  role: z.string().max(150).optional(),
  perDiem: z.number().nonnegative().optional(),
  currency: z.string().max(10).optional(),
  notes: z.string().optional(),
});

export const addEventOrganizationSchema = z.object({
  organizationId: z.number().int().positive(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
export type AddEventContactInput = z.infer<typeof addEventContactSchema>;
