# API Contract

> Confirmed from the checked-in NestJS implementation and a local end-to-end verification on 2026-09-21. Mobile calls the NestJS API only; it never connects directly to Supabase PostgreSQL.

## Base URL

`EXPO_PUBLIC_API_BASE_URL` must include the API prefix. For local Android/BlueStacks testing, use `http://<LAN-IP>:3000/api`.

## Authentication behavior

- Protected endpoints require `Authorization: Bearer <accessToken>`.
- The Backend issues a stateless JWT with a 30-day expiry (see "Endpoints added on 2026-10-12").
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


## Endpoints added on 2026-10-12

> Implemented in `apps/api` and verified against the running API with `apps/api/scripts/api-smoke.cjs` and the Mobile live suites (`apps/mobile/__tests__/live/`). All routes below require `Authorization: Bearer <accessToken>` unless marked public. List responses use `{ data, meta: { page, limit, total, totalPages } }`.

### Shapes shared by several endpoints

**Current user** (`GET /users/me`, `user` in the login and Google-login responses, and the result of profile edits):

~~~json
{
  "id": "…", "username": "…", "email": "…", "displayName": null, "bio": null, "avatarUrl": null,
  "createdAt": "…", "updatedAt": "…",
  "onboardedAt": null,
  "hasPassword": true
}
~~~

`onboardedAt` is `null` until the first-run setup is completed or skipped. `hasPassword` is `false` for Google-only accounts.

**Post** (feed, post detail, profile posts, saved, search, and the result of create/update):

~~~json
{
  "id": "…", "content": "…", "privacy": "PUBLIC", "createdAt": "…", "updatedAt": "…",
  "author": { "id": "…", "username": "…", "displayName": null, "avatarUrl": null },
  "media": [{ "id": "…", "url": "…", "type": "image", "order": 0 }],
  "likeCount": 0, "commentsCount": 0, "repostsCount": 0,
  "isLiked": false, "isSaved": false, "isReposted": false
}
~~~

`privacy` is `PUBLIC`, `FRIENDS` or `PRIVATE` (Mobile shows `PRIVATE` as "only me"). Feed rows also carry `type: "POST"`.

**Repost row** (`GET /posts/feed`, `GET /users/:id/reposts`):

~~~json
{
  "type": "REPOST", "id": "<repost id>", "createdAt": "…",
  "repostedBy": { "id": "…", "username": "…", "displayName": null, "avatarUrl": null },
  "originalPost": { "available": true, "…": "every Post field" }
}
~~~

When the original was deleted or the viewer may no longer see it, `originalPost` is `{ "available": false, "id": null, "author": null, "media": [], … }`.

**Comment**:

~~~json
{
  "id": "…", "content": "…", "createdAt": "…", "updatedAt": "…", "editedAt": null, "parentId": null,
  "author": { "id": "…", "username": "…", "displayName": null, "avatarUrl": null },
  "repliesCount": 0, "likesCount": 0, "isLiked": false
}
~~~

### Visibility rule

One rule decides whether a viewer may see a post, and every endpoint uses it (feed, post detail, profile posts, comments, likes, save, repost, search): the post is not deleted, its author and the viewer have not blocked each other, and it is `PUBLIC`, or the viewer's own, or `FRIENDS` with a follow in both directions. A post that fails the rule answers `404`.

### Auth

| Endpoint | Notes |
|---|---|
| `POST /auth/login` | Unverified email now answers `401` with `{ "code": "EMAIL_NOT_VERIFIED", "message": "…" }`. Wrong credentials stay a plain `401`. |
| `PATCH /auth/password` `{ currentPassword?, newPassword }` | `newPassword` 8–72 chars. A wrong current password answers **`400`** (not `401`, which Mobile treats as an expired session). Google-only accounts may omit `currentPassword` to set their first password. |
| Access token | Expires after **30 days** (was 1 day). There is still no refresh token or revocation. |

Rate limits (per IP): 300 requests/minute overall; `login`, `verify-email`, `reset-password` 10/minute; `register`, `resend-verification`, `forgot-password` 10/hour. Exceeding a limit answers `429`.

### Users

