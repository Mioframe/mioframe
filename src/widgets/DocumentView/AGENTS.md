# src/widgets/DocumentView

Inherits the rules from `src/widgets/AGENTS.md`. Applies to `src/widgets/DocumentView` and its descendants until a deeper `AGENTS.md` overrides it.

## Contains

- `Database/`: database document view composition.
- `index.ts`: the public entry point for document-view widgets.

## Patterns

- Keep this directory focused on document-view composition rather than generic UI primitives.
- Prefer passing document IDs, view IDs, and narrow props instead of large mutable domain objects.
- Put reusable document-view wiring here when it spans more than one nested widget module.

## Anti-patterns

- Do not move entity or feature logic here just because it is used in document screens.
- Do not make this directory depend directly on low-level services when entity or feature APIs already exist.
- Do not treat `DocumentView` as a catch-all for every document-related component.

## Constraints

- Changes here can affect every document-view screen that reuses this composition path.
- External imports should go through `index.ts`.
- Minimum verification: `pnpm type-check` and a manual smoke check of the affected document-view scenario.
