---
name: visual-regression-testing
description: 'Use when adding or reviewing screenshot-based appearance checks, Material state matrices, canonical visual stories, responsive visual surfaces, or baseline updates. Use Playwright against isolated Storybook stories; do not use Vitest, happy-dom, or Vue Test Utils for appearance.'
---

# Visual regression testing

Visual tests prove rendered appearance only. They do not replace component-contract, browser-behavior, pure logic, consumer, agent, or operator review.

For public Material components, follow `docs/material-3/component-testing.md`.

## Harness

Use isolated Storybook stories with:

- deterministic fixture data;
- only dependencies needed for rendering;
- no business logic or product orchestration;
- no app bootstrap, storage, network, diagnostics, or navigation side effects.

Storybook is a rendering harness, not an alternate application.

## Material backdrop

Use `.visual-checker-backdrop` when transparency, shape, elevation, or state-layer output must remain visible against a neutral fixture surface.

Do not duplicate the checkerboard, derive it from theme tokens, apply it to production UI, or hide transparent output behind an implicit solid surface.

A simple opaque component may use another deterministic bounded fixture when the checkerboard adds no value.

## Canonical visual identity

A visible component records one stable canonical visual story and bounded anchor.

Use:

- `StateMatrix` and `data-testid="visual-<component-kebab>-state-matrix"` when multiple distinct component-owned visual routes exist;
- a bounded `Overview`, `Default`, or equivalent story and stable anchor when one representative route is sufficient.

Keep accepted ids stable. Rename only with matching specs and snapshots.

## Test location

Use:

```text
tests/e2e/visual/<surface>.spec.ts
```

For Material families prefer:

```text
tests/e2e/visual/material/<family>.spec.ts
```

Pointer, touch, scrolling, focus acquisition, overlay lifecycle, and behavior assertions belong in Storybook browser specs, not visual specs.

## `StateMatrix`

Use a matrix only for multiple distinct supported visual routes.

It covers applicable:

- configurations or states producing distinct visible results;
- disabled or unavailable appearances that differ visually;
- simultaneous states with distinct winner or coexistence output;
- visual extensions and deviations.

A non-visual state does not need a cell. Do not build a Cartesian product of equivalent sizes, labels, icons, content, or configurations.

Use visible row, column, and section labels. Prefer one bounded screenshot and split only when readability requires labelled sections. Do not create one snapshot per cell.

## Simple visual components

When one representative route is sufficient:

- use one bounded canonical story;
- screenshot the component or meaningful fixture root;
- do not create a ceremonial matrix or artificial rows and columns.

## Snapshot scope

Prefer a bounded stable surface:

- a complete matrix or labelled section;
- one simple canonical component story;
- one dialog, sheet, or menu surface;
- one responsive layout context;
- one focused regression case with a clear invariant.

Avoid full-page screenshots unless page layout itself is the contract.

## Determinism

Before capture:

1. use stable data and viewport;
2. settle or disable animation appropriately;
3. avoid live dates, randomness, network, storage, uncontrolled timers, and loading state;
4. wait for fonts, icons, async rendering, and deterministic state setup;
5. mask only unavoidable dynamic regions;
6. keep the screenshot readable;
7. update baselines only from the canonical environment;
8. do not hide text or raise thresholds merely to suppress noise.

## Visual-state setup

- Use the real public contract for semantic and disabled appearance.
- Generic transient appearance may use an accepted foundation testing adapter.
- Use minimal real Playwright input when no adapter accurately represents the visible state.
- Capture only after the visible state is stable.

Forced state proves appearance only. Real acquisition, transition, cancellation, cleanup, and user-visible outcomes require browser tests.

Do not add test-only public API, production branches, or family-local forced-state systems.

## Operator Material review

Automated screenshots compare against a baseline; they do not prove that the baseline matches Material.

Operator comparison with named official evidence is required for applicable:

- a component's first accepted canonical visual reference;
- an intentional visible-contract or baseline change;
- a foundation change intentionally altering rendered output.

Report:

```text
Canonical visual story: <story id>
Visual coverage: complete | incomplete (<gap>)
Automated visual baseline: passed | updated and inspected | not applicable (<reason>)
Operator visual acceptance: required | accepted | rejected | blocked (<reason>)
```

An automated agent never reports operator acceptance as accepted.

## Commands

Run through repository verification:

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

- a unit, browser, or consumer test is the correct owner;
- the screenshot is broad without a clear visual invariant;
- the fixture depends on uncontrolled product, time, network, or storage state;
- a baseline changes without explanation and inspection;
- behavior is asserted instead of appearance;
- equivalent combinations create snapshot bloat;
- forced states are presented as behavior proof;
- a simple component receives a meaningless matrix;
- a component with multiple distinct visual routes lacks readable canonical coverage.
