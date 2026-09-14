// The Login Portal drops the freshly-issued JWT in a cookie and in the URL hash;
// the Admin Portal adopts it exactly once at boot.
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

// Session is handed over via (a) URL hash, (b) the bm_token cookie. Adopt
// whichever is present, then clear both so it's consumed once.
export const adoptSessionFromCookie = () => {
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

export const getRole = () => localStorage.getItem(ROLE_KEY);

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  window.location.href = LOGIN_PORTAL_URL;
};

export const isAuthenticated = () => !!localStorage.getItem(TOKEN_KEY);