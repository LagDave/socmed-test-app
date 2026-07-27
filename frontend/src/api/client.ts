import type { ApiSuccess, ApiError } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });
  const json = (await res.json()) as ApiSuccess<T> | ApiError;
  if (!json.success) {
    throw new Error(json.error?.message || "Request failed");
  }
  return json.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: async <T>(path: string, file: File, purpose?: string): Promise<T> => {
    const fd = new FormData();
    fd.append("file", file);
    if (purpose) fd.append("purpose", purpose);
    const res = await fetch(path, { method: "POST", body: fd, credentials: "include" });
    const json = (await res.json()) as ApiSuccess<T> | ApiError;
    if (!json.success) throw new Error(json.error?.message || "Upload failed");
    return json.data;
  },
};
