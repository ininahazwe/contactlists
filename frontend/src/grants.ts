// Types et libellés du module Grants (bailleurs + projets/subventions financés).
// Reflètent les lignes SQL renvoyées par /api/grants (snake_case conservé).

export type GrantStatus = "ongoing" | "ended" | "unknown";

export const GRANT_STATUS_LABELS: Record<GrantStatus, string> = {
  ongoing: "Ongoing",
  ended: "Ended",
  unknown: "Unknown",
};

export const GRANT_STATUS_BADGE: Record<GrantStatus, string> = {
  ongoing: "badge badge--mint",
  ended: "badge badge--ink",
  unknown: "badge",
};

export interface Donor {
  id: number;
  name: string;
  notes: string | null;
  grant_total: number;
}

export interface Grant {
  id: number;
  donor_id: number;
  donor_name: string;
  grant_label: string | null;
  project_name: string | null;
  key_objectives: string | null;
  implemented_by: string | null;
  budget_amount: string | null;
  budget_currency: string | null;
  budget_label: string | null;
  start_label: string | null;
  start_date: string | null;
  start_year: number | null;
  end_label: string | null;
  end_date: string | null;
  end_year: number | null;
  reporting_cycle: string | null;
  status: GrantStatus;
  comment: string | null;
}

export interface GrantsFacets {
  totals: { donors: number; grants: number };
  byStatus: { status: GrantStatus; total: number }[];
  budgetByCurrency: { currency: string; total: number; ongoingTotal: number }[];
}

/** Nom affiché d'un projet/subvention : "Grant 2" seul si pas de titre de projet. */
export function grantTitle(g: Pick<Grant, "project_name" | "grant_label">): string {
  if (g.project_name) return g.project_name;
  if (g.grant_label) return g.grant_label;
  return "Untitled project";
}

/** Période affichée, au meilleur niveau de précision disponible. */
export function periodText(
  g: Pick<Grant, "start_date" | "start_label" | "start_year" | "end_date" | "end_label" | "end_year">
): string {
  const start = g.start_date ?? g.start_label ?? (g.start_year ? String(g.start_year) : null);
  const end = g.end_date ?? g.end_label ?? (g.end_year ? String(g.end_year) : null);
  if (start && end) return `${start} – ${end}`;
  if (start) return `Since ${start}`;
  if (end) return `Until ${end}`;
  return "—";
}

/** Budget affiché : montant + devise si connus, sinon le texte brut d'origine. */
export function budgetText(g: Pick<Grant, "budget_amount" | "budget_currency" | "budget_label">): string {
  if (g.budget_amount) {
    const amount = Number(g.budget_amount).toLocaleString("en-US");
    return g.budget_currency ? `${g.budget_currency} ${amount}` : amount;
  }
  return g.budget_label ?? "—";
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
