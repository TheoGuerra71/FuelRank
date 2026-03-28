/**
 * Fachada fina sobre o Axios (`apiClient`).
 *
 * Mantemos a assinatura `apiRequest(path, { method, body, query })` para não quebrar
 * AuthContext, TenantContext, páginas e hooks que já importam este módulo.
 *
 * Por que centralizar aqui?
 * - Um único lugar trata query string, corpo JSON vs FormData e mensagens de erro.
 */

import type { AxiosRequestConfig } from 'axios';
import { apiClient, getApiErrorMessage } from '@/lib/axiosClient';

export interface ApiOptions extends Omit<AxiosRequestConfig, 'url' | 'params' | 'data'> {
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Corpo JSON, objeto literal ou FormData (multipart). */
  body?: unknown;
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { query, body, method = 'GET', ...axiosOpts } = options;

  try {
    const response = await apiClient.request<T>({
      url: path.replace(/^\//, ''),
      method,
      params: query,
      data: body,
      ...axiosOpts,
    });

    if (response.status === 204) return undefined as T;
    return response.data as T;
  } catch (error) {
    throw new Error(getApiErrorMessage(error));
  }
}
