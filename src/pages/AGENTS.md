# src/pages

Inherits the rules from `src/AGENTS.md`. Applies to `src/pages` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Route modules, pane composition, and page-level navigation state.

## Patterns

- A page composes `widgets`, `features`, `entities`, and `shared/ui`; it should not become a hidden domain or service layer.
- Keep route params, pane params, and query state serializable and stable across refresh and navigation history.
- Keep page-only orchestration here. Move reusable state derivation or user-action flows down to `entities` or `features`.

## Anti-patterns

- Do not bypass lower-layer APIs with direct storage, filesystem, or service logic from pages.
- Do not duplicate a reusable screen composition that belongs in `widgets`.
- Do not keep long-lived global state in page modules.

## Constraints

- Changes in `SplitView` affect every pane.
- Minimum verification: `pnpm type-check`, then open the affected page or pane, refresh it, and exercise back or forward navigation for the touched route state.
