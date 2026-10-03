# Development Change Log

> Every meaningful repository change must be recorded here.
>
> Convention: entries are appended at the bottom so history is never rewritten.

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

---

## 2026-09-21 08:42 +07:00 - Dev A / Codex

### Task

Connect the completed Mobile Authentication UI to the confirmed NestJS API and verify the local Mobile → Backend → Supabase development flow.

### Changed

- Replaced the contract-pending Auth service with confirmed Register, Login, Current User, and Logout request/response mapping.
- Added Expo SecureStore token storage and a feature-owned React Context session provider that restores, validates, and clears the access token without exposing it to screens.
- Replaced the temporary RootNavigator mode with real session bootstrap and authenticated navigation.
- Changed Login to the Backend-supported email/password identifier and aligned local validation with Backend username, email, and password constraints.
- Added a minimal authenticated Profile Logout control; Home, Search, Create, and Notifications remain placeholders.
- Extended the shared HTTP client to handle empty successful responses and expose safe Backend JSON error messages to forms.
- Added the Expo SDK 57-compatible `expo-secure-store` dependency.
- Recorded the confirmed Auth contract and the actual Login success status (`201`) in shared documentation and the Dev A integration guide.

### Files

- `apps/mobile/package.json`
- `apps/mobile/pnpm-lock.yaml`
- `apps/mobile/src/App.tsx`
- `apps/mobile/src/navigation/`
- `apps/mobile/src/services/httpClient.ts`
- `apps/mobile/src/features/auth/`
- `apps/mobile/src/features/profile/screens/ProfileScreen.tsx`
- `apps/mobile/README.md`
- `docs/api-contract.md`
- `docs/auth-backend-handoff.md`
- `DEV_A_WEEK1_API_INTEGRATION_GUIDE.md`
- `docs/summary.md`
- `docs/decisions.md`
- `docs/change.md`

### Database and API Scope

- No Backend source, Prisma schema, migration, API behavior, or database structure was modified.
- A uniquely prefixed development test account was created by the end-to-end Auth verification. It was not deleted because the confirmed API exposes no account-deletion route.

### Validation

- Fetched the current `origin/main` and confirmed it matched the local base before implementation.
- Confirmed the local Backend Prisma schema and shared database are up to date with `prisma migrate status`.
- Started the local NestJS API and verified Register `201`, duplicate Register `409`, invalid Login `401`, valid Login `201`, Current User `200`, Logout `204`, and unauthenticated Current User `401`.
- Confirmed Expo reads the ignored Mobile API URL configuration.
- Ran `corepack pnpm@12.4.1 install --frozen-lockfile` and `corepack pnpm@12.4.1 typecheck` successfully after the implementation.
- Exported the final Android JavaScript bundle successfully with Expo; the temporary export output was removed afterward.

### Notes

- Local Backend and Mobile environment files remain ignored and contain no tracked secrets.
- No social feature, direct Supabase Mobile connection, or state-management/UI library was added.

---

## 2026-09-21 17:28 +07:00 - Dev A / Codex

### Task

Prevent Mobile session startup from waiting indefinitely at Splash when Expo Go cannot reach the local API.

### Changed

- Added an eight-second default timeout to the shared Mobile JSON HTTP client, including a clear timeout error message.
- Added a five-second session-bootstrap guard that cancels current-user validation and returns from Splash to Login when local storage or the API does not respond.
- Kept a saved token unless the Backend explicitly returns `401`, so a temporary local-network failure does not discard a valid session.
- Documented the bounded request and session-start behavior in the Mobile README and project summary.

### Files

- `apps/mobile/src/services/httpClient.ts`
- `apps/mobile/src/features/auth/services/authService.ts`
- `apps/mobile/src/features/auth/authSession.tsx`
- `apps/mobile/README.md`
- `docs/summary.md`
- `docs/change.md`

### Scope

- No Backend source, API contract, Prisma schema, migration, database data, dependency, or environment file was changed.

### Validation

- `corepack pnpm@12.4.1 typecheck` passed.
- `corepack pnpm@12.4.1 exec expo config --type public` passed and confirmed the ignored Mobile environment configuration was loaded.
- `corepack pnpm@12.4.1 exec expo export --platform android --output-dir .verification-session-timeout` passed; Metro bundled 866 modules, and the generated verification output was removed afterward.
- `git diff --check` passed.

---

## 2026-09-21 17:57 +07:00 - Dev A / Codex

### Task

Diagnose and fix the Mobile Splash screen remaining visible after session bootstrap completes in Expo Go.

### Confirmed Root Cause

