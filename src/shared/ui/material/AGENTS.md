# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical Material library boundary.

Use:

- `material3-guidelines` for source, usage, and alignment decisions;
- `material-foundation` for cross-family foundation changes;
- `shared-ui-implementation` for public component implementation;
- `docs/material-3/library-architecture.md` for location, dependency, public API, and migration;
- `docs/material-3/foundation-architecture.md` for foundation ownership;
- `docs/material-3/component-architecture.md` for family implementation.

## Contains

Only:

- `foundation`: cross-family Material contracts;
- `components`: official public Material component families;
- `patterns`: reusable official Material compositions passing the documented pattern gate;
- library-level documentation and curated public entry points.

## Dependency direction

```text
shared/lib generic infrastructure
  → material/foundation
  → material/components
  → material/patterns
  → project-specific shared UI and product layers
```

- `foundation` must not import `components` or `patterns`.
- Component families must not deep-import other families.
- Patterns use public foundation/component entry points only.
- No library code imports `entities`, `features`, `widgets`, `pages`, or `app`.
- Generic `shared/lib` infrastructure must not depend on this library.

## New artifacts

- New official Material components belong in `components/<family>`.
- New Material foundation runtime artifacts belong in `foundation/<domain>`.
- New reusable Material compositions belong in `patterns/<pattern>` only when Material documents the composition and a current product scenario requires it.
- Do not add empty directories, placeholder files, speculative extension points, or a universal base component.
- Project-specific UI does not belong under `components`, even when it uses Material tokens or primitives.

## Public API

- Public product imports use `@shared/ui/material` after the root production entry point exists.
- Internal library code must not import the root barrel.
- Components import accepted foundation entry points.
- External deep imports into `.vue`, `.css`, private helpers, or another family are forbidden.
- Every public export has one owner, accurate TSDoc, and matching README/registry status.

## Foundation

- Foundation owners are component-agnostic and registry-backed.
- Generic bridges expose only minimum cross-family inputs.
- Do not duplicate theme, tokens, units, typography, state/ripple/focus, motion, icon, or overlay ownership.
- Generic browser/DOM/teleport utilities stay outside the library unless their contract is specifically Material-owned.

## Components

- Each family follows one `layered-v1` profile and owns its README blueprint.
- Family code owns API, semantics, anatomy, component tokens, routing, property-specific state resolution, rendering, stories, and focused tests.
- Product behavior, placement, information architecture, and workflow remain outside the family.

## Patterns

A pattern is allowed only when:

- it maps to an official Material composition or canonical/adaptive layout;
- it is independent of one domain or feature;
- a current scenario requires it;
- it cannot be owned more narrowly by one family or product composition;
- it is testable without product data.

## Legacy migration

- Existing Material code outside this directory is legacy, not a template.
- Strict local repairs may remain at legacy paths under `Architecture impact: none`.
- New public Material surface at a legacy path is forbidden.
- Migrate one family or foundation domain per focused PR.
- Update all consumers, exports, contracts, registries, stories, tests, and the library migration map atomically.
- Remove old paths; temporary compatibility re-exports require an explicit removal target and must not receive new usage.

## Verification

Architecture validation is blocking for new and migrated library artifacts. Verify location, dependency direction, public exports, no deep imports, no project-specific content, no local foundation substitute, complete consumer migration, and removal of obsolete legacy paths.
