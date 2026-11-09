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

`imageUrl` (since 2026-10-17) is a **signed URL to a private bucket, valid for 1 hour**, in every response and socket event that carries a message. It changes on every load, so clients must cache the image by message id, not by URL, and reload the conversation to get a fresh URL after an hour.

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

## Safety features added on 2026-10-17

Details and rules: [docs/moderation/MODERATION_PLAN.md](moderation/MODERATION_PLAN.md). Error bodies of the new refusals carry a machine-readable `code`.

### Age (18+)

| Endpoint | Notes |
|---|---|
| `POST /auth/register` | New required field `birthDate` (`YYYY-MM-DD`). Under 18: `403 { code: "AGE_RESTRICTED" }`. Impossible date: `400`. |
| `GET /users/me`, login `user` | New `birthDate` (`YYYY-MM-DD` or `null`) and `allowAnonymousMessages`. `null` birth date: the app asks for it before anything else. |
| `PATCH /users/me/birth-date` | `{ birthDate }`, once (`409` when already set). Returns the user plus `ageLocked`. Under 18 locks the account. |
| Any request / login of a locked account | `401 { code: "AGE_RESTRICTED" }`. |
| `PATCH /users/me` | New optional `allowAnonymousMessages: boolean`. |
| `GET /users/:id` | New `acceptsAnonymousMessages`. |

### Conversations

Conversation object (list, open, `meta.conversation` of the message list, socket events) gains:

`{ status: "ACCEPTED" | "PENDING", isRequest, anonymous: null | { role: "SENDER" | "RECIPIENT", revealed }, closed, canSendImages }`

Message object gains `sensitive` (blur the image for the recipient), `storyId` (reply to a story) and `warning` (scam wording, from a stranger or an anonymous sender).

For the recipient of an anonymous conversation, until the sender reveals themselves, the sender's id is `"anonymous"` and the peer is `{ id: "anonymous", username: "nguoi_an_danh", displayName: "Người ẩn danh", avatarUrl: null }` in every response, socket event and push.

| Endpoint | Notes |
|---|---|
| `POST /conversations` | A new conversation is `PENDING` (a request) when the other person does not follow the opener. |
| `POST /conversations/anonymous` | `{ userId }`. Refusals: `ANONYMOUS_NOT_ACCEPTED`, `ANONYMOUS_FOLLOW_REQUIRED`, `ANONYMOUS_NOT_ELIGIBLE` (email not verified / account younger than 7 days), `ANONYMOUS_SUSPENDED`, `ANONYMOUS_DAILY_LIMIT` (429), `CONVERSATION_CLOSED`. |
| `GET /conversations/unread-count` | `{ count, requests }`: `count` excludes requests. |
| `GET /conversations/:id/messages` | `meta.conversation` added; `meta.peerReadAt` is `null` for the opener of a pending conversation. |
| `POST /conversations/:id/messages` | New refusals: `IMAGES_NOT_ALLOWED` (anonymous, or pending opener), `CONTACT_INFO_BLOCKED` with `contact: LINK \| PHONE \| BANK_ACCOUNT`, `REQUEST_LIMIT` (429, 3 messages while pending), `CONVERSATION_CLOSED`, `ANONYMOUS_SUSPENDED`. A reply from the recipient accepts a pending conversation. |
| `POST /conversations/:id/accept` | Recipient accepts a request. |
| `POST /conversations/:id/decline` | Recipient removes a request; the opener still sees it as pending. |
| `POST /conversations/:id/close` | Recipient of an anonymous conversation blocks that sender for good. |
| `POST /conversations/:id/reveal` | Anonymous sender reveals themselves (cannot be undone). Emits `conversation:updated` to both. |
| Socket `message:new` | Payload adds `conversation` (as seen by the receiver of the event). |

### Stories

