# Mobile App

## Purpose

This directory contains Dev A's Android-targeted Mobile application for the Mobile Social Network MVP. It owns Mobile UI, navigation, client-side state and interaction, API integration, validation, and Mobile testing.

The app provides typed navigation, Authentication UI, and a confirmed Auth client/session flow. Login, Register, token persistence, current-user validation, authenticated navigation, and Logout communicate only with the documented NestJS API contract.

## Stack

- Expo SDK 57 (`expo` 57.0.22)
- React Native 0.86.3
- React 19.2.3
- TypeScript 6.0.3 with Expo's base TypeScript configuration and strict checking
- pnpm 12.4.1, invoked through Corepack
- React Navigation 7 with native stack and bottom tabs
- Expo-compatible `react-native-screens` and `react-native-safe-area-context`
- `expo-secure-store` 57.0.4 for device-local access-token storage
- `@expo/ngrok` 4.1.0 as a development-only Expo tunnel fallback

## Requirements

- Node.js 22.13.0 or newer; this workspace was validated with Node.js 24.19.0.
- Corepack, or a compatible pnpm 12.4.1 installation.
- For Android runtime testing: an Android emulator or physical Android device with Expo Go.

## Folder structure

```text
apps/mobile/
├── app.json
├── index.ts
├── package.json
├── tsconfig.json
├── src/
│   ├── App.tsx
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   └── ui/
│   ├── features/
│   │   ├── auth/
│   │   ├── feed/
│   │   ├── notifications/
│   │   ├── post/
│   │   ├── profile/
│   │   └── search/
│   ├── navigation/
│   ├── services/
│   ├── hooks/
│   ├── constants/
│   ├── types/
│   ├── utils/
│   └── config/
├── AGENTS.md
└── README.md
```

Feature-specific UI and behavior belongs under its feature. Reusable application-wide UI belongs in `src/components/`. API and network code belongs in `src/services/`. Shared Mobile types belong in `src/types/`.

## Install dependencies

From `apps/mobile/`, install the locked dependencies:

```powershell
corepack pnpm install
```

## Run the app

Start Expo:

```powershell
corepack pnpm start
```

## Run the full local Auth stack

1. In `apps/api/`, create or retain the ignored local `.env` supplied privately by Dev B. It needs the Backend database and JWT variables from `.env.example`; never commit it.
2. Start the Backend:

   ~~~powershell
   cd apps/api
   corepack pnpm@12.4.1 prisma:generate
   corepack pnpm@12.4.1 start:dev
   ~~~

3. In `apps/mobile/.env.local`, set an API URL reachable from the device. A local Android/BlueStacks session normally needs the Wi-Fi LAN address of this computer:

   ~~~env
   EXPO_PUBLIC_API_BASE_URL=http://<LAN-IP>:3000/api
   ~~~

4. Restart Expo after changing `.env.local`, then use the BlueStacks/Expo Go LAN workflow below.

Mobile does not use a Supabase SDK or connect to PostgreSQL directly. It calls the local NestJS API, which owns the Prisma/Supabase connection.

## Run on BlueStacks / Expo Go

BlueStacks with Expo Go SDK 57 has been manually verified for this project. Prefer LAN for normal local development:

1. Start BlueStacks and Expo Go SDK 57.
2. From `apps/mobile/`, start Metro over LAN:

   ```powershell
   corepack pnpm start:lan
   ```

3. In Expo Go, open the LAN development URL or QR code shown by Expo.
4. Keep Metro running while testing.

If LAN is unavailable, use the tunnel fallback:

```powershell
corepack pnpm start:tunnel
```

Tunnel transport may disconnect intermittently. `@expo/ngrok` is kept as a dev dependency only for this Expo tunnel workflow; it is not part of the Mobile app runtime.

### BlueStacks troubleshooting (this development machine)

If BlueStacks or Expo needs the previously verified ADB environment workarounds on this machine, set them for the current PowerShell session before starting Expo:

```powershell
$env:ADB_LOCAL_TRANSPORT_MAX_PORT = '0'
$env:ANDROID_USER_HOME = "$env:USERPROFILE\.android"
```

These correspond to `ADB_LOCAL_TRANSPORT_MAX_PORT=0` and `ANDROID_USER_HOME=$USERPROFILE\.android`. They are troubleshooting steps for this development machine, not universal project requirements; do not set them system-wide.

## Run Android

With an Android emulator running or an Android device available to Expo Go:

```powershell
corepack pnpm android
```

