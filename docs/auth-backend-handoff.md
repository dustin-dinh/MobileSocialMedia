# Auth Backend Handoff

## Status

Completed on 2026-09-21. The confirmed Week 1 Authentication contract is recorded in `docs/api-contract.md` and implemented by Mobile.

## Confirmed handoff

- Register: `POST /api/auth/register`, username/email/password, returns a safe user object on `201`.
- Login: `POST /api/auth/login`, email/password only, returns `data.accessToken` and a safe user object on `201`.
- Current user: `GET /api/users/me`, Bearer JWT, returns `{ data: user }` on `200`.
- Logout: `POST /api/auth/logout`, Bearer JWT, returns `204 No Content`; it is stateless server validation followed by Mobile-local token removal.
- Session: access tokens expire after one day. Refresh tokens and immediate server-side revocation are not implemented.

## Mobile integration boundary

- `apps/mobile/src/features/auth/services/authService.ts` owns the confirmed request and response mapping.
- `expo-secure-store` stores only the access token on the device.
- `AuthSessionProvider` validates a stored token through `/users/me` before rendering the authenticated navigator.
- Mobile must continue to call only the documented REST API and must not access Supabase PostgreSQL directly.

## Future Backend changes

Dev B must update `docs/api-contract.md` before Mobile changes when an endpoint, field, status, expiry rule, refresh-token flow, or logout behavior changes.