| Endpoint | Notes |
|---|---|
| `POST /stories` | New optional `allowAnonymous` (default `false`). |
| `GET /stories/feed` | Own stories: `reactionsCount` (no `viewsCount` any more). Others' stories: `allowAnonymous`, `myReaction: { type, isAnonymous } \| null`. |
| `GET /stories/:id/viewers` | **Removed** (owners no longer see viewers). |
| `GET /stories/:id/reactions` | Owner only. `[{ type, isAnonymous, createdAt, user }]`, `user` is `null` when anonymous. |
| `POST /stories/:id/reactions` | `{ type, anonymous? }` (post reaction types). Anonymous only when the story allows it (`403`). |
| `DELETE /stories/:id/reactions` | Remove your reaction. |
| `POST /stories/:id/reply` | `{ content, anonymous? }` → `{ conversationId, message }`. Anonymous replies open an anonymous conversation (same rules as above). |

### Reports and administration

| Endpoint | Notes |
|---|---|
| `POST /reports` | New `targetType: "CONVERSATION"` (`targetId` = conversation id) and reason `SCAM`. Stores a snapshot of the last 50 messages. Reporting an anonymous conversation closes it and suspends the sender's anonymous messaging. |
| `GET /admin/reports` | Conversation reports carry `target: { conversationId, kind, reportedUserId, anonymous, messages, author }` with the real identity. |
| `POST /admin/reports/:id/resolve` | `DISMISS` on an anonymous conversation report restores anonymous messaging unless 3 different people reported that user in 30 days. |
| `GET /admin/users` | Adds `ageLockedAt`, `anonymousSuspendedAt`, `birthDate`. |
| `DELETE /admin/users/:id/age-lock` | Unlock and clear the birth date so it can be declared again. |
| `POST` / `DELETE /admin/users/:id/anonymous` | Restore / suspend anonymous messaging. |
| `GET /admin/stats` | Adds `imageModeration: "ready" \| "unavailable"`. |

## Changes 2026-11-01 (parts 1-2)

### Moderation, audit log and account deletion

**Report queue.** `GET /admin/reports?status=&page=&limit=`: `status` = `OPEN` (default) | `RESOLVED` | `DISMISSED` | `CLOSED` (resolved or dismissed). Each item is now one reported target with every report about it grouped in: `{ id, targetType, targetId, reason, severity, reportCount, reports: [{ id, reason, note, createdAt, reporter }], note, status, createdAt, resolvedAt, reporter, target }`. `id` is the oldest report of the group (pass it to resolve). `reason` is the most severe reason of the group, `severity` 1 (most severe) to 7: `CHILD_SAFETY`, `SCAM`, `HARASSMENT`, `SENSITIVE`, `MISINFORMATION`, `SPAM`, `OTHER`. `POST /reports` accepts the same 7 reasons; `CHILD_SAFETY` (child sexual abuse or sexualisation of minors) is always handled first. The admin console tags severity ≤ 3 `Nghiêm trọng` and ≤ 5 `Trung bình`. `OPEN` is ordered by severity, then `reportCount` (one report per person per target, so it counts distinct reporters), then oldest first. Closed items: one per resolution, newest first. `meta.total` counts items, not reports.

**Conversation reports hide identity.** In the list, a `CONVERSATION` target is `{ conversationId, kind, anonymous, messageCount, identityHidden: true }`: no messages, no `reportedUserId`, no `author`.

| Endpoint | Notes |
|---|---|
| `POST /admin/reports/:id/identity` `{ reason }` | `reason` 3-500 chars, required (`400` without). Returns the snapshot `{ conversationId, kind, reportedUserId, anonymous, messages, author }` (`author` = real identity with `bannedAt`, `anonymousSuspendedAt`) and writes a `VIEW_IDENTITY` audit row. `404` for a non-conversation report. |
| `POST /admin/reports/:id/resolve` `{ action, reason? }` | `REMOVE_CONTENT` on a comment now hides it (`Comment.removedAt`) instead of deleting it. Optional `reason` (≤ 500) goes to the audit log; without it the row records `Báo cáo: <reason>`. |
| `POST /admin/comments/:id/restore` `{ reason? }` | Clears `removedAt`. `404` when the comment is not removed. |
| `GET /admin/audit?page=&limit=` | Newest first: `{ id, actorId, actor, action, targetType, targetId, reason, createdAt }`. |
| `POST`/`DELETE /admin/users/:id/ban`, `DELETE /admin/users/:id/age-lock`, `POST`/`DELETE /admin/users/:id/anonymous` | Accept an optional body `{ reason? }`; each writes an audit row. |
| `GET /admin/users` | Adds `deletedAt`. `GET /admin/stats` `users` / `newUsers` leave deleted accounts out. |

