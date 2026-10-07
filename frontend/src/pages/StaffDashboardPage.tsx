import { useEffect, useState } from "react";
import { api } from "../api/client";
import { IconUsers } from "../components/Icons";

interface DashboardStats {
  totals: { total: number; active: number; former: number };
  employmentTypes: { value: string; count: number }[];
  departments: { value: string; count: number }[];
  seniorityLevels: { value: string; count: number }[];
}

interface StatCard {
  label: string;
  value: number;
  subtext?: string;
  color?: string;
}

export default function StaffDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardStats>("/staff/facets")
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Error loading dashboard");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="page">Loading dashboard...</div>;
  if (error || !stats) return <div className="page">Error: {error}</div>;

  const activePercent = Math.round((stats.totals.active / stats.totals.total) * 100);
  const formerPercent = Math.round((stats.totals.former / stats.totals.total) * 100);

  const statCards: StatCard[] = [
    {
      label: "Total Staff",
      value: stats.totals.total,
      color: "var(--blue, #0066cc)",
    },
    {
      label: "Active",
      value: stats.totals.active,
      subtext: `${activePercent}%`,
      color: "var(--green, #00aa44)",
    },
    {
      label: "Former",
      value: stats.totals.former,
      subtext: `${formerPercent}%`,
      color: "var(--grey, #999)",
    },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div className="crumbs">
          <span className="crumb">
            <IconUsers />
            Staff
          </span>
          <span className="crumb crumb-muted">Dashboard</span>
        </div>
      </div>

      <div style={{ maxWidth: "1400px" }}>
        {/* Stats cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {statCards.map((card) => (
            <div
              key={card.label}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                textAlign: "center",
                borderTop: `4px solid ${card.color}`,
              }}
            >
              <div style={{ fontSize: "32px", fontWeight: "700", color: card.color }}>
                {card.value}
              </div>
              <div style={{ fontSize: "12px", color: "var(--grey)", marginTop: "8px" }}>
                {card.label}
              </div>
              {card.subtext && (
                <div style={{ fontSize: "11px", color: "var(--grey-light)", marginTop: "4px" }}>
                  {card.subtext}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Charts grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "16px",
          }}
        >
          {/* Department distribution */}
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Staff by Department</h3>
            </div>
            <div style={{ padding: "14px 22px" }}>
              {stats.departments.length === 0 ? (
                <p className="muted">No data</p>
              ) : (
                stats.departments.map((dept) => (
                  <div
                    key={dept.value}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: "12px",
                      borderBottom: "1px solid var(--line)",
                    }}
                  >
                    <span style={{ fontSize: "13px" }}>{dept.value}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: Math.max(100, (dept.count / stats.totals.total) * 200),
                          height: "24px",
                          background: "linear-gradient(90deg, #0066cc, #00aa44)",
                          borderRadius: "4px",
                        }}
                      />
                      <span style={{ fontSize: "13px", fontWeight: "600", minWidth: "40px" }}>
                        {dept.count}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Seniority distribution */}
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Staff by Seniority Level</h3>
            </div>
            <div style={{ padding: "14px 22px" }}>
              {stats.seniorityLevels.length === 0 ? (
                <p className="muted">No data</p>
              ) : (
                stats.seniorityLevels.map((level) => (
                  <div
                    key={level.value}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: "12px",
                      borderBottom: "1px solid var(--line)",
                    }}
                  >
                    <span style={{ fontSize: "13px" }}>{level.value}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: Math.max(100, (level.count / stats.totals.total) * 200),
                          height: "24px",
                          background: "linear-gradient(90deg, #aa00ff, #0066cc)",
                          borderRadius: "4px",
                        }}
                      />
                      <span style={{ fontSize: "13px", fontWeight: "600", minWidth: "40px" }}>
                        {level.count}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Employment type distribution */}
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Employment Type</h3>
            </div>
            <div style={{ padding: "14px 22px" }}>
              {stats.employmentTypes.length === 0 ? (
                <p className="muted">No data</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {stats.employmentTypes.map((type, idx) => {
                    const pct = Math.round((type.count / stats.totals.total) * 100);
                    const colors = [
                      "#0066cc",
                      "#00aa44",
                      "#ff9900",
                      "#cc0000",
                      "#aa00ff",
                    ];
                    return (
                      <div key={type.value} style={{ display: "flex", gap: "8px" }}>
                        <div
                          style={{
                            width: "12px",
                            height: "12px",
                            background: colors[idx % colors.length],
                            borderRadius: "2px",
                            marginTop: "2px",
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "13px" }}>
                            {type.value} ({pct}%)
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: "6px",
                              background: "var(--soft)",
                              borderRadius: "2px",
                              marginTop: "4px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: colors[idx % colors.length],
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: "600", minWidth: "35px" }}>
                          {type.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Insights card */}
        <div className="card" style={{ marginTop: "16px" }}>
          <div className="card-head">
            <h3 className="card-title">Key Insights</h3>
          </div>
          <div style={{ padding: "14px 22px" }}>
            <ul style={{ fontSize: "13px", lineHeight: "1.8", color: "var(--text)" }}>
              {stats.departments.length > 0 && (
                <li>
                  Largest department:{" "}
                  <strong>
                    {stats.departments[0].value} ({stats.departments[0].count} staff)
                  </strong>
                </li>
              )}
              {stats.seniorityLevels.length > 0 && (
                <li>
                  Most common seniority level:{" "}
                  <strong>
                    {stats.seniorityLevels[0].value} ({stats.seniorityLevels[0].count} staff)
                  </strong>
                </li>
              )}
              {stats.totals.former > 0 && (
                <li>
                  Turn-over rate:{" "}
                  <strong>
                    {formerPercent}% ({stats.totals.former} former staff)
                  </strong>
                </li>
              )}
              {stats.employmentTypes.length > 0 && (
                <li>
                  Primary employment type:{" "}
                  <strong>
                    {stats.employmentTypes[0].value} ({stats.employmentTypes[0].count})
                  </strong>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
