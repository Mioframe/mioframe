# src/widgets

Inherits the rules from the root `AGENTS.md`. Applies to `src/widgets` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `DocumentView/`: document-centric screen compositions.
- `GoogleDriveWidget/`: Google Drive-related widget composition.
- `LocalFSWidget/`: local directory widget composition built on mounted-directory entities.

## Patterns

- A widget combines multiple `features` and `entities` into a larger screen block.
- Keep widgets thin: layout, wiring, slots, and orchestration between existing parts.
- Delegate mutations to `features` and domain reads/derivations to `entities`.
- If a part becomes reusable across widgets, move it to a lower layer.

## Anti-patterns

- Do not turn widgets into a hidden service or entity layer.
- Do not import widgets back into `entities`.
- Do not hide low-level API, filesystem, or schema work inside widgets.
- Do not store one-off feature UI here if it is not reused as widget composition.

## Constraints

- Widgets may depend on `features`, `entities`, and `shared`, but should remain a composition layer only.
- If a widget directory has an `index.ts`, use it as the external entry point.
- Minimum verification: `pnpm type-check` and a manual smoke check of the affected screen flow.
