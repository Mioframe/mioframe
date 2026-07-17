---
name: visual-regression-testing
description: 'Use for canonical Storybook visual references, bounded screenshot coverage, Material state matrices, responsive visual surfaces, intentional baseline updates, and operator visual handoff. Visual tests prove appearance only.'
---

# Visual regression testing

Follow `docs/testing/architecture.md`. Visual regression detects unintended changes in accepted rendered appearance. It does not prove component API, browser behavior, product flow, accessibility interaction, or Material correctness.

For public Material components, also follow `docs/material-3/component-testing.md`.

## Harness

Use isolated Storybook stories with:

- deterministic fixture data;
- only dependencies required to render the surface;
- no product orchestration, navigation, storage, network, diagnostics, or app bootstrap side effects;
- a stable bounded root whose identity is recorded by the owning component or family documentation.

Storybook is a rendering harness, not an alternate application.

## Canonical visual identity

A visible public component or stable surface records one canonical visual reference:

- use `StateMatrix` and `data-testid="visual-<component-kebab>-state-matrix"` only when multiple distinct component-owned visual routes exist;
- use a bounded `Overview`, `Default`, or equivalent story when one representative route is sufficient.

Keep accepted story ids and bounded roots stable. Rename them only with matching spec, snapshot, and documentation changes.

Use `.visual-checker-backdrop` when transparency, shape, elevation, or state-layer output must remain visible against a neutral fixture. Do not copy the checkerboard into component stories or production UI. A simple opaque component may use another deterministic bounded fixture when the checkerboard adds no value.

## State matrix

A state matrix represents distinct visible contracts, not every state or configuration name.

Include applicable:

- supported configurations producing distinct component-owned visible output;
- semantic, disabled, unavailable, or transient appearances that differ visibly;
- simultaneous states with a distinct winner or coexistence result;
- project extensions and accepted deviations that change visible output.

Do not build a Cartesian product. Equivalent sizes, labels, icons, content, and configurations do not receive duplicate cells. Use readable row, column, and section labels. Prefer one bounded screenshot and split only when readability requires labelled sections.

Do not manufacture a matrix for a component with one meaningful visual route.

## Snapshot scope

Prefer:

- one complete readable matrix;
- one simple canonical component story;
- one dialog, sheet, menu, or overlay surface;
- one distinct responsive layout context;
- one focused regression fixture with a named visible invariant.

Avoid full-page screenshots unless page layout itself is the accepted contract. Do not create one snapshot per matrix cell or per equivalent state.

## Determinism

Before capture:

1. use stable data and viewport;
2. settle or disable animation without changing the accepted final appearance;
3. avoid live dates, randomness, network, storage, uncontrolled timers, and loading state;
4. wait for fonts, icons, asynchronous rendering, and deterministic fixture setup;
5. mask only unavoidable dynamic regions;
6. keep labels and output readable;
7. update baselines only from the canonical environment;
8. do not hide text, broaden clipping, or raise thresholds merely to suppress noise.

## Transient visual state

- Use the real public contract for semantic and disabled appearance.
- Generic transient appearance may use an accepted foundation testing adapter outside public product API.
- Use minimal real Playwright input only when no accepted adapter accurately represents the stable visible state.
- Capture only after the visible state is stable.

Forced state proves appearance only. It does not prove real acquisition, release, transition, cancellation, cleanup, actionability, or focus movement.

Do not add test-only public API, production branches, or family-local forced-state systems.

## Strict lane boundary

Visual specs live under:

```text
tests/e2e/visual/
```

For Material families prefer:

```text
tests/e2e/visual/material/<family>.spec.ts
```

A visual spec may open a story, prepare deterministic appearance, and capture a screenshot. It must not contain behavioral success criteria such as click outcomes, focus movement, pointer acquisition, drag completion, scroll lifecycle, overlay dismissal, or persistence.

Do not reproduce Material token tables through large computed-style assertion matrices. Use canonical screenshots for appearance and a small browser or contract assertion only when a non-visual stable routing contract cannot be observed reliably in the image.

Route real focus, keyboard, pointer, touch, drag, scrolling, overlay, responsive interaction, motion lifecycle, and browser behavior to `ui-browser-behavior`.

## Operator Material review

Automated baselines compare against prior accepted output; they do not prove correspondence with current canonical Material 3 Expressive sources.

Operator comparison is required for applicable:

- first accepted canonical reference for a component;
- intentional changes to visible tokens, state routing, shape, color, elevation, typography, icon geometry, focus, ripple, motion appearance, or layout;
- foundation changes with rendered impact;
- intentional baseline updates caused by a visible-contract change.

Report:

```text
Canonical visual story: <story id>
Visual coverage: complete | incomplete (<gap>)
Automated visual baseline: passed | updated and inspected | not applicable (<reason>)
Official visual sources: <named evidence when Material applies>
Operator visual acceptance: required | accepted | rejected | blocked (<reason>)
```

An automated agent never reports operator acceptance as `accepted`.

## Commands

Run through repository verification:

```bash
pnpm verify --only visual --files <source-story-or-visual-spec-paths...>
```

Update snapshots only for intentional accepted changes after inspecting the diff:

```bash
pnpm test:visual:update
pnpm verify --only visual --files <source-story-or-visual-spec-paths...>
```

The direct update command changes baselines; the verify-managed command remains the evidence gate.

## Reject when

- a unit, component-contract, browser-behavior, app-e2e, or consumer test is the correct owner;
- the screenshot is broad without a clear visual invariant;
- the fixture depends on uncontrolled product, time, network, storage, or loading state;
- a baseline changes without explanation and inspection;
- behavior is asserted instead of appearance;
- computed styles duplicate a token table or implementation;
- equivalent combinations create snapshot bloat;
- forced states are presented as behavior proof;
- a simple component receives a ceremonial matrix;
- a component with multiple distinct visible routes lacks readable canonical coverage.