Audit actions: `VIEW_IDENTITY`, `REPORT_DISMISS`, `REPORT_REMOVE_CONTENT`, `REPORT_BAN_USER`, `BAN`, `UNBAN`, `AGE_UNLOCK`, `ANONYMOUS_RESTORE`, `ANONYMOUS_SUSPEND`, `COMMENT_RESTORE`. A resolve that bans or restores anonymous messaging writes both rows.

**Removed comments** are left out of `GET /posts/:id/comments`, `GET /comments/:id/replies` (its replies too), every post's `commentsCount` (replies under a removed comment included), and `GET /notifications` (list, `total`, `unreadCount`). Replying to, liking, editing or listing replies of a removed comment answers `404`. A user deleting their own comment still deletes it.

**Account deletion** (`DELETE /users/me`, same body and errors). The user row is kept as a tombstone: `deletedAt` set, `tokenVersion` incremented, `username` → `deleted_<12 hex>`, `email` → `deleted+<id>@deleted.invalid`, `displayName` → `"Người dùng đã xóa"`; password, Google link, avatar, cover, bio, birth date cleared. Posts, stories, comments (with their files), follows, follow requests, blocks, mutes, likes, reposts, saves, story reactions and views, notifications, device and auth tokens are deleted. Conversations stay for the other person; the deleted user's messages lose their text and image. Reports and their snapshots stay, and images referenced by an open report's snapshot are not deleted. Login and Google login cannot reach the account (email and Google id are rewritten); the same email can register again.

Message object (list, conversation `lastMessage`, socket) gains `deleted: boolean`; when `true`, `content` is `"Tin nhắn đã bị xóa"` and `imageUrl` is `null`. The deleted user appears as peer `{ displayName: "Người dùng đã xóa", username: "deleted_…", avatarUrl: null }`.

### Account security: sessions, lockout, two-factor sign-in

