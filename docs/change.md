# Development Change Log

> Every meaningful repository change must be recorded here.
>
> Convention: entries are appended at the bottom so history is never rewritten.

---

## 2026-09-13 10:33 +07:00 - Dev A / Codex

### Task

Create the initial Mobile foundation and shared documentation system for the Mobile Social Network MVP.

### Changed

- Added the initial `apps/mobile/src/` feature-based directory structure.
- Added Mobile agent instructions and a Mobile README.
- Added `docs/summary.md`, `docs/decisions.md`, and the API contract template.
- Added the AI/Codex change-tracking rule in `RULE.md`.

### Files

- `RULE.md`
- `apps/mobile/AGENTS.md`
- `apps/mobile/README.md`
- `apps/mobile/src/`
- `docs/summary.md`
- `docs/change.md`
- `docs/decisions.md`
- `docs/api-contract.md`

### Decisions

- Use a feature-based structure for Mobile source code.
- Keep shared UI, services, navigation, and shared types in dedicated application-wide areas.
- Do not assume a framework, package manager, API contract, or dependency because the workspace contains no existing project manifest.
- Keep the foundation documentation-first and do not implement MVP features yet.

### Validation

- Inspected the complete supplied workspace; no existing source, configuration, package files, lockfiles, or Git metadata were present.
- Verified that no backend implementation exists in the workspace and none was added.
- No build, lint, or test command was run because no package manifest or toolchain is present.

### Notes

- The repository-local Codex skill system was not present, so `apps/mobile/AGENTS.md` is the agent entrypoint for Mobile work.
- The Mobile run/install instructions remain intentionally uncommanded until a verified package manifest is added.

---

## 2026-09-13 11:02 +07:00 - Dev A / Codex

### Task

Week 1 - Phase 1 Mobile audit and foundation review before Authentication implementation.

### Changed

- Updated the project summary with the verified Git and Mobile project state.
- Recorded this Phase 1 audit in the shared development activity log.

### Files

- `docs/summary.md`
- `docs/change.md`

### Decisions

- No new architectural decision was made.
- Retained the existing feature-based Mobile foundation because it already matches the agreed ownership boundaries.

### Validation

- Read `RULE.md`, Mobile `AGENTS.md`, project summary, change log, and technical decisions.
- Inspected Git status, tracked files, project configuration, lockfiles, and the entire Mobile source tree.
- Confirmed that no package manifest, Mobile framework configuration, TypeScript configuration, source entrypoint, navigation dependency, environment configuration, aliases, lint/format/test scripts, or runnable Mobile application is present.
- No build, lint, test, install, or start command was run because no verified toolchain or script exists.

### Notes

- No Mobile source files were created, moved, or modified during this phase.
- No backend, database, API, or Week 2 functionality was touched.

---

## 2026-09-13 11:50 +07:00 - Dev A / Codex

### Task

Week 1 - Phase 1.5 Mobile application bootstrap.

### Changed

- Bootstrapped a managed React Native + Expo + TypeScript application directly in `apps/mobile/`.
- Added a pnpm-managed Mobile package manifest, Expo configuration, TypeScript configuration, and application entry point.
- Added the minimal foundation screen required to verify the runtime without adding authentication or navigation.
- Added root ignore rules for Mobile dependencies, Expo artifacts, generated native folders, local environment files, and debug output.
- Updated Mobile/project documentation and recorded the Mobile stack decision.

### Files

- `.gitignore`
- `apps/mobile/package.json`
- `apps/mobile/pnpm-lock.yaml`
- `apps/mobile/app.json`
- `apps/mobile/tsconfig.json`
- `apps/mobile/index.ts`
- `apps/mobile/src/App.tsx`
- `apps/mobile/README.md`
- `docs/summary.md`
- `docs/decisions.md`
- `docs/change.md`

### Decisions

- Use managed React Native + Expo SDK 57 + TypeScript for the Mobile MVP.
- Use pnpm 12.4.1 through Corepack for the Mobile package.
- Keep the blank TypeScript-style entry point and postpone navigation, authentication, API integration, and social features.
- Do not add a root pnpm workspace configuration while `apps/mobile` is the only JavaScript package.

### Validation

- `corepack pnpm install` completed successfully with 458 packages and generated `apps/mobile/pnpm-lock.yaml`.
- `corepack pnpm install --frozen-lockfile` passed with no downloads, confirming the lockfile can recreate the dependency set.
- `corepack pnpm typecheck` passed.
- `corepack pnpm exec expo config --type public` passed and resolved Expo SDK 57 with Android support.
- `corepack pnpm exec expo export --platform android` passed; Metro bundled 580 modules and produced an Android Hermes bundle. The generated `apps/mobile/dist/` output was removed after validation.
- `corepack pnpm start -- --offline --port 8082` started Expo at `http://localhost:8082` and was stopped immediately after verification.
- Android runtime was not tested because `adb` and `emulator` are not available on `PATH`.

