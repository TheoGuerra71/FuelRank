/// <reference types="vite/client" />

/**
 * Variáveis expostas ao frontend (prefixo VITE_).
 * Mantemos documentado o valor esperado para evitar URLs duplicadas (/api duas vezes).
 */
interface ImportMetaEnv {
  /** Ex.: http://localhost:4000/api — deve incluir o segmento /api igual ao mount do Express. */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