| Endpoint | Notes |
|---|---|
| Access token | Now carries `ver` (the user's `tokenVersion`). Every authenticated request and the `/notifications` socket handshake check it against the database: a token whose `ver` differs, or a deleted account, answers `401 { "code": "SESSION_REVOKED", "message": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." }`. Tokens issued before this change have no `ver` and count as `0`, so existing users stay signed in. Still 30 days, still no refresh token. |
| `POST /auth/logout` | Now really signs out: increments `tokenVersion`, so **every device** of the account is signed out. `204`. |
| `PATCH /auth/password` | Increments `tokenVersion` (other devices are signed out) and answers `{ data: { changed: true, accessToken } }`: the client must store the new `accessToken`, the one it sent is revoked. |
| `POST /auth/reset-password` | Also increments `tokenVersion` and clears the login lock. |
| `POST /auth/login` | Per-account lockout: 5 wrong passwords in a row lock password login for 15 minutes. The 5th wrong attempt and every attempt while locked answer **`423`** `{ "code": "LOGIN_LOCKED", "message": "Bạn đã nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau N phút." }` (423, not 429, because the app replaces any 429 message with its own generic one). A correct password resets the counter. The per-IP limit (10/minute) is unchanged. An unknown email still runs a bcrypt comparison, so response time does not reveal which emails exist. |
| `POST /auth/login`, `POST /auth/google` | When the account has two-factor sign-in on, they answer `200` `{ data: { twoFactorRequired: true, challengeToken, email } }` instead of `{ accessToken, user }`, and email a 6-digit code (5 minutes, 5 attempts). `challengeToken` lasts 10 minutes and is signed with a different key: it is never accepted as an access token. `POST /auth/google` is now limited to 10/minute per IP. |
| `POST /auth/2fa/verify` `{ challengeToken, code }` | `code` = 6 digits. Answers the normal session `{ data: { accessToken, user } }`. Wrong or used code: `401` "Mã xác minh không đúng hoặc đã hết hạn."; expired or invalid `challengeToken`: `401 { "code": "TWO_FACTOR_EXPIRED" }`. 10/minute per IP. |
| `POST /auth/2fa/resend` `{ challengeToken }` | Emails a new code (the previous one stops working). At most 5 two-factor codes per account per hour, counting the ones sent by login (`429`). 10/hour per IP. |
| `PATCH /auth/2fa` `{ enabled, currentPassword }` | Signed in. Turns two-factor sign-in on or off; always needs the current password (wrong: `400`). Accounts without a password (Google-only) answer `400 { "code": "PASSWORD_REQUIRED" }`: they set a password first with `PATCH /auth/password`. → `{ data: { twoFactorEnabled } }`. |
| `GET /users/me`, login responses | `user` adds `twoFactorEnabled`. |

Auth error messages are now in Vietnamese (wrong credentials, unverified email, suspended account, invalid or expired codes, duplicate email or username, wrong current password, generic forgot-password and resend messages). Codes (`EMAIL_NOT_VERIFIED`, `ACCOUNT_BANNED`, …) are unchanged.

### Messaging safety: who can message me, daily request cap, quiet requests

| Endpoint | Notes |
|---|---|
| `GET /users/me`, login `user`, `PATCH /users/me` response | Add `messagePermission`: `"EVERYONE"` (default; strangers land in Tin nhắn chờ) or `"FOLLOWING"` (only people I follow can open a new conversation). |
| `PATCH /users/me` | New optional `messagePermission: "EVERYONE" \| "FOLLOWING"` (anything else: `400`). |
| `POST /conversations` `{ userId }` | Opening a **new** conversation with someone who does not follow you: `403 { code: "MESSAGE_NOT_ALLOWED", message: "Người này chỉ nhận tin nhắn từ những người họ theo dõi." }` when their `messagePermission` is `FOLLOWING`; otherwise counts toward a daily cap of 20 new message requests per 24 hours (5 when your account is younger than 7 days): `429 { code: "REQUEST_DAILY_LIMIT", limit, message: "Hôm nay bạn đã nhắn cho N người chưa theo dõi bạn. Hãy thử lại vào ngày mai." }`. The cap counts every `DIRECT` conversation you opened as a request in the last 24 hours (opening counts, even without sending). Reopening an existing conversation is never refused. Anonymous conversations keep their own cap (`ANONYMOUS_DAILY_LIMIT`, 10). |
| `POST /conversations/:id/messages` | New refusals: `403 MESSAGE_NOT_ALLOWED` when you opened a request that is still unanswered and the recipient switched to `FOLLOWING` (and does not follow you); `403 ANONYMOUS_NOT_ACCEPTED` ("Người này không nhận tin nhắn ẩn danh nữa.") when you are the hidden sender of an anonymous conversation opened from the profile and the recipient turned anonymous messages off. Conversations started by an anonymous story reply (their first message has a `storyId`) and new story replies are not affected (DEC-025: the story's own `allowAnonymous` governs them). The recipient can always write. |
| `POST /conversations/:id/messages` (after `decline`) | The opener can still send (they are not told), but the recipient gets no `message:new` socket event and no push. The opener's own devices still get `message:new`. |
| Push for a new message | Body is `"Bạn có tin nhắn ẩn danh mới"` when the sender is hidden, `"Bạn có tin nhắn chờ mới"` while the conversation is a pending request, otherwise the text (`"Đã gửi một ảnh"` for an image). Title unchanged (sender name, or "Người ẩn danh"). The old `"[Tin nhắn chờ] <text>"` body is gone. |

Links in messages: no API change. The app makes URLs tappable and warns on suspicious ones (`apps/mobile/src/features/messages/linkSafety.ts`); the server still blocks every link from strangers and hidden anonymous senders (`CONTACT_INFO_BLOCKED`).

### Content visibility, mute, sensitive post images, private post media

- **Locked and deleted accounts.** Posts, reels, reposts and stories of a user with `bannedAt`, `ageLockedAt` or `deletedAt` set are hidden from everyone else: home feed, Reels, post search, trending hashtags, profile posts and reposts, saved posts, post detail (404) and the story tray. Such users are left out of `GET /users/search` and suggestions, `GET /users/:id` answers 404, and they cannot be muted (404). One rule in `visiblePostWhere` (`apps/api/src/modules/posts/post-view.ts`, `activeUserWhere`).
- **Mentions.** At most 20 distinct `@username` per post or comment are considered. A mentioned user is notified only if they can see the post (privacy `FRIENDS`/`PRIVATE`, blocks with the post's author, private account) and their account is active. Applies to posts and comments.
- **`POST /interactions`** silently skips events for posts the sender cannot see (same as posts that no longer exist), still `204`.
- **Mute** (the muted user is never told and gets no notification):
  - `POST /users/:id/mute` → `201 { data: { isMuted: true } }`; idempotent. `400` for yourself, `404` for an unknown, locked or deleted user.
  - `DELETE /users/:id/mute` → `200 { data: { isMuted: false } }`; idempotent.
  - `GET /users/me/muted` → `{ data: [{ id, username, displayName, avatarUrl }] }`, newest first.
  - Muted authors' posts, reposts by them and reposts of their posts disappear from the muter's `GET /posts/feed`; their videos from `GET /reels/feed`; their stories from `GET /stories/feed`. They stay on the muted user's profile, in search and in post detail.
  - `GET /users/:id` adds `isMuted: boolean`. Every post object (feed, repost `originalPost`, detail, profile, saved, search, Reels) adds `isAuthorMuted: boolean`.
- **Sensitive post images.** Images uploaded with `POST /posts` and `PATCH /posts/:id` are checked by the same image model, threshold and "model missing" policy as chat images (`IMAGE_MODERATION_THRESHOLD`, `IMAGE_MODERATION_REQUIRED`). Every media item in post responses adds `sensitive: boolean`; the app shows a blurred cover until tapped. Video posters uploaded directly to storage are not checked (`sensitive` stays `false`).
- **Private post and story media.** New post images, post videos and thumbnails, and story files are stored in the private bucket (`s3p:<key>`): `url` and `thumbnailUrl` in responses are signed URLs that expire after 1 hour and change on every response, so clients cache images by media id. `POST /media/upload-url` now returns a PUT URL into the private bucket (request and response shape unchanged); a signed URL is valid for `GET` only (not `HEAD`). Avatars and covers stay in the public bucket. Files uploaded before this change keep their public `s3:` URLs until a migration moves them.

### Push notifications and paging

- **No new endpoints.** `POST /notifications/devices` and `DELETE /notifications/devices?token=` are unchanged.
- **Push payload** (sent through the Expo push service): `{ to, title, body, data, channelId: "default" }`. `channelId` is the Android channel the app creates at startup; iOS ignores it. `data.type` tells the app which screen a tap opens:
  - `LIKE`, `COMMENT`, `REPLY`, `REPOST`, `MENTION` → `{ postId, commentId, actorId }` (post detail, scrolled to the comment when there is one);
  - `FOLLOW`, `FOLLOW_ACCEPT` → `{ actorId }` (that profile); `FOLLOW_REQUEST` → follow requests;
  - `MESSAGE` → `{ conversationId }` (the conversation, or the inbox when it cannot be found); `STORY_REACTION` → `{ storyId }` (reactions to your story);
  - anything else → the notifications screen.
- **Who gets a push.** Never an account with `deletedAt`, `bannedAt` or `ageLockedAt` set (their device tokens are skipped).
- **Dead tokens.** The Expo ticket for each message is read; a token whose ticket says `DeviceNotRegistered` is deleted. Receipts (`/push/getReceipts`) are not read yet.
- **`EXPO_PUSH_URL`** (optional server env var, default `https://exp.host/--/api/v2/push/send`): only for tests against a fake push server (`apps/api/scripts/push-smoke.cjs`).
- **Paging** (already supported, now used by the app): `GET /notifications?page=&limit=` (limit ≤ 50) returns `meta: { page, limit, total, unreadCount, totalPages }`, where `total` and `unreadCount` cover every page; `GET /users/search?q=&page=&limit=` returns `meta: { page, limit, total, totalPages }`. The app asks for 20 per page and loads the next page while scrolling.
