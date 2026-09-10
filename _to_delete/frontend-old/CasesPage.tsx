import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";
import { CaseItem } from "../types";

export default function CasesPage() {
  const [items, setItems] = useState<CaseItem[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    api
      .get<{ items: CaseItem[] }>("/cases")
      .then((res) => setItems(res.items))
      .catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.post("/cases", { title });
      setTitle("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  }

  return (
    <div className="container">
      <h1 style={{ fontSize: 22 }}>Dossiers d'investigation</h1>

      <form className="card" onSubmit={handleCreate} style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <input
          placeholder="Titre du dossier"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Créer
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}

      <div className="card">
        {items.length === 0 ? (
          <p>
            Aucun dossier accessible. (Rappel : sauf pour les administrateurs, vous ne voyez que
            les dossiers auxquels vous êtes affecté.)
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Référence</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>{c.title}</td>
                  <td>{c.reference ?? "—"}</td>
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
