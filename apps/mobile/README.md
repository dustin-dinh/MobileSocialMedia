# Mobile App

## Purpose

This directory contains Dev A's Android-targeted Mobile application for the Mobile Social Network MVP. It owns Mobile UI, navigation, client-side state and interaction, API integration, validation, and Mobile testing.

The app currently provides a typed navigation foundation with placeholder screens. Real authentication, API calls, token storage, and social-feature behavior have not been implemented.

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

No environment file or backend URL is committed yet. When the API contract is agreed, use a non-secret `EXPO_PUBLIC_API_BASE_URL` in `apps/mobile/.env.local` and read it through a static `process.env.EXPO_PUBLIC_API_BASE_URL` reference from `src/config/`.

`EXPO_PUBLIC_` values are bundled into the client application and must never contain secrets, tokens, or credentials. Local `.env` files are ignored by the repository.

## API base URL

The API base URL should be configured through `src/config/` after the Backend contract is confirmed. Do not invent an endpoint, host, or response shape.

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

Auth placeholder screens live in `src/features/auth/screens/`. The five tab placeholders live in the `screens/` directory of their relevant feature. Route parameter types are centralized in `src/navigation/types.ts`.

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
- Login, Register, Splash, Home, Search, Create, Notifications, and Profile currently render navigation-only placeholders.
- Frozen-lockfile installation, TypeScript checking, Expo configuration resolution, and Android JavaScript bundling have passed.
- Android device/emulator runtime validation has not been performed in this workspace.