| Endpoint | Notes |
|---|---|
| `PATCH /users/me` `{ displayName?, bio?, username? }` | `displayName` 1–50, `bio` ≤ 160, `username` as in register. `409` when the username is taken. Returns the current user. |
| `POST /users/me/avatar` (multipart, field `avatar`) | JPEG/PNG/WebP, ≤ 5 MB. Replaces and deletes the previous picture. Returns the current user. |
| `DELETE /users/me/avatar` | Removes the picture. |
| `POST /users/me/onboarding/complete` | Sets `onboardedAt`. |
| `DELETE /users/me` `{ password }` or `{ confirm: "<username>" }` | Deletes the account, everything it owns and its stored files. Wrong confirmation answers `400`. |
| `GET /users/me/blocked` | `{ data: User[] }`. |
| `GET /users/suggestions?limit=` | `{ data: [{ id, username, displayName, avatarUrl, isFollowing, mutualCount, mutualPreview: string[], reason }] }`, `reason` = `FOLLOWS_YOU` \| `MUTUAL` \| `POPULAR`. |
| `GET /users/:id` | Now requires a token. Adds `followersCount`, `followingCount`, `isFollowing`, `followsYou`, `isBlocked`; `postsCount` counts only posts the viewer may see. `404` when that user blocked the viewer. |
| `GET /users/:id/posts` | Now applies the visibility rule (it used to return private posts). |
| `GET /users/:id/reposts` | Repost rows, newest first. |
| `POST` / `DELETE /users/:id/block` | Blocking also removes the follow in both directions. |
| `GET /users/:id/followers`, `/following` | Each user now has `isFollowing` (for the viewer). Newest first. |
| `GET /users/search` | Leaves out users in a block relation with the viewer. |

### Posts

| Endpoint | Notes |
|---|---|
| `GET /posts/feed` | Rows are Post or Repost rows as above; hidden posts and blocked authors are left out. |
| `GET /posts/search?q=&page=&limit=` | Case-insensitive text search over visible posts; `q=#tag` finds a hashtag. |
| `GET /posts/saved` | The viewer's bookmarks, newest first. |
| `POST` / `DELETE /posts/:id/save` | `{ data: { isSaved } }`. |
| `POST` / `DELETE /posts/:id/hide` | Hides the post from the viewer's feed. |
| `GET /posts/:id/likes` | Users who liked the post. |
| `POST /posts/:id/repost` | Now also notifies the author (`REPOST`). |
| `GET /posts/:id` | Unchanged envelope: returns the Post object itself, without `data`. |

### Comments

| Endpoint | Notes |
|---|---|
| `POST /posts/:id/comments`, `POST /comments/:id/replies` | Return a Comment (the writer is now `author` in both). A reply to a reply is attached to the top-level comment. Replies notify with type `REPLY`. |
| `GET /posts/:id/comments`, `GET /comments/:id/replies` | Comments now include `editedAt`, `likesCount`, `isLiked`, `repliesCount`. |
| `PATCH /comments/:id` `{ content }` | Author only (`403` otherwise). Sets `editedAt`. |
| `DELETE /comments/:id` | Allowed for the comment's author **or the post's author**. Returns `{ data: { deleted: true, commentsCount } }` — the post's new total, since replies are deleted with their parent. |
| `POST` / `DELETE /comments/:id/like` | `{ data: { isLiked, likesCount } }`. |

### Notifications, reports

| Endpoint | Notes |
|---|---|
| Notification `type` | Now one of `LIKE`, `COMMENT`, `REPLY`, `FOLLOW`, `REPOST`, `MENTION`. `@username` in a post or comment creates a `MENTION`. No notification is created between users in a block relation. |
| `POST /notifications/devices` `{ token, platform: "android" \| "ios" }` | Registers an Expo push token for the signed-in user. |
| `DELETE /notifications/devices?token=` | Unregisters it. |
| `POST /reports` `{ targetType: "POST" \| "COMMENT" \| "USER", targetId, reason, note? }` | `reason` = `SPAM` \| `HARASSMENT` \| `SENSITIVE` \| `MISINFORMATION` \| `OTHER`. Reporting the same target again updates the existing report. |

## Video posts, Reels and file storage (added on 2026-10-12)

All routes need `Authorization: Bearer <token>`.

### File URLs

