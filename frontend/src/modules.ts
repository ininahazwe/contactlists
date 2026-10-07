import type { ComponentType, SVGProps } from "react";
import {
  IconBuilding,
  IconGrid,
  IconList,
  IconLock,
  IconTimeline,
  IconUser,
  IconUsers,
} from "./components/Icons";
import type { UserRole } from "./types";

// Les modules de la plateforme. Source unique pour la page d'accueil (cartes) et pour la
// barre du haut (onglets du module en cours) : ajouter un module = ajouter une entrée ici,
// puis ses routes dans App.tsx.

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

export interface ModuleTab {
  to: string;
  label: string;
  icon: IconType;
  /** true = actif seulement sur ce chemin exact (sinon aussi sur ses sous-chemins). */
  end?: boolean;
  /** Rôles autorisés à voir cet onglet (tous si omis). */
  roles?: UserRole[];
}

export interface ModuleDef {
  id: "contacts" | "staff" | "keydocs" | "admin";
  label: string;
  description: string;
  icon: IconType;
  /** Couleur de fond du pictogramme sur la carte d'accueil. */
  accent: string;
  /** Page d'entrée du module. */
  landing: string;
  /** Rôles autorisés à voir le module (tous si omis). */
  roles?: UserRole[];
  tabs: ModuleTab[];
  /** Préfixes de chemin qui appartiennent à ce module. */
  prefixes: string[];
}

export const MODULES: ModuleDef[] = [
  {
    id: "contacts",
    label: "Contacts",
    description: "Directory of contacts, organizations and events, with search by country, category and year.",
    icon: IconUser,
    accent: "var(--mint)",
    landing: "/contacts",
    tabs: [
      { to: "/contacts", label: "Directory", icon: IconGrid, end: true },
      { to: "/organizations", label: "Organizations", icon: IconBuilding },
    ],
    prefixes: ["/contacts", "/organizations", "/events"],
  },
  {
    id: "staff",
    label: "Staff",
    description: "MFWA staff, career history, trainings and travel, job titles and HR dashboards.",
    icon: IconUsers,
    accent: "var(--teal-2)",
    landing: "/staff",
    roles: ["admin", "editor"],
    tabs: [
      { to: "/staff", label: "Directory", icon: IconUsers, end: true },
      { to: "/staff/dashboard", label: "Dashboard", icon: IconTimeline },
      { to: "/staff/job-titles", label: "Job Titles", icon: IconList, roles: ["admin"] },
    ],
    prefixes: ["/staff"],
  },
  {
    id: "keydocs",
    label: "Key Docs",
    description: "Institutional documents, memberships and renewals, and what is missing for compliance.",
    icon: IconList,
    accent: "var(--lime)",
    landing: "/keydocs",
    roles: ["admin", "editor"],
    tabs: [
      { to: "/keydocs", label: "Documents", icon: IconList, end: true },
      { to: "/keydocs/memberships", label: "Memberships", icon: IconBuilding },
      { to: "/keydocs/dashboard", label: "Compliance", icon: IconTimeline },
    ],
    prefixes: ["/keydocs"],
  },
  {
    // Séparé des autres modules : montré à part sur l'accueil, réservé aux admins.
    id: "admin",
    label: "Administration",
    description: "User access and the activity log.",
    icon: IconLock,
    accent: "var(--soft-2)",
    landing: "/admin/users",
    roles: ["admin"],
    tabs: [
      { to: "/admin/users", label: "Users", icon: IconUsers },
      { to: "/admin/activity", label: "Activity", icon: IconTimeline },
    ],
    prefixes: ["/admin"],
  },
];

export function canSee(item: { roles?: UserRole[] }, role: UserRole | undefined): boolean {
  if (!item.roles) return true;
  return !!role && item.roles.includes(role);
}

/** Module auquel appartient un chemin (null sur l'accueil et les pages hors module). */
export function moduleForPath(pathname: string): ModuleDef | null {
  return (
    MODULES.find((m) =>
      m.prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
    ) ?? null
  );
}
