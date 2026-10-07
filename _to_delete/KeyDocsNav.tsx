import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/keydocs", label: "Documents", end: true },
  { to: "/keydocs/memberships", label: "Memberships", end: false },
  { to: "/keydocs/dashboard", label: "Compliance", end: false },
];

/** Sous-navigation commune aux trois écrans du module Key Docs. */
export default function KeyDocsNav() {
  return (
    <div className="seg" style={{ marginBottom: 18, marginTop: 18, alignSelf: "flex-start" }}>
      {LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) => `seg-btn${isActive ? " is-active" : ""}`}
        >
          {l.label}
        </NavLink>
      ))}
    </div>
  );
}
