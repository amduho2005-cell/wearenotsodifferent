import type { Entry, FieldErrors } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: FieldErrors,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(
      'No pudimos conectar con el servidor. Comprueba que la API está en marcha (npm run dev) e inténtalo de nuevo.',
      0,
    );
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* respuesta sin JSON */
  }
  if (!res.ok) {
    const b = body as { error?: string; fields?: FieldErrors } | null;
    throw new ApiError(b?.error ?? `El servidor respondió con un error (${res.status}).`, res.status, b?.fields);
  }
  return body as T;
}

export interface ListResult {
  total: number;
  entries: Entry[];
}

export function listEntries(params: { q?: string; sort?: 'asc' | 'desc'; limit?: number }, signal?: AbortSignal) {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.sort) search.set('sort', params.sort);
  if (params.limit) search.set('limit', String(params.limit));
  return request<ListResult>(`/api/entries?${search}`, { signal });
}

export function getEntry(id: string, signal?: AbortSignal) {
  return request<{ entry: Entry }>(`/api/entries/${encodeURIComponent(id)}`, { signal });
}

export function createEntry(form: FormData) {
  return request<{ entry: Entry; editKey: string }>('/api/entries', { method: 'POST', body: form });
}

export function updateEntry(id: string, editKey: string, form: FormData) {
  return request<{ entry: Entry }>(`/api/entries/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'X-Edit-Key': editKey },
    body: form,
  });
}

export function verifyEditKey(id: string, editKey: string) {
  return request<{ entry: Entry }>(`/api/entries/${encodeURIComponent(id)}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ editKey }),
  });
}
