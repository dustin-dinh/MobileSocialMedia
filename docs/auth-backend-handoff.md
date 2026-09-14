# Auth Backend Handoff

## Purpose

This checklist records what Dev A needs from Dev B before Phase 5B can connect the Mobile Auth service to a real backend. It requests confirmation only; it does not prescribe endpoints, token fields, or session features.

## Register

Need confirmation for:

- HTTP method and URL.
- Request body fields, including which are required or optional.
- Success status and success response shape.
- Validation and conflict error statuses and response shapes.

## Login

Need confirmation for:

- HTTP method and URL.
- Supported identifier format.
- Request body fields.
- Success status and response shape.
- Access token or session field, if any.
- Returned user shape, if any.
- Invalid-credential status and error behavior.

## Logout

Need confirmation for:

- HTTP method and URL.
- Authentication requirement.
- Whether logout is server-side or client-only.
- Expected success status and response.

## Session

Need confirmation for:

- Token type, if tokens are used.
- Whether the access token expires.
- Whether refresh tokens are supported.
- Refresh behavior, if supported.
- Authorization header format.
- Expired-token response behavior.

## Handoff Notes

- Confirm whether access-token expiry and refresh-token behavior are supported; Mobile does not assume either feature exists.
- Once confirmed, record the final contract in `docs/api-contract.md` and map only those fields inside `apps/mobile/src/features/auth/services/authService.ts`.
- Until then, the Auth service must continue to send no request and Mobile must not persist credentials, tokens, or a session.
