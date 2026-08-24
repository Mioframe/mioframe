# src/entities/directory

Inherits the rules from `src/entities/AGENTS.md`. Applies to `src/entities/directory` and its descendants until a deeper `AGENTS.md` refines it.

## Contains

- Small reusable UI for rendering one directory entry.

## Patterns

- Keep file and directory distinctions explicit in typed contracts and rendered UI.
- Render entry state and emit intents here, but leave rename, create, and remove flows to features.

## Anti-patterns

- Do not mix directory-entry UI with destructive action orchestration.
- Do not reintroduce reactive directory listing state, filesystem reads, invalidation, or canonical directory state here — that lifecycle belongs to `shared/service/fileSystem`.

## Constraints

- Changes here affect how a single directory entry renders wherever it is composed.
- Minimum verification: run `pnpm verify --only static`, then exercise the touched entry UI through an existing consuming feature or widget and confirm rendered state and emitted intents still match the contract.