### Notes

- No nested Git repository was added under `apps/mobile/`.
- No `package-lock.json`, `yarn.lock`, secrets, backend files, database files, authentication, navigation, or Week 2 features were added.

---

## 2026-09-13 12:21 +07:00 - Dev A / Codex

### Task

Week 1 - Phase 2 Mobile navigation foundation.

### Changed

- Added React Navigation with native stack and bottom-tab support, plus Expo-compatible screen and safe-area dependencies.
- Added a typed `RootNavigator`, `AuthNavigator`, `MainTabNavigator`, and centralized route parameter lists.
- Added safe placeholder screens for Splash, Login, Register, Home, Search, Create, Notifications, and Profile in their feature-owned directories.
- Added the smallest isolated temporary navigation mode for checking, unauthenticated, and authenticated topology validation; it does not authenticate, persist data, or call an API.
- Kept `App.tsx` as a small composition root for safe-area support, `NavigationContainer`, and `RootNavigator`.
- Updated Mobile and shared documentation with the established navigation architecture and decision.

### Files

- `apps/mobile/package.json`
- `apps/mobile/pnpm-lock.yaml`
- `apps/mobile/src/App.tsx`
- `apps/mobile/src/components/common/PlaceholderScreen.tsx`
- `apps/mobile/src/navigation/`
- `apps/mobile/src/features/*/screens/`
- `apps/mobile/README.md`
- `docs/summary.md`
- `docs/decisions.md`
- `docs/change.md`

### Decisions

- Use React Navigation 7 with native stack and bottom tabs for the Mobile navigation foundation.
- Keep the temporary root navigation mode isolated until Phase 5 replaces it with real session bootstrap.

### Validation

- `corepack pnpm typecheck` passed.
- `corepack pnpm install --frozen-lockfile` passed after retrying outside the sandbox; the first sandboxed attempt could not access the ignored `node_modules/.pnpm` directory.
- `corepack pnpm exec expo config --type public` passed and resolved Expo SDK 57 with Android support.
- `corepack pnpm exec expo export --platform android --output-dir <temporary directory>` passed; Metro bundled 850 modules. The temporary export directory was removed after validation.
- Android device/emulator runtime validation was not performed because Android SDK command-line tools are not available on `PATH`.

### Notes

- The Expo installer resolved compatible native dependency versions but could not spawn a bare `pnpm` executable on this workspace's `PATH`; Corepack pnpm installed those exact Expo-resolved versions successfully.
- No backend, database, token/session persistence, API calls, fake authentication, or social-feature behavior was added.

---

## 2026-09-13 15:25 +07:00 - Dev A / Codex

### Task

Week 1 - Phase 3 Authentication UI and local validation.

### Changed

- Replaced the Splash, Login, and Register placeholders with a consistent Mobile Social Auth UI.
- Added feature-owned reusable Auth controls for keyboard-safe layout, branding, form inputs, password visibility, primary actions, and form messages.
- Added local Login required-field validation and Register required-field, email-format, and password-confirmation validation.
- Added next-field keyboard focus, accessible labels, error hints, touch targets, and an explicit local notice that no authentication request is sent.
- Hid the native stack header for Auth routes so the screens own their safe-area presentation.
- Updated the Mobile README and project summary to describe Auth UI while keeping backend integration explicitly pending.

### Files

- `apps/mobile/src/features/auth/authTheme.ts`
- `apps/mobile/src/features/auth/validation.ts`
- `apps/mobile/src/features/auth/components/`
- `apps/mobile/src/features/auth/screens/SplashScreen.tsx`
- `apps/mobile/src/features/auth/screens/LoginScreen.tsx`
- `apps/mobile/src/features/auth/screens/RegisterScreen.tsx`
- `apps/mobile/src/navigation/AuthNavigator.tsx`
- `apps/mobile/README.md`
- `docs/summary.md`
- `docs/change.md`

### Decisions

- No new cross-project architectural decision was made.
- Retained the established feature-owned Auth structure and React Native `StyleSheet` convention without adding a UI framework or form library.

### Validation

- `corepack pnpm install --frozen-lockfile` passed after retrying outside the sandbox; the first sandboxed attempt could not access the ignored `node_modules/.pnpm` directory.
- `corepack pnpm typecheck` passed after correcting an unsupported React Native accessibility-state property.
- `corepack pnpm exec expo config --type public` passed and resolved Expo SDK 57 with Android support.
- `corepack pnpm exec expo export --platform android --output-dir <temporary directory>` passed; Metro bundled 857 modules. The temporary export directory was removed after validation.
- `corepack pnpm exec expo start --tunnel --clear` was attempted but could not start the local Android SDK ADB server because it failed to create `\.android`; no ADB or system configuration was changed.

