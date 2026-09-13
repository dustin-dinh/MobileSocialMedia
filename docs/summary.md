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
- The current UI is a bootstrap-only foundation screen; feature screens, API calls, and navigation logic have not been implemented.

## Current Tech Stack

- Expo SDK 57 (`expo` 57.0.22)
- React Native 0.86.3
- React 19.2.3 and `expo-status-bar` 57.0.1
- TypeScript 6.0.3 using `expo/tsconfig.base` with strict checking
- pnpm 12.4.1 through Corepack, with `apps/mobile/pnpm-lock.yaml`

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

- `apps/mobile/` is a runnable managed Expo + React Native + TypeScript application.
- The app has a valid Expo entry point, package manifest, app configuration, TypeScript configuration, and pnpm lockfile.
- The foundation screen is intentionally the only Mobile UI; no authentication, navigation, API integration, backend, database, or Week 2 feature has been added.
- Static TypeScript, Expo configuration, Android JavaScript bundle, and local development-server startup validation have passed.
- Android device/emulator runtime validation is pending because Android SDK command-line tools are not available on this workspace's `PATH`.

## Current Sprint

Week 1 - Phase 1.5: bootstrap the Mobile application before Navigation or Authentication work begins.

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

## How to Continue Development

1. Confirm the Mobile framework, TypeScript status, package manager, and package scripts by adding or locating the Mobile project manifest.
2. Update this summary and `apps/mobile/README.md` with only verified commands and configuration.
3. Agree on API contracts in `docs/api-contract.md` before integrating network calls.
4. Implement the smallest Mobile slice within the feature-based structure and log the work in `docs/change.md`.
