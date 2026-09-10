import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export type DetailKind = "contact" | "organization" | "event";

export interface DetailTarget {
  kind: DetailKind;
  id: number;
}

const KINDS: DetailKind[] = ["contact", "organization", "event"];

/**
 * The open detail view is carried by the URL (?contact=42, ?event=7...).
 * Intended consequences: each view is shareable by link, the browser's
 * Back button closes the modal or returns to the previous view, and
 * reloading the page reopens the same view.
 * Only one view at a time: opening one clears the other keys.
 */
export function useDetail() {
  const [params, setParams] = useSearchParams();

  let target: DetailTarget | null = null;
  for (const kind of KINDS) {
    const raw = params.get(kind);
    if (raw && Number.isFinite(Number(raw))) {
      target = { kind, id: Number(raw) };
      break;
    }
  }

  const open = useCallback(
    (kind: DetailKind, id: number) => {
      const next = new URLSearchParams(params);
      KINDS.forEach((k) => next.delete(k));
      next.set(kind, String(id));
      setParams(next);
    },
    [params, setParams]
  );

  const close = useCallback(() => {
    const next = new URLSearchParams(params);
    KINDS.forEach((k) => next.delete(k));
    setParams(next);
  }, [params, setParams]);

  return {
    target,
    open,
    close,
    openContact: useCallback((id: number) => open("contact", id), [open]),
    openOrganization: useCallback((id: number) => open("organization", id), [open]),
    openEvent: useCallback((id: number) => open("event", id), [open]),
  };
}