Files are stored in S3-compatible storage (MinIO in local development). Every `url`, `avatarUrl` and `thumbnailUrl` in a response is an absolute URL, built for the host the client used to call the API, so the same row is reachable from an emulator (`10.0.2.2`) and from a phone on the LAN. Do not store these URLs on the device across sessions. Files uploaded before this date remain absolute Supabase URLs.

### Media object (inside a Post)

```json
{ "id": "...", "type": "image" | "video", "order": 0, "url": "http://...",
  "thumbnailUrl": "http://..." | null, "width": 720, "height": 1280, "durationMs": 12000 }
```

`thumbnailUrl`, `width`, `height`, `durationMs` are `null` for images and for media created before this date.

### Posting a video (three steps)

| Step | Endpoint | Notes |
|---|---|---|
| 1 | `POST /media/upload-url` `{ kind: "video" \| "thumbnail", mimeType, sizeBytes }` | Video: `video/mp4`, `video/quicktime`, at most 30 MB. Thumbnail: `image/jpeg`, `image/png`, `image/webp`, at most 2 MB. Returns `{ data: { storageKey, uploadUrl, method: "PUT", headers } }`. The URL is valid for 10 minutes. |
| 2 | `PUT <uploadUrl>` with the file as the raw body and exactly the returned `headers` | Goes straight to storage, not through the API. `200` on success. |
| 3 | `POST /posts/media` `{ content?, privacy?, media: [{ type: "VIDEO", storageKey, thumbnailKey?, width?, height?, durationMs }] }` | Exactly one video. The server checks that the object exists, is a video, is at most 30 MB and `durationMs` is at most 60 s; an invalid upload is deleted and answered with `400`. Returns `{ data: Post }` (`201`). A vertical or square video sets the post's `reelEligible` flag. |

`POST /posts` (multipart, up to 4 images) is unchanged.

### Reels

| Endpoint | Notes |
|---|---|
| `GET /reels/feed?limit=&exclude=` | `limit` 1-20 (default 5). `exclude` is a comma-separated list of post ids already shown (the last 50 are used). Returns `{ data: Post[], meta: { requestId } }`; each post also has `reason: { code: "FOLLOWING" \| "TRENDING" \| "FRESH", text }`. Only `reelEligible` posts the viewer may see, without hidden posts and blocked authors. Ranked feeds have no pages: call again with a longer `exclude`. Videos the viewer watched in the last 7 days are ranked last instead of removed. |
| `POST /interactions` `{ events: [...] }` | At most 50 events. Event: `{ eventId, eventType, postId, mediaId?, watchMs?, durationMs?, position?, requestId?, surface, createdAt? }`, `eventType` = `VIEW` \| `COMPLETE` \| `REPLAY` \| `SKIP` \| `LIKE` \| `SAVE` \| `NOT_INTERESTED`. `eventId` is generated on the device; a resent event is stored once. Events for unknown posts are skipped. `204`. |
| `POST /posts/:id/not-interested` | Same effect as `POST /posts/:id/hide`. `{ data: { isHidden: true } }`. |

## Social features added on 2026-10-13

All routes need `Authorization: Bearer <token>` unless noted.

### Changed behaviour

- `GET /posts/feed` now returns only the viewer's own posts and posts (and reposts) of people they follow.
- `401` with `code: "ACCOUNT_BANNED"` is returned at login and on every request of a suspended account.
- A post's `PUBLIC` privacy on a **private account** means "followers only" everywhere (feed, profile, search, reels, post detail).

### Users and profile

