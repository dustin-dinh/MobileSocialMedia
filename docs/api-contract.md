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

## Google Login

- Method: `POST`
- Path: `/auth/google`
- Authentication: none

Request body:

~~~json
{
  "idToken": "Google-issued-id-token"
}
~~~

Success: `200 OK`

~~~json
{
  "data": {
    "accessToken": "JWT",
    "user": {
      "id": "uuid",
      "username": "capt_01",
      "email": "capt@example.com",
      "displayName": "Captain",
      "bio": null,
      "avatarUrl": "https://lh3.googleusercontent.com/..."
    }
  }
}
~~~

Errors: `400` invalid input / missing idToken; `401` invalid Google token.


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

## Notifications

All notification endpoints require authentication and operate only on the current user's notifications.

### List notifications

- Method: `GET`
- Path: `/notifications?page=1&limit=20`
- Authentication: bearer JWT
- `page` defaults to `1`; `limit` defaults to `20` and is limited to `1–50`.
- Results are ordered by `createdAt` descending.

Success: `200 OK`

~~~json
{
  "data": [
    {
      "id": "notification-id",
      "type": "LIKE",
      "createdAt": "ISO-8601 timestamp",
      "readAt": null,
      "actor": {
        "id": "actor-id",
        "username": "capt_01",
        "displayName": null,
        "avatarUrl": null
      },
      "post": {
        "id": "post-id"
      },
      "comment": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "unreadCount": 1,
    "totalPages": 1
  }
}
~~~

Notification `type` is `LIKE`, `COMMENT`, or `FOLLOW`. `post` and `comment` are nullable and expose only their public identifiers when present. `unreadCount` counts all unread notifications for the current user, not only the current page. Actor data excludes private fields.

### Mark one notification as read

- Method: `PATCH`
- Path: `/notifications/:id/read`
- Authentication: bearer JWT

Success: `200 OK`

~~~json
{
  "data": {
    "id": "notification-id",
    "readAt": "ISO-8601 timestamp"
  }
}
~~~

Returns `404 Not Found` if the notification does not belong to the current user or does not exist.

### Mark all notifications as read

- Method: `PATCH`
- Path: `/notifications/read-all`
- Authentication: bearer JWT

Success: `200 OK`

~~~json
{
  "data": {
    "updatedCount": 4
  }
}
~~~

Only unread notifications belonging to the current user are updated.
