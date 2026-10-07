import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { canSee, moduleForPath } from "../modules";
import Avatar from "./Avatar";
import { IconLogout } from "./Icons";

/**
 * App shell. No navigation shared by every page: the brand goes back to the module grid
 * (home), and inside a module the top bar shows that module's own tabs (see modules.ts).
 */
export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const current = moduleForPath(location.pathname);
  const tabs = current ? current.tabs.filter((t) => canSee(t, user?.role)) : [];

  return (
    <div className="app">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="All modules" title="All modules">
          CP
        </NavLink>

        {current && (
          <>
            <Link to={current.landing} className="module-chip">
              <current.icon />
              <span>{current.label}</span>
            </Link>

            <nav className="nav" aria-label={`${current.label} sections`}>
              {tabs.map((t) => (
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
          </>
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
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
