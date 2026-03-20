import type { SupportedStorage } from '@supabase/supabase-js';

const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

// Este adaptador troca o localStorage por cookies.
// Benefício: a sessão fica centralizada em cookies e mais fácil de inspecionar/expirar.
// Observação importante: em SPA pura no navegador ainda não existe como marcar HttpOnly pelo JS;
// isso exigiria backend. Mesmo assim, `Secure` + `SameSite=Strict` já melhora bastante.
export const cookieStorage: SupportedStorage = {
  getItem(key) {
    const match = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(`${encodeURIComponent(key)}=`));

    return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
  },
  setItem(key, value) {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; Path=/; Max-Age=${ONE_WEEK_IN_SECONDS}; SameSite=Strict${secure}`;
  },
  removeItem(key) {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${encodeURIComponent(key)}=; Path=/; Max-Age=0; SameSite=Strict${secure}`;
  },
};

export const selectedTenantCookieKey = 'fuelrank_selected_tenant';
