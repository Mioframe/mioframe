# src/entities

Inherits the rules from the root `AGENTS.md`. Applies to `src/entities` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- document-oriented entities such as `cfrDocument`.
- database entities such as `databaseData`, `databaseProperty`, `databaseView`, `databaseFilter`, `databaseValue`, and typed value modules.
- filesystem/settings/integration entities such as `directory`, `fsEntry`, `mountedDirectories`, `localSettings`, `googleSession`, and `googleDriveAccess`.

## Patterns

- An entity provides domain-facing composables, typed access patterns, and small reusable UI fragments.
- `entities` may import only `shared`.
- Keep canonical domain access patterns here rather than redistributing them into features or widgets.
- Entity components should stay small and reusable across higher-level flows.
- Keep state derivation and display contracts for a domain concept in `entities`; do not move user action orchestration down from `features`.
- Prefer entity UI components to expose slots for higher-layer actions instead of owning feature-specific buttons or handlers.
- Keep entity component props narrow and display-oriented. Prefer IDs, labels, display records, and explicit slots over passing service clients, action bundles, or mixed read/write objects.
- Keep entity slot contracts minimal and real. Declare only slots that the component actually renders or documents as part of its public UI contract; do not leave unused `defineSlots` entries behind as speculative API.
- Keep entity `use*` composable inputs narrow and model-oriented. Prefer IDs, small query inputs, and explicit scalar arguments over feature-owned action sets, snackbar adapters, menu controllers, service bags, or broad mutable records.
- Entity UI may show domain state and emit intents, but must not own user mutation flows such as action menus, destructive confirmation paths, submit handling, or snackbar/error feedback for those actions.
- If an entity surface triggers or reflects any user-noticeable loading, render an explicit loading indicator in the component instead of leaving the area visually empty during the fetch or derivation.
- If that loading source can expose meaningful progress, show progress rather than a generic spinner. Reserve indeterminate indicators for loads whose progress cannot be surfaced from the underlying source.
- When a domain exposes both persisted and derived read models, name them explicitly. Prefer pairs such as `storedValue`/`value` or `item`/`effectiveItem`, and keep entities as consumers of those contracts rather than recomputing derivations locally.
- Keep one reactive data source per composable. Do not mix stored and effective reads in the same entity composable; expose them as separate `use*` contracts with names that make the source semantics obvious.

## Anti-patterns

- Do not move screen flows or dialog orchestration into `entities`.
- Do not place user action menus, mutation handlers, or action-specific snackbar/retry logic in entity components; wrap entity presentation with a feature instead.
- Do not bypass shared service/lib contracts with direct storage or API access.
- Do not duplicate schema constants or domain types across sibling entity directories.
- Do not turn entity components into heavy composition containers.

## Constraints

- Entity API changes usually affect features and widgets above this layer.
- Persistent behavior changes must preserve or intentionally revise loading/error/mutation contracts.
- Use `index.ts` as the external entry point when present.
- Minimum verification: `pnpm type-check` and a focused smoke or test check for the touched entity scenario.
