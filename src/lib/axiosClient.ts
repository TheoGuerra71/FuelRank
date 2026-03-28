/**
 * Cliente HTTP central (Axios) para todo o app conversar com o backend Node.js.
 *
 * Por que Axios em vez de fetch?
 * - Interceptors permitem injetar o Bearer token em todas as requisições sem repetir código.
 * - Erros HTTP não-2xx viram exceção de forma previsível; padronizamos a leitura de `message` no backend.
 *
 * Por que Bearer no header?
 * - O painel admin e outras rotas protegidas esperam `Authorization: Bearer <JWT>`.
 * - Mantemos `withCredentials: true` opcionalmente útil se o backend também emitir cookies de sessão
 *   no futuro; o token no header já basta para o contrato atual.
 */

import axios, { type AxiosError } from 'axios';

/** Chave no localStorage: isolada por app para não colidir com outros projetos na mesma origem. */
const ACCESS_TOKEN_KEY = 'fuelrank_access_token';

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Persiste ou remove o JWT devolvido pelo login (ou por um refresh de sessão).
 * Por que localStorage?
 * - O Vite roda no browser; precisamos de um armazenamento síncrono acessível aos interceptors.
 * - Em produção, avalie HttpOnly cookies emitidos pelo próprio backend (mitiga XSS).
 */
export function setAccessToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
    else localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * URL base da API (Express montado em /api).
 * VITE_API_URL deve incluir o prefixo /api, ex.: http://localhost:4000/api
 */
const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL,
  /** Permite enviar cookies se o backend combinar JWT + cookie de sessão. */
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  /** Requisições típicas do app; uploads podem precisar de timeout maior na rota específica. */
  timeout: 30_000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // FormData: o browser precisa definir Content-Type com boundary automaticamente.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

/**
 * Extrai mensagem amigável do corpo `{ message }` que o Express envia nos Toasts.
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<{ message?: string }>;
    const fromBody = ax.response?.data?.message;
    if (typeof fromBody === 'string' && fromBody.trim()) return fromBody;
    if (ax.message) return ax.message;
  }
  if (error instanceof Error) return error.message;
  return 'Erro inesperado na API.';
}
