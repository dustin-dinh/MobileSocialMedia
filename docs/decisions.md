# Technical Decisions

## DEC-001 - Use feature-based organization for Mobile source

Date: 2026-09-13

Status: Accepted

### Context

The Mobile MVP contains several domains, including authentication, feed, posts, profile, search, and notifications. The project needs a structure that lets Dev A add each domain without concentrating all logic in one screen or file.

### Decision

Organize Mobile source under `apps/mobile/src/features/` by product feature, while keeping reusable UI, services, navigation, and shared types in application-wide directories.

### Reason

This matches the requested Mobile ownership boundaries and keeps feature-specific UI close to its feature while avoiding duplicated shared code.

### Consequences

- New feature behavior should be added to the relevant feature directory.
- Reusable components should not be placed inside an unrelated feature.
- The structure does not prescribe a framework or dependency until the Mobile toolchain is confirmed.

### Related Files

- `apps/mobile/src/`
- `apps/mobile/README.md`
- `docs/summary.md`

## DEC-002 - Use React Native + Expo + TypeScript for Mobile

Date: 2026-09-13

Status: Accepted

### Context

Phase 1 confirmed that the repository had no runnable Mobile application. The MVP has a four-week delivery window, targets Android, and needs a maintainable Mobile structure without custom native requirements or navigation work during bootstrap.

### Decision

Use a managed React Native application with Expo SDK 57 and TypeScript in `apps/mobile/`. Use pnpm 12.4.1 through Corepack for Mobile dependencies. Start from Expo's blank TypeScript shape with a thin `index.ts` entry point and a foundation component in `src/App.tsx`.

### Reason

Expo reduces initial Android setup work while retaining React Native and TypeScript for the planned Mobile architecture. The blank template avoids introducing navigation before Phase 2.

### Consequences

- Native Android and iOS folders are not committed during this managed Expo bootstrap.
- The application can be started with Expo and validated through TypeScript and Android JavaScript bundle export.
- Future non-secret API configuration will use Expo's `EXPO_PUBLIC_` environment-variable convention only after an API contract is agreed.
- Authentication, navigation, and API integration remain out of scope for this phase.

### Related Files

- `apps/mobile/package.json`
- `apps/mobile/app.json`
- `apps/mobile/index.ts`
- `apps/mobile/src/App.tsx`
- `apps/mobile/tsconfig.json`
- `apps/mobile/pnpm-lock.yaml`

## DEC-003 - Use React Navigation for Mobile navigation

Date: 2026-09-13

Status: Accepted

### Context

Phase 2 needs a typed Mobile navigation foundation that supports future authentication state switching and the five MVP top-level destinations without building product behavior or introducing a routing framework beyond the application's needs.

### Decision

Use React Navigation 7 in `apps/mobile/`: `@react-navigation/native` for the navigation container, `@react-navigation/native-stack` for Splash/Login/Register, and `@react-navigation/bottom-tabs` for Home/Search/Create/Notifications/Profile. Keep route parameter lists centralized in `src/navigation/types.ts`.

### Reason

React Navigation supports the managed Expo application and provides the native stack and bottom-tab primitives required by the agreed navigation hierarchy. It avoids an unnecessary filesystem router, global state library, icon dependency, or UI framework.

### Consequences

- `App.tsx` remains a small composition root rather than holding route configuration.
- The temporary root navigation mode is isolated in `RootNavigator` and must be replaced by real session bootstrap in Phase 5.
- Placeholder screens remain feature-owned until their relevant product phases add behavior.
- Navigation routes without parameters use `undefined`; future parameters should be added only when a confirmed feature requires them.

### Related Files

- `apps/mobile/src/App.tsx`
- `apps/mobile/src/navigation/`
- `apps/mobile/src/features/*/screens/`
- `apps/mobile/package.json`

## DEC-004 - Use a minimal fetch-based Mobile HTTP boundary until Auth contracts are confirmed

Date: 2026-09-14

Status: Accepted

### Context

Phase 4 needs a reusable Mobile networking foundation, but this repository contains no confirmed Register, Login, or Logout method, URL, request/response shape, error contract, or token/session field. The application must be ready for integration without teaching screens speculative backend details.

### Decision