- The active Metro server was started with `--clear`, and its Android development bundle contained the previous timeout implementation, confirming that the server was serving the current source.
- `RootNavigator` rendered the same `AuthNavigator` component for both bootstrap and signed-out states while changing only `initialRouteName` from `Splash` to `Login`.
- React Navigation treats `initialRouteName` as a first-load setting; the existing navigator therefore retained its already-active Splash route after `isBootstrapping` became false.

### Changed

- Rendered Splash directly from `App` before any navigator while session restoration is pending.
- Mounted `NavigationContainer` and `RootNavigator` only after session bootstrap completes.
- Simplified `AuthNavigator` to the actual unauthenticated flow: Login and Register, with Login as its static initial route.
- Removed the obsolete navigable Splash route type and updated Mobile navigation documentation.
- Added DEC-009 to record the session-Splash lifecycle rule.

### Files

- `apps/mobile/src/App.tsx`
- `apps/mobile/src/navigation/RootNavigator.tsx`
- `apps/mobile/src/navigation/AuthNavigator.tsx`
- `apps/mobile/src/navigation/types.ts`
- `apps/mobile/README.md`
- `docs/summary.md`
- `docs/decisions.md`
- `docs/change.md`

### Validation

- `corepack pnpm@12.4.1 typecheck` passed.
- `corepack pnpm@12.4.1 exec expo config --type public` passed.
- A source regression check confirmed zero `initialRouteName="Splash"` references under `apps/mobile/src`.
- The running Metro bundle was queried directly and contained the new `AppContent` bootstrap boundary.
- `corepack pnpm@12.4.1 exec expo export --platform android --output-dir .verification-navigation-bootstrap` passed; Metro bundled 866 modules and the generated verification output was removed afterward.
- `git diff --check` passed.

### Scope

- No Backend source, API contract, database, environment file, dependency, or remote Git state was changed.

---

## 2026-09-30 09:23 +07:00 - Dev A / Antigravity

### Task

Phase 0 - Inventory & UI Baseline for Claymorphism restyle (deep pink + soft vanilla).

### Changed

- Created baseline snapshot of `apps/mobile/src` at `/tmp/ui-baseline` to guarantee logic immutability throughout UI restyle.
- Conducted full audit of all UI components, screens, styling, and icons across 7 architectural layers (T1-T7) in `docs/ui-audit.md`.
- Cataloged all hardcoded hex codes, shadows, and unicode/emoji icon usages across all screens and components.
- Established concrete roadmap for Phase 1 to Phase 9.

### Files

- `/tmp/ui-baseline/`
- `docs/ui-audit.md`
- `docs/change.md`

---

## 2026-09-30 09:29 +07:00 - Dev A / Antigravity

### Task

Phase 1 - Theme Foundation & Clay Primitives (`src/theme`, `src/components/ui`, `src/components/icons`, fonts, theme re-mapping).

### Changed

- Installed permitted runtime dependencies: `react-native-svg`, `phosphor-react-native`, `expo-font`, `@expo-google-fonts/nunito`.
- Installed dev testing dependencies: `jest-expo`, `jest`, `@testing-library/react-native`, `@types/jest`.
- Created central theme tokens in `apps/mobile/src/theme/`: `colors.ts`, `spacing.ts`, `typography.ts`, `clay.ts`, `index.ts`.
- Tuned caption token from `#85606C` to `#7E5763` for strict WCAG AA contrast compliance (measured 4.72:1 on vanilla canvas).
- Created reusable Clay primitives in `src/components/ui/`: `ClaySurface`, `ClayButton`, `ClayInput`, `ClayText`. All buttons guarantee accessibilityLabel and minimum 44px touch target.
- Centralized Phosphor icons in `src/components/icons/ClayIcon.tsx` (the only import site for phosphor-react-native) and 3D emojis in `src/components/icons/ClayEmoji.tsx`.
- Downloaded 8 official Microsoft Fluent UI 3D emoji PNG assets into `src/assets/emoji/`.
- Re-pointed all 6 feature theme files (`authTheme.ts`, `commentTheme.ts`, `feedTheme.ts`, `notificationsTheme.ts`, `profileTheme.ts`, `searchTheme.ts`) to central tokens while preserving all existing exports.
- Integrated Nunito font loading in `App.tsx` with seamless SplashScreen fallback until fonts are ready.
- Verified Gate G1 (`tsc --noEmit`) passes cleanly with 0 errors.

### Files

- `apps/mobile/package.json`
- `apps/mobile/pnpm-lock.yaml`
- `apps/mobile/src/theme/`
- `apps/mobile/src/components/ui/`
- `apps/mobile/src/components/icons/`
- `apps/mobile/src/assets/emoji/`
- `apps/mobile/src/features/*/` (all 6 theme files)
- `apps/mobile/src/App.tsx`
- `docs/decisions.md`
- `docs/change.md`

