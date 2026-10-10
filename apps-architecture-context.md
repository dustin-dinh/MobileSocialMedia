# AI Context: `apps/` Architecture and Existing Functionality

## Purpose and reading guide

This document describes the application code currently present under `apps/api` and `apps/mobile`. It is intended as repository context for future AI-assisted work: use it to locate functionality, understand the main request/data flows, and distinguish implemented backend contracts from frontend screens that still use local mock data.

This is a static source review, not proof that services are deployed, database migrations have been applied, or every flow has been exercised at runtime. When source and older README descriptions differ, the implementation source is the stronger evidence. Do not read or reproduce values from `apps/api/.env`; use environment-variable names only.

## Repository-level shape

| Application | Role | Main stack | Responsibility |
|---|---|---|---|
| `apps/api` | Backend | NestJS, TypeScript, Prisma, PostgreSQL | Authentication, user/profile reads, social graph, posts, likes, comments, search, notifications, media storage integration |
| `apps/mobile` | Frontend | Expo, React Native, TypeScript, React Navigation | Mobile UI, navigation, auth/session state, feature screens and services, API transport, local mock data for unfinished or UI-tested flows |

Each app has its own source tree and package configuration. Mobile's HTTP client uses `EXPO_PUBLIC_API_BASE_URL` as its API origin and appends API paths; it does not imply that every feature service currently uses the real API.

## Backend: `apps/api`

### Runtime and module organization

`src/main.ts` is the HTTP bootstrap. It applies the `/api` global route prefix and a validation pipe for request DTOs. `src/app.module.ts` composes configuration and feature modules. Prisma access is centralized through the Prisma module/service rather than being implemented independently in each feature.

Feature modules currently present under `src/modules/`:

| Module | Responsibility and current behavior |
|---|---|
| `auth` | Register/login/logout endpoints, credential verification, JWT issue/validation and Passport strategy. JWT lifetime is configured in the module; the signing secret is read from required configuration rather than embedded in source. |
| `users` | Current-user/profile lookup, user profile reads, a user's posts, and user search. Profile reads include public profile data and related post information according to the controller/service selection. |
| `follows` | Follow/unfollow actions and follower/following listings. Follow is implemented as its own feature, separate from Users, and uses the social-graph relation. |
| `posts` | Post creation, feed listing, post detail and post-related data. Create DTO accepts optional string content with a maximum length of 500 characters; media upload/storage is handled through the storage feature and associated post/media data. |
| `likes` | Like/unlike post actions and post-like state/count operations. Creating a like can produce a notification for the post owner. |
| `comments` | Create/list comments and list replies. A comment is tied to a post and may refer to a parent comment; parent comments are checked against the same post. Creating a comment can produce a notification for the post owner. |
| `search` | Backend search functionality exposed through the API; inspect its DTO/service before changing search semantics or adding filters. |
| `notifications` | Notification listing and read-state updates, plus realtime delivery via the Socket.IO gateway. The gateway authenticates socket connections with JWT, joins the user's `user:<id>` room and emits `notification:new` when a new notification is created. |
| `storage` | Media/storage integration, including upload handling and generation/return of storage-backed media references. |

The project also contains `src/prisma/` for generated-client-backed database access. Controllers define the HTTP boundary, DTOs validate incoming data, services contain the use cases and Prisma queries, and modules wire controllers/providers/dependencies together.

### HTTP surface

The global prefix means the routes below are mounted under `/api`. Exact route parameters and DTO details should be confirmed in the corresponding controller before changing a contract.

| Area | Implemented API capability | Access notes |
|---|---|---|
| Auth | Register, login, logout | Register/login are public; authenticated operations use JWT where required. |
| Users | Current user (`me`), profile lookup, user posts, user search | Current-user requires JWT; public profile/search reads are not necessarily authenticated. |
| Follows | Follow/unfollow, followers, following | Mutations require an authenticated actor. |
| Posts | Feed, detail, create | Create requires an authenticated actor; feed/detail visibility follows controller guards. |
| Likes | Like/unlike a post | Requires an authenticated actor. |
| Comments | List/create comments, list replies | Creation requires an authenticated actor; reads use pagination/query DTOs. |
| Notifications | List, mark one read, mark all read | User-scoped and authenticated. |
| Storage | Upload/media integration | Review the storage controller and configuration before altering provider behavior. |

