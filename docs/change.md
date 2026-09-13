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