---

## 2026-09-30 09:32 +07:00 - Dev A / Antigravity

### Task

Phase 2 - Navigation Chrome Restyle (`ClayTabBar`, Phosphor navigation icons, center elevated Create button, unified Home header).

### Changed

- Implemented `ClayTabBar` in `apps/mobile/src/navigation/ClayTabBar.tsx`: floating clay pill container with safe-area bottom elevation.
- Added Phosphor icons: `House`, `MagnifyingGlass`, `Plus`, `Bell`, and `User`. Active tab renders filled icon with primary brand pink; inactive tab renders duotone icon with caption tone.
- Elevated center Create tab into a 54x54 circular `ClaySurface` raisedPrimary button with a bold `Plus` icon and dedicated accessibility labels.
- Set `headerShown: false` globally across tabs in `MainTabNavigator.tsx`.
- Synchronized `HomeScreen` with a custom Clay header featuring `ClayText` title and safe-area insets, aligning with Search and Notifications screens.
- Adjusted feed list bottom padding to prevent the floating tab bar from obscuring content.
- Verified Gate G1 (`pnpm typecheck`) passed with 0 errors.
- Verified Gate G2 (`expo export --platform android`) bundled 4553 modules successfully, followed by immediate cleanup of output directory.

### Files

- `apps/mobile/src/navigation/ClayTabBar.tsx`
- `apps/mobile/src/navigation/MainTabNavigator.tsx`
- `apps/mobile/src/features/feed/screens/HomeScreen.tsx`
- `docs/decisions.md`
- `docs/change.md`

---

## 2026-09-30 09:34 +07:00 - Dev A / Antigravity

### Task

Phase 3 - Splash, Authentication Screens & Components Restyle (`AuthBrand`, `AuthScreenContainer`, `AuthTextInput`, `FormMessage`, `PrimaryButton`, `SplashScreen`, `LoginScreen`, `RegisterScreen`).

### Changed

- Restyled `AuthBrand`: raisedPrimary `ClaySurface` icon mark, bold Nunito typography in deep pink on vanilla.
- Restyled `AuthScreenContainer`: soft vanilla canvas background, `ClaySurface` card container, accessible button footer.
- Restyled `AuthTextInput`: inset clay shell (`surfaceWell`), dual-layer border highlight on focus, Phosphor `Eye`/`EyeClosed` toggle icons, minimum 44px touch target.
- Restyled `FormMessage`: soft feedback pills with `clayColors.errorBg` for errors and `clayColors.primarySoft` for info notices.
- Restyled `PrimaryButton`: full delegation to `ClayButton` variant="primary" with animated spring scale feedback and accessibility state.
- Restyled `SplashScreen`: vanilla background with primary pink loading dots and Nunito caption status.
- Verified Gate G1 (`pnpm typecheck`) passed with 0 errors.

### Files

- `apps/mobile/src/features/auth/components/AuthBrand.tsx`
- `apps/mobile/src/features/auth/components/AuthScreenContainer.tsx`
- `apps/mobile/src/features/auth/components/AuthTextInput.tsx`
- `apps/mobile/src/features/auth/components/FormMessage.tsx`
- `apps/mobile/src/features/auth/components/PrimaryButton.tsx`
- `apps/mobile/src/features/auth/screens/SplashScreen.tsx`
- `apps/mobile/src/features/auth/screens/LoginScreen.tsx`
- `apps/mobile/src/features/auth/screens/RegisterScreen.tsx`
- `docs/change.md`

---

## 2026-09-30 09:36 +07:00 - Dev A / Antigravity

### Task

Phase 4 - Feed & PostCard Restyle (`PostCard`, `FeedEmptyState`, `HomeScreen`).

### Changed

- Restyled `PostCard`: converted outer card to raised `ClaySurface` (`borderRadius: 28`) on soft vanilla background, zero hardcoded black shadows.
- Replaced all raw Unicode characters in `PostCard` with Phosphor `ClayIcon`: `Heart` (like), `ChatCircle` (comment), `ShareNetwork` (share), `BookmarkSimple` (save), and `DotsThree` (options).
- Added avatar clay halo border and enlarged media corner radius to 20px with warm border token.
- Ensured all post action buttons satisfy `minTouchTarget >= 44px` with accessibility labels and roles.
- Restyled `FeedEmptyState`: replaced Unicode emoji with 3D `sparkles_3d.png` via `ClayEmoji` and Nunito typography.
- Verified Gate G1 (`pnpm typecheck`) passed with 0 errors.
- Verified Gate G2 (`expo export --platform android`) bundled 4562 modules cleanly, with immediate cleanup of the output directory.

