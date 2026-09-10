const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

/**
 * Thin fetch wrapper. Sends/receives the httpOnly session cookie set by
 * the server (credentials: "include"), so there is no token to manage
 * on the client.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? "GET",
      credentials: "include",
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    // fetch throws (not a 4xx/5xx) when the server can't be reached at all:
    // not running, wrong port, DNS/CORS failure, etc. Surface that distinctly
    // instead of letting callers assume it was an application-level rejection.
    throw new ApiError(`Could not reach the server (${API_URL}). Check that it is running.`, 0);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(data?.error ?? `Request failed (${res.status})`, res.status, data?.details);
  }

  return data as T;
}

/**
 * Multipart upload (e.g. the Excel contact import). Left out of `request`
 * because the body must NOT be JSON-stringified and the Content-Type
 * (with its multipart boundary) has to come from the browser, not us.
 */
async function upload<T>(path: string, formData: FormData): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
  } catch {
    throw new ApiError(`Could not reach the server (${API_URL}). Check that it is running.`, 0);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(data?.error ?? `Request failed (${res.status})`, res.status, data?.details);
  }
  return data as T;
}

/**
 * Downloads a server file (e.g. the import template) as a real file save
 * rather than navigating there, so the httpOnly session cookie is sent
 * the same way as every other request.
 */
async function download(path: string, filename: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { credentials: "include" });
  } catch {
    throw new ApiError(`Could not reach the server (${API_URL}). Check that it is running.`, 0);
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.error ?? `Request failed (${res.status})`, res.status, data?.details);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, formData: FormData) => upload<T>(path, formData),
  download: (path: string, filename: string) => download(path, filename),
};
