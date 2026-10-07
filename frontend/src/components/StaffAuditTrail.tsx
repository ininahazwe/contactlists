import { useEffect, useState } from "react";
import { api } from "../api/client";

interface AuditEntry {
  id: number;
  action: string;
  entityType: string;
  after: string | null;
  changedAt: string;
  userName: string;
}

interface AuditTrailProps {
  staffId: number;
}

export default function StaffAuditTrail({ staffId }: AuditTrailProps) {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    api
      .get<{ auditLog: AuditEntry[] }>(`/staff/${staffId}/audit`)
      .then((res) => {
        setAuditLog(res.auditLog);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [staffId]);

  const filteredLog =
    filter === "all" ? auditLog : auditLog.filter((entry) => entry.action === filter);

  const actionColors: Record<string, string> = {
    create: "#00aa44",
    update: "#0066cc",
    delete: "#cc0000",
    read: "#999999",
  };

  const actionIcons: Record<string, string> = {
    create: "🆕",
    update: "✏️",
    delete: "🗑️",
    read: "👁️",
  };

  if (loading) return <p className="muted">Loading audit trail...</p>;
  if (auditLog.length === 0) return <p className="muted">No audit log available</p>;

  const actions = Array.from(new Set(auditLog.map((e) => e.action)));

  return (
    <div>
      {/* Filter buttons */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button
          className={filter === "all" ? "btn" : "btn btn-ghost"}
          onClick={() => setFilter("all")}
          style={{ fontSize: "12px", padding: "6px 12px" }}
        >
          All ({auditLog.length})
        </button>
        {actions.map((action) => {
          const count = auditLog.filter((e) => e.action === action).length;
          return (
            <button
              key={action}
              className={filter === action ? "btn" : "btn btn-ghost"}
              onClick={() => setFilter(action)}
              style={{ fontSize: "12px", padding: "6px 12px" }}
            >
              {action} ({count})
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div style={{ position: "relative", paddingLeft: "32px" }}>
        {filteredLog.map((entry, idx) => {
          const date = new Date(entry.changedAt);
          const dateStr = date.toLocaleDateString() + " " + date.toLocaleTimeString();
          const action = entry.action.toLowerCase();
          const color = actionColors[action] || "#999";

          return (
            <div
              key={entry.id}
              style={{
                position: "relative",
                marginBottom: "16px",
                paddingLeft: "16px",
              }}
            >
              {/* Timeline dot */}
              <div
                style={{
                  position: "absolute",
                  left: "-28px",
                  top: "4px",
                  width: "12px",
                  height: "12px",
                  background: color,
                  border: "3px solid white",
                  borderRadius: "50%",
                  boxShadow: `0 0 0 2px ${color}`,
                }}
              />

              {/* Timeline line */}
              {idx < filteredLog.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: "-22px",
                    top: "12px",
                    width: "2px",
                    height: "24px",
                    background: "#ddd",
                  }}
                />
              )}

              {/* Content */}
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ fontSize: "16px" }}>{actionIcons[action] || "•"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: "600", color }}>
                    {entry.action.toUpperCase()}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--grey)", marginTop: "2px" }}>
                    by <strong>{entry.userName}</strong> on {dateStr}
                  </div>
                  {entry.after && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--grey-light)",
                        marginTop: "4px",
                        fontFamily: "monospace",
                        background: "var(--soft)",
                        padding: "4px 6px",
                        borderRadius: "2px",
                        maxHeight: "60px",
                        overflow: "hidden",
                      }}
                    >
                      {(() => {
                        try {
                          const data = JSON.parse(entry.after);
                          if (entry.action === "update" && typeof data === "object" && data.fieldsUpdated) {
                            return `Fields: ${data.fieldsUpdated.join(", ")}`;
                          }
                          return JSON.stringify(data, null, 2).slice(0, 100) + "...";
                        } catch {
                          return entry.after.slice(0, 100) + "...";
                        }
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