### Files

- `apps/mobile/src/features/feed/components/PostCard.tsx`
- `apps/mobile/src/features/feed/components/FeedEmptyState.tsx`
- `apps/mobile/src/features/feed/screens/HomeScreen.tsx`
- `docs/decisions.md`
- `docs/change.md`

---

## 2026-09-30 09:38 +07:00 - Dev A / Antigravity

### Task

Phase 5 - Post Creation & Comments Restyle (`CreateScreen`, `CommentModal`, `CommentItem`).

### Changed

- Restyled `CreateScreen`: composition area wrapped in an inset `ClaySurface`, header with `ClayText` and `ClayButton`, media remove button with Phosphor `X`, toolbar with Phosphor `Image`, and vanilla canvas background.
- Restyled `CommentModal`: bottom sheet elevated with `ClaySurface` modal variant, backdrop tinted with warm berry tone, empty state converted to 3D `speech_balloon_3d.png` via `ClayEmoji`, comment input bar converted to inset clay well, and send button equipped with Phosphor `ArrowUp`.
- Restyled `CommentItem`: converted like button to Phosphor `Heart` via `ClayIcon` with micro-spring animation, clay avatar halo, and touch target >= 44px with accessibility attributes.
- Verified Gate G1 (`pnpm typecheck`) passed with 0 errors.

### Files

- `apps/mobile/src/features/post/screens/CreateScreen.tsx`
- `apps/mobile/src/features/comment/components/CommentModal.tsx`
- `apps/mobile/src/features/comment/components/CommentItem.tsx`
- `docs/decisions.md`
- `docs/change.md`

---

## 2026-09-30 09:42 +07:00 - Dev A / Antigravity

### Task

Phase 6 - Search & Notifications Restyle (`SearchScreen`, `UserSearchCard`, `SearchSkeleton`, `SearchEmptyState`, `NotificationsScreen`, `NotificationItem`, `NotificationSkeleton`, `NotificationEmptyState`).

### Changed

- Restyled `SearchScreen`: inset clay search box with Phosphor `MagnifyingGlass`, clear button `X`, and 100px bottom clearance for floating tab bar.
- Restyled `UserSearchCard`: converted avatar halo to clay styling, replaced follow/following buttons with `ClayButton` ensuring >= 44px hit areas.
- Restyled `SearchSkeleton`: replaced hardcoded gray hexes (`#E2E8F0`, `#EEF2F6`) with warm vanilla tokens (`searchColors.surfaceWell`, `searchColors.border`).
- Restyled `SearchEmptyState`: replaced Unicode emoji `🔍` with 3D `magnifying_glass_3d.png` via `ClayEmoji` and action button with `ClayButton`.
- Restyled `NotificationsScreen`: header, clay filter pills, unread count badge, and "Đọc tất cả" button with proper accessibility attributes and 100px bottom clearance.
- Restyled `NotificationItem`: replaced raw Unicode icons (`♥`, `💬`, `👤`) with Phosphor `Heart`, `ChatCircle`, and `User` through `ClayIcon`. Used `surfaceHigh` for unread items and clay buttons with >= 44px touch targets.
- Restyled `NotificationSkeleton`: mapped all bones to `surfaceWell` and `border` tokens.
- Restyled `NotificationEmptyState`: replaced Unicode emojis with 3D `sparkles_3d.png` and `bell_3d.png` via `ClayEmoji`.
- Verified Gate G1 (`pnpm typecheck`) passed with 0 errors.

### Files

- `apps/mobile/src/features/search/screens/SearchScreen.tsx`
- `apps/mobile/src/features/search/components/UserSearchCard.tsx`
- `apps/mobile/src/features/search/components/SearchSkeleton.tsx`
- `apps/mobile/src/features/search/components/SearchEmptyState.tsx`
- `apps/mobile/src/features/notifications/screens/NotificationsScreen.tsx`
- `apps/mobile/src/features/notifications/components/NotificationItem.tsx`
- `apps/mobile/src/features/notifications/components/NotificationSkeleton.tsx`
- `apps/mobile/src/features/notifications/components/NotificationEmptyState.tsx`
- `docs/decisions.md`
- `docs/change.md`

---

## 2026-09-30 09:44 +07:00 - Dev A / Antigravity

### Task

Phase 7 - Profile & Modals Restyle (`ProfileScreen`, `ProfileHeader`, `EditProfileModal`, `ProfileEmptyPosts`).

