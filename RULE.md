# Repository Rules

- Keep changes within the requested scope and preserve existing implementation.
- Follow the repository's confirmed framework, package manager, and conventions.
- Do not add dependencies, API assumptions, or architecture without a clear need.
- Keep Mobile and backend responsibilities separate unless a task explicitly requires coordination.

## AI / Codex Change Tracking Rule

1. AI agents must read `RULE.md` before modifying the repository.
2. AI agents must inspect the existing implementation before creating new files.
3. AI agents must not modify code outside the requested scope without a clear reason.
4. Every meaningful repository modification must be documented in `docs/change.md`.
5. `docs/change.md` must never be erased or regenerated; existing history must be preserved.
6. Before reporting a task as complete, the AI must update `docs/change.md`.
7. Architectural decisions that affect other developers must also be recorded in `docs/decisions.md`.
8. If an API contract is assumed but not confirmed, do not invent it.
9. Backend, API, and database architecture must not be changed by Dev A's AI agent without coordination.
10. Existing code takes precedence over assumptions in prompts.
