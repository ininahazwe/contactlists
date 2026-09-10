import { query } from "../../db/pool";
import { AppError } from "../../utils/AppError";
import { buildStorageKey, getDownloadUrl, getUploadUrl } from "../../utils/storage";
import { ConfirmUploadInput, RequestUploadInput } from "./schema";

export interface DocumentRow {
  id: number;
  event_id: number | null;
  contact_id: number | null;
  organization_id: number | null;
  file_name: string;
  storage_key: string;
  mime_type: string | null;
  size_bytes: number | null;
  uploaded_by: number;
  created_at: string;
}

export async function createUploadUrl(input: RequestUploadInput) {
  const storageKey = buildStorageKey(input.fileName);
  const uploadUrl = await getUploadUrl(storageKey, input.mimeType);
  return { storageKey, uploadUrl };
}

export async function confirmUpload(
  input: ConfirmUploadInput,
  uploadedBy: number
): Promise<DocumentRow> {
  const result = await query<{ insertId: number }>(
    `INSERT INTO documents
      (event_id, contact_id, organization_id, file_name, storage_key, mime_type, size_bytes, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.eventId ?? null,
      input.contactId ?? null,
      input.organizationId ?? null,
      input.fileName,
      input.storageKey,
      input.mimeType,
      input.sizeBytes,
      uploadedBy,
    ]
  );
  return getDocumentById(result.insertId);
}

export async function getDocumentById(id: number): Promise<DocumentRow> {
  const rows = await query<DocumentRow[]>("SELECT * FROM documents WHERE id = ? LIMIT 1", [id]);
  if (rows.length === 0) throw AppError.notFound("Document");
  return rows[0];
}

export async function listDocuments(filter: {
  eventId?: number;
  contactId?: number;
  organizationId?: number;
}): Promise<DocumentRow[]> {
  if (filter.eventId) {
    return query<DocumentRow[]>(
      "SELECT * FROM documents WHERE event_id = ? ORDER BY created_at DESC",
      [filter.eventId]
    );
  }
  if (filter.contactId) {
    return query<DocumentRow[]>(
      "SELECT * FROM documents WHERE contact_id = ? ORDER BY created_at DESC",
      [filter.contactId]
    );
  }
  if (filter.organizationId) {
    return query<DocumentRow[]>(
      "SELECT * FROM documents WHERE organization_id = ? ORDER BY created_at DESC",
      [filter.organizationId]
    );
  }
  return [];
}

export async function getDocumentDownloadUrl(id: number): Promise<{ document: DocumentRow; url: string }> {
  const document = await getDocumentById(id);
  const url = await getDownloadUrl(document.storage_key);
  return { document, url };
}

export async function deleteDocument(id: number): Promise<DocumentRow> {
  const before = await getDocumentById(id);
  await query("DELETE FROM documents WHERE id = ?", [id]);
  return before;
}