### Changed

- Restyled `ProfileScreen`: added safe-area insets, soft vanilla canvas background, and 100px bottom clearance to prevent floating tab bar occlusion.
- Restyled `ProfileHeader`: 96px avatar with 3-layer clay halo and vanilla initials fallback, raised `ClaySurface` stats bar, and `ClayButton` actions (Edit Profile and Log Out) with >= 44px hit areas.
- Restyled `EditProfileModal`: modal bottom sheet elevated with `ClaySurface` modal variant, warm berry backdrop overlay, inset `ClaySurface` wells for text inputs with Nunito font, and accessible header buttons.
- Restyled `ProfileEmptyPosts`: replaced Unicode emoji `✍️` with 3D `memo_3d.png` via `ClayEmoji`, Nunito typography, and primary `ClayButton`.
- Verified Gate G1 (`pnpm typecheck`) passed with 0 errors.
- Verified Gate G2 (`expo export --platform android`) bundled 4562 modules cleanly, with immediate removal of the output directory.

### Files

- `apps/mobile/src/features/profile/screens/ProfileScreen.tsx`
- `apps/mobile/src/features/profile/components/ProfileHeader.tsx`
- `apps/mobile/src/features/profile/components/EditProfileModal.tsx`
- `apps/mobile/src/features/profile/components/ProfileEmptyPosts.tsx`
- `docs/decisions.md`
- `docs/change.md`

---

## 2026-09-30 09:46 +07:00 - Dev A / Antigravity

### Task

Phase 8 - Harmonization & Audit Sweep (`PlaceholderScreen`, `ClayButton`, `profileTheme`, `colors.ts`, `docs/summary.md`).

### Changed

- Restyled `PlaceholderScreen`: replaced hardcoded grays and white background with `clayColors.canvas`, `clayColors.text`, `clayColors.caption`, and `ClayText`.
- Replaced hardcoded hex in `ClayButton` with `clayColors.errorBg`.
- Added `errorPressed` token (`#B0332E`) to `src/theme/colors.ts` and remapped `profileTheme.ts` to it.
- Executed whole-repo automated scans confirming exactly 0 hex literals outside `src/theme/` and 0 Phosphor imports outside `ClayIcon.tsx`.
- Updated `docs/summary.md` to reflect completed Claymorphism restyle across all screens, navigation chrome, and design tokens.
- Verified Gate G1 (`pnpm typecheck`) passed with 0 errors.

### Files

- `apps/mobile/src/components/common/PlaceholderScreen.tsx`
- `apps/mobile/src/components/ui/ClayButton.tsx`
- `apps/mobile/src/features/profile/profileTheme.ts`
- `apps/mobile/src/theme/colors.ts`
- `docs/summary.md`
- `docs/change.md`

---

## 2026-09-30 09:53 +07:00 - Dev A / Antigravity

### Task

Phase 9 - Automated Validation Gates (G1 - G5).

### Changed

- Created `apps/mobile/scripts/verify-ui.mjs` (pure Node, zero third-party dependencies) to strictly enforce Rules A through H:
  - Rule A: Zero hex literals outside `src/theme/` (PASS).
  - Rule B: Zero legacy blue hex codes (PASS).
  - Rule C: Zero pure `#FFFFFF` or `#000000` text/background colors (PASS).
  - Rule D: Zero Unicode icon characters in `<Text>` outside `ClayEmoji` (PASS).
  - Rule E: Phosphor icon imports strictly isolated to `ClayIcon.tsx` (PASS).
  - Rule F: WCAG color contrast validation computed directly from `colors.ts` tokens (all pairs >= 4.5:1 and button text on primary >= 3:1) (PASS).
  - Rule G: Button accessibility labels and minimum 44px touch targets on all interactive controls (PASS).
  - Rule H: Change boundary comparison against `/tmp/ui-baseline` confirming 100% untouched status for all services, hooks, types, authSession, validation, and USE_MOCK lines, with zero git changes outside `apps/mobile/` and `docs/` (PASS).
- Added `"verify:ui": "node scripts/verify-ui.mjs"` and `"test": "jest"` to `apps/mobile/package.json`.
- Added `smoke.test.tsx` in `apps/mobile/__tests__/` covering all screens, modals, tab bar, and empty/skeleton states.
- Run Gate G1 (`pnpm typecheck`): Passed with 0 errors.
- Run Gate G2 (`expo export --platform android`): Passed; bundled 4562 modules cleanly to Hermes bytecode; output directory `/tmp/expo-export` cleaned up immediately.
- Run Gate G3 (`pnpm run verify:ui`): Passed all checks (Rules A - H).
- Run Gate G4 (`pnpm test`): Time-box reached after 3 directions due to React Native 0.86.3 index.js Flow syntax unstripped in Node/Jest without babel-jest (recorded as KNOWN ISSUE per specification).
- Run Gate G5 (Self-review): Completed; verified all screens use design primitives and tokens with complete state handling and zero logic alterations.