Use controller guards and decorators as the source of truth for authentication on any individual route; the table is a high-level index rather than a substitute for route-level inspection.

### Data model

The Prisma schema currently defines the core social data:

- **User** — identity and profile fields; authored posts, follows, likes, comments and notifications.
- **Post** — authored content and lifecycle/deletion fields; related media, likes and comments.
- **PostMedia** — media references associated with posts.
- **Follow** — directed relationship between a follower and a followed user.
- **Like** — user-to-post like relationship.
- **Comment** — comment content associated with a post and author; optional self-relation for replies.
- **Notification** — recipient, actor, notification type and optional related post/comment, with read state and timestamps.

Relations, unique constraints, indexes, defaults and exact nullability must be read from `apps/api/prisma/schema.prisma` before making persistence changes. A migration file in the repository only proves that a migration script exists; it does not prove it has been applied to any database.

### Notifications and realtime delivery

Notifications are persisted by the notification service and emitted to the recipient's socket room after creation. The realtime payload includes notification identity/type/time, actor identity/profile fields, and optional post/comment identifiers. The WebSocket namespace is `/notifications`; socket authentication and room membership are separate from the mobile app's local event bus.

The current backend creates notifications for relevant Follow, Like and Comment interactions. Inspect the notification service call sites before adding a new trigger, and consider both persistence and realtime emission. A notification's REST read state and socket event delivery are distinct concerns.

### Backend configuration and integration boundaries

- PostgreSQL access is through Prisma; project configuration includes a Prisma PostgreSQL adapter.
- Supabase is used for hosted database/storage integration in this application.
- JWT/configuration values are supplied via environment configuration. Do not put secret values in documentation or source.
- Storage provider credentials, JWT secrets and database connection strings must remain in local/deployment secret configuration, never in client-exposed `EXPO_PUBLIC_*` variables.

## Frontend: `apps/mobile`

### Runtime composition and navigation

`src/App.tsx` composes the safe-area and authentication-session providers with the root navigator. Root navigation switches between the authentication flow and the main application. The auth stack contains Login and Register; the main tab navigator exposes Home/Feed, Search, Create, Notifications and Profile.

The mobile source is organized by feature under `src/features/`, with shared UI and app-wide concerns outside individual features:

| Path | Responsibility |
|---|---|
| `src/navigation/` | Root/auth/tab navigation and custom tab bar. |
| `src/components/ui/` | Reusable presentational controls and surfaces shared across features. |
| `src/theme/` | Tokens, typography, reusable visual treatment and palette definitions. Palettes include `blush`, `paper` and `ink`; source currently selects `blush` as active. |
| `src/config/` | API configuration and runtime constants. |
| `src/services/` | Shared HTTP client and token-storage façade. |
| `src/features/auth/` | Login/register UI, API service, session provider and secure token persistence. |
| `src/features/feed/` | Feed screen, post cards and feed data/service. |
| `src/features/search/` | User search screen, result cards and search service. |
| `src/features/post/` | Post creation UI/service. |
| `src/features/comment/` | Comment modal/list, comment item and comment service. |
| `src/features/notifications/` | Notification list/items and notification service/realtime-related client code. |
| `src/features/profile/` | Profile view/header, edit UI and profile service. |
| `__tests__/`, `scripts/` | Mobile smoke/performance tests and UI validation tooling. |

Feature screens and mock data establish substantial UI behavior, but that alone does not establish backend integration. The service-level status below is important when using these screens as examples for new work.

### Authentication and API transport

The intended auth path is:

1. Login/register screens call the auth service.
2. A successful response provides an access token.
3. The token is persisted using Expo SecureStore through `authTokenStorage`.
4. Session bootstrap validates the token by requesting the current user (`GET /users/me`).
5. Logout clears stored token and in-memory session.

`httpClient` builds requests from `EXPO_PUBLIC_API_BASE_URL`, applies a timeout (currently 8 seconds by default), and obtains the persisted token for requests that do not explicitly provide an Authorization header. `tokenStorage` is a façade over the auth feature's canonical SecureStore implementation.

Important current behavior: `BYPASS_AUTH_FOR_TESTING` in `features/auth/authSession.tsx` is set to `true`. This bypasses normal session bootstrap and injects a mock test user/token, so app startup can go directly to the main tabs instead of demonstrating the production login/session flow. Treat this as a development/testing switch, not as production authentication behavior.

