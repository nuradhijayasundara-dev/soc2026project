// Unified authentication: NO login form here. Credentials are entered only in
// the Login Portal (frontend/login-portal). That portal authenticates against
// the single Authentication Service via the Gateway, drops the JWT in a cookie
// and in the URL hash, and redirects here by role. This file adopts that shared
// session exactly once.
export const LOGIN_PORTAL_URL =
  import.meta.env.VITE_LOGIN_PORTAL_URL || 'http://localhost:3100';

const TOKEN_KEY = 'token';
const ROLE_KEY = 'role';
const COOKIE = 'bm_token';

const saveSession = (token, role) => {
  localStorage.setItem(TOKEN_KEY, token);
  if (role) {
    localStorage.setItem(ROLE_KEY, role);
  }
};

const stripHash = () => {
  if (window.location.hash && window.location.hash.indexOf('bm_token=') >= 0) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }
};

// The Login Portal hands the session over via (a) URL hash, (b) the bm_token
// cookie. Adopt whichever is present, then clear both so it's consumed once.
export const adoptSessionFromCookie = () => {
  // 1) URL hash fallback:  /#auth?bm_token=...&role=...
  if (!localStorage.getItem(TOKEN_KEY)) {
    const hash = window.location.hash;
    if (hash && hash.indexOf('bm_token=') >= 0) {
      const params = new URLSearchParams(hash.replace(/^[^?]*\?/, ''));
      const t = params.get('bm_token');
      if (t) {
        saveSession(t, params.get('role'));
      }
    }
  }

  // 2) Cookie fallback:  bm_token=...
  if (!localStorage.getItem(TOKEN_KEY)) {
    const hit = document.cookie.split('; ').find((p) => p.startsWith(`${COOKIE}=`));
    if (hit) {
      const value = hit.split('=').slice(1).join('=');
      if (value) {
        saveSession(value);
      }
      document.cookie = `${COOKIE}=; path=/; max-age=0`;
    }
  }

  stripHash();
};

export const setSession = (token, role) => saveSession(token, role);

export const getRole = () => localStorage.getItem(ROLE_KEY);

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  window.location.href = LOGIN_PORTAL_URL;
};

export const isAuthenticated = () => !!localStorage.getItem(TOKEN_KEY);