### Notes

- Local form submission validates only and displays an honest not-connected notice. It does not call an API, save credentials, persist tokens, fake success, or navigate to the main tabs.
- Splash remains presentation-only. Phase 5 must replace `TEMPORARY_NAVIGATION_MODE` with real session bootstrap.
- Phase 3 runtime UI interaction remains pending until the local ADB/tunnel issue is resolved or a user manually runs the supported BlueStacks/Expo Go workflow.

---

## 2026-09-14 08:48 +07:00 - Dev A / Codex

### Task

Week 1 - Phase 4 Authentication client/API foundation.

### Changed

- Added public Expo API base-URL configuration under `src/config/` without committing an environment file or URL.
- Added a shared built-in `fetch` JSON client with relative-path enforcement, JSON request/response handling, and normalized configuration, network, unauthorized, server, and unknown errors.
- Added a feature-owned Auth service boundary and shared submission-state hook for idle, submitting, and error behavior with duplicate-submission prevention.
- Refactored Login and Register to retain local validation, delegate valid submissions to the Auth service, show loading/error-ready UI, and honestly report that no request is sent while the contract is pending.
- Recorded the missing Auth contract status and the minimal fetch-based boundary decision in shared documentation.

### Files

- `apps/mobile/src/config/api.ts`
- `apps/mobile/src/services/apiError.ts`
- `apps/mobile/src/services/httpClient.ts`
- `apps/mobile/src/features/auth/services/authService.ts`
- `apps/mobile/src/features/auth/hooks/useAuthSubmission.ts`
- `apps/mobile/src/features/auth/screens/LoginScreen.tsx`
- `apps/mobile/src/features/auth/screens/RegisterScreen.tsx`
- `apps/mobile/README.md`
- `docs/api-contract.md`
- `docs/summary.md`
- `docs/decisions.md`
- `docs/change.md`

### Decisions

- Added DEC-004: use a small fetch-based shared Mobile HTTP boundary and keep Auth endpoint calls disabled until Dev B confirms the API contract.

### Validation

- `corepack pnpm typecheck` passed.
- `corepack pnpm exec expo config --type public` passed and resolved Expo SDK 57 with Android support.
- `corepack pnpm exec expo export --platform android --output-dir <temporary directory>` passed; Metro bundled 860 modules. The temporary output directory was removed after validation.
- Reviewed the Auth/client scope: screens contain no raw HTTP call, the shared client contains the only `fetch`, no endpoint URL or token field was added, and no backend/database file changed.

### Notes

- Register, Login, and Logout are all MISSING: this repository contains no confirmed method, URL, request shape, response shape, error contract, or token/session field.
- No Auth API request/response types were created because no backend fields are confirmed.
- No dependency was added. The existing user-owned `@expo/ngrok` manifest/lockfile changes and untracked Expo Go APK were not modified or included.

---

## 2026-09-14 10:32 +07:00 - Dev A / Codex

### Task

Week 1 - Phase 5A Mobile hardening and Backend Auth handoff.

### Changed

- Reviewed the Login, Register, Splash, Auth submission, and client boundary behavior; no concrete UI or client code defect required a source refactor.
- Formalized the existing `@expo/ngrok` 4.1.0 change as a development-only Expo tunnel fallback and added verified `start:lan` and `start:tunnel` scripts.
- Documented the BlueStacks + Expo Go SDK 57 workflow with LAN as the preferred transport, tunnel as a fallback, and machine-local ADB troubleshooting guidance.
- Added a targeted ignore rule for local `Expo-Go-*.apk` artifacts, preserving the existing local APK without tracking it.
- Added the Auth Backend handoff checklist and aligned the API contract template to show every Auth endpoint as pending Backend confirmation.
- Updated Week 1 Mobile status and recorded DEC-005 for the shared local development workflow.

### Files

- `.gitignore`
- `apps/mobile/package.json`
- `apps/mobile/pnpm-lock.yaml`
- `apps/mobile/README.md`
- `docs/auth-backend-handoff.md`
- `docs/api-contract.md`
- `docs/summary.md`
- `docs/decisions.md`
- `docs/change.md`

### Decisions

- Added DEC-005: prefer Expo LAN development and retain the verified `@expo/ngrok` tunnel fallback as a dev-only dependency.

### Validation

