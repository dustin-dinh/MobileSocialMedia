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




## 2026-10-03 17:15 +07:00 - Dev A / Claude Code

### Task

Prepare a proposal document for a Reel module and its recommendation system (plan and feasibility only, no code changes).

### Changed

- Added `docs/reel/Reel_Module_Proposal.pdf` (11 pages, Vietnamese): current project state, Reel scope, upload/view workflows, rule-based recommendation design, proposed tables and API, feasibility, risks, 6-phase plan, open decisions.
- The API routes and database tables in the document are proposals awaiting Dev B confirmation; `docs/api-contract.md`, `apps/api/`, and `apps/mobile/` were not modified.

### Files

- `docs/reel/Reel_Module_Proposal.pdf`
- `docs/change.md`

## 2026-10-03 19:10 +07:00 - Dev A / Claude Code

### Task

Connect the Mobile app to the live NestJS API from `main` (Week 2-3 endpoints + realtime notifications) and verify every integrated feature against a running backend.

### Changed

1. **Live/mock switch.** Added `src/config/runtime.ts` (`USE_MOCK_API`, driven by `EXPO_PUBLIC_USE_MOCK`). The app now uses the live API by default; every per-service `USE_MOCK*` flag and `BYPASS_AUTH_FOR_TESTING` read this one switch. Jest sets it to `true` in `jest.config.js`, so the unit suite still runs offline on mock data.
2. **HTTP client.** Added `requestForm` (multipart upload, 30s timeout) and `setUnauthorizedHandler`; a 401 now signs the user out to Login instead of leaving screens failing. Removed the request-header log line because it printed the JWT.
3. **Services mapped to the real response shapes** (no more silent fallback to mock data on 404/network errors):
   - Feed / user posts: `likeCount` -> `likesCount`, lower-case media `type`, nullable `content`, `meta.totalPages` -> `hasMore` (`feed/services/postMapper.ts`).
   - Create Post: `POST /posts` as multipart with repeated `images` field; server error message shown in the alert.
   - Comments: `GET|POST /posts/:id/comments` (create returns the writer as `user`, list as `author`).
   - Search / follow: `GET /users/search`, `POST|DELETE /users/:id/follow`; `isFollowing` derived from the signed-in user's following list (`services/followApi.ts`), self filtered out, empty query returns no rows.
   - Notifications: `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`; `readAt` -> `isRead`, follow-back state derived from the following list.
   - Profile: `GET /users/:id`, `GET /users/:id/posts`, follower/following totals from the follow list `meta.total`.
4. **Realtime.** Added `socket.io-client` and `notifications/services/notificationSocket.ts`; the auth session connects after login and disconnects on logout, and the Notifications screen reloads on `notification:new` and on reconnect.
5. **UI adjustments required by the real data:** follower count hidden in search cards when unknown, search shows a prompt instead of "no results" for an empty query, Edit Profile shows the error instead of failing silently.
6. **Backend (one change, needs Dev B review):** `apps/api/src/app.module.ts` now imports `SearchModule` before `UsersModule`. Before this, `GET /api/users/search` was captured by `GET /api/users/:id` and always returned `404 User not found`.
7. **Live test suite.** Added `__tests__/live/liveApi.test.ts` (18 tests driving the real Mobile services with two throwaway accounts) and `__tests__/live/nodeFetch.ts`. Skipped unless `LIVE_API=1`.

### Not available on the backend (Mobile behaviour)

- Bookmark/save and comment-like: no endpoint. Kept in memory for the current app session only.
- Edit profile (`PATCH /users/me`): no endpoint. The modal shows "Máy chủ chưa hỗ trợ cập nhật hồ sơ."
- Forgot password / verify code: no endpoint. `passwordResetService` is unchanged and still uses its own mock flag.
- Delete/edit post, reply UI, post previews inside notifications, suggested users: not present on one side or the other; unchanged.

### Validation

- `tsc --noEmit`: pass.
- `jest` (mock mode): 79/79 pass. `verifyCode.test.tsx` timed out once on a cold cache (`--no-cache`) and passed on every warm run; that file was not modified.
- `LIVE_API=1 jest __tests__/live` against a local backend on port 3100 and the shared dev database: 18/18 pass (auth, create text post, feed, follow/unfollow, search, like, comment, profile totals, notifications incl. mark read, realtime `notification:new`, logout).
- `expo export --platform android`: bundle builds.
- `node scripts/verify-ui.mjs`: Rules A-G and I-M pass. Rule H fails by design: it compares logic files with the `C:/tmp/ui-baseline` snapshot from the UI restyle, and it was already failing before this change (`navigation/types.ts`, `auth/validation.ts`).
- Not verified: image upload (local backend ran with a placeholder `SUPABASE_SERVICE_ROLE_KEY`), and on-device behaviour (no emulator was running).
- The live runs created test accounts named `qa_int_*` and `qa_live_*` with a few posts/comments in the shared dev database.

### Files

- `apps/mobile/src/config/runtime.ts`
- `apps/mobile/src/services/httpClient.ts`
- `apps/mobile/src/services/followApi.ts`
- `apps/mobile/src/features/auth/authSession.tsx`
- `apps/mobile/src/features/feed/services/feedService.ts`
- `apps/mobile/src/features/feed/services/postMapper.ts`
- `apps/mobile/src/features/post/services/postService.ts`
- `apps/mobile/src/features/post/hooks/useImagePicker.ts`
- `apps/mobile/src/features/post/screens/CreateScreen.tsx`
- `apps/mobile/src/features/comment/services/commentService.ts`
- `apps/mobile/src/features/search/services/searchService.ts`
- `apps/mobile/src/features/search/types.ts`
- `apps/mobile/src/features/search/screens/SearchScreen.tsx`
- `apps/mobile/src/features/search/components/UserSearchCard.tsx`
- `apps/mobile/src/features/search/components/SearchEmptyState.tsx`
- `apps/mobile/src/features/notifications/services/notificationService.ts`
- `apps/mobile/src/features/notifications/services/notificationSocket.ts`
- `apps/mobile/src/features/notifications/screens/NotificationsScreen.tsx`
- `apps/mobile/src/features/profile/services/profileService.ts`
- `apps/mobile/src/features/profile/components/EditProfileModal.tsx`
- `apps/mobile/__tests__/live/liveApi.test.ts`
- `apps/mobile/__tests__/live/nodeFetch.ts`
- `apps/mobile/jest.config.js`
- `apps/mobile/package.json`
- `apps/mobile/pnpm-lock.yaml`
- `apps/api/src/app.module.ts`
- `docs/change.md`
- `docs/decisions.md`

## 2026-10-03 19:50 +07:00 - Dev A / Claude Code

### Task

Fix the LogBox warning "Modal with 'pageSheet' presentation style and 'transparent' value is not supported."

### Changed

- `EditProfileModal` passed both `presentationStyle="pageSheet"` and `transparent` to `Modal`. React Native only supports `transparent` with `overFullScreen`. The modal is built as a bottom sheet over its own translucent backdrop, so `transparent` is the intended behaviour; removed `presentationStyle`, which lets React Native default to `overFullScreen` (same as `CommentModal`).

### Validation

- `tsc --noEmit` pass; `jest` 79/79 pass; no `presentationStyle` prop remains in `src/`.
- Not re-checked on a device.

### Files

- `apps/mobile/src/features/profile/components/EditProfileModal.tsx`
- `docs/change.md`

