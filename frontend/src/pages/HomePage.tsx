import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { IconArrowUpRight } from "../components/Icons";
import { canSee, MODULES, ModuleDef } from "../modules";
import { formatCount } from "../utils/format";

type Stats = Partial<Record<ModuleDef["id"], string>>;

export default function HomePage() {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState<Stats>({});

  const role = user?.role;
  const modules = MODULES.filter((m) => m.id !== "admin" && canSee(m, role));
  const adminModule = MODULES.find((m) => m.id === "admin");
  const showAdmin = !!adminModule && canSee(adminModule, role);

  // Une ligne de chiffres par carte. Un échec reste silencieux : la carte s'affiche sans.
  useEffect(() => {
    if (!role) return;
    let alive = true;
    const put = (id: ModuleDef["id"], text: string) => alive && setStats((s) => ({ ...s, [id]: text }));

    api
      .get<{ totals: { contacts: number; organizations: number } }>("/search/facets")
      .then((f) =>
        put(
          "contacts",
          `${formatCount(f.totals.contacts)} contacts · ${formatCount(f.totals.organizations)} organizations`
        )
      )
      .catch(() => undefined);

    if (role === "admin" || role === "editor") {
      api
        .get<{ totals: { active: number; total: number } }>("/staff/facets")
        .then((f) => put("staff", `${formatCount(f.totals.active)} active staff`))
        .catch(() => undefined);
      api
        .get<{ documents: { total: number; byStatus: { status: string; total: number }[] } }>(
          "/keydocs/dashboard"
        )
        .then((d) => {
          const available = d.documents.byStatus.find((s) => s.status === "available")?.total ?? 0;
          put("keydocs", `${available} of ${d.documents.total} documents on file`);
        })
        .catch(() => undefined);
    }
    return () => {
      alive = false;
    };
  }, [role]);

  // Anciens liens (/?contact=42, /?q=…) : le répertoire a déménagé sous /contacts.
  if (location.search) {
    return <Navigate to={`/contacts${location.search}`} replace />;
  }

  const firstName = user?.name.split(" ")[0] ?? "";

  function Card({ m }: { m: ModuleDef }) {
    return (
      <Link to={m.landing} className="module-card">
        <span className="module-card-icon" style={{ background: m.accent }}>
          <m.icon />
        </span>
        <span className="module-card-body">
          <span className="module-card-name">{m.label}</span>
          <span className="module-card-desc">{m.description}</span>
        </span>
        <span className="module-card-foot">
          <span>{stats[m.id] ?? m.tabs.filter((t) => canSee(t, role)).map((t) => t.label).join(" · ")}</span>
          <IconArrowUpRight />
        </span>
      </Link>
    );
  }

  return (
    <>
      <div className="page-head">
        <div className="title-row">
          <div>
            <h1 className="title">{firstName ? `Hello, ${firstName}` : "Welcome"}</h1>
            <p className="title-sub">Choose a module.</p>
          </div>
        </div>
      </div>

      <div className="module-grid">
        {modules.map((m) => (
          <Card key={m.id} m={m} />
        ))}
      </div>

      {showAdmin && adminModule && (
        <section className="module-admin">
          <h2 className="group-title">{adminModule.label}</h2>
          <div className="module-grid module-grid--compact">
            {adminModule.tabs.map((t) => (
              <Link to={t.to} className="module-card module-card--compact" key={t.to}>
                <span className="module-card-icon" style={{ background: adminModule.accent }}>
                  <t.icon />
                </span>
                <span className="module-card-name">{t.label}</span>
                <IconArrowUpRight />
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
