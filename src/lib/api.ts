const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

interface ApiOptions extends RequestInit {
  query?: Record<string, string | number | boolean | undefined | null>;
}

const buildUrl = (path: string, query?: ApiOptions['query']) => {
  const url = new URL(path, API_URL.endsWith('/') ? API_URL : `${API_URL}/`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;
  if (!isFormData) headers.set('Content-Type', 'application/json');

  const response = await fetch(buildUrl(path, options.query), {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Erro inesperado na API.' }));
    throw new Error(payload.message ?? 'Erro inesperado na API.');
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
