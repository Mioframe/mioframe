---
name: visual-regression-testing
description: 'Use when adding or reviewing screenshot-based appearance checks, Material state matrices, responsive visual surfaces, or baseline updates. Use Playwright against isolated Storybook stories; do not use Vitest, happy-dom, or Vue Test Utils for appearance.'
---

# Visual regression testing

Visual tests prove rendered appearance only. They do not replace component-contract, browser-behavior, pure logic, consumer, or human Material review.

For new or migrated public Material components, follow `docs/material-3/component-testing.md`.

## Harness

Use isolated Storybook stories.

Do not inherit product app effects such as storage/permission flows, diagnostics, account/network state, workers, unload guards, navigation, or live overlays.

Required:

- deterministic fixture data;
- only rendering dependencies needed by the component;
- no business logic or product orchestration;
- no `MainApp.vue`, app bootstrap, or product-route workarounds.

Storybook is a rendering harness, not an alternate application or behavior-test substitute.

## Material backdrop

Every Material component visual fixture uses `.visual-checker-backdrop` on the fixture root or a shared Storybook-only wrapper applying that class.

Do not:

- add the legacy `.visual-list-backdrop` alias;
- duplicate the checkerboard gradient;
- derive checker colors from Material theme tokens;
- apply the checkerboard to production components/pages;
- add an implicit solid surface that hides transparency, shape, elevation, or state-layer behavior.

Explicit surface-context scenarios place their semantic surfaces inside the checkerboard.

## Story identity

Story title, export name, root anchor, visual-spec target, and snapshot names are one contract.

For a new or migrated Material component:

```text
Story export: StateMatrix
Root anchor: data-testid="visual-<component-kebab>-state-matrix"
```

Keep accepted ids stable. Rename only with matching specs and snapshots.

## Test location

Use:

```text
tests/e2e/visual/<surface>.spec.ts
```

For new or migrated Material families prefer:

```text
tests/e2e/visual/material/<family>.spec.ts
```

Pointer, touch, scrolling, focus acquisition, overlay lifecycle, and behavior assertions belong in `tests/e2e/storybook`, not visual specs.

## Canonical Material `StateMatrix`

The matrix is exhaustive by distinct supported component-owned visible output.

It covers:

- every supported state/configuration producing a distinct visible result;
- every distinct visible property route from the rendered-property matrix;
- disabled/unavailable appearances that differ visually;
- simultaneous-state combinations with distinct visible winner/coexistence results;
- visual extensions and deviations.

A semantic, interaction, or lifecycle state with no distinct component-owned visible output does not need a matrix cell. Verify it through component or browser tests.

Do not build the full Cartesian product of equivalent sizes, labels, icons, content, or configurations.

Prefer one screenshot for the complete bounded matrix. Split only into visibly labelled bounded sections when one image would be unreadable. Do not create one snapshot per cell.

## Snapshot scope

Prefer a bounded stable surface:

- complete canonical matrix;
- one labelled matrix section;
- one dialog/sheet/menu surface;
- one responsive layout context;
- one focused non-matrix visual regression with a separate context.

Avoid full-page screenshots unless page layout itself is the visual contract.

## Labels and readability

A reviewer must identify every matrix case directly from the screenshot.

Require:

- visible row headings;
- visible column headings;
- visible section headings when split;
- external fixture labels for ambiguous/icon-only cases;
- consistent alignment and representative content.

Accessible names, tooltips, test ids, CSS classes, controls, and source order are insufficient as the only labels.

Labels must not alter or obscure component rendering.

## Determinism

Before capture:

1. use stable data and viewport;
2. settle or disable animations appropriately;
3. avoid live dates, randomness, network, storage, uncontrolled timers, and loading state;
4. wait for fonts, icons, async rendering, and deterministic state setup;
5. mask only unavoidable dynamic regions;
6. keep the screenshot readable;
7. accept/update baselines only from the canonical Linux/Chromium environment;
8. do not hide text or raise thresholds merely to suppress rendering noise.

## Visual-state setup

- Semantic and disabled appearance uses the real public component contract.
- Generic transient appearance may use an accepted foundation testing adapter.
- When no accepted adapter accurately represents the appearance, use minimal real Playwright input before capture.
- Capture after the visible state is stable.

Forced state proves appearance only. Real acquisition, transition, cancellation, cleanup, and user-visible outcomes require Storybook browser tests.

Do not add test-only public props, events, classes, production branches, or family-local forced-state systems.

## Human Material review

Automated screenshots compare against a baseline; they do not prove that the baseline matches Material.

Human comparison with recorded official documentation and, when required, official Design Kit evidence is required for:

- an initial matrix;
- a component's first complete migrated matrix;
- an intentional matrix baseline change;
- a foundation change intentionally altering rendered output.

Report:

```text
State matrix story: <story id>
State coverage: complete | incomplete (<gap>)
Automated visual baseline: passed | updated and inspected | not applicable (<reason>)
Human Material visual review: required | passed | blocked (<reason>)
```

An automated agent must not report human review as passed. Persist accepted PR/date and source snapshot in the family blueprint.

## Commands

Run through the repository verification entry point:

```bash
pnpm verify --only visual --files <changed-source-story-or-visual-spec-paths...>
```

Update snapshots only for intentional changes after inspecting the diff:

```bash
pnpm test:visual:update
pnpm verify --only visual --files <changed-source-story-or-visual-spec-paths...>
```

Do not use direct Playwright invocation as a substitute for repository verification.

## Reject when

- a unit/contract test is the correct owner;
- the screenshot is broad without a clear visual invariant;
- the fixture depends on uncontrolled product/time/network/storage state;
- product app bootstrap affects rendering;
- a baseline changes without explanation and inspection;
- behavior is asserted instead of appearance;
- the checkerboard contract is missing or duplicated;
- a new/migrated Material component lacks one canonical matrix and visual assertion;
- matrix cases are not visibly identifiable;
- equivalent combinations create snapshot bloat;
- forced states are presented as behavior proof;
- non-visual states are duplicated as meaningless visual cells.
