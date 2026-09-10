import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Contact } from "../types";

export default function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState<Contact | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ contact: Contact }>(`/contacts/${id}`)
      .then((res) => setContact(res.contact))
      .catch((err) => setError(err.message ?? "Contact introuvable"));
  }, [id]);

  async function handleDelete() {
    if (!confirm("Supprimer ce contact ?")) return;
    await api.delete(`/contacts/${id}`);
    navigate("/contacts");
  }

  if (error) return <div className="container error-text">{error}</div>;
  if (!contact) return <div className="container">Chargement...</div>;

  return (
    <div className="container">
      <Link to="/contacts">&larr; Retour aux contacts</Link>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>
            {contact.first_name} {contact.last_name}
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <Link to={`/contacts/${contact.id}/edit`} className="btn">
              Modifier
            </Link>
            <button className="btn btn-danger" onClick={handleDelete}>
              Supprimer
            </button>
          </div>
        </div>

        <dl style={{ marginTop: 16 }}>
          <p><strong>Email :</strong> {contact.email ?? "—"}</p>
          <p><strong>Téléphone :</strong> {contact.phone ?? "—"}</p>
          <p><strong>Fonction :</strong> {contact.role_title ?? "—"}</p>
          <p><strong>Niveau de sensibilité :</strong> {contact.sensitivity_level}</p>
          <p><strong>Statut :</strong> {contact.status}</p>
          <p><strong>Notes :</strong> {contact.notes ?? "—"}</p>
        </dl>
      </div>
    </div>
  );
}
