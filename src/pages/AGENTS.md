# src/pages

Inherits the rules from `src/AGENTS.md`. Applies to `src/pages` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- Route modules, pane composition, route parameter handling, and page-level navigation state.

## Patterns

- A page composes `widgets`, `features`, `entities`, and `shared/ui`; it must not become a hidden domain, provider, or service layer.
- Keep route params, pane params, and query state serializable and stable across refresh and navigation history.
- Keep page-only orchestration here: route selection, navigation after a completed child flow, shell-level pane composition, and page-level fallback selection.
- When a page needs domain state, consume an entity or widget contract. Do not wire service queries directly if an entity or widget already owns that read model.
- When a page reacts to a child flow result, it may navigate, retry the route, or close the pane, but the flow state itself belongs in entities, features, or widgets.

## Anti-patterns

- Do not bypass lower-layer APIs with direct storage, filesystem, provider, or service logic from pages.
- Do not coordinate provider recovery flows, pending request registries, retry state, or background service details in pages.
- Do not duplicate entity or widget data reads in a page only to inspect errors or loading state already owned by the widget or entity.
- Do not keep service clients or provider instances in page state.
- Do not duplicate a reusable screen composition that belongs in `widgets`.
- Do not keep long-lived global state in page modules.

## Constraints

- Changes in `SplitView` affect every pane.
- Minimum verification: `pnpm type-check`, then open the affected page or pane, refresh it, and exercise back or forward navigation for the touched route state.
