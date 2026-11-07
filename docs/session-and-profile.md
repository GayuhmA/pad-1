# Session and profile

The browser calls the same-origin Next.js `/api/auth/login`, `/api/auth/me`, and
`/api/auth/logout` handlers. Only these handlers forward requests to Laravel.
Set `API_URL` in the server environment (existing `NEXT_PUBLIC_API_URL` remains
supported). Deploy with a Next.js server and HTTPS; static export is not supported.
The public URL seen by Next.js must match the browser Origin for mutation checks.
Set `APP_ORIGIN` to the canonical public frontend origin if a reverse proxy changes
the request URL. Never derive this allowlist from an untrusted forwarded header.

Login consumes Laravel's `data.token` and `data.akun`; `/me` consumes `data`.
Responses are validated and mapped to a small UI account model. The token is kept
in a session cookie with HttpOnly, SameSite=Lax, Path=/, and Secure plus a __Host-
prefix in production. It is never returned in the frontend response, persisted in
Zustand, or stored in localStorage. Existing localStorage tokens are removed and
users with those legacy sessions must sign in again. They are not migrated.
Backend token expiry/revocation remains authoritative. Browser session-cookie
retention is not a substitute for a backend maximum token lifetime.

The root provider restores `/me` before showing authenticated UI, deduplicates
concurrent checks, and revalidates on focus, page restore, visibility changes,
and every 60 seconds while visible. Login/logout broadcasts only an invalidation
signal to other tabs. A revision counter prevents obsolete responses from
restoring an old account. Protected layouts hide content while session restoration
is pending and remount account UI when the account changes. These UI boundaries
are not backend authorization: every protected API must validate the session and
permissions server-side. Future domain endpoints need their own fixed server
handlers; do not send the cookie token to JavaScript or add an arbitrary proxy.

401 removes the displayed identity and redirects to login. Network/5xx errors
preserve the cookie and provide retry; they do not force a logout. Logout clears
the cookie after backend revocation, including an already-expired token. A failed
revocation is shown to the user and can be retried. GET /me never modifies cookies,
so a delayed response cannot erase a newer login cookie. Auth responses use no-store.
Mutations require same-origin Origin and reject cross-site fetch metadata.

Backend requests use a dedicated Undici connection pool with a 2-second IPv4/IPv6
attempt interval, a 10-second connection timeout, and a 15-second request timeout.
This avoids abandoning a slow IPv4 connection too quickly when IPv6 is unavailable,
without changing networking globally or disabling TLS checks. Login POST requests
are not automatically replayed. Connection failures log only endpoint and transport
code to the server console, never credentials or tokens. Requires Node.js 20.18.1+.

Profile and navbar use only the validated backend identity. `/me` currently
provides name, username, role, account status, and nullable phone. Birth details,
address, and neighborhood contacts show unavailable states. Profile/password
editing is disabled until real update endpoints exist; old draft forms are not
connected to the displayed identity. Other pages and notification demo data are
outside this phase.

Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
Tests use Node's built-in runner and the existing TypeScript compiler, with mock
backend responses; they do not contain real accounts or credentials.
