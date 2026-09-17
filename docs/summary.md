# Project Summary

## Project

Mobile Social Network MVP

## Team

- Dev A: Mobile
- Dev B: Backend

## MVP Goal

Deliver a small mobile social network that supports authentication, profiles, following, posts, feed interactions, search, and notifications through a coordinated Mobile and Backend implementation.

## Core Features

- Authentication
- Profile
- Follow
- Post
- Feed
- Like
- Comment / Reply
- Search User
- Notifications

## Main User Flow

Register -> Login -> Profile -> Search User -> Follow User -> Create Post -> Feed -> Like / Comment -> Notification

## Mobile Navigation

- Home
- Search
- Create
- Notifications
- Profile

## Mobile Architecture

- Mobile code lives under `apps/mobile/`.
- Source code is organized by feature under `apps/mobile/src/features/`.
- Reusable application-wide UI belongs in `apps/mobile/src/components/`.
- API and network code belongs in `apps/mobile/src/services/`.
- Shared types belong in `apps/mobile/src/types/`.
- Navigation, configuration, hooks, constants, and utilities have dedicated source areas.
- `apps/mobile/index.ts` is the Expo entry point and registers the foundation component in `apps/mobile/src/App.tsx`.
- `apps/mobile/src/App.tsx` composes `SafeAreaProvider`, `NavigationContainer`, and `RootNavigator` only.
- `RootNavigator` prepares checking, unauthenticated, and authenticated application branches without real session logic.
- `AuthNavigator` owns Splash, Login, and Register; `MainTabNavigator` owns Home, Search, Create, Notifications, and Profile in that order.
- Auth UI, validation helpers, and reusable Auth controls are feature-owned under `apps/mobile/src/features/auth/`.
- API base configuration is isolated in `apps/mobile/src/config/api.ts`, while JSON HTTP behavior and normalized transport errors are shared under `apps/mobile/src/services/`.
- The Auth service boundary and submission-state hook live under `apps/mobile/src/features/auth/`; they intentionally make no endpoint call until Dev B confirms an Auth contract.
- Home, Search, Create, Notifications, and Profile remain navigation-only placeholders.
- Authentication API calls, token storage, and session bootstrap are not implemented.

## Current Tech Stack

- Expo SDK 57 (`expo` 57.0.22)
- React Native 0.86.3
- React 19.2.3 and `expo-status-bar` 57.0.1
- TypeScript 6.0.3 using `expo/tsconfig.base` with strict checking
- pnpm 12.4.1 through Corepack, with `apps/mobile/pnpm-lock.yaml`
- React Navigation 7.3.18 with native-stack 7.18.10 and bottom-tabs 7.18.18
- Expo-compatible `react-native-screens` 4.26.2 and `react-native-safe-area-context` 5.7.0
- `@expo/ngrok` 4.1.0 as a development-only Expo tunnel fallback
- NestJS 11 + TypeScript for the backend in `apps/api/`
- Prisma 7 with the PostgreSQL adapter and Supabase PostgreSQL
- pnpm 12.4.1 with an independent `apps/api/pnpm-lock.yaml`

## Dev A Responsibilities

- Mobile UI
- Navigation
- Mobile state and interaction
- API integration
- Loading, empty, and error states
- Client-side validation
- Mobile testing

## Dev B Responsibilities

- Backend
- Database
- API implementation
- Authentication backend
- Server-side business logic

## Current Project Status

- `apps/mobile/` is a runnable managed Expo + React Native + TypeScript application with a typed React Navigation foundation.
- The app has an Expo entry point, package manifest, app configuration, TypeScript configuration, navigation configuration, and pnpm lockfile.
- Splash has presentation-only UI, while Login and Register have keyboard-safe local forms with client-side validation and password visibility controls.
- Auth client infrastructure is implemented with a public environment-based base-URL configuration, shared JSON HTTP client, normalized Mobile error categories, Auth service boundary, and submission state handling.
- Register, Login, and Logout contracts are all pending Backend confirmation, so the Auth service does not send any request or define speculative request/response/token types.
- `apps/api/` contains the NestJS and Prisma connection foundation. It reads an untracked local `.env`, uses `DATABASE_URL` at runtime, and reserves `DIRECT_URL` for Prisma CLI. Its initial `User` model is defined locally, but no migration, endpoint, or authentication behavior has been created.
- Home, Search, Create, Notifications, and Profile remain navigation-only placeholders.
- No real authentication, endpoint integration, token storage, database migration, or social-feature behavior has been added.
- Static TypeScript, frozen-lockfile, Expo configuration, and Android JavaScript bundle validation have passed.
- BlueStacks with Expo Go SDK 57 has been manually verified. LAN is preferred for local testing, with Expo tunnel available as an intermittent fallback through the development-only `@expo/ngrok` dependency.
- Local Expo Go APK downloads are ignored and remain outside version control.

### Week 1 Mobile Status

- Mobile foundation: Complete.
- Navigation: Complete.
- Auth UI: Complete.
- Auth client foundation: Complete.
- Real Auth API integration: Blocked by pending Backend contract confirmation.
- Session persistence: Pending.
- Authenticated navigation: Pending.

## Current Sprint

Week 1 - Phase 5A: harden the Mobile Auth foundation and prepare Backend handoff while Auth contracts remain pending.

## Important Constraints

- Preserve existing implementation when it exists.
- Do not invent API endpoints or response shapes.
- Do not modify backend or database architecture from the Mobile scope without coordination.
- Avoid unnecessary dependencies and large abstractions.
- Support loading, success, empty, and error states for data-driven screens as features are implemented.
- Record every meaningful AI-assisted repository change in `docs/change.md`.

## Important Files

- `RULE.md` - repository and AI collaboration rules
- `docs/summary.md` - concise project context
- `docs/change.md` - append-only shared development activity log
- `docs/decisions.md` - technical decisions affecting both developers
- `docs/api-contract.md` - Mobile / Backend API contract template
- `docs/supabase_setup_instruction.md` - Dev A local dependency, Backend environment, and secret-handoff guide
- `apps/mobile/AGENTS.md` - Mobile-specific AI instructions
- `apps/mobile/README.md` - Mobile setup and contribution notes
- `apps/mobile/package.json` - verified Mobile scripts and dependencies
- `apps/mobile/app.json` - Expo application configuration
- `apps/mobile/index.ts` - Expo application entry point
- `apps/mobile/src/navigation/` - typed root, authentication, and tab navigators
- `apps/mobile/src/components/common/PlaceholderScreen.tsx` - shared safe placeholder container
- `apps/mobile/src/config/api.ts` - public Expo API base-URL configuration
- `apps/mobile/src/services/` - shared JSON HTTP client and normalized transport errors
- `apps/mobile/src/features/auth/` - Auth screens, reusable controls, local validation, service boundary, and submission state
- `apps/api/` - NestJS + Prisma configuration and Backend setup guide

## How to Continue Development

1. Have Dev B complete the Register, Login, Logout, and Session checklist in `docs/auth-backend-handoff.md` before implementing an endpoint call.
2. Map only confirmed API fields inside the Auth service, using the shared HTTP client without adding guessed response or token types.
3. Keep the temporary `RootNavigator` mode isolated until a later phase implements confirmed session bootstrap behavior.
4. Log each meaningful repository change in `docs/change.md`.