## 2026-10-03 20:25 +07:00 - Dev A / Claude Code

### Task

Fix "Unable to reach the server" when creating a post with an image.

### Changed

- Root cause (from the Metro log): `Error: Unsupported FormDataPart implementation`. Expo SDK 57 `fetch` does not accept React Native's legacy `{ uri, name, type }` file descriptor, so the request failed while its body was being built and never left the device; the HTTP client reported it as a network error.
- `postService` now builds each image part as `{ name, type, bytes() }`, reading the file through `File` from `expo-file-system` (the shape Expo's multipart encoder supports). Added `expo-file-system` (~57.0.7, already bundled with Expo) as a declared dependency.
- Default extension for images with an unknown file name is now `.jpg`.
- Added `__tests__/postUpload.test.ts`: runs the part through Expo's own `convertFormDataAsync`, and pins that the legacy descriptor is what it rejects.

### Validation

- `tsc --noEmit` pass; `jest` 82/82 pass.
- Backend restarted with the real `SUPABASE_*` values from `apps/api/.env`: a multipart `POST /api/posts` with a PNG returned 201 and the public URL served the identical bytes (test account `qa_upload_*`).
- Not yet confirmed on a device: reading the picked image with `File.bytes()` inside Expo Go.

### Files

- `apps/mobile/src/features/post/services/postService.ts`
- `apps/mobile/__tests__/postUpload.test.ts`
- `apps/mobile/package.json`
- `apps/mobile/pnpm-lock.yaml`
- `docs/change.md`


---

## 2026-10-06 - Reel final spec and plan

### Task

Merge `Reel_Module_Proposal.pdf` and the 4-week video/recommendation roadmap into one final spec and workflow plan, checked against the current code.

### Changed

- Added `docs/reel/REEL_FINAL_SPEC_AND_PLAN.md` (documentation only; no code, schema or API changed). All APIs/tables in it are proposals pending Dev B review.

### Files

- `docs/reel/REEL_FINAL_SPEC_AND_PLAN.md`
- `docs/change.md`


---

## 2026-10-06 - Google login plan

### Task

Plan Google Sign-In (mobile + backend) against the current auth code.

### Changed

- Added `docs/google-login/GOOGLE_LOGIN_PLAN.md` (documentation only; no code, schema or API changed). The endpoint and schema changes in it are proposals.

### Files

- `docs/google-login/GOOGLE_LOGIN_PLAN.md`
- `docs/change.md`

---

## 2026-10-06 - Google Sign-In implementation (Backend + Mobile)

### Task

Implement "Sign in with Google" across backend (`apps/api`) and mobile (`apps/mobile`) according to the approved specification `docs/google-login/GOOGLE_LOGIN_PLAN.md` and decisions D1–D6.

### Changed

- **Backend (`apps/api`)**:
  - Added dependency `google-auth-library`.
  - Added `GOOGLE_WEB_CLIENT_ID=` to `apps/api/.env.example`.
  - Updated Prisma schema: `passwordHash String?`, `googleId String? @unique`.
  - Created and deployed migration `20261006111500_add_google_login`, ran `prisma generate`.
  - `users.service.ts`: Added `findByGoogleId(googleId)` and `linkGoogle(userId, googleId)` (sets `googleId` and `passwordHash = null` per D2). Made `passwordHash`, `googleId`, `displayName`, `avatarUrl` optional in `create`.
  - Added `google-login.dto.ts` with `idToken` validation.
  - Added `google-verifier.service.ts` verifying ID token via `OAuth2Client` and `GOOGLE_WEB_CLIENT_ID`.
  - `auth.service.ts`: Implemented `loginWithGoogle` with token verification, email linking (D2), new user provisioning with username sanitization and collision retry (D3-D5), and safe null guard in `login` preventing `bcrypt.compare` crash (D6).
  - Added `POST /api/auth/google` endpoint in `auth.controller.ts` and registered `GoogleVerifierService` in `auth.module.ts`.
  - Documented endpoint in `docs/api-contract.md`.

- **Mobile (`apps/mobile`)**:
  - Installed `expo-dev-client` and `@react-native-google-signin/google-signin`.
  - Updated `app.json`: added `"scheme": "mobilesocial"`, `"android.package": "com.mobilesocial.app"`, and `@react-native-google-signin/google-signin` plugin.
  - Added `src/config/google.ts` with `getGoogleWebClientId` and `isGoogleSignInAvailable()`.
  - Added official Google 4-color palette tokens to `src/theme/colors.ts` (`googleBrandColors`) adhering to Rule A.
  - Added `src/features/auth/services/googleSignIn.ts` using lazy-required native module with `GoogleSignInError` normalization.
  - Updated `authService.ts`: Added `loginWithGoogle` and extracted `extractValidAccessToken`.
  - Updated `authSession.tsx`: Added `signInWithGoogle`, factored out `finishSignIn`, and added best-effort `googleSignIn.signOut()`.
  - Updated `useAuthSubmission.ts`: Handled `GoogleSignInError` ('cancelled' resets silently, 'play_services_unavailable' alerts user).
  - Created `GoogleLogo.tsx` (official 20x20 SVG), `GoogleButton.tsx` (`ClayButton variant="secondary"`, minHeight 52, 100% width), and `AuthDivider.tsx`.
  - Updated `LoginScreen.tsx` & `RegisterScreen.tsx`: Render `AuthDivider` + `GoogleButton` directly below PrimaryButton when `isGoogleSignInAvailable()` is true.
  - Added architectural record `DEC-019` in `docs/decisions.md`.

### Validation

- Backend: `corepack pnpm exec tsc --noEmit` passed with 0 errors; `prisma validate` passed.
- Mobile: `corepack pnpm exec tsc --noEmit` passed with 0 errors.
- Mobile: `corepack pnpm exec jest` passed 9/9 suites, 82/82 tests.
- Mobile: `node scripts/verify-ui.mjs` passed Rules A–G and I–M (Rule H is expected baseline failure per DEC-017).

### Files

- `apps/api/package.json`
- `apps/api/pnpm-lock.yaml`
- `apps/api/.env.example`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/20261006111500_add_google_login/migration.sql`
- `apps/api/src/modules/users/users.service.ts`
- `apps/api/src/modules/auth/dto/google-login.dto.ts`
- `apps/api/src/modules/auth/google-verifier.service.ts`
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/auth.controller.ts`
- `apps/api/src/modules/auth/auth.module.ts`
- `apps/mobile/package.json`
- `apps/mobile/pnpm-lock.yaml`
- `apps/mobile/app.json`
- `apps/mobile/src/theme/colors.ts`
- `apps/mobile/src/config/google.ts`
- `apps/mobile/src/features/auth/services/googleSignIn.ts`
- `apps/mobile/src/features/auth/services/authService.ts`
- `apps/mobile/src/features/auth/authSession.tsx`
- `apps/mobile/src/features/auth/hooks/useAuthSubmission.ts`
- `apps/mobile/src/features/auth/components/GoogleLogo.tsx`
- `apps/mobile/src/features/auth/components/GoogleButton.tsx`
- `apps/mobile/src/features/auth/components/AuthDivider.tsx`
- `apps/mobile/src/features/auth/screens/LoginScreen.tsx`
- `apps/mobile/src/features/auth/screens/RegisterScreen.tsx`
- `docs/api-contract.md`
- `docs/decisions.md`
- `docs/change.md`

---

## 2026-10-06 - Post Features UI (5 features: More Options, Share, Privacy, Edit, Delete)

### Task

Build UI for 5 post management features in `apps/mobile` (Luân - Dev A):
1. More options modal (`PostOptionsModal.tsx`): Author actions (edit, change privacy, delete) vs viewer actions (share, bookmark, hide, report).
2. Share post bottom sheet (`SharePostModal.tsx`): Preview card, copy link, repost to feed, direct message, system share.
3. Post privacy selector (`PostPrivacyModal.tsx` & `PrivacyPill`): PUBLIC, FRIENDS, ONLY_ME options, integrated into creation and post cards.
4. Edit post modal (`EditPostModal.tsx`): Header with save action, author info with privacy pill, multiline text input (max 500 chars), existing media preview, real-time feed event emission.
5. Delete post confirmation dialog (`DeletePostModal.tsx`): Custom Clay confirmation dialog with error badge, destructive button, real-time feed removal.

### Changed

- **UI Components (`apps/mobile/src/features/post/components/`)**:
  - `PostPrivacyModal.tsx`: Bottom sheet modal with options (Public, Friends, Only me) and reusable `PrivacyPill` component.
  - `PostOptionsModal.tsx`: Bottom sheet action menu conditionally showing author vs non-author actions.
  - `SharePostModal.tsx`: Share bottom sheet with post preview, copy link feedback, repost, and system share.
  - `EditPostModal.tsx`: Modal for editing post content and privacy with character counter and validation.
  - `DeletePostModal.tsx`: Centered Clay confirmation dialog with warning icon and destructive action.
- **Icon Registry (`apps/mobile/src/components/icons/ClayIcon.tsx`)**:
  - Added Phosphor icons: `PencilSimple`, `Trash`, `GlobeSimple`, `Users`, `LockKey`, `LinkSimple`, `Export`, `Flag`, `EyeSlash`, `Repeat`, `WarningCircle`, `Camera`.
- **Feed & Post Domain**:
  - `apps/mobile/src/features/feed/types.ts`: Added `PostPrivacy` type and `privacy?: PostPrivacy` to `Post`.
  - `apps/mobile/src/features/feed/feedEvents.ts`: Added `postDeleted` and `postUpdated` events and helper emitter methods.
  - `apps/mobile/src/features/post/services/postService.ts`: Added `updatePost`, `deletePost`, and `updatePrivacy` (supporting offline mock and live API).
  - `apps/mobile/src/features/feed/components/PostCard.tsx`: Connected three-dots button to `PostOptionsModal`, share button to `SharePostModal`, added privacy badge in header meta, and rendered all modals.
  - `apps/mobile/src/features/post/screens/CreateScreen.tsx`: Added `PrivacyPill` and `PostPrivacyModal` to allow privacy selection upon post creation.
  - `apps/mobile/src/features/feed/screens/HomeScreen.tsx` & `ProfileScreen.tsx`: Subscribed to `postDeleted` and `postUpdated` for instant feed updates.

### Validation

- `corepack pnpm --filter @mobile-social/mobile exec tsc --noEmit`: PASS (0 errors).
- `node scripts/verify-ui.mjs`: PASS (Rules A–G, I–M).
- `corepack pnpm --filter @mobile-social/mobile exec jest`: PASS (9/9 suites, 82 passed tests).

### Files

- `apps/mobile/src/components/icons/ClayIcon.tsx`
- `apps/mobile/src/features/feed/types.ts`
- `apps/mobile/src/features/feed/feedEvents.ts`
- `apps/mobile/src/features/post/services/postService.ts`
- `apps/mobile/src/features/post/components/PostPrivacyModal.tsx`
- `apps/mobile/src/features/post/components/PostOptionsModal.tsx`
- `apps/mobile/src/features/post/components/SharePostModal.tsx`
- `apps/mobile/src/features/post/components/EditPostModal.tsx`
- `apps/mobile/src/features/post/components/DeletePostModal.tsx`
- `apps/mobile/src/features/feed/components/PostCard.tsx`
- `apps/mobile/src/features/post/screens/CreateScreen.tsx`
- `apps/mobile/src/features/feed/screens/HomeScreen.tsx`
- `apps/mobile/src/features/profile/screens/ProfileScreen.tsx`
- `docs/change.md`



---

## 2026-10-12 - Reel recommendation production plan (PDF)

### Task

Plan how to take Reels and its recommendation system to production level, with several options and their trade-offs.

### Changed

- Added `docs/reel/REEL_RECSYS_PRODUCTION_PLAN.pdf` (documentation only; no code, schema or API changed). It builds on `docs/reel/REEL_FINAL_SPEC_AND_PLAN.md`; all tables and endpoints in it are proposals pending Dev B review.

### Files

- `docs/reel/REEL_RECSYS_PRODUCTION_PLAN.pdf`
- `docs/change.md`


---

## 2026-10-12 - Feature gap checklist

### Task

List the small but required social-network features the project is still missing, in detail, checked against the current code.

### Changed

- Added `docs/FEATURE_GAP_CHECKLIST.md` (documentation only; no code, schema or API changed). All endpoints and tables in it are proposals. It also records defects found while reading the code (section 1), including `GET /users/:id/posts` not filtering by post privacy.

### Files

- `docs/FEATURE_GAP_CHECKLIST.md`
- `docs/change.md`


---

## 2026-10-12 - Feature-gap batch (backend + mobile) and Reels UI

### Task

Implement the items in `docs/FEATURE_GAP_CHECKLIST.md`: fix the flows that only worked in mock mode, add the small features the app was missing, and build the Reels UI. Backend written in the smallest-change style; mobile keeps the existing Claymorphism components and feature folders. Branch `feat/gap-checklist`, nothing committed.

### Changed

- **Database (`apps/api/prisma`)**: additive migration `20261012090000_add_gap_features` (applied to the Supabase database): tables `Block`, `Report`, `Save`, `CommentLike`, `HiddenPost`, `DeviceToken`; columns `User.onboardedAt`, `Comment.editedAt`. Existing users are back-filled with `onboardedAt = createdAt`.
- **Backend (`apps/api`)**:
  - New `modules/posts/post-view.ts`: the single post-visibility rule, shared post select and DTO, block lookup. Used by feed, post detail, profile posts, comments, likes, save, repost and search. This fixes `GET /users/:id/posts` returning private posts, and the same gap in comments and likes.
  - Users: profile edit, avatar upload/removal, account deletion (with stored files), onboarding completion, block/unblock, blocked list, follow suggestions, reposts by user; profile now reports follow totals and relation flags.
  - Posts: feed rows carry `privacy`, `isSaved`, `isReposted`, `repostsCount`; save, hide, saved list, text search, likers list; repost notifies the author.
  - Comments: edit, like, delete by the post's author, `commentsCount` returned on delete, replies limited to two levels.
  - Auth: `PATCH /auth/password`, `EMAIL_NOT_VERIFIED` error code, access token lifetime 30 days, rate limits (`@nestjs/throttler`), `trust proxy`.
  - Notifications: one `notify()` entry point, new types `REPLY`, `REPOST`, `MENTION`, Expo push delivery, device-token endpoints. New `reports` module.
  - Mail: both code emails now say not to share the code.
  - `scripts/seed-test-users.cjs` and `scripts/api-smoke.cjs` for checking the API.
- **Mobile (`apps/mobile`)**:
  - Auth: email-verification step after register and on unverified login; password reset now calls the real endpoints and has a new-password screen (`passwordResetService` no longer hard-codes mock mode).
  - Navigation: `MainStackNavigator` around the tabs; new screens UserProfile, PostDetail, PostLikes, FollowList, SavedPosts, Settings, ChangePassword, DeleteAccount, BlockedUsers, Legal, Intro, Onboarding; deep links `mobilesocial://p/:postId` and `mobilesocial://u/:userId`.
  - Feed: mapper understands repost rows and maps `PRIVATE` to the app's `ONLY_ME` (creating an "only me" post used to be rejected by the API); infinite scroll with the end-of-feed message; repost, save, hide and report call the API; hashtags and mentions are tappable.
  - Comments: reply, edit, delete with confirmation pop-up, like, paging; the thread is shared by the comment sheet and the Post detail screen.
  - Profile: other users' profiles with follow, block and report; avatar change; Posts / Reposts tabs; tappable follower totals. Sign-out moved to Settings.
  - Search: suggestions when the box is empty, post search tab, tap a user to open the profile.
  - Notifications: tap opens the post or profile; unread badge on the tab; new notification types.
  - Reels (`src/features/reel/`): vertical player, overlay, view tracker, sample-video service, video picker (posting a video works in mock mode only).
  - Shared components under `src/components/common/`: ConfirmModal, ActionSheet, toast, ScreenHeader, UserAvatar, UserRow, UserListScreen, ListFooter, LoadError, RichText, ErrorBoundary.
  - Fixed the 16 TypeScript errors that existed before this batch (icon declarations, two wrong font keys, an unsupported icon prop), and a stale-closure bug that could post with the previous privacy setting.
  - Dependencies added: `expo-video`, `expo-clipboard`, `expo-notifications`.
- **Docs**: `docs/api-contract.md` (new endpoints), `docs/decisions.md` (DEC-020), status table in `docs/FEATURE_GAP_CHECKLIST.md`.

### Validation

- API: `tsc --noEmit` clean, `nest build` OK. `scripts/api-smoke.cjs` against the running API: 70 of 71 checks passed; the remaining one was a wrong assertion in the script (since corrected), the rate limit itself behaved as intended.
- Mobile: `tsc --noEmit` 0 errors (16 before). `jest`: 94 passed. `verify-ui.mjs`: rules A–G and I–M pass; Rule H fails exactly as before this batch (it compares against an old baseline directory).
- Mobile services against the running API: `__tests__/live/gapLive.test.ts` 14/14, `__tests__/live/liveApi.test.ts` 20/20 (two of those are `it.failing`, recording that the feed returns every public post instead of only followed users').
- **Not verified:** nothing was run on a device or emulator. Unchecked there: the video player, image/video pickers, avatar upload from the app, push notifications, Google Sign-In, deep links, the intro and onboarding screens.

### Files

- `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20261012090000_add_gap_features/`
- `apps/api/src/app.module.ts`, `apps/api/src/main.ts`, `apps/api/src/modules/{auth,comments,follows,likes,mail,notifications,posts,reports,search,storage,users}/`
- `apps/api/scripts/`, `apps/api/package.json`, `apps/api/pnpm-lock.yaml`
- `apps/mobile/src/` (features `auth`, `comment`, `feed`, `notifications`, `onboarding`, `post`, `profile`, `reel`, `report`, `search`, `settings`; `components/common`, `navigation`, `services`, `App.tsx`)
- `apps/mobile/__tests__/`, `apps/mobile/jest.setup.js`, `apps/mobile/types/phosphor-icons.d.ts`, `apps/mobile/app.json`, `apps/mobile/package.json`, `apps/mobile/pnpm-lock.yaml`
- `docs/api-contract.md`, `docs/decisions.md`, `docs/FEATURE_GAP_CHECKLIST.md`, `docs/change.md`


---

## 2026-10-12 - Mobile finds the local backend by itself in development

### Task

Stop "Unable to reach the server" from coming back every time the development computer gets a new LAN address.

### Changed

- `apps/mobile/src/config/api.ts`: when `EXPO_PUBLIC_API_BASE_URL` is not set and the app runs in development, the API URL is `http://<host the JS bundle was loaded from>:3000/api` (the LAN IP on a phone, `10.0.2.2` on an Android emulator). An explicit `EXPO_PUBLIC_API_BASE_URL` still wins and is still required for a deployed backend or when Metro runs behind a tunnel. The URL in use is logged once at startup (`[api] Backend URL: …`).
- `apps/mobile/.env.local` (ignored by git) no longer pins an address.

### Validation

- `tsc --noEmit` clean; `jest` 94 passed.
- The bundle served by Metro no longer contains the stale address. Not yet confirmed on a device that the detected address is the right one.

### Files

- `apps/mobile/src/config/api.ts`
- `docs/change.md`


---

## 2026-10-12 - Root README: how to run the backend and the mobile app

### Task

Document the commands to run the backend and the mobile app.

### Changed

- Rewrote the root `README.md` (it only held the project title, saved as UTF-16; it is now UTF-8): run commands for `apps/api` and `apps/mobile`, how to open the app on BlueStacks / Android / iPhone, mock mode, and the connection problems met while testing with their fixes.

### Files

- `README.md`
- `docs/change.md`


---

## 2026-10-12 - Binding rule: everything must work on Android and iOS

### Task

Make "runs on both Android and iOS" a rule that every AI agent entering the project has to follow.

### Changed

- `RULE.md`: new section "Cross-Platform Rule (Android + iOS)" with 12 checkable rules (no platform-only APIs, paired permissions, `app.json` valid for both, store requirements, and stating which platforms a change was actually run on).
- New root `AGENTS.md` and `CLAUDE.md`: entry points that send every agent to `RULE.md` (`CLAUDE.md` imports it).
- `apps/mobile/AGENTS.md`: new "Android and iOS" section pointing at the rule.

### Platforms run

Documentation only; nothing to run.

### Files

- `RULE.md`, `AGENTS.md`, `CLAUDE.md`, `apps/mobile/AGENTS.md`, `docs/change.md`

---

## 2026-10-12 - Mobile UI redesign: flat content-first layout, card feed, in-app pop-ups only

### Task

Redesign the Mobile UI: calm, content-first layout (Threads-like) everywhere, rounded cards only for feed posts (moderate radius), same colours and font, and no operating-system pop-ups - the app shows its own.

### Changed

- **Tokens** (`src/theme`): radii lowered (`control`/`card` 12, `media` 10, `dialog` 16, `modal` 20); one light shadow kept for floating layers only (`getClayBoxShadow('floating')`), cards and buttons are flat with a 1px border; `title` 22/28 and `heading` 16/22 in bold; heavy Nunito weights (ExtraBold, Black) and duotone icons are no longer used by screens.
- **Shared components**: `ClaySurface` gained `dialog`, `flat`, `rowLite`; the highlight lip is gone. `ClayButton`, `ClayInput`, `AuthTextInput` are flat. `ClayButton` now renders plain-text children as its label (see Fixed).
- **Tab bar**: attached to the bottom edge with a hairline (was a floating pill); it absorbs the bottom safe-area inset, so the per-screen bottom paddings for the floating bar were removed.
- **Feed**: `PostCard` is a 12px-radius card with a hairline border, avatar 40, media radius 10. Action row is like, comment, repost, share (each with its count). Repost is one tap on the card; Save moved to the "..." menu only. Home header: title left, compact "Bang tin | Reels" switch.
- **Flat screens**: profile header is left-aligned (name and bio left, avatar right, one line of counts, two outline buttons, underline tabs); Settings is a flat list with section headers; auth screens lost their card; search rows, comment rows and notification rows lost avatar halos and shadows.
- **Pop-ups**: every `Alert.alert` is gone (10 call sites). Errors use `showToast`; confirmations use `ConfirmModal` (discard post, discard edits, delete post). `DeletePostModal` is now a thin wrapper over `ConfirmModal`. `showToast` reaches every mounted `ToastHost`, and a host is mounted inside `ConfirmModal`, `CommentModal`, `EditPostModal` and `EditProfileModal`, because a native modal covers the root host. Reposting from the share sheet no longer asks for confirmation (it is one tap to undo).
- **`app.json`**: added `ios.bundleIdentifier` and the iOS photo-library usage text (`expo-image-picker` plugin), required by the cross-platform rule.

### Fixed

- `ConfirmModal` buttons showed no text and raised "Text strings must be rendered within a <Text> component": `ClayButton` rendered string children raw. Found on the emulator, fixed in `ClayButton`, covered by `__tests__/clayButton.test.tsx`.
- Profile action buttons did not share the row width (`ClayButton` puts `style` on its inner pressable); they are wrapped now.

### Not changed

- Colours, the Nunito family, the five tabs, hooks, services, API calls, backend, and the `Clay*` component names.
- Still operating-system UI by nature: the system share sheet ("Other share options") and permission prompts.

### Checks

- `pnpm exec tsc --noEmit`: clean. `pnpm exec jest`: 95 passed (2 live suites skipped). `node scripts/verify-ui.mjs`: rules A-G and I-M pass; rule H fails as it did before this change (baseline comparison).

### Platforms run

- **Android emulator (BlueStacks, Expo Go), real API**: home feed, Reels pane, search, notifications, own profile, settings, post "..." menu, share sheet, comment sheet, create screen, sign-out confirmation - looked at on screen.
- **Not looked at on any device**: login / register / intro / onboarding, edit-profile and edit-post sheets, delete account, other users' profiles, toasts shown inside a modal, the confirmation nested inside the edit-post sheet.
- **iPhone: not run.**

### Follow-up

- `scripts/qa/e2e.ps1` taps by coordinates; the tab bar, post actions and profile buttons moved, so its coordinates are stale.
- The Create screen and the search "Follow" button still use English labels (not part of this change).

### Files

- `apps/mobile/src/theme/{spacing,clay,typography}.ts`, `apps/mobile/src/components/{ui,common,icons}/*`, `apps/mobile/src/navigation/ClayTabBar.tsx`
- `apps/mobile/src/features/{feed,post,comment,profile,search,notifications,settings,auth,onboarding,reel}` (screens and components listed in the commit)
- `apps/mobile/app.json`, `apps/mobile/__tests__/{smoke.test.tsx,clayButton.test.tsx}`
- `docs/change.md`, `docs/decisions.md`

---

## 2026-10-12 - Google sign-in button was hidden: missing Mobile client ID

### Task

The owner did not see the Google button on the login screen.

### Cause

`isGoogleSignInAvailable()` hides the button unless `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set. `apps/mobile/.env.local` did not have it (the backend's `GOOGLE_WEB_CLIENT_ID` was set).

### Changed

- `apps/mobile/.env.local` (git-ignored, local only): added `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` with the same web client ID the backend uses. Metro must be restarted to pick it up.
- `googleSignIn.ts`: when the native module is missing (Expo Go), the error now says that Google Sign-In needs a development build.

### Still open (cross-platform rule 9 and 10)

- Google Sign-In uses a native module: it cannot run in Expo Go on either platform. It needs a development build.
- Android: an OAuth client of type Android (package `com.mobilesocial.app` + SHA-1 of the build keystore) in Google Cloud.
- iOS: an OAuth client of type iOS and its `iosUrlScheme` in the `@react-native-google-signin/google-signin` plugin entry of `app.json`; the App Store also requires Sign in with Apple next to it. Neither exists yet.

### Platforms run

Not run on a device: the button's visibility follows from the config check; the sign-in flow itself was not exercised on Android or iPhone.

### Files

- `apps/mobile/src/features/auth/services/googleSignIn.ts`, `docs/change.md` (and the untracked `apps/mobile/.env.local`)

---

## 2026-10-12 - Reels overlay: fade instead of a flat band, readable hashtags

### Task

The owner sent an iPhone screenshot of the Reels pane showing display problems.

### Changed

- `ReelOverlay`: the bottom scrim was a flat translucent box and showed a hard horizontal edge across the video. It is now a top-to-bottom fade (`experimental_backgroundImage` linear gradient, React Native new architecture, no new dependency).
- Hashtags and mentions in the reel caption were brand pink on a dark video and hard to read; they are white and bold there. `RichText` gained an optional `tokenStyle` prop for this; posts and comments are unchanged.

### Not a bug in the app

- The blue gear button over the title in the screenshot is Expo Go's own tools button on iOS. It is not drawn by the app and does not exist in a development or store build.

### Checks

- `tsc --noEmit` clean, `jest` 95 passed, `verify-ui` unchanged (only rule H, as before).

### Platforms run

- Android emulator (BlueStacks, Expo Go): Reels pane looked at - no hard edge, hashtags readable.
- iPhone: not run by the agent; the fade uses an experimental style property, so it needs a look on the owner's iPhone.

### Files

- `apps/mobile/src/features/reel/components/ReelOverlay.tsx`, `apps/mobile/src/components/common/RichText.tsx`, `docs/change.md`

---

## 2026-10-12 - Reel backend, video upload for posts, S3 storage, screen transitions

### Task

Assigned to Luân: build the Reel backend; add video upload for posts (UI and backend) so that a video in the feed opens the reel viewer on that video; improve the transition between tabs and screens. During the work the owner asked to move file storage to S3 (MinIO in Docker for now).

### Changed - backend

- Migration `20261012150000_add_reels` (additive, applied): `PostMedia` + `thumbnailUrl`, `width`, `height`, `durationMs`, `sizeBytes`; `Post` + `reelEligible`; new table `ContentInteraction`.
- New module `reels`: `POST /media/upload-url`, `GET /reels/feed`, `POST /interactions`. `posts`: `POST /posts/media`, `POST /posts/:id/not-interested`. Post responses carry the new media fields.
- `StorageService` rewritten on the S3 API (AWS SDK v3): upload, delete, presigned upload URL, object info, bucket creation at start-up. `@supabase/supabase-js` removed.
- `storage/media-url.ts` + `MediaUrlInterceptor`: files are stored as `s3:<key>` and turned into absolute URLs per request host; the notifications gateway does the same per socket.
- `docker-compose.yml` (MinIO), `S3_*` variables in `apps/api/.env.example` (and in the local `.env`).
- `scripts/reels-smoke.cjs`: end-to-end check of upload, video post, feeds, interactions, not-interested and URL handling.

### Changed - mobile

- `reelService`: live upload (poster frame, presigned upload with progress, `POST /posts/media`) and live reels feed; the `EXPO_PUBLIC_REELS_API` and `REEL_UPLOAD_AVAILABLE` switches are gone (samples only in mock mode). New `services/uploadFile.ts`.
- Create screen: the Video button is always available.
- `FeedVideo` is a poster with a play badge; tapping it opens the new `ReelViewerScreen` (`ReelsFeed` with `initialPost`). Landscape videos are fitted, not cropped.
- Transitions: tab cross-fade, slide-from-right for pushed screens (also in the auth flow), canvas-coloured navigation background, fade when switching "Bang tin | Reels".

### Checks

- API: `tsc --noEmit` clean, `nest build` OK, `scripts/reels-smoke.cjs` all 28 checks pass against the running API with MinIO.
- Mobile: `tsc --noEmit` clean, `jest` 95 passed (2 live suites skipped), `verify-ui` unchanged (only rule H, as before).

### Platforms run

- **Android emulator (BlueStacks, Expo Go), real API + MinIO**: picked a video, posted it (progress bar shown), saw it in the home feed with its poster and duration, tapped it and the reel viewer played it, saw it in the Reels pane, deleted the post. Tab and screen transitions were exercised but not judged frame by frame.
- **iPhone: not run.** The upload uses XMLHttpRequest with a file URI and `expo-video-thumbnails`; both are cross-platform APIs but were only exercised on Android.
- A phone on Wi-Fi was not tried: it needs port 9000 open in the Windows firewall (see README).

### Files

- `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/20261012150000_add_reels/`, `apps/api/src/modules/{reels,storage,posts,notifications}/`, `apps/api/src/app.module.ts`, `apps/api/scripts/reels-smoke.cjs`, `apps/api/package.json`, `apps/api/.env.example`, `docker-compose.yml`
- `apps/mobile/src/features/reel/`, `apps/mobile/src/features/feed/components/{FeedVideo,PostCard}.tsx`, `apps/mobile/src/features/feed/screens/HomeScreen.tsx`, `apps/mobile/src/features/post/screens/CreateScreen.tsx`, `apps/mobile/src/services/uploadFile.ts`, `apps/mobile/src/navigation/`, `apps/mobile/src/App.tsx`, `apps/mobile/package.json`
- `README.md`, `docs/api-contract.md`, `docs/decisions.md`, `docs/change.md`

---

## 2026-10-12 - Icon set changed from Phosphor to Lucide

### Task

The owner found the icons dated and asked whether the whole set could be changed.

### Changed

- `apps/mobile/src/components/icons/ClayIcon.tsx` now draws every icon with `lucide-react-native` (2px outline, solid version for active/liked/saved states). The app's icon names and the `ClayIcon` props are unchanged, so no screen was edited; `PhosphorIconName` was renamed `ClayIconName` (one caller, the tab bar).
- `phosphor-react-native` removed; `lucide-react-native` added (pure JS on top of `react-native-svg`, same on Android and iOS). Icons are imported one file each, so the bundle only carries the 41 icons in use.
- `jest.config.js` and rule E of `scripts/verify-ui.mjs` now name the new library (the rule still means: icon library imported only in `ClayIcon.tsx`).

### Checks

- `tsc --noEmit` clean, `jest` 95 passed, `verify-ui` unchanged (only rule H, as before).

### Platforms run

- Android emulator (BlueStacks, Expo Go): home feed, tab bar, post menu and settings looked at with the new icons.
- iPhone: not run.

### Files

- `apps/mobile/src/components/icons/ClayIcon.tsx`, `apps/mobile/src/navigation/ClayTabBar.tsx`, `apps/mobile/jest.config.js`, `apps/mobile/scripts/verify-ui.mjs`, `apps/mobile/package.json`, `docs/change.md`

---

## 2026-10-13 - Followed-only feed, cover photo, reactions, trending, private accounts, messages, stories, admin console

### Task

Build the "small" and "medium" items from the feature comparison, to the level of existing apps, with messages in their own tab.

### Changed - backend

- Migration `20261013090000_add_social_features` (additive, applied): `User.coverUrl / isPrivate / role / bannedAt`, `Like.type`, `Report.resolvedAt / resolvedById`, new tables `FollowRequest`, `Conversation`, `Message`, `Story`, `StoryView`.
- Feed limited to own posts and followed authors; `visiblePostWhere` honours private accounts.
- Reactions on `POST /posts/:id/like`; cover endpoints; `GET /hashtags/trending`; follow requests in `follows`; `FOLLOW_REQUEST` / `FOLLOW_ACCEPT` notifications.
- New modules `messages`, `stories`, `admin` (JSON routes, `admin.html`, `AdminGuard`), `auth/ban-list.ts`, ban checks at login and in `JwtStrategy`.
- `NotificationsGateway.emitToUser` takes an event name; `NotificationsService.pushToUser` is reusable.
- `nest-cli.json` copies `*.html` into the build. `scripts/make-admin.cjs`, `scripts/social-smoke.cjs`.

### Changed - mobile

- Reactions: long-press bar on the like button (`ReactionPicker`, `reactions.ts`), reaction shown per user on the likes screen.
- Profile: cover photo (header and edit sheet), lock badge, "request sent" state, locked view for private accounts, "Message" button.
- Settings: "Private account" switch and "Follow requests"; new `FollowRequestsScreen`; two new notification types.
- Search: trending hashtags when the query is empty. Feed empty state in Vietnamese with a button to find people.
- Messages: `ConversationsScreen` (new tab with unread badge), `ChatScreen` (realtime, images, "seen", retry), `NewMessageScreen`, `messageService`, `unreadMessages`; the socket service forwards message events.
- Stories: `StoriesTray` above the feed, `StoryViewerScreen`, `StoryViewersScreen`, `storyService`.
- Navigation: Messages tab replaces Notifications; notifications open from a bell in the home header and gained a back button.

### Checks

- API: `tsc --noEmit` clean, `nest build` OK. Against the running API with MinIO: `social-smoke.cjs` 74/74, `reels-smoke.cjs` 28/28, `api-smoke.cjs` 72/72.
- Mobile: `tsc --noEmit` clean, `jest` 95 passed, `verify-ui` unchanged (only rule H, as before). Live suites against the real API, run one at a time: `liveApi` 20/20, `gapLive` 14/14.

### Platforms run

- **Android emulator (BlueStacks, Expo Go), real API + MinIO**: home with stories tray and bell; reaction bar, picking and removing a reaction; Messages tab empty state; receiving messages live from another account (inbox row, unread badges), opening the chat, sending a reply, inbox preview; posting a story, opening the viewer, deleting it through the confirmation dialog.
- **Admin page in a desktop browser**: login as a seeded admin, dashboard and report list. The action buttons were exercised through the API smoke test, not by clicking.
- **Not looked at on any device**: cover photo and private-account screens, follow requests, trending section, story of another user, video story, image message, chat with the on-screen keyboard open (BlueStacks shows none), failed-message retry.
- **iPhone: not run.**

### Files

- `apps/api/prisma/`, `apps/api/src/modules/{admin,messages,stories,auth,follows,likes,notifications,posts,reels,search,users}/`, `apps/api/src/app.module.ts`, `apps/api/nest-cli.json`, `apps/api/scripts/{make-admin,social-smoke,reels-smoke}.cjs`
- `apps/mobile/src/features/{messages,stories,feed,profile,settings,search,notifications,reel,auth}/`, `apps/mobile/src/components/common/{UserRow,UserListScreen}.tsx`, `apps/mobile/src/navigation/`, `apps/mobile/src/services/followApi.ts`, `apps/mobile/__tests__/live/liveApi.test.ts`
- `README.md`, `docs/api-contract.md`, `docs/decisions.md`, `docs/change.md`

## 2026-10-17 - Private chat images; share links hidden

### Task

Owner decisions 1 and 7 of 2026-10-17: fix chat images being publicly readable, and hide "copy link" while keeping it usable later.

### Changed

- API: chat images go to a private bucket (`S3_PRIVATE_BUCKET`, default `<S3_BUCKET>-private`, created on startup) and are returned as 1-hour signed URLs in responses and socket events (`resolveMediaUrls` is now async). See DEC-024.
- API: deleting an account also removes its story files, cover photo, post thumbnails and the images of its conversations.
- Mobile: chat images cached by message id (`cacheKey`), because the signed URL changes each load.
- Mobile: `SHARE_LINKS_ENABLED` (`EXPO_PUBLIC_SHARE_LINKS_ENABLED`, off) hides "Sao chép liên kết" on posts and profiles; the system share sheet shares the post text only and is offered only for posts with text.
- `apps/api/.env.example`, `docs/api-contract.md`, `docs/decisions.md` (DEC-024).

### Checks

- API `tsc --noEmit` clean; the dev server created `social-media-private` on restart.
- Against the running API + MinIO with seeded `gaptest_*` accounts (removed afterwards): signed URL serves the exact bytes; the same object without a signature returns 403; the object is not in the public bucket; the sender response, the recipient history, the inbox preview and the `message:new` socket event all carry signed URLs; after deleting an account its chat image returns 404.
- Shared database: 0 chat images were stored in the public bucket, so no migration was needed.
- Mobile `tsc --noEmit` clean, `jest` 95 passed / 34 skipped, `verify-ui` unchanged (only rule H, as before).

### Platforms run

- Android: not run on a device for this change. iPhone: not run.

### Files

- `apps/api/src/modules/storage/`, `apps/api/src/modules/notifications/notifications.gateway.ts`, `apps/api/src/modules/messages/messages.service.ts`, `apps/api/src/modules/users/users.service.ts`, `apps/api/.env.example`
- `apps/mobile/src/config/links.ts`, `apps/mobile/src/features/post/components/SharePostModal.tsx`, `apps/mobile/src/features/profile/components/ProfileView.tsx`, `apps/mobile/src/features/messages/screens/ChatScreen.tsx`
- `docs/api-contract.md`, `docs/decisions.md`, `docs/change.md`

## 2026-10-17 - Safety batch: 18+, message requests, anonymous messaging, blurred chat images, anonymous story reactions

### Task

Owner-approved plan of 2026-10-17 (phases 1-9), done in one pass. See DEC-025 and `docs/moderation/MODERATION_PLAN.md`.

### Changed - backend

- Migration `20261017090000_add_safety_features` (applied to the shared Supabase DB): `User.birthDate / ageLockedAt / allowAnonymousMessages / anonymousSuspendedAt`, `Conversation.kind / status / requesterId / revealedAt / closedAt` with the unique index moved to `(userAId, userBId, kind)`, `Message.sensitive / storyId`, `Story.allowAnonymous`, `Report.snapshot`, table `StoryReaction`.
- New `moderation` module: `ImageModerationService` (ONNX NSFW model, `onnxruntime-node` + `sharp`), `text-safety.ts` (blocked contacts, scam phrases), `age.ts`. `scripts/download-moderation-model.cjs`; `apps/api/models/` is git-ignored.
- Auth/users: birth date required at registration (18+), `PATCH /users/me/birth-date`, age lock checked at login and in `JwtStrategy`, `allowAnonymousMessages` on `PATCH /users/me`, `acceptsAnonymousMessages` on profiles.
- Messages rewritten around requests and anonymous conversations: per-viewer masking (API, socket, push), accept / decline / close / reveal, image and contact restrictions, 3-message request limit, 10 anonymous conversations per day, sensitive-image flag, scam warning flag, story replies.
- Stories: `allowAnonymous`, reactions (named or anonymous), reply endpoint, viewer list removed, grouped reaction push.
- Reports: `CONVERSATION` target and `SCAM` reason with a 50-message snapshot; anonymous reports close the conversation and suspend anonymous messaging.
- Admin: conversation reports with real identity and snapshot (sensitive images blurred for the reviewer), age unlock, restore / suspend anonymous messaging, image-checker warning on the dashboard.
- `scripts/safety-smoke.cjs` (76 checks); `social-smoke.cjs` story checks updated for the removed viewer list.

### Changed - mobile

- Registration: date of birth field (DD/MM/YYYY, no new dependency); `BirthDateScreen` gate for accounts without a birth date; age-locked screen.
- Messages: inbox split into "Tin nhắn" / "Tin nhắn chờ"; request bar (accept / delete / report); anonymous conversations with mask avatar, notices, reveal and block; text-only composer where required; blurred sensitive images with tap to view; scam warning under messages; story-reply label; Vietnamese messages for every refusal code; menu with report and block.
- Stories: reaction bar and reply box (anonymous switch when allowed) in the viewer; "N cảm xúc" and `StoryReactionsScreen` for owners (viewer screen removed); "allow anonymous interactions" choice when posting.
- Profile: "Nhắn ẩn danh" for people who accept it. Settings: "Nhận tin nhắn ẩn danh" opens `AnonymousMessagesScreen` (risks, safeguards, confirm).
- Report: `CONVERSATION` target and "Lừa đảo" reason. New icons (Lucide): Cake, Inbox, Mask, Reply, ShieldCheck, ShieldWarning, TriangleWarning.
- Tests: `birthDate.test.ts`, regression registration tests updated, live `safetyLive.test.ts`.

### Checks

- API `tsc --noEmit` clean. Against the running API + MinIO + shared DB: `safety-smoke` 76/76, `social-smoke` 73/73, `api-smoke` 72/72, `reels-smoke` 28/28 (api-smoke and reels-smoke needed a pause for the login rate limit). Migration diff after apply: empty.
- Model check: six ordinary photos and flat colours score 0.006-0.19 (threshold 0.7).
- Mobile `tsc --noEmit` clean, `jest` 100 passed / 39 skipped (live), live suites `liveApi` 20/20, `gapLive` 14/14, `safetyLive` 5/5 (each on freshly seeded accounts). `verify-ui` unchanged (only rule H). `expo export` builds Android and iOS bundles.

### Platforms run

- **Android (BlueStacks, Expo Go), real API:** registration birth-date field and under-18 error; birth-date gate (invalid date, confirm, continue); inbox folders and request count; request chat with accept / delete / report bar, scam warning and report sheet; anonymous chat (mask, notices, menu, reply accepting it); blurred image cover; story viewer reaction bar, anonymous switch and anonymous reaction (confirmed on the server); own story "2 cảm xúc" and the reactions list with "Người ẩn danh"; Settings switch and the anonymous-messages screen.
- **Not seen on a device:** "allow anonymous" sheet after picking a story (the system picker did not accept automated taps), revealing identity from the sender side, "Nhắn ẩn danh" on a profile, locked-account screen, admin page in a browser (covered by the API smoke test).
- **iPhone: not run.**

### Incidents

- A bug in a first version of `safety-smoke.cjs` (helper calling itself) opened database connections in a loop and exhausted the shared Supabase pooler for a few minutes (`EMAXCONN`). Fixed before any further run.
- Found during the test: `import sharp from` compiled to `undefined` (sharp 0.35 ships ESM typings); every image fell back to "blurred". Fixed with a typed `require`.
- Pre-existing, not fixed: signing out in Expo Go shows a red LogBox for the missing Google Sign-In native module (the error is caught; dev-only overlay).

### Files

- `apps/api/prisma/`, `apps/api/src/modules/{moderation,messages,stories,reports,admin,auth,users}/`, `apps/api/src/app.module.ts`, `apps/api/scripts/{download-moderation-model,safety-smoke,social-smoke}.cjs`, `apps/api/package.json`, `apps/api/pnpm-lock.yaml`, `apps/api/pnpm-workspace.yaml`, `apps/api/.env.example`, `.gitignore`
- `apps/mobile/src/features/{auth,messages,stories,settings,profile,report,notifications}/`, `apps/mobile/src/components/icons/ClayIcon.tsx`, `apps/mobile/src/navigation/`, `apps/mobile/__tests__/`
- `README.md`, `docs/moderation/MODERATION_PLAN.md`, `docs/api-contract.md`, `docs/decisions.md`, `docs/change.md`

## 2026-10-31 - Feature report (PDF) with overview use case diagram

### Task

Owner asked for a PDF report of the features that exist now, grouped into large modules and their sub-modules, in black Times New Roman (13 pt body, larger Roman-numeral headings, larger title), with an overview use case diagram drawn with the draw.io skill.

### Changed

- New `docs/report/bao-cao-tinh-nang.pdf` (9 pages): I. overview, II. use case diagram, III. 13 functional modules with sub-modules, IV. supporting backend modules, V. test status and open work.
- New `docs/report/usecase-tong-quan.drawio`: editable source of the diagram (actors Khách, Người dùng, Quản trị viên with generalization; 18 use cases).
- New `docs/report/bao-cao-tinh-nang.template.html`: report text; the `<!--DIAGRAM-->` marker is replaced by the diagram rendered to SVG (draw.io viewer, headless Edge), then printed to PDF with headless Edge.
- No application code changed.

### Checks

- Content taken from the code (controllers, Prisma schema, mobile screens) and the entries above; 98 API routes, 22 tables, 32 mobile screens counted from the code.
- Diagram: `validate.py` 0 errors, 0 crossings (18 overlap warnings are the use cases inside the system boundary). PDF pages rendered and checked by eye; fonts embedded are Times New Roman only.

### Platforms run

- Not applicable (documentation only; the app was not run for this report).

### Files

- `docs/report/bao-cao-tinh-nang.pdf`, `docs/report/bao-cao-tinh-nang.template.html`, `docs/report/usecase-tong-quan.drawio`, `docs/change.md`

## 2026-10-31 - Trial: run the mobile app on the web (Expo web)

### Task

Owner asked to try the app as a web app locally (goal: web + app like Threads).

### Changed

- Mobile: `react-dom`, `react-native-web`, `@expo/metro-runtime` added with `expo install` (Expo web support).
- Mobile `src/config/api.ts`: on web the dev API URL is `http://<page host>:3000/api` (web has no `SourceCode` native module, so the URL was undefined).
- API `main.ts`: `app.enableCors()` so the browser can call the API from another origin (Bearer tokens, no cookies). Open to every origin for now; restrict to a list of origins before a real web deploy.

### Checks

- Mobile `tsc --noEmit` clean, `jest` 100 passed / 39 skipped (one earlier run had 1 failure that did not repeat). API `tsc --noEmit` clean.
- `expo start --web` bundles; the home feed renders in headless Edge at 1280x800 with mock data (`EXPO_PUBLIC_USE_MOCK=true`).
- Not checked with the real API: the backend could not start because Supabase answers "tenant/user not found" for the project in `DATABASE_URL` (likely paused; `.env` unchanged since 2026-10-12).

### Platforms run

- Web (Edge, mock data): home feed only. Android and iPhone: not run for this change (only the web branch of `api.ts` is new).

### Known web gaps (not fixed)

- `expo-secure-store`, `expo-file-system`, `expo-video-thumbnails` and Google Sign-In have no web implementation (token storage, video poster, file reads, Google login).
- The layout is the phone layout stretched to the window (bottom tab bar, full-width cards).

### Files

- `apps/mobile/package.json`, `apps/mobile/pnpm-lock.yaml`, `apps/mobile/src/config/api.ts`, `apps/api/src/main.ts`, `docs/change.md`

## 2026-10-31 - Feature integration plan (PDF) with 75 flowcharts

### Task

Owner asked for a plan to bring the product to about 60% of Facebook / small social apps, with 2FA and the safety features done thoroughly, each feature described in words and with detailed flowcharts drawn with the draw.io skill. Owner also asked to run independent work on parallel agents.

### Changed

- New `docs/plan/ke-hoach-tinh-nang.pdf` (288 pages, Times New Roman, bookmarks and a linked table of contents): I. goals and how to read; II. what "perfect" means (scope and a shared definition of done); III. gap table against Facebook; IV. 30 features (A1–A6 account security, B1–B8 safety, C1–C3 moderation, D1–D9 social, E1–E4 privacy) in four phases, with a roadmap and a layered-safety overview; V. one spec per feature (purpose, current state from the code, step-by-step behaviour, flowcharts, rules and limits, proposed data/API, Android/iOS/web, done criteria, estimate); VI. legal, store rules, bugs found in the current code, shared technical decisions, risks, external services and costs; VII. 30 questions for the owner, each with a proposal.
- New `docs/plan/flows/*.drawio`: 75 editable flowcharts (73 feature flows + 2 overview).
- New `docs/plan/src/`: sources to rebuild the PDF: `sections/` (feature HTML + per-group summaries), `specs/` (flowchart JSON), `tools/flowgen.py` (spec -> swimlane .drawio on a grid; Graphviz is not installed), `tools/render.py` (draw.io viewer in headless Edge -> SVG/PNG), `tools/build_plan.py` (assemble + print to PDF), `risks.html`, `questions.html`, `BRIEF.md` (the brief given to the seven writing agents).
- New `docs/plan/ke-hoach-tinh-nang.template.html`: the frame of the document.
- No application code changed. All endpoints and tables in the plan are proposals; nothing was added to `docs/api-contract.md` or `docs/decisions.md`.

### How to rebuild

From `docs/plan/src`: `python tools/flowgen.py specs/<id>.json ../flows/<id>.drawio`, then `python tools/render.py ../flows/<id>.drawio render` for every flow, then `python tools/build_plan.py ../ke-hoach-tinh-nang.template.html plan.html ../ke-hoach-tinh-nang.pdf`. Rendering loads the draw.io viewer from viewer.diagrams.net.

### Checks

- Every flowchart: generator 0 errors; drawio-skill `validate.py` 0 errors, 0 crossings, 0 edges through nodes, 0 overlaps; each PNG looked at. Field names reconciled across features (comment filter fields in B4/B7/B8 vs C1).
- PDF: 75 figures, 30 features, fonts Times New Roman (plus symbol glyphs only where E4 lists tick-like characters to ban), no figure separated from its lead-in line.
- Estimates add up to 364 working days (GĐ1 71.5, GĐ2 104, GĐ3 116.5, GĐ4 72).

### Platforms run

- Not applicable (planning document; the app was not run).

### Found in the current code while planning (not fixed)

- Listed in section VI.3 of the PDF (12 items), e.g. request-message text shown in push on the lock screen, pushes after a request was deleted, banned users' posts still visible, admin can read anonymous senders' identity without a log, account deletion removing the other person's conversation and the deleted user's reports.

### Files

- `docs/plan/ke-hoach-tinh-nang.pdf`, `docs/plan/ke-hoach-tinh-nang.template.html`, `docs/plan/flows/`, `docs/plan/src/`, `docs/change.md`