| Endpoint | Notes |
|---|---|
| Current user (`login`, `GET /users/me`, `PATCH /users/me`) | Also carries `coverUrl`, `isPrivate`, `role` (`USER` \| `ADMIN`). |
| `PATCH /users/me` `{ isPrivate }` | Switching back to public accepts every pending follow request. |
| `POST /users/me/cover` (multipart, field `cover`) / `DELETE /users/me/cover` | Same rules as the avatar: JPEG/PNG/WebP, at most 5 MB. Returns the current user. |
| `GET /users/:id` | Adds `coverUrl`, `isPrivate`, `followRequested` (the viewer's request is pending). |
| `POST /users/:id/follow` | Returns `{ data: { following, requested } }`. For a private account not yet followed: `following: false, requested: true` and the owner gets a `FOLLOW_REQUEST` notification. |
| `DELETE /users/:id/follow` | Also withdraws a pending request. |
| `GET /users/me/follow-requests` | `{ data: User[] }` with `requestedAt`. |
| `POST /users/:id/follow-request/accept`, `DELETE /users/:id/follow-request` | `:id` is the requester. Accepting notifies them with `FOLLOW_ACCEPT`. |
| `GET /users/:id/followers`, `/following` | `403` for a private account the viewer does not follow. |

### Reactions

| Endpoint | Notes |
|---|---|
| `POST /posts/:id/like` `{ type? }` | `type` = `LIKE` (default) \| `LOVE` \| `HAHA` \| `WOW` \| `SAD` \| `ANGRY`. One reaction per user; sending another type replaces it. `{ data: { isLiked, myReaction } }`. |
| `DELETE /posts/:id/like` | Removes the reaction. |
| Post object | Adds `myReaction` (string or `null`). `likeCount` counts every reaction. |
| `GET /posts/:id/likes` | Each user carries `reaction`; `meta.reactions` holds the count per type. |

### Trending

`GET /hashtags/trending` -> `{ data: [{ tag, postsCount }] }`: up to 10 hashtags (lower-cased, without `#`) used by the most public posts of public accounts in the last 7 days.

### Direct messages

Realtime events arrive on the existing Socket.IO namespace `/notifications`: `message:new` `{ conversationId, message }` (sent to both users) and `message:read` `{ conversationId, readAt }` (sent to the other user).

| Endpoint | Notes |
|---|---|
| `POST /conversations` `{ userId }` | Opens the conversation with a user, creating it on first use. `404` when the user does not exist or a block exists. |
| `GET /conversations` | Conversations that have messages, newest first: `{ id, peer, lastMessage, lastMessageAt, unreadCount }`. |
| `GET /conversations/unread-count` | `{ data: { count } }`: conversations with unread messages. |
| `GET /conversations/:id/messages?before=&limit=` | Newest first, `limit` 1-50 (default 30). `before` is the `createdAt` of the oldest message already loaded. `meta: { hasMore, peerReadAt }`. |
| `POST /conversations/:id/messages` | JSON `{ content?, clientId? }`, or multipart with the same fields plus an `image` file (JPEG/PNG/WebP, at most 5 MB). Text at most 2000 characters. `clientId` is generated on the device: sending it again returns the stored message instead of creating a second one. `403` when a block exists. |
| `POST /conversations/:id/read` | Marks the conversation read for the caller. |

Message: `{ id, conversationId, senderId, content, imageUrl, createdAt }`.

### Stories

| Endpoint | Notes |
|---|---|
| `POST /media/upload-url` | New `kind: "image"` (JPEG/PNG/WebP, at most 10 MB) for story pictures. |
| `POST /stories` `{ type: "IMAGE" \| "VIDEO", storageKey, thumbnailKey?, durationMs? }` | The file is uploaded first with `POST /media/upload-url`. Video: at most 30 MB and 60 s, `durationMs` required. Expires after 24 hours. |
| `GET /stories/feed` | Active stories of the viewer and of people they follow, grouped by author: `{ author, hasUnseen, stories: [...] }`. The viewer's own group comes first, then groups with unseen stories. Own stories carry `viewsCount`. |
| `POST /stories/:id/view` | Idempotent. `404` when the viewer may not see the story. |
| `GET /stories/:id/viewers`, `DELETE /stories/:id` | Owner only. |

### Administration

`GET /admin` serves the admin web page (no token needed to load it). Every other route needs a token of a user whose `role` is `ADMIN` (`403` otherwise).

| Endpoint | Notes |
|---|---|
| `GET /admin/stats` | Counters for the dashboard. |
| `GET /admin/reports?status=&page=&limit=` | `status` = `OPEN` (default) \| `RESOLVED` \| `DISMISSED`. Each report carries `reporter` and `target` (the reported post, comment or user; `null` when it no longer exists). |
| `POST /admin/reports/:id/resolve` `{ action }` | `DISMISS`, `REMOVE_CONTENT` (post or comment) or `BAN_USER` (the reported user or the content's author). Closes every open report on the same target. |
| `GET /admin/users?q=&page=&limit=` | Search by username, display name or email. |
| `POST` / `DELETE /admin/users/:id/ban` | Suspends or restores an account. Administrators cannot be suspended. |
