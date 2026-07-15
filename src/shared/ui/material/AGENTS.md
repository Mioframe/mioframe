# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical Material library boundary.

Use:

- `material3-guidelines` for sources, usage, alignment, and review gates;
- `material-foundation` for cross-family foundation changes;
- `shared-ui-implementation` for component implementation;
- `component-contract-testing` for Vue contract tests;
- `ui-browser-behavior` for real browser behavior;
- `visual-regression-testing` for visual matrices and baseline diffs;
- canonical architecture under `docs/material-3`.

These scoped rules route work and state hard boundaries. Complete schemas live in the architecture documents.

## Contains

Only:

- `foundation`: cross-family Material contracts;
- `components`: official public Material families;
- `patterns`: accepted reusable official Material compositions;
- local contracts and curated public entry points.

Policy and source-evidence documents remain under `docs/material-3`.

## Dependency direction

```text
shared/lib generic infrastructure
  ├─→ material/foundation
  ├─→ material/components
  └─→ material/patterns

material/foundation → material/components → material/patterns
material library → project-specific shared UI and product layers
```

- Any Material layer may use a correctly owned generic utility directly.
- Do not create foundation wrappers only to route generic DOM/event/geometry/lifecycle/teleport/browser behavior.
- Foundation must not import components or patterns.
- Families must not deep-import other families.
- Patterns use public component/foundation contracts only.
- Library code must not import product layers.
- Generic infrastructure must not depend on the Material library.

## New artifacts

- New official components belong under `components/<family>`.
- A single component may own a family.
- Multi-component families require an official relationship and a real current shared contract.
- Legacy proximity, similar names, repeated CSS, fewer files, or hypothetical reuse do not establish family ownership.
- New foundation runtime/testing owners belong under `foundation/<domain>`.
- New patterns require official composition evidence and a current scenario.
- Do not add empty directories, placeholder files, speculative extension points, or universal bases.
- Project-specific UI remains outside `components`.

## Public API

- Product consumers use `@shared/ui/material` after the root entry point exists.
- Internal library code does not import the root barrel.
- Components import accepted foundation/family entry points or correctly owned generic utilities.
- External deep imports into implementation/testing/private files are forbidden.
- Every public export has one owner, accurate TSDoc, and matching blueprint/registry status.

## Foundation

- Foundation owners are component-agnostic and registry-backed.
- Generic bridges expose only minimum cross-family inputs.
- Do not duplicate theme, tokens, units, typography, state/ripple/focus, motion, icon, overlay, or verification ownership.
- Generic browser/DOM/teleport utilities remain outside unless the contract itself is Material-owned.
- Verification adapters belong to the owning foundation testing surface and are never component/product API.
- Legacy additive changes must keep one active owner; new standalone artifacts require canonical relocation.

## Components

- Each family owns one complete canonical README blueprint and one `layered-v1` profile.
- Family boundary, state source of truth, and DOM/accessibility owners must be explicit.
- Controlled semantic state has no hidden component copy.
- Browser/foundation facts remain browser/foundation-owned.
- Transient component state is limited to owned gesture, overlay, animation, or native coordination and defines cancellation/cleanup.
- Product behavior, placement, information architecture, and workflow remain outside the family.
- Every new or migrated component follows the standard test profile.
- Exactly one canonical `StateMatrix` covers every distinct supported component-owned visible route.
- Non-visual state contracts remain in contract/browser tests.
- Visual regression and real browser behavior are separate proof layers.
- Automated agents do not claim human visual review passed.

## Testing

Required for new/migrated components:

1. static and structured architecture validation;
2. colocated Vue Test Utils contract tests;
3. canonical `StateMatrix`;
4. Playwright visual regression;
5. Storybook Playwright behavior tests when applicable;
6. pure helper/composable tests when applicable;
7. changed-consumer preservation checks;
8. required architecture, Material, and human visual review.

Do not verify appearance in Vitest/Vue Test Utils, prove behavior with forced state, add test-only production APIs, create one screenshot per cell, duplicate non-visual states as matrix cells, or build a production matrix/test DSL.

## Patterns

A pattern is allowed only when it:

- maps to official Material composition or canonical/adaptive layout;
- is independent of one domain/feature;
- is required by a current scenario;
- cannot be owned more narrowly;
- is testable without product data.

## Migration

- Existing Material code outside this directory is legacy, not a template.
- Strict local repairs may remain under valid `Architecture impact: none`.
- New Material ownership at legacy paths is forbidden.
- Migrate one cohesive family/domain per focused PR.
- Update consumers, exports, blueprints/contracts, registries, stories, tests, snapshots, risk registration, and migration map atomically.
- Remove obsolete paths; temporary compatibility requires exact consumers, no new usage, and removal target.

## Verification

Automation may block deterministic facts: paths, dependencies, exports, files, token syntax, required blueprint sections, story identity, and test artifacts.

Architecture/Material review confirms family rationale, source interpretation, route correctness, visual-route completeness/equivalence, and matrix readability. Human review confirms visual correctness.

Do not claim that automation proves free-form architecture or visual decisions.
