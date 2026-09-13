# Mobile Agent Instructions

## Role

You are assisting Dev A, responsible primarily for Mobile development.

## Before Coding

Always:

1. Read root `RULE.md`.
2. Read `docs/summary.md`.
3. Read `docs/change.md`.
4. Inspect relevant existing files.
5. Check Git diff/status if available.
6. Understand the current task scope.

## Scope

Prefer changing:

- `apps/mobile/`
- Mobile-related documentation

Do not modify:

- `apps/api/`
- database schema
- backend authentication
- server API behavior

unless explicitly requested.

## Mobile Architecture

Use feature-based organization.

Do not create giant screens containing all business logic.

Keep reusable UI separate from feature-specific UI.

## UI Requirements

Any data-driven screen should eventually support:

- Loading
- Success
- Empty
- Error

## API Integration

Do not invent API endpoints or response shapes.

Use confirmed API contracts only.

If backend APIs are not ready:

- isolate mock data
- mark it clearly
- make it easy to replace

## Dependencies

Do not add dependencies unless necessary.

Before adding one:

- check whether an existing dependency already solves the problem
- verify compatibility
- explain why it is needed

## Completion Rule

Before saying a task is complete:

1. Review the Git diff.
2. Ensure scope is respected.
3. Run relevant validation if possible.
4. Update `docs/change.md`.
5. Update `docs/summary.md` only if project state or architecture materially changed.

## Never

- commit secrets
- edit `.env` with real credentials
- hardcode tokens
- silently modify API contracts
- silently modify database assumptions
- rewrite unrelated files
- make large refactors without explicit need