### Feature-by-feature frontend status

| Feature | UI present | Data/integration status observed |
|---|---|---|
| Auth | Login/register forms and session context | Auth service is wired to the API and SecureStore, but the enabled testing bypass can mask the normal flow. |
| Feed | Home/feed screen, post card, interactions and mock feed records | `USE_MOCK_FEED = true`; the visible feed is currently supplied through mock mode, not proof of a live feed request. |
| Search | Search screen and user-result cards | `USE_MOCK = true`; UI/result state exists but is in mock mode. |
| Post creation | Create screen and post composition UI | `USE_MOCK_CREATE = true`; API path is not the active default. Do not assume media upload/create is fully wired from the screen existing. |
| Comments | Comment modal, comment list/items, replies and interaction UI | `USE_MOCK = true`; comment service includes a comment-like API path that is not present in the backend routes reviewed. |
| Notifications | Notification list and notification items | `USE_MOCK = true`; the backend has REST and Socket.IO capabilities, but the mobile list is presently mock-driven. |
| Profile | Profile screen/header and edit-profile UI | `USE_MOCK = true`; backend profile reads exist, while a corresponding profile-update endpoint was not found in the reviewed API surface. |

Mock flags may be changed or removed deliberately as integration proceeds. Before doing so, confirm the target backend contract, response shape, authentication state and error/loading behavior; do not silently replace mocks with guessed routes.

### Local coordination and UX behavior

Mobile has a local `feedEvents` event bus used to reflect actions such as newly created posts or changed comment counts across mounted screens. This is in-process UI synchronization, not server push and not a replacement for Socket.IO.

The UI uses a shared palette/theme system and reusable Clay-style components. The current app has UI verification rules and tests for screen smoke/performance behavior; prior change-log entries record validation across the available palettes. Consult the scripts and tests in the repository for the current checks rather than assuming test counts or outcomes remain current.

## Cross-app contract and known gaps

The backend and mobile app are not uniformly integrated. Use the following distinctions when planning work:

1. **Implemented backend capability** means a controller/service/schema path is present; it does not imply Mobile currently calls it.
2. **Visible Mobile feature** means a screen/component exists; it does not imply the feature's data is live.
3. **Mock-enabled service** means the default runtime may not exercise the corresponding API at all.
4. **Type/UI fields** are not backend guarantees. Compare service request/response mappings, DTOs, controllers and Prisma selections before relying on a field.

Specific mismatches or unconfirmed parity from the source reviewed:

- Mobile types/UI refer to follower/following counts and `isFollowing`; confirm the exact backend response mapping rather than relying on display models.
- Mobile includes save/bookmark concepts, while no corresponding backend save endpoint/model was identified in the reviewed routes/schema.
- Comment UI exposes comment-like behavior, but no comment-like backend route/model was identified; the current service path is therefore not a verified contract.
- Profile editing is presented in Mobile, but a profile-update backend endpoint was not identified in the reviewed route surface.
- Notification UI may show previews/images or other display fields beyond the backend realtime payload's identifiers; verify the REST response separately.
- Post creation/media flows require checking both post and storage contracts. A backend upload capability does not by itself prove the Mobile service has completed the upload-then-create sequence.

These are observations from the source reviewed, not requirements to add backend features. A future change should define scope and API contract first, preserve existing behavior, and update both sides only when requested.

## Safe workflow for future AI-assisted changes

1. Identify whether the task belongs to API, Mobile or both; inspect the owning controller/service/screen and its callers.
2. For API changes, inspect the relevant DTO, controller, service, module and Prisma model/migration together.
3. For Mobile changes, inspect screen, service, types, navigation/session dependencies and related tests; check whether mock mode is enabled.
4. For integration work, compare the actual serialized API response and Mobile mapping. Do not infer a contract from UI types or endpoint names alone.
5. Preserve the repository's module/feature boundaries and follow local instructions (`RULE.md` and `apps/mobile/AGENTS.md` where applicable).
6. Keep secrets out of documentation and public client configuration. Do not inspect `.env` values to write architecture context.
7. Validate with the smallest relevant typecheck/test/build command available and record meaningful repository changes using the existing change-log convention.

