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
