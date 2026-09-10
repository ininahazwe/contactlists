import { ReactNode, useEffect } from "react";
import { IconClose } from "./Icons";

interface Props {
  onClose: () => void;
  children: ReactNode;
  /** Label read by screen readers. */
  label: string;
}

/**
 * Modal shell: blurred backdrop, closes on Escape or an outside click,
 * page scroll locked while open.
 */
export default function Modal({ onClose, children, label }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">{children}</div>
    </div>
  );
}

/** Header shared by the three detail views, with a close button. */
export function ModalHead({
  eyebrow,
  title,
  sub,
  badges,
  avatar,
  onClose,
  extra,
}: {
  eyebrow: string;
  title: string;
  sub?: ReactNode;
  badges?: ReactNode;
  avatar?: ReactNode;
  onClose: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="modal-head">
      {avatar}
      <div className="modal-head-main">
        <div className="modal-eyebrow">{eyebrow}</div>
        <h2 className="modal-title">{title}</h2>
        {sub && <p className="modal-sub">{sub}</p>}
        {badges && <div className="modal-badges">{badges}</div>}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flex: "none" }}>
        {extra}
        <button className="icon-btn icon-btn--soft" onClick={onClose} aria-label="Close">
          <IconClose />
        </button>
      </div>
    </div>
  );
}
