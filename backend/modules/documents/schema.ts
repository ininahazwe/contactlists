import { z } from "zod";

export const requestUploadSchema = z
  .object({
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(1).max(150),
    sizeBytes: z.number().int().positive().max(200 * 1024 * 1024), // 200MB cap
    eventId: z.number().int().positive().optional(),
    contactId: z.number().int().positive().optional(),
    organizationId: z.number().int().positive().optional(),
  })
  .refine((v) => v.eventId || v.contactId || v.organizationId, {
    message: "One of eventId, contactId or organizationId is required",
  });

export const confirmUploadSchema = z.object({
  storageKey: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(150),
  sizeBytes: z.number().int().positive(),
  eventId: z.number().int().positive().optional(),
  contactId: z.number().int().positive().optional(),
  organizationId: z.number().int().positive().optional(),
});

export type RequestUploadInput = z.infer<typeof requestUploadSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
