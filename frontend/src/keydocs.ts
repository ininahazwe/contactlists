// Types et libellés du module Key Docs (documents institutionnels + adhésions).
// Reflètent les lignes SQL renvoyées par /api/keydocs (snake_case conservé).

export type KeyDocStatus = "available" | "outdated" | "in_review" | "missing";
export type MembershipStatus = "active" | "renewal_due" | "lapsed" | "not_applicable" | "unknown";
export type FeePeriod = "annual" | "multi_year" | "one_time";

export const KEY_DOC_STATUS_LABELS: Record<KeyDocStatus, string> = {
  available: "Available",
  in_review: "In review",
  outdated: "Outdated",
  missing: "Missing",
};

export const KEY_DOC_STATUS_BADGE: Record<KeyDocStatus, string> = {
  available: "badge badge--mint",
  in_review: "badge badge--teal",
  outdated: "badge badge--lime",
  missing: "badge badge--ink",
};

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "Active",
  renewal_due: "Renewal due",
  lapsed: "Lapsed",
  not_applicable: "N/A",
  unknown: "Unknown",
};

export const MEMBERSHIP_STATUS_BADGE: Record<MembershipStatus, string> = {
  active: "badge badge--mint",
  renewal_due: "badge badge--lime",
  lapsed: "badge badge--ink",
  not_applicable: "badge",
  unknown: "badge",
};

export const FEE_PERIOD_LABELS: Record<FeePeriod, string> = {
  annual: "per year",
  multi_year: "multi-year",
  one_time: "one-time",
};

export interface KeyDocCategory {
  id: number;
  name: string;
  sort_order: number;
  total: number;
}

export interface KeyDocument {
  id: number;
  category_id: number;
  category_name: string;
  title: string;
  status: KeyDocStatus;
  year_label: string | null;
  produced_label: string | null;
  produced_year: number | null;
  reviewed_on: string | null;
  reviewed_year: number | null;
  review_label: string | null;
  next_review_due: string | null;
  drive_url: string | null;
  comment: string | null;
  owner_staff_id: number | null;
  owner_name: string | null;
  open_actions: number;
}

export interface KeyDocAction {
  id: number;
  document_id: number;
  text: string;
  done: number;
  due_date: string | null;
}

export interface Membership {
  id: number;
  institution: string;
  year_commenced: number | null;
  last_renewed_year: number | null;
  renewed_label: string | null;
  status: MembershipStatus;
  reporting_cycle: string | null;
  renewal_cycle: string | null;
  fee_amount: string | null;
  fee_currency: string;
  fee_period: FeePeriod | null;
  renewal_due_on: string | null;
  last_report_on: string | null;
  notes: string | null;
}

export interface KeyDocsDashboard {
  documents: {
    total: number;
    byStatus: { status: KeyDocStatus; total: number }[];
    byCategory: { category: string; total: number; available: number }[];
    availableWithoutLink: { id: number; title: string; category: string }[];
    missing: { id: number; title: string; category: string }[];
    reviewOverdue: { id: number; title: string; next_review_due: string }[];
    stale: { id: number; title: string; category: string; last_year: number }[];
  };
  openActions: {
    id: number;
    document_id: number;
    document_title: string;
    text: string;
    due_date: string | null;
  }[];
  memberships: {
    total: number;
    byStatus: { status: MembershipStatus; total: number }[];
    needingAttention: {
      id: number;
      institution: string;
      status: MembershipStatus;
      renewal_cycle: string | null;
      renewal_due_on: string | null;
    }[];
    annualFeeTotal: number;
  };
}

/** Dernière revue d'un document, quel que soit le niveau de précision disponible. */
export function reviewText(d: Pick<KeyDocument, "reviewed_on" | "reviewed_year" | "review_label">): string {
  if (d.reviewed_on) return d.reviewed_on;
  if (d.reviewed_year) return String(d.reviewed_year);
  return d.review_label ?? "—";
}

/** "" -> null, pour envoyer un champ vidé comme NULL plutôt que comme chaîne vide. */
export function nullIfEmpty(value: string): string | null {
  const v = value.trim();
  return v === "" ? null : v;
}

export function numOrNull(value: string): number | null {
  const v = value.trim();
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