- `corepack pnpm install --frozen-lockfile` passed after an approved retry outside the sandbox; the lockfile was current and no packages were downloaded.
- `corepack pnpm typecheck` passed.
- `corepack pnpm exec expo config --type public` passed and resolved Expo SDK 57 with Android support.
- `corepack pnpm exec expo export --platform android --output-dir <temporary directory>` passed; Metro bundled 860 modules. The verified temporary export directory was removed after validation.
- `corepack pnpm run start:lan -- --help` and `corepack pnpm run start:tunnel -- --help` both resolved the verified Expo transport commands without starting a development server.
- Reviewed the Auth/client boundary: screens contain no raw `fetch`, the shared HTTP client contains the only `fetch`, no endpoint URL or token shape was introduced, and no credential/token logging, backend/database change, APK, or generated export artifact is included.

### Notes

- Automated BlueStacks interaction was not run. BlueStacks + Expo Go SDK 57 had already been manually verified; the current runtime checklist remains the handoff for any further device check.
- Register, Login, Logout, and session details remain pending Backend confirmation. No request, token persistence, session bootstrap, fake authentication, or Phase 5B implementation was added.

---

## 2026-09-16 00:00 +07:00 - Dev B / Codex

### Task

Create the Backend and Prisma connection configuration after the shared Supabase development project was prepared.

### Changed

- Added the independent NestJS Backend package under `apps/api/` with pnpm scripts, TypeScript, and Nest CLI configuration.
- Added untracked-environment guidance through `.env.example`; no real connection URL, secret, token, or `.env` file was added.
- Added Prisma 7 configuration that uses `DIRECT_URL` for CLI commands and a global `PrismaService` that uses `DATABASE_URL` for the NestJS runtime through the PostgreSQL adapter.
- Added an intentionally model-free Prisma schema and Backend setup guide; no migration, table, API endpoint, or Auth behavior was created.
- Ignored Backend dependencies, build output, and generated Prisma Client.

### Files

- `.gitignore`
- `apps/api/`
- `docs/summary.md`
- `docs/decisions.md`
- `docs/change.md`

### Decisions

- Added DEC-006 for the already-agreed NestJS + Prisma + Supabase connection roles.

### Validation

- Installed the declared Backend dependencies with pnpm 12.4.1 and generated `apps/api/pnpm-lock.yaml`.
- Generated Prisma Client 7.10.0 with a process-only placeholder `DIRECT_URL`; no connection to Supabase was made.
- Ran `tsc --noEmit` successfully.

### Notes

- The machine's Corepack shim incorrectly looks for `pnpm.cjs` although pnpm 12 provides `pnpm.mjs`. Dependency installation and validation used the verified pnpm executable installed by Corepack directly; project scripts and the documented `corepack pnpm@12.4.1` commands remain the intended developer workflow.
- Before the API can run against Supabase, Dev B must create `apps/api/.env` locally from `.env.example` and paste the two connection strings directly from Supabase Project → Connect → ORM → Prisma.
- Database schema, migrations, and all Auth/API contracts remain pending agreement.

---

## 2026-09-16 00:00 +07:00 - Dev B / Codex

### Task

Document the local dependency setup and private Backend environment handoff for Dev A after Supabase connectivity was confirmed.

### Changed

- Added a Dev A onboarding guide that identifies ignored local dependencies and generated artifacts, with reproducible pnpm commands for Mobile and Backend.
- Documented the private `.env` handoff process, required variables, secret-handling rules, Prisma generation, verification, and Dev A database restrictions.
- Linked the guide from the project summary.

### Files

- `docs/dev-a-local-setup.md`
- `docs/summary.md`
- `docs/change.md`

### Validation

- Reviewed the guide against `.gitignore`, both package manifests/lockfiles, `apps/api/.env.example`, and the Backend/Supabase collaboration rules.

### Notes

- The guide contains placeholders only; no connection string, password, JWT secret, token, or local `.env` was added to the repository.

---

## 2026-09-16 00:00 +07:00 - Dev B / Codex

### Task

Define the initial Prisma `User` model without creating a migration.

### Changed

- Added `User` with a UUID identifier, unique username/email, password hash, optional profile fields, and timestamps.
- Documented DEC-007 and updated Backend/project status to clarify that the model exists only in local Prisma schema.

### Files

- `apps/api/prisma/schema.prisma`
- `apps/api/README.md`
- `docs/summary.md`
- `docs/decisions.md`
- `docs/change.md`

### Database Changes

- None. No migration was created, applied, edited, or deleted; Supabase schema and data are unchanged.

### API Changes

- None. No endpoint, request/response field, token behavior, or API contract was added.

### Validation

- Ran `prisma validate`, `prisma generate`, and `tsc --noEmit` successfully.
