# src/pages

Inherits the rules from the root `AGENTS.md`. Applies to `src/pages` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `routes.ts`: route registration.
- `SplitView/`: pane model and navigation primitives.
- `HomePane/`, `DocumentViewPane/`, `RepoExplorer/`, `Settings/`: screen modules.

## Patterns

- A page composes screens from `widgets`, `features`, `entities`, and `shared/ui`.
- Keep route and pane parameters serializable and stable.
- Keep logic in `pages` limited to screen composition, navigation, route and pane parameters, and page-level orchestration.
- Move domain rules, derived state, reusable error or state mapping, and user action flows to lower FSD layers where they belong.
- If screen composition is reused across pages, move it into `widgets`.

## Anti-patterns

- Do not bypass entity or service abstractions with low-level storage or API access from pages.
- Do not duplicate widget-scale compositions across multiple pages.
- Do not keep long-lived global state here.
- Do not replace the pane/navigation model casually.

## Constraints

- Changes in `SplitView` affect every pane.
- Route and query contract changes must be checked for navigation, refresh, and state restoration.
- Minimum verification: `pnpm type-check` and a manual navigation/state-restoration smoke check for the affected page.
