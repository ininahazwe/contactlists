import { z } from "zod";
import { contactCategoryEnum, contactGenderEnum } from "../contacts/schema";

export const searchKindEnum = z.enum(["contact", "organization", "event"]);

/**
 * Advanced search. Everything is optional: with no criteria at all the
 * endpoint behaves like a browse of the whole directory, which is what
 * the UI shows before the user types anything.
 */
export const searchQuerySchema = z.object({
  q: z.string().trim().optional(),
  /** Comma-separated list, e.g. "contact,event". Defaults to all three. */
  kinds: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return ["contact", "organization", "event"] as const;
      const parsed = val
        .split(",")
        .map((s) => s.trim())
        .filter((s) => searchKindEnum.safeParse(s).success);
      return (parsed.length ? parsed : ["contact", "organization", "event"]) as ReadonlyArray<
        "contact" | "organization" | "event"
      >;
    }),
  category: contactCategoryEnum.optional(),
  country: z.string().trim().min(1).optional(),
  gender: contactGenderEnum.optional(),
  year: z.coerce.number().int().min(1900).max(2200).optional(),
  organizationId: z.coerce.number().int().positive().optional(),
  eventType: z.enum(["event", "training", "other"]).optional(),
  sort: z.enum(["name", "recent"]).default("name"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
