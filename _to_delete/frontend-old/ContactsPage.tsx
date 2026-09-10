import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Contact, Paginated } from "../types";

export default function ContactsPage() {
  const [items, setItems] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams();
    if (search) params.set("search", search);

    api
      .get<Paginated<Contact>>(`/contacts?${params.toString()}`)
      .then((res) => setItems(res.items))
      .catch((err) => setError(err.message ?? "Erreur de chargement"))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [search]);

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22 }}>Contacts</h1>
        <Link to="/contacts/new" className="btn btn-primary">
          + Nouveau contact
        </Link>
      </div>

      <div className="field" style={{ maxWidth: 320 }}>
        <input
          placeholder="Rechercher un contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="card">
        {loading ? (
          <p>Chargement...</p>
        ) : items.length === 0 ? (
          <p>Aucun contact trouvé.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Sensibilité</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/contacts/${c.id}`}>
                      {c.first_name} {c.last_name}
                    </Link>
                  </td>
                  <td>{c.email ?? "—"}</td>
                  <td>{c.phone ?? "—"}</td>
                  <td>{c.sensitivity_level}</td>
                  <td>{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
