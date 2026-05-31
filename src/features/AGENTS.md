# src/features

Inherits the rules from `src/AGENTS.md`. Applies to `src/features` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- User-triggered flows such as dialogs, forms, menus, inline actions, submit flows, recovery actions, and destructive mutations.

## Patterns

- A feature owns one user action and the orchestration around it.
- Build features on top of `entities` and `shared`; do not reimplement their domain contracts.
- Keep feature UI action-focused and keep reusable display state in `entities`.
- Keep feature contracts narrow: expose IDs, payloads, and explicit options rather than service bundles or broad mutable objects.
- Handle loading, cancel, reset, success, and error states explicitly.
- User-action-only platform flows such as pickers, account prompts, or permission prompts may live in a feature, but the feature must report the result back to the owning entity/service instead of becoming the source of truth.
- Name public feature methods after the action they perform. Reserve `on*` for component-local event handlers.

## Anti-patterns

- Do not import deep internals from another feature when its public API is enough.
- Do not merge entity presentation and feature mutation orchestration into one "smart row" component here.
- Do not place generic UI primitives or low-level helpers in `features`.
- Do not store canonical provider, repository, document, or storage state inside a feature.
- Do not pass service bags, provider instances, or capabilities through feature props unless the feature is explicitly the narrow user-action boundary for that capability.

## Constraints

- Features should stay replaceable composition units rather than hidden global state.
- Minimum verification: `pnpm type-check`, then open the touched action, exercise cancel and submit paths, and reopen it to confirm state reset or persistence behavior.
