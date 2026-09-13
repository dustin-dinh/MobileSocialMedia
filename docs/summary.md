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
- Placeholder screens are feature-owned; no feature behavior, API calls, or authentication implementation exists yet.

## Current Tech Stack

- Expo SDK 57 (`expo` 57.0.22)
- React Native 0.86.3
- React 19.2.3 and `expo-status-bar` 57.0.1
- TypeScript 6.0.3 using `expo/tsconfig.base` with strict checking
- pnpm 12.4.1 through Corepack, with `apps/mobile/pnpm-lock.yaml`
- React Navigation 7.3.18 with native-stack 7.18.10 and bottom-tabs 7.18.18
- Expo-compatible `react-native-screens` 4.26.2 and `react-native-safe-area-context` 5.7.0

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
- Login, Register, Splash, Home, Search, Create, Notifications, and Profile render only safe navigation placeholders.
- No real authentication, API integration, token storage, backend, database, or social-feature behavior has been added.
- Static TypeScript, frozen-lockfile, Expo configuration, and Android JavaScript bundle validation have passed.
- Android device/emulator runtime validation is pending because Android SDK command-line tools are not available on this workspace's `PATH`.

## Current Sprint

Week 1 - Phase 2: establish the Mobile navigation foundation before Authentication UI work begins.

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
- `apps/mobile/AGENTS.md` - Mobile-specific AI instructions
- `apps/mobile/README.md` - Mobile setup and contribution notes
- `apps/mobile/package.json` - verified Mobile scripts and dependencies
- `apps/mobile/app.json` - Expo application configuration
- `apps/mobile/index.ts` - Expo application entry point
- `apps/mobile/src/navigation/` - typed root, authentication, and tab navigators
- `apps/mobile/src/components/common/PlaceholderScreen.tsx` - shared safe placeholder container

## How to Continue Development

1. Keep the temporary `RootNavigator` mode isolated until Phase 5 replaces it with real session bootstrap.
2. Implement the next agreed Mobile slice within the existing feature-based structure without adding API assumptions.
3. Agree on API contracts in `docs/api-contract.md` before integrating network calls.
4. Log each meaningful repository change in `docs/change.md`.