Use Expo's public `EXPO_PUBLIC_API_BASE_URL` convention through `src/config/api.ts`, a small shared JSON client built on the platform `fetch`, and normalized Mobile transport error categories. Keep Register, Login, and Logout behind a feature-owned Auth service that performs no request until Dev B confirms the contract.

### Reason

This avoids an unnecessary HTTP dependency while giving future Auth integration one place for base-URL, JSON, and basic transport-error handling. It keeps raw requests and backend shapes out of screens without inventing endpoints, response fields, or token behavior.

### Consequences

- Screens retain local validation and delegate valid submissions to the Auth service boundary.
- The service must map only confirmed API fields and call the shared client when a contract exists.
- Missing configuration, network failures, HTTP 401 responses, server responses, and unknown failures can be represented consistently on Mobile.
- Session persistence and authenticated navigation remain Phase 5 responsibilities.

### Related Files

- `apps/mobile/src/config/api.ts`
- `apps/mobile/src/services/apiError.ts`
- `apps/mobile/src/services/httpClient.ts`
- `apps/mobile/src/features/auth/services/authService.ts`

## DEC-005 - Prefer Expo LAN development with a documented tunnel fallback

Date: 2026-09-14

Status: Accepted

### Context

The Mobile app is developed and manually tested with BlueStacks and Expo Go SDK 57. LAN has worked reliably for local testing, while Expo tunnel has also worked but can disconnect intermittently. The project already has the Expo-compatible `@expo/ngrok` package installed locally to support tunnel transport.

### Decision

Use `expo start --lan` as the documented default development workflow. Keep `expo start --tunnel` as a fallback through the development-only `@expo/ngrok` dependency, exposed by simple `start:lan` and `start:tunnel` package scripts.

### Reason

LAN is the preferred local transport. Retaining the verified tunnel fallback gives developers a documented option when LAN discovery or routing is unavailable, without adding an application runtime dependency or platform automation.

### Consequences

- `@expo/ngrok` is intentionally tracked as a Mobile dev dependency and lockfile entry.
- Developers should use tunnel only when LAN is unavailable and should expect intermittent tunnel disconnects.
- BlueStacks-specific environment workarounds are documented as machine-local troubleshooting rather than committed system configuration.
- Expo Go APK downloads remain ignored local artifacts.

### Related Files

- `apps/mobile/package.json`
- `apps/mobile/pnpm-lock.yaml`
- `apps/mobile/README.md`
- `.gitignore`

## DEC-006 - Configure the Backend with NestJS, Prisma 7, and Supabase connection roles

Date: 2026-09-16

Status: Accepted

### Context

The shared Backend/Supabase guide requires a NestJS backend using Prisma with one Supabase development database. The repository had no Backend package or connection configuration.

### Decision

Create `apps/api/` as an independent pnpm package. Use NestJS configuration to read an untracked `.env`; use `DATABASE_URL` through one global `PrismaService` at runtime and `DIRECT_URL` only through `prisma.config.ts` for Prisma CLI commands. Start with no models or migrations.

### Consequences

- Secrets remain local and `.env.example` contains placeholders only.
- Database schema work requires Dev B approval and a new Prisma migration; direct Dashboard edits and `prisma db push` remain prohibited for the shared database.
- API contracts, Auth behavior, and Mobile integration remain pending; this configuration adds none of them.

### Related Files

- `apps/api/`
- `BACKEND_SUPABASE_COLLAB_GUIDE.md`
- `docs/api-contract.md`

## DEC-007 - Establish the initial User schema without a database migration

Date: 2026-09-16

Status: Accepted

### Context

The MVP needs a stable identity model before Auth and social-feature models can be designed. The repository has a confirmed Prisma/Supabase connection but no database model.

### Decision

Define the initial Prisma `User` model with a UUID primary key, unique `username` and `email`, required `passwordHash`, optional profile fields (`displayName`, `avatarUrl`, `bio`), and creation/update timestamps. Do not create or apply a migration in this change.

### Consequences

- The model is only local schema source until Dev B creates a new migration.
- Later Auth endpoints must never return `passwordHash`.
- Future `Post`, `Follow`, `Like`, `Comment`, and `Notification` models will reference `User` in later, separately reviewed schema changes.

### Related Files

- `apps/api/prisma/schema.prisma`
- `docs/api-contract.md`
