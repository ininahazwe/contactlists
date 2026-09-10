/**
 * The historical import left a "-" last name for people whose Excel row only
 * gave a single word: we don't display it.
 */
export function personName(first: string | null, last: string | null): string {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  const keepLast = l && !/^[-—–.]+$/.test(l);
  return [f, keepLast ? l : ""].filter(Boolean).join(" ") || "Unnamed";
}

export function initials(name: string): string {
  // Skip fragments with no letter or digit ("-", "—"...), otherwise
  // initials come out as "A-".
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => /[\p{L}\p{N}]/u.test(p));
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatYear(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr.slice(0, 4);
  return String(d.getFullYear());
}

/** "1,234" rather than "1234" — more readable for counters. */
export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatPerDiem(amount: string | null, currency: string | null): string | null {
  if (!amount) return null;
  const n = Number(amount);
  if (Number.isNaN(n) || n === 0) return null;
  return `${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${
    currency ?? ""
  }`.trim();
}

/** Stable avatar palette derived from the name: same person, same color. */
export function avatarTone(seed: string): "ink" | "teal" | "mint" | "" {
  const tones = ["", "teal", "mint", "ink"] as const;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return tones[h % tones.length];
}
