import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Avatar from "./Avatar";
import {
  IconBuilding,
  IconCalendar,
  IconGrid,
  IconHome,
  IconLogout,
  IconPlus,
  IconTimeline,
  IconUsers,
} from "./Icons";

const TABS = [
  { to: "/", label: "Directory", icon: IconGrid, end: true },
  { to: "/organizations", label: "Organizations", icon: IconBuilding, end: false },
];

// Only shown to admins. The screen itself is guarded, and so is the API
// behind it: hiding the tab just keeps the nav honest about what a given
// person can actually open.
// "Users" is deliberately kept out of this list: as in the mockup, where
// team access ("Add Manager") sits apart from the Dashboard/Payments/Reports
// tabs, user management here is its own pill button rather than another tab
// â€” see the standalone NavLink rendered after .nav below.
const ADMIN_TABS = [{ to: "/admin/activity", label: "Activity", icon: IconTimeline, end: false }];

/**
 * App shell: top bar (brand, tabs, profile) and left icon rail, as in
 * the mockup. The rail provides creation shortcuts; it disappears under
 * 900px, where the tabs are enough.
 */
export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isNew = (path: string) => location.pathname === path;

  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="Home">
          CP
        </NavLink>

        <nav className="nav">
          {[...TABS, ...(user?.role === "admin" ? ADMIN_TABS : [])].map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) => `tab${isActive ? " is-active" : ""}`}
            >
              <t.icon />
              <span>{t.label}</span>
            </NavLink>
          ))}
        </nav>

        {user?.role === "admin" && (
          <NavLink to="/admin/users" className="btn" title="Manage users" style={{ marginLeft: "auto" }}>
            <IconUsers />
            <span>Users</span>
          </NavLink>
        )}

        <div className="topbar-right">
          {user && (
            <>
              <span className="who">
                <strong>{user.name}</strong>
                <span>{user.role}</span>
              </span>
              <Avatar name={user.name} size="md" tone="ink" />
              <button
                className="icon-btn icon-btn--white"
                onClick={() => logout()}
                aria-label="Sign out"
                title="Sign out"
              >
                <IconLogout />
              </button>
            </>
          )}
        </div>
      </header>

      <div className="app-body">
        <aside className="rail">
          <button
            className={`rail-btn${location.pathname === "/" ? " is-active" : ""}`}
            onClick={() => navigate("/")}
            aria-label="Directory"
            title="Directory"
          >
            <IconHome />
          </button>
          <button
            className="rail-btn"
            onClick={() => navigate("/?kinds=contact")}
            aria-label="Contacts"
            title="Contacts"
          >
            <IconUsers />
          </button>
          <button
            className="rail-btn"
            onClick={() => navigate("/?kinds=event")}
            aria-label="Events"
            title="Events"
          >
            <IconCalendar />
          </button>
          <button
            className={`rail-btn${location.pathname === "/organizations" ? " is-active" : ""}`}
            onClick={() => navigate("/organizations")}
            aria-label="Organizations"
            title="Organizations"
          >
            <IconBuilding />
          </button>
          <button
            className="rail-btn"
            onClick={() => navigate("/?sort=recent")}
            aria-label="Recent additions"
            title="Recent additions"
          >
            <IconTimeline />
          </button>

          <span className="rail-sep" />

          <button
            className={`rail-btn${isNew("/contacts/new") ? " is-active" : ""}`}
            onClick={() => navigate("/contacts/new")}
            aria-label="New contact"
            title="New contact"
          >
            <IconPlus />
          </button>
        </aside>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
