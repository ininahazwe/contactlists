import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import Avatar from "../components/Avatar";
import { IconPlus, IconSearch, IconUsers } from "../components/Icons";
import { ManagedUser, USER_ROLE_LABELS, UserRole } from "../types";

const ROLES: UserRole[] = ["read_only", "editor", "admin"];

function formatDate(value: string | null): string {
  if (!value) return "Never";
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [items, setItems] = useState<ManagedUser[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("read_only");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get<{ items: ManagedUser[] }>("/users")
      .then((res) => setItems(res.items))
      .catch((err) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q));
  }, [items, filter]);

  const activeAdmins = items.filter((u) => u.role === "admin" && u.is_active).length;

  async function save(target: ManagedUser, body: { role?: UserRole; isActive?: boolean }) {
    setSavingId(target.id);
    setError(null);
    try {
      const res = await api.patch<{ user: ManagedUser }>(`/users/${target.id}`, body);
      setItems((prev) => prev.map((u) => (u.id === target.id ? res.user : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingId(null);
    }
  }

  async function addUser(e: FormEvent) {
    e.preventDefault();
    const email = newEmail.trim();
    if (!email) return;

    setAdding(true);
    setAddError(null);
    try {
      const res = await api.post<{ user: ManagedUser }>("/users", {
        email,
        name: newName.trim() || undefined,
        role: newRole,
      });
      setItems((prev) => [...prev, res.user].sort((a, b) => a.name.localeCompare(b.name)));
      setNewEmail("");
      setNewName("");
      setNewRole("read_only");
      setShowAdd(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Error");
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div className="crumbs">
          <span className="crumb">
            <IconUsers />
            Administration
          </span>
          <span className="crumb crumb-muted">Users</span>
        </div>
        <div className="title-row">
          <div>
            <h1 className="title">Users and roles</h1>
            <p className="title-sub">
              {loading
                ? "Loading..."
                : `${items.length} accounts · ${activeAdmins} active admin${activeAdmins > 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setShowAdd((v) => !v);
              setAddError(null);
            }}
          >
            <IconPlus className="i" />
            Add user
          </button>
        </div>
      </div>

      {showAdd && (
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Add a user by email</h2>
          </div>
          <form onSubmit={addUser} className="row" style={{ flexWrap: "wrap", gap: 12 }}>
            <input
              type="email"
              required
              className="search-input"
              style={{ flex: "1 1 260px" }}
              placeholder="person@mfwa.org"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={adding}
            />
            <input
              type="text"
              className="search-input"
              style={{ flex: "1 1 200px" }}
              placeholder="Name (optional)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={adding}
            />
            <div className="seg">
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`seg-btn${newRole === role ? " is-active" : ""}`}
                  disabled={adding}
                  onClick={() => setNewRole(role)}
                >
                  {USER_ROLE_LABELS[role]}
                </button>
              ))}
            </div>
            <button type="submit" className="btn btn-primary" disabled={adding || !newEmail.trim()}>
              {adding ? "Adding..." : "Add"}
            </button>
          </form>
          {addError && <p className="error-text">{addError}</p>}
          <p className="muted" style={{ marginTop: 8 }}>
            The account is created right away with the role above. The person signs in with
            &quot;Sign in with Google&quot; using this same address whenever they&apos;re ready — no
            invitation email is sent.
          </p>
        </section>
      )}

      <section className="card search-panel">
        <div className="search-field">
          <IconSearch className="i search-ico" />
          <input
            className="search-input"
            placeholder="Filter by name or email..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </section>

      {error && <p className="error-text">{error}</p>}

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Accounts</h2>
        </div>

        {!loading && visible.length === 0 && (
          <p className="empty">No account matches this filter.</p>
        )}

        <div className="list">
          {visible.map((u) => {
            const isMe = me?.id === u.id;
            const busy = savingId === u.id;
            const active = Boolean(u.is_active);

            return (
              <div className="row" key={u.id}>
                <Avatar name={u.name} size="sm" tone={active ? "ink" : "mint"} />

                <div className="row-main">
                  <span className="row-name">
                    {u.name}
                    {isMe && (
                      <span className="badge badge--mint" style={{ marginLeft: 8 }}>
                        You
                      </span>
                    )}
                    {!active && (
                      <span className="badge" style={{ marginLeft: 8 }}>
                        Deactivated
                      </span>
                    )}
                  </span>
                  <span className="row-sub">{u.email}</span>
                </div>

                <div className="row-cell row-cell--sm">
                  <span className="muted">Last sign-in</span>
                  <div>{formatDate(u.last_login_at)}</div>
                </div>

                <div className="seg">
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={`seg-btn${u.role === role ? " is-active" : ""}`}
                      disabled={busy || isMe || !active}
                      title={
                        isMe
                          ? "You cannot change your own role"
                          : !active
                            ? "Reactivate this account first"
                            : `Set role to ${USER_ROLE_LABELS[role]}`
                      }
                      onClick={() => u.role !== role && save(u, { role })}
                    >
                      {USER_ROLE_LABELS[role]}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className={`btn ${active ? "btn-ghost" : "btn-primary"}`}
                  disabled={busy || isMe}
                  title={isMe ? "You cannot deactivate your own account" : undefined}
                  onClick={() => save(u, { isActive: !active })}
                >
                  {busy ? "Saving..." : active ? "Deactivate" : "Reactivate"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <p className="muted" style={{ marginTop: 12 }}>
        <strong>Read only</strong> browses the directory. <strong>Editor</strong> also creates and
        edits contacts, organizations and events. <strong>Admin</strong> also deletes, manages these
        accounts and reads the activity log. A change applies on the person&apos;s next request, not
        at their next sign-in.
      </p>
    </>
  );
}
