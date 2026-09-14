# Mobile App

## Purpose

This directory contains Dev A's Android-targeted Mobile application for the Mobile Social Network MVP. It owns Mobile UI, navigation, client-side state and interaction, API integration, validation, and Mobile testing.

The app provides a typed navigation foundation, local Authentication UI, and an Auth client foundation. Login and Register validate user input locally and reach an Auth service boundary, but no endpoint call, token persistence, or real authentication is implemented until the Backend contract is confirmed.

## Stack

- Expo SDK 57 (`expo` 57.0.22)
- React Native 0.86.3
- React 19.2.3
- TypeScript 6.0.3 with Expo's base TypeScript configuration and strict checking
- pnpm 12.4.1, invoked through Corepack
- React Navigation 7 with native stack and bottom tabs
- Expo-compatible `react-native-screens` and `react-native-safe-area-context`

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

## Run Android

With an Android emulator running or an Android device available to Expo Go:

```powershell
corepack pnpm android
```

This command is defined by the project. It was not device/emulator-tested in this workspace because Android SDK command-line tools are not available on `PATH`.

## TypeScript validation

```powershell
corepack pnpm typecheck
```

## Expo configuration validation

```powershell
corepack pnpm exec expo config --type public
```

## Environment variables

`src/config/api.ts` reads the optional, non-secret `EXPO_PUBLIC_API_BASE_URL` through a static Expo environment reference. Use `apps/mobile/.env.local` for a local backend URL only after a contract is agreed; no environment file or URL is committed.

`EXPO_PUBLIC_` values are bundled into the client application and must never contain secrets, tokens, or credentials. Local `.env` files are ignored by the repository.

## API base URL

The shared `src/services/httpClient.ts` accepts only relative paths and obtains its base URL through `src/config/api.ts`. Missing or invalid configuration becomes a normalized Mobile configuration error; it never falls back to a hardcoded host.

`src/features/auth/services/authService.ts` is the Auth feature boundary. Its Register, Login, and Logout methods currently report that the contract is pending, so they do not call the HTTP client or send any request. Once Dev B confirms a contract, map the confirmed fields and call `httpClient.requestJson` inside this service rather than from a screen.

## Navigation

The navigation foundation is:

```text
App
└── NavigationContainer
    └── RootNavigator
        ├── AuthNavigator
        │   ├── Splash
        │   ├── Login
        │   └── Register
        └── MainTabNavigator
            ├── Home
            ├── Search
            ├── Create
            ├── Notifications
            └── Profile
```

`RootNavigator` has one isolated, non-persistent temporary navigation mode. It defaults to the unauthenticated branch so Login and Register links can be verified without faking authentication. Phase 5 must replace that constant with real session bootstrap; it must not be used for token storage, API calls, or real authentication.

Auth screens, reusable controls, theme values, and local validation live in `src/features/auth/`. The five tab placeholders remain in the `screens/` directory of their relevant feature. Route parameter types are centralized in `src/navigation/types.ts`.

## Authentication UI

- Splash is presentation-only and does not start a session or navigate automatically.
- Login includes a username-or-email field, password field, local required-field validation, keyboard next-field focus, and password visibility control.
- Register includes username, email, password, and confirm-password fields with required-field, email-format, and password-match validation.
- Valid local submissions pass through the Auth service boundary, show an explicit no-request-sent notice while the contract is pending, and never navigate to the main tabs.
- Submission handling supports idle, submitting, and error states; duplicate submissions are prevented while an operation is active.
- Reusable Auth controls support focused, invalid, loading-ready, and message/error-ready presentation without a UI library.

Phase 4 must connect only confirmed API contracts. Phase 5 must replace the temporary root navigation mode with real session bootstrap.

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
- `src/App.tsx` stays small and composes safe-area support, `NavigationContainer`, and `RootNavigator`.
- Splash, Login, and Register have Mobile UI and local validation; Home, Search, Create, Notifications, and Profile remain navigation-only placeholders.
- The Auth client foundation has public API base-URL configuration, a shared JSON HTTP client, normalized Mobile API errors, and a contract-pending Auth service boundary. No Auth endpoint has been implemented because no contract is confirmed.
- Frozen-lockfile installation, TypeScript checking, Expo configuration resolution, and Android JavaScript bundling have passed.
- Phase 3 device runtime validation could not be completed because Expo tunnel startup could not start the local Android SDK ADB server.