This command is defined by the project. BlueStacks with Expo Go SDK 57 has been manually verified through the workflow above; Android SDK command-line tools may still be unavailable on `PATH` in this workspace.

## TypeScript validation

```powershell
corepack pnpm typecheck
```

## Expo configuration validation

```powershell
corepack pnpm exec expo config --type public
```

## Environment variables

`src/config/api.ts` reads the non-secret `EXPO_PUBLIC_API_BASE_URL` through a static Expo environment reference. Use ignored `apps/mobile/.env.local` for the device-reachable local Backend URL and restart Expo when it changes.

`EXPO_PUBLIC_` values are bundled into the client application and must never contain secrets, tokens, or credentials. Local `.env` files are ignored by the repository.

## API base URL

The shared `src/services/httpClient.ts` accepts only relative paths and obtains its base URL through `src/config/api.ts`. Missing or invalid configuration becomes a normalized Mobile configuration error; it never falls back to a hardcoded host. Requests time out after eight seconds by default so an unreachable local API does not leave a Mobile action loading indefinitely.

`src/features/auth/services/authService.ts` maps the confirmed `/auth/register`, `/auth/login`, `/users/me`, and `/auth/logout` routes. It owns request/response mapping; screens do not issue raw network requests. The complete current contract, including the Login success status of `201`, is in `docs/api-contract.md`.

## Navigation

The navigation foundation is:

```text
App
└── AuthSessionProvider
    ├── SplashScreen (while restoring a saved session)
    └── NavigationContainer
        └── RootNavigator
            ├── AuthNavigator
            │   ├── Login
            │   └── Register
            └── MainTabNavigator
                ├── Home
                ├── Search
                ├── Create
                ├── Notifications
                └── Profile
```

`AuthSessionProvider` restores the access token from Expo SecureStore and validates it with `GET /users/me`. `App` renders Splash before any navigator while that work is pending; when it completes, `RootNavigator` renders the Auth stack or Main tabs. Startup has a five-second guard: if local storage or the API does not respond, Splash ends at Login instead of waiting indefinitely. The token is retained unless the server explicitly returns `401`. The token is never placed in route parameters or exposed to screens.

Auth screens, reusable controls, theme values, and local validation live in `src/features/auth/`. The five tab placeholders remain in the `screens/` directory of their relevant feature. Route parameter types are centralized in `src/navigation/types.ts`.

## Authentication UI

- Splash is displayed only while the saved token is being checked.
- Login accepts the Backend-supported email/password fields, validates them locally, stores only the returned access token in SecureStore, confirms it with `/users/me`, and then enters the Main tabs.
- Register sends username, email, and password after local validation; it returns to Login with the registered email after the Backend confirms account creation.
- Profile exposes the authenticated username and a Logout action. Logout waits for the Backend `204` response, deletes the local token, and returns to Login.
- Submission handling supports idle, submitting, and error states; duplicate submissions are prevented while an operation is active.
- Reusable Auth controls support focused, invalid, loading-ready, and message/error-ready presentation without a UI library.

The current Backend uses one-day stateless access tokens. Refresh tokens and immediate server-side revocation are not implemented; see `docs/api-contract.md` before changing this behavior.

## Feature organization

The planned features are authentication, feed, post, profile, search, and notifications. Add feature-specific screens, components, hooks, services, and types only when they are needed; do not create every possible subdirectory in advance.

## Development Rules

- Read the root `RULE.md`, `docs/summary.md`, and `docs/change.md` before coding.
- Inspect existing implementation before adding files.
- Keep changes within Mobile scope unless the task explicitly requires coordination.
- Use confirmed API contracts only.
- Support loading, success, empty, and error states for data-driven screens.
- Avoid unnecessary dependencies and large refactors.
- Append every meaningful change to `docs/change.md` before reporting the task complete.

## Current Status

- `index.ts` registers the Expo root component from `src/App.tsx`.
- `src/App.tsx` stays small and composes safe-area support, Auth session state, `NavigationContainer`, and `RootNavigator`.
- Splash, Login, and Register have live Auth behavior; Home, Search, Create, and Notifications remain navigation-only placeholders. Profile is the minimal authenticated Logout surface.
- The Auth client uses a public API base URL, shared JSON HTTP behavior, normalized Backend errors, confirmed Auth service mapping, Expo SecureStore, and React Context session bootstrap.
- Frozen-lockfile installation, TypeScript checking, Expo configuration resolution, and Android JavaScript bundling have passed.
- BlueStacks with Expo Go SDK 57 has been manually verified. LAN is the preferred transport; the documented tunnel fallback may disconnect intermittently.
