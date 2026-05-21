# Material 3 Storybook policy

## Principle

Storybook is the project documentation surface for shared UI. For Material components used by the app, Storybook should read like the corresponding official Material 3 documentation adapted to the project implementation.

Storybook is not the source of truth for Material 3. It documents how the project implements the official guidance checked through MCP or `m3-docs-cache`.

## Story hierarchy

Use a hierarchy that separates official Material-aligned components from project-specific UI:

```text
Material 3/Components/<Component>/<Story>
Project UI/<Component>/<Story>
```

Use `Material 3/Components` only for components that intentionally implement an official Material 3 component or pattern.

Use `Project UI` for components such as markdown renderers, repository-specific navigation helpers, and other app-specific surfaces.

## Required story sections for Material components

A mature Material component story set should cover:

- Overview;
- Variants;
- Configurations;
- Anatomy when useful;
- States;
- Accessibility notes;
- Tokens and supported override points;
- Do / Don't or usage notes when the official docs include them;
- Project deviations or unsupported official variants;
- Visual regression surfaces when the component is a shared primitive or has high visual risk.

Do not add every section mechanically in the first pass. Add the sections that make the component understandable and verifyable, then expand during the component's parity work.

## Story rules

- Keep stories deterministic and fixture-driven.
- Do not connect product stores, storage flows, diagnostics, routing lifecycle, Google Drive integration, live network calls, or app bootstrap side effects.
- Do not change public component APIs only to satisfy Storybook.
- Do not put business logic in stories.
- Use the same public props and tokens that product code uses.
- Tag screenshot-ready stories with `visual`.

## Visual documentation

For components that are used as visual regression surfaces, prefer stable gallery stories that show Material-relevant states and configurations in one bounded locator screenshot.

Do not add visual snapshots for every story. Use visual coverage for shared primitives, important Material states, responsive layout surfaces, CSS-heavy components, and previously broken states.

## Documentation notes

Each Material component's Storybook docs should name the checked official Material 3 pages or cache paths. If a feature is project-specific or unsupported, say so in the Storybook notes rather than implying official Material support.
