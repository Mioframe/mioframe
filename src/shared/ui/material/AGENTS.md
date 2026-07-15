# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical Material library boundary.

Use:

- `material3-guidelines` for source, usage, and alignment decisions;
- `material-foundation` for cross-family foundation changes;
- `shared-ui-implementation` for public component implementation;
- `component-contract-testing` for colocated Vue contract tests;
- `ui-browser-behavior` for real browser-owned behavior;
- `visual-regression-testing` for state-matrix screenshots and visual diffs;
- `docs/material-3/library-architecture.md` for location, dependency, public API, and migration;
- `docs/material-3/foundation-architecture.md` for foundation ownership;
- `docs/material-3/component-architecture.md` for family implementation;
- `docs/material-3/component-testing.md` for the mandatory component test profile and state matrix.

## Contains

Only:

- `foundation`: cross-family Material contracts;
- `components`: official public Material component families;
- `patterns`: reusable official Material compositions passing the documented pattern gate;
- library-level documentation and curated public entry points.

Canonical Material policy and source-evidence documents remain under `docs/material-3`.

## Dependency direction

```text
shared/lib generic infrastructure
  ├─→ material/foundation
  ├─→ material/components
  └─→ material/patterns

material/foundation → material/components → material/patterns
material library → project-specific shared UI and product layers
```

- Any Material layer may import a correctly owned generic `shared/lib` utility directly.
- Do not create a foundation wrapper merely to route generic DOM, event, geometry, lifecycle, or browser behavior.
- `foundation` must not import `components` or `patterns`.
- Component families must not deep-import other families.
- Patterns use public foundation/component contracts and correctly owned generic utilities only.
- No library code imports `entities`, `features`, `widgets`, `pages`, or `app`.
- Generic `shared/lib` infrastructure must not depend on this library.

## New artifacts

- New official Material components belong in `components/<family>`.
- A single component may own its own family.
- Multiple public components share a family only when official Material guidance relates them and a real shared production contract exists now.
- Legacy directory proximity, similar names, repeated CSS, fewer files, or possible future reuse do not establish family ownership.
- New Material foundation runtime artifacts belong in `foundation/<domain>`.
- New reusable Material compositions belong in `patterns/<pattern>` only when Material documents the composition and a current product scenario requires it.
- Do not add empty directories, placeholder files, speculative extension points, or a universal base component.
- Project-specific UI does not belong under `components`, even when it uses Material tokens or primitives.
- Using a generic external utility does not transfer that utility's ownership into Material.

## Public API

- Public product imports use `@shared/ui/material` after the root production entry point exists.
- Internal library code must not import the root barrel.
- Components import accepted foundation entry points or correctly owned generic `shared/lib` entry points.
- External deep imports into `.vue`, `.css`, private helpers, or another family are forbidden.
- Every public export has one owner, accurate TSDoc, and matching README/registry status.

## Foundation

- Foundation owners are component-agnostic and registry-backed.
- Generic bridges expose only minimum cross-family inputs.
- Do not duplicate theme, tokens, units, typography, state/ripple/focus, motion, icon, or overlay ownership.
- Generic browser/DOM/teleport utilities stay outside the library unless their contract is specifically Material-owned.
- Verification-only transient-state adapters belong to the owning foundation testing surface, never to individual component APIs.

## Components

- Each family follows one `layered-v1` profile and owns its README blueprint.
- The blueprint records the family ownership basis; unresolved family boundaries are blocking.
- Family code owns API, semantics, anatomy, component tokens, routing, property-specific state resolution, rendering, stories, and focused tests.
- Every supported state has one explicit source of truth and change path.
- Consumer-controlled semantic state must not have a hidden component-owned copy.
- Browser/foundation interaction facts remain browser/foundation-owned; components map them to property-specific output.
- Component-owned transient state is limited to owned gesture, overlay, animation, or native coordination lifecycle and defines cancellation and cleanup.
- Every interactive or semantic anatomy part records its DOM/native, semantics, focus, accessible-name, ARIA, disabled/readonly, target-area, state-layer/ripple, focus-indicator, consumer-interactivity, and rendered-property owners as applicable.
- Parent and child components must not implicitly split native action, focus, accessibility, interaction-surface, or rendering ownership.
- Product behavior, placement, information architecture, and workflow remain outside the family.
- Every new or migrated public component records and implements the standard test profile from `component-testing.md`.
- Every new or migrated public component has one canonical Storybook export named `StateMatrix`.
- The matrix covers every supported visual state and every distinct state-rendering route, not every equivalent size/content combination.
- The family README includes a concise state-matrix coverage map.
- A state-matrix screenshot is mandatory, but real browser behavior is verified separately through real input.
- Automated agents must not claim that human visual review passed.

## Component testing ownership

Use the same layers for every component:

1. verify-managed architecture checks;
2. colocated `<Component>.test.ts` contract tests;
3. canonical `StateMatrix` Storybook story;
4. Playwright visual regression of that matrix;
5. Storybook Playwright behavior tests when browser-owned behavior exists;
6. pure helper/composable tests when extracted logic exists;
7. changed-consumer preservation checks.

Do not:

- verify appearance in Vitest or Vue Test Utils;
- prove behavior with forced visual states;
- add test-only public props, events, classes, or production branches;
- create one screenshot per state cell;
- omit a supported state because it is hard to display;
- build a production state-matrix component or generic test DSL.

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
- Update all consumers, exports, contracts, registries, stories, tests, risk registration, snapshots, and the library migration map atomically.
- A component migration adds or consolidates the canonical state matrix and standard test profile.
- Remove old paths; temporary compatibility re-exports require an explicit removal target and must not receive new usage.

## Verification

Architecture and test-profile validation are blocking for new and migrated library artifacts.

Verify:

- location, accepted family boundary, and dependency direction;
- public exports and no deep imports;
- explicit state sources of truth and no hidden controlled-state copies;
- explicit anatomy, DOM, accessibility, interaction-surface, and rendered-property owners;
- no artificial foundation wrappers or project-specific content;
- no local foundation substitute;
- complete consumer migration and removal of obsolete paths;
- colocated contract tests;
- exactly one canonical `StateMatrix` export and stable root anchor;
- complete state-route coverage with visible labels;
- Playwright visual regression for the matrix;
- separate real browser behavior tests when applicable;
- truthful human-review status.