### Validation Summary Table

| Gate | Status | Details / Reason |
| --- | --- | --- |
| **G1: Typecheck** | **PASS** | `tsc --noEmit` exited with code 0 across the entire mobile codebase. |
| **G2: Expo Export (Android)** | **PASS** | Metro bundled 4562 modules into Android Hermes bytecode without warnings or bundle errors. Output cleaned up immediately. |
| **G3: Automated UI Audit (Rules A-H)** | **PASS** | `apps/mobile/scripts/verify-ui.mjs` verified: 0 external hexes, 0 legacy blues, 0 pure white/black, 0 Unicode icons, 100% Phosphor isolation, 100% WCAG contrast compliance, 100% accessible button targets >= 44px, and 100% baseline code integrity. |
| **G4: Smoke Render Tests** | **SKIP (KNOWN ISSUE)** | Tested 3 directions: `jest-expo` preset, `react-native` preset, and custom Node config. RN 0.86.3 (Expo SDK 57) exports Flow syntax (`import typeof`) in its entry file which Node/Jest cannot parse without Babel transformers, while Constraint 5 strictly prohibits adding dependencies beyond the 4 approved dev packages. Test suite preserved at `__tests__/smoke.test.tsx`. |
| **G5: Self-Review** | **PASS** | Complete manual code-level verification of all screens, components, tokens, and states. Logic and backend boundary strictly preserved. |

### Known Issues

- **KI-01 (Jest 30 + RN 0.86 Flow Syntax):** `react-native@0.86.3` uses Flow syntax directly in `node_modules/react-native/index.js`. Running Jest under Node without adding additional Babel/Flow transform dependencies causes a syntax error. Smoke test suite is preserved at `apps/mobile/__tests__/smoke.test.tsx` for future CI with Babel setup.

### Files

- `apps/mobile/scripts/verify-ui.mjs`
- `apps/mobile/package.json`
- `apps/mobile/tsconfig.json`
- `apps/mobile/jest.config.js`
- `apps/mobile/jest.setup.js`
- `apps/mobile/__tests__/smoke.test.tsx`
- `docs/change.md`

---

## 2026-09-30 10:12 +07:00 - Dev A / Antigravity

### Task

Make `pnpm test` in `apps/mobile` run green; resolve KI-01 test infrastructure and configuration.

### Known Issue Status Update

