# API Contract

> Confirmed from the checked-in NestJS implementation and a local end-to-end verification on 2026-09-21. Mobile calls the NestJS API only; it never connects directly to Supabase PostgreSQL.

## Base URL

`EXPO_PUBLIC_API_BASE_URL` must include the API prefix. For local Android/BlueStacks testing, use `http://<LAN-IP>:3000/api`.

## Authentication behavior

- Protected endpoints require `Authorization: Bearer <accessToken>`.
- The Backend issues a stateless JWT with a one-day expiry.
- There is no refresh-token flow or server-side token revocation in the current implementation.

## Register

- Method: `POST`
- Path: `/auth/register`
- Authentication: none

Request body:

~~~json
{
  "username": "capt_01",
  "email": "capt@example.com",
  "password": "at-least-8-characters"
}
~~~

Validation: username is 3–30 characters and uses letters, numbers, dots, or underscores; email is required; password is 8–72 characters.

Success: `201 Created`

~~~json
{
  "data": {
    "id": "uuid",
    "username": "capt_01",
    "email": "capt@example.com",
    "displayName": null,
    "bio": null,
    "avatarUrl": null,
    "createdAt": "ISO-8601 timestamp"
  }
}
~~~

Errors: `400` invalid input; `409` duplicate email or username.

## Login

- Method: `POST`
- Path: `/auth/login`
- Authentication: none

Request body:

~~~json
{
  "email": "capt@example.com",
  "password": "at-least-8-characters"
}
~~~

Success: `201 Created` (the current NestJS controller uses the framework default for a POST handler).

~~~json
{
  "data": {
    "accessToken": "JWT",
    "user": {
      "id": "uuid",
      "username": "capt_01",
      "email": "capt@example.com",
      "displayName": null,
      "bio": null,
      "avatarUrl": null
    }
  }
}
~~~

Errors: `400` invalid input; `401` invalid email or password.

## Current user

- Method: `GET`
- Path: `/users/me`
- Authentication: Bearer JWT

Success: `200 OK`, returning `{ data: user }` with the Login user fields plus `createdAt` and `updatedAt`.

Errors: `401` missing, invalid, or expired token.

## Logout

- Method: `POST`
- Path: `/auth/logout`
- Authentication: Bearer JWT

Success: `204 No Content`.

Mobile clears its locally stored access token and authenticated state after this response. Because the current JWT implementation is stateless, a successful Logout does not revoke the token at the server.
