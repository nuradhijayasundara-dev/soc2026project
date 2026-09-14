// Role -> landing portal map used by the Login Portal AFTER a successful,
// single authentication against the Authentication Service. Each role is
// redirected to its own portal; the portal decides nothing about login.
export const PORTAL_BY_ROLE = {
  COURIER_USER: 'http://localhost:3000',
  FLEET_MANAGER: 'http://localhost:3001',
  DRIVER: 'http://localhost:3002',
  ADMIN: 'http://localhost:3101',
};

export const ROLES = [
  { value: 'COURIER_USER', label: 'Courier User' },
  { value: 'FLEET_MANAGER', label: 'Fleet Manager' },
  { value: 'DRIVER', label: 'Driver' },
  { value: 'ADMIN', label: 'Admin' },
];

const COOKIE = 'bm_token';

// Store the freshly issued JWT in a cookie scoped to the shared localhost
// domain (cookies ignore the port) so every Backhaul-Match app on THIS host
// can adopt it; then land the user in the portal for their role. JWTs are
// base64url (no '=',';',',' or spaces), so the raw token is cookie-safe.
//
// The token is ALSO passed through the URL hash as a deterministic fallback —
// some browsers/browsing modes don't carry host cookies across navigations,
// and the target portal can adopt from the hash even if the cookie is absent.
export function redirectAfterLogin(token, role) {
  const target = PORTAL_BY_ROLE[role];
  if (!target) {
    return null;
  }
  document.cookie = `${COOKIE}=${token}; path=/; SameSite=Lax`;
  window.location.href = `${target}/#auth?bm_token=${token}&role=${role}`;
  return target;
}