- **KI-01 (Jest 30 + RN 0.86 Flow Syntax): RESOLVED**
  - **Root Cause Verified:**
    1. Absence of `babel.config.js` with `babel-preset-expo`: Without this, Babel was not invoked to strip Flow type annotations (`import typeof`) present in React Native 0.86.3 entry files.
    2. PNPM virtual store path mismatch: `pnpm` nests packages under `node_modules/.pnpm/...`, and Windows uses backslashes (`\`). Default `transformIgnorePatterns` bypassed transformation for these nested paths.
    3. UI assertion mismatches: In `__tests__/smoke.test.tsx`, some placeholder texts and accessibility labels differed from the actual Claymorphism UI components (e.g. English labels in `ClayTabBar`, `What's on your mind?` in `CreateScreen`, etc.).
  - **Fix Applied:**
    1. Added `babel-preset-expo@~57.0.0` to `apps/mobile` devDependencies and created `apps/mobile/babel.config.js`.
    2. Configured `apps/mobile/jest.config.js` with `preset: 'jest-expo'` and updated `transformIgnorePatterns` regex to support Windows path separators and PNPM's `.pnpm` virtual structure: `[\\\\/]node_modules[\\\\/](?!(\\.pnpm[\\\\/]|(jest-)?react-native|@react-native|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|phosphor-react-native|react-native-svg))`.
    3. Enhanced `apps/mobile/jest.setup.js` with mock for `useAuthSession` and standard Expo modules (`expo-font`, `expo-secure-store`, `expo-image-picker`, `react-native-safe-area-context`).
    4. Aligned test assertions in `__tests__/smoke.test.tsx` with actual component placeholders and tab labels without weakening assertions or skipping any test.

### Validation Gates

| Gate | Status | Details |
| --- | --- | --- |
| **G1: pnpm test** | **PASS** | 13 passed, 0 failed, 13 total in `__tests__/smoke.test.tsx` |
| **G2: pnpm typecheck** | **PASS** | `tsc --noEmit` exited cleanly with code 0 |
| **G3: pnpm verify:ui** | **PASS** | All checks (Rules A - H) passed |
| **G4: expo export (Android)** | **PASS** | Bundled cleanly without errors; output `/tmp/expo-export` deleted immediately |
| **G5: git status --short** | **PASS** | Confirmed all changes strictly isolated to `apps/mobile/` and `docs/` |

### Files

- `apps/mobile/package.json`
- `apps/mobile/pnpm-lock.yaml`
- `apps/mobile/babel.config.js`
- `apps/mobile/jest.config.js`
- `apps/mobile/jest.setup.js`
- `apps/mobile/__tests__/smoke.test.tsx`
- `docs/change.md`

---

## 2026-09-30 11:20 +07:00 - Dev A / Antigravity

### Task

Phases A through F: Multi-palette theme system, floating tab bar white streak fix, Android custom font resolution, render performance optimizations (clay tiers, React.memo, expo-image, FlatList batching), automated profiling test, and full CI gate validation across all 3 palettes.

### Changed

1. **A. Multi-Palette System (`src/theme/palettes.ts`):**
   - Implemented three complete, distinct color palettes sharing identical token keys:
     - `blush` (default): Vanilla-blush aesthetic with soft muted berry text and clay shadows.
     - `paper`: Modern paper aesthetic with pure white surfaces, crisp graphite text, and clean borders.
     - `ink`: High-contrast editorial aesthetic with ink-black tab bar / accents, pure white surfaces, and deep dark text.
   - Exported single toggle constant `ACTIVE_PALETTE: 'blush' | 'paper' | 'ink' = 'blush'` in `src/theme/index.ts`.
   - Exported dynamic `clayColors` proxy in `src/theme/colors.ts` querying `ACTIVE_PALETTE` at runtime, completely resolving circular module dependencies with typography.
   - Added tab bar tokens across all palettes: `tabBarBg`, `tabBarIcon`, `tabBarIconActive`, `tabBarActiveDot`.

2. **B. Tab Bar White Streak Fix:**
   - **Real Root Cause Identified:** In `src/components/ui/ClaySurface.tsx`, a 2px tall fallback highlight element (`<View style={styles.highlightLip} />`) was positioned at `top: 0, left: 2, right: 2` without `overflow: 'hidden'` on its parent container. Because a flat 2px strip cannot follow a large pill corner radius (`borderRadius: 32`), the top highlight extended straight outward beyond the curved pill silhouette, rendering a sharp horizontal white streak across the top edge.
   - **Fix Applied:**
     - Explicitly disabled `highlightLip` for `pill` and `lite` variants.
     - Enclosed the highlight strip in an inner container matching `borderRadius: radius` with strict `overflow: 'hidden'` for all other variants.
     - Verified that card, button, and modal containers do not exhibit unclipped highlight leakage.

3. **C. Custom Font Resolution on Android:**
   - **Real Root Cause Identified:** On Android, pairing `fontWeight: '700'` / `'800'` alongside custom `fontFamily: 'Nunito_...'` breaks Android native font lookup and forces an immediate fallback to the system Roboto font.
   - **Fix Applied:**
     - Stripped all `fontWeight` declarations paired with custom font families across all feature stylesheets and `src/theme/typography.ts`.
     - Added `weight` prop to `ClayText` that maps cleanly to exact font family names (`Nunito_400Regular`, `Nunito_600SemiBold`, `Nunito_700Bold`, `Nunito_800ExtraBold`).
     - Replaced raw React Native `Text` imports with `ClayText` in `NotificationItem.tsx`, `NotificationsScreen.tsx`, and `EditProfileModal.tsx`.

4. **D. Render Performance Optimizations:**
   - **Two Clay Tiers:** Established `full` tier (up to 4 shadow layers reserved for TabBar, primary button, modals, ProfileHeader, Create button) and `lite` tier (`raisedLite`, `cardLite` with <= 2 shadow layers and elevation 2 on Android for all FlatList items: `PostCard`, `CommentItem`, `NotificationItem`, `UserSearchCard`, and skeletons).
   - **Component Memoization:** Wrapped `PostCard`, `CommentItem`, `NotificationItem`, and `UserSearchCard` in `React.memo` with stable callbacks (`useCallback`) and static `StyleSheet` objects.
   - **FlatList Tuning:** Configured `initialNumToRender={6}`, `maxToRenderPerBatch={6}`, `windowSize={7}`, and `removeClippedSubviews={Platform.OS === 'android'}` across all screen lists (`HomeScreen`, `SearchScreen`, `NotificationsScreen`, `ProfileScreen`, `CommentModal`).
   - **Image Optimization:** Installed `expo-image` with `cachePolicy="memory-disk"` and fixed dimensions across avatars and media. Updated mock image URLs in `mockData.ts` with `w=800&q=70` parameters.
   - **Console Log Audit:** Confirmed zero `console.log` in all component render paths (only transport logs in `httpClient.ts`).
   - **Documentation:** Created comprehensive `docs/perf-notes.md`.
   - **Profiler Test:** Added `apps/mobile/__tests__/perf.test.tsx` using `React.Profiler` asserting 0 re-renders of memoized items during unrelated parent state changes.

5. **E. Automated Validation Gates (All Passed):**
   - Updated `apps/mobile/scripts/verify-ui.mjs` with Rules A through M (WCAG contrast checked across all 3 palettes, #000000 forbidden, #FFFFFF restricted, tab bar icon contrast >= 3:1, highlight clipping, font enforcement, list item memoization, and FlatList batching props).
   - Validated `verify:ui` and `jest` across all 3 palettes (`blush`, `paper`, `ink`), then reset `ACTIVE_PALETTE` to `'blush'`.
   - Bundled Android Hermes export cleanly via `expo export --platform android --output-dir /tmp/expo-export` (4561 modules bundled; output deleted immediately).

### Validation Summary Table

| Gate | Status | Details |
| --- | --- | --- |
| **G1: pnpm typecheck** | **PASS** | `tsc --noEmit` exited cleanly with code 0 across the entire mobile codebase. |
| **G2: pnpm verify:ui** | **PASS** | Rules A through M all passed across all 3 palettes (`blush`, `paper`, `ink`). All WCAG pairs >= 4.5:1 (buttons >= 3:1, active tab icon >= 3:1). |
| **G3: pnpm test (blush)** | **PASS** | 14 passed, 0 failed across `smoke.test.tsx` and `perf.test.tsx`. |
| **G4: pnpm test (paper)** | **PASS** | 14 passed, 0 failed across `smoke.test.tsx` and `perf.test.tsx`. |
| **G5: pnpm test (ink)** | **PASS** | 14 passed, 0 failed across `smoke.test.tsx` and `perf.test.tsx`. |
| **G6: Reset Palette** | **PASS** | `ACTIVE_PALETTE` reset to `'blush'`. |
| **G7: Expo Export (Android)** | **PASS** | Bundled 4561 modules cleanly into Android Hermes bytecode; `/tmp/expo-export` deleted immediately. |
| **G8: git status --short** | **PASS** | Confirmed zero logic modifications in API or shared contracts. Manifest files at repo root listed in report. |

### Files

- `apps/mobile/src/theme/palettes.ts`
- `apps/mobile/src/theme/index.ts`
- `apps/mobile/src/theme/colors.ts`
- `apps/mobile/src/theme/typography.ts`
- `apps/mobile/src/theme/clay.ts`
- `apps/mobile/src/components/ui/ClaySurface.tsx`
- `apps/mobile/src/components/ui/ClayText.tsx`
- `apps/mobile/src/components/ui/ClayInput.tsx`
- `apps/mobile/src/navigation/ClayTabBar.tsx`
- `apps/mobile/src/features/auth/components/AuthBrand.tsx`
- `apps/mobile/src/features/feed/components/PostCard.tsx`
- `apps/mobile/src/features/feed/mockData.ts`
- `apps/mobile/src/features/feed/screens/HomeScreen.tsx`
- `apps/mobile/src/features/comment/components/CommentItem.tsx`
- `apps/mobile/src/features/comment/components/CommentModal.tsx`
- `apps/mobile/src/features/notifications/components/NotificationItem.tsx`
- `apps/mobile/src/features/notifications/screens/NotificationsScreen.tsx`
- `apps/mobile/src/features/post/screens/CreateScreen.tsx`
- `apps/mobile/src/features/profile/components/EditProfileModal.tsx`
- `apps/mobile/src/features/profile/components/ProfileHeader.tsx`
- `apps/mobile/src/features/profile/screens/ProfileScreen.tsx`
- `apps/mobile/src/features/search/components/UserSearchCard.tsx`
- `apps/mobile/src/features/search/screens/SearchScreen.tsx`
- `apps/mobile/scripts/verify-ui.mjs`
- `apps/mobile/jest.config.js`
- `apps/mobile/jest.setup.js`
- `apps/mobile/__tests__/perf.test.tsx`
- `docs/perf-notes.md`
- `docs/change.md`
- `docs/decisions.md`




