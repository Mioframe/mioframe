---
name: visual-regression-testing
description: 'Use when adding or reviewing visual appearance checks, screenshot snapshots, Material state matrices, responsive layout snapshots, or visual regression coverage. Use Playwright screenshots against Storybook stories; do not use Vitest, happy-dom, or Vue Test Utils for appearance.'
---

# Visual regression testing

Use this skill only for appearance regressions. Visual tests are a narrow browser verification layer, not a replacement for unit, component contract, browser behavior, or e2e tests.

For new or migrated public Material components, also follow `docs/material-3/component-testing.md`.

## Core rule

Use Playwright screenshot assertions for visual appearance.

Do not use Vitest, happy-dom, or Vue Test Utils to verify appearance, layout, responsive behavior, Material state visuals, or browser-rendered styling.

## Harness rule

Use Storybook as the preferred visual test harness.

The visual runtime must not inherit product app effects from the normal root app, such as storage permission requests, diagnostics consent/reporting, optional integrations, unload guards, live performance overlays, network initialization, or other product lifecycle behavior.

Required boundaries:

- Add or reuse a colocated Storybook story for the component surface under test.
- Keep stories deterministic and fixture-driven.
- Reuse application styles and shared UI infrastructure required to render the component correctly.
- Isolate product runtime behavior from Storybook rendering. Do not import `MainApp.vue`, call `setupApp`, or add route-based conditionals to disable product effects.
- Do not put business logic, storage orchestration, network behavior, diagnostics, optional integrations, or permission prompts into stories.

Storybook is a stable rendering harness, not an alternate product application or an e2e runner.

## Material component backdrop

Every Storybook demonstration or visual fixture for a shared Material `MD*` component must expose the rendered component against the canonical neutral checkerboard backdrop.

Required contract:

- Reuse `.visual-checker-backdrop` from `.storybook/visual.css` on the fixture root, or the shared Storybook decorator/wrapper that applies the same canonical class.
- Do not add new uses of the legacy `.visual-list-backdrop` alias.
- Do not duplicate the checkerboard gradient inline, create component-family-specific checkerboards, or derive checker colors from `--md-sys-color-*` tokens.
- Apply the checkerboard only to Storybook fixture wrappers, never to production components or product pages.
- Keep the component's own background, transparency, shape, elevation, and state-layer ownership unchanged; the fixture must not add a solid Material surface merely to make the component look correct.
- Surface-context, inheritance, and contrast scenarios keep the checkerboard as the outer fixture and place explicit semantic Material surfaces inside it.
- When touching an existing Material visual story, migrate its fixture root to the canonical checkerboard in the same change and intentionally review resulting baseline updates.

Reject a new or changed Material component demonstration or visual snapshot when its fixture hides the component on a flat implicit background instead of the canonical checkerboard.

## Story identity contract

When a visual spec opens a Storybook story by id, the story `title` and story export name are part of the visual test contract.

Do not rename Storybook titles, story exports, or visual `data-testid` anchors in touched visual stories unless matching visual specs and snapshots are intentionally updated in the same pass.

Prefer keeping existing story ids stable when only component internals, tokens, or visual states change. If a story id must change, update the Playwright `openStory` call and prove the story still renders the expected stable screenshot surface before refreshing baselines.

For new or migrated Material components, the canonical visual contract is:

```text
Story export: StateMatrix
Root anchor: data-testid="visual-<component-kebab>-state-matrix"
```

## Isolation review

Before adding visual snapshots, check whether the story is rendered under an isolated Storybook runtime. If it depends on the normal product root app, refactor setup so the screenshot cannot be affected by product effects.

Reject or refactor setup when visual tests can be affected by:

- onboarding, permission, diagnostics, or storage dialogs;
- snackbars or error-reporting side effects;
- optional integration setup;
- background writes, workers, timers, or unload guards;
- live performance overlays;
- network or account state;
- route guards or product navigation state unrelated to the component surface.

Do not solve isolation by sprinkling `if Storybook` or route checks through product features. Keep isolation in Storybook config and story fixtures.

## Test location

Place visual Playwright specs under the existing Playwright tree:

```text
tests/e2e/visual/<surface>.spec.ts
```

For new or migrated Material families, prefer:

```text
tests/e2e/visual/material/<family>.spec.ts
```

Prefer one spec per stable visual surface or component family. Do not mix unrelated components in one visual spec unless they intentionally share one visual gallery.

Storybook is the harness, not evidence that a test belongs here. Pointer, touch, scrolling, focus acquisition, and browser lifecycle assertions against a Storybook story belong in `tests/e2e/storybook`, even though they render through the same static Storybook build.

## When to add visual tests

Add visual tests for:

- every new or migrated public Material component's canonical `StateMatrix`;
- shared UI primitives and Material-style surfaces with meaningful visual risk;
- important semantic or interaction states;
- mobile and desktop layout regressions;
- previously broken visual states;
- CSS-heavy components where visual regressions are likely and costly.

Do not add visual tests for every non-Material component by default. The mandatory Material state-matrix rule is a deliberate exception because the library requires one consistent human-review surface per component.

## Material state matrix

A canonical Material `StateMatrix` story is exhaustive by supported visual state and distinct state-rendering route.

It must cover:

- all supported semantic states;
- resting/default and every supported interaction state;
- disabled/unavailable states;
- every distinct property-state route from the family rendered-property matrix;
- simultaneous-state combinations with distinct winner or coexistence behavior;
- visual extensions and deviations.

It must not build the full Cartesian product of equivalent sizes, labels, icons, and content. Use the smallest labelled rows that cover distinct state routes.

Prefer one screenshot for the complete bounded matrix. If the matrix would be unreadably large, keep one `StateMatrix` story and capture visibly labelled bounded sections separately. Do not create one snapshot per cell.

## Snapshot scope

Prefer surface screenshots over full-page screenshots.

Good targets:

- a canonical component state matrix;
- one labelled section of a large state matrix;
- one dialog/sheet/menu surface;
- one responsive layout surface;
- one stable visual state group outside the canonical matrix when it covers a separate context.

Avoid full-page screenshots unless page layout itself is under test.

## Manual-review labels

For galleries intended for manual comparison, a reviewer must be able to identify every case directly from the screenshot.

Required for state matrices:

- visible row headings;
- visible column headings;
- visible section headings for split matrices;
- fixture-only external labels for icon-only or otherwise ambiguous cases;
- consistent cell alignment and representative content.

Invisible tooltips, accessible names, test IDs, CSS classes, and source order are insufficient. Labels must not alter or obscure the production component.

## Determinism checklist

Before adding or updating snapshots:

1. Use stable fixture data.
2. Use a fixed viewport or explicit Playwright project viewport.
3. Disable or settle animations and transitions when possible.
4. Avoid live dates, random IDs, timers, network content, loading spinners, and progress indicators unless the stable state itself is under test.
5. Wait for fonts, icons, and async rendering to settle.
6. Mask dynamic regions only when they cannot be made deterministic.
7. Keep screenshots small enough for reviewers to understand the diff.
8. Accept or refresh baselines only from stable Linux/Chromium rendering such as CI or the canonical pinned Playwright container flow; treat other local host-rendered diffs as advisory.
9. Do not refresh baselines from headed mode, hide ordinary text, or raise screenshot thresholds only to suppress text anti-aliasing noise.

## Interaction state rule

For visual states such as hover, pressed, focused, selected, checked, expanded, open, or dragged:

- semantic and disabled states use the real public component contract;
- transient interaction states may use an accepted verification-only foundation adapter for deterministic matrix rendering;
- when an accepted adapter cannot represent the visual accurately, use a minimal Playwright interaction setup before capture;
- capture the smallest stable matrix surface after state setup.

Forced state proves appearance only. Real acquisition, transition, cancellation, cleanup, and user-visible outcomes belong in Storybook behavior tests using actual browser input.

Do not add test-only public component props, events, production branches, or family-local forced-state systems.

## Human Material review

An automated screenshot compares against an accepted baseline; it does not prove that the baseline matches Material.

Human review against named official Material sources is required for:

- an initial state matrix;
- a component's first complete migrated matrix;
- an intentional state-matrix baseline update;
- a foundation change that intentionally changes the component's rendered output.

The verification report records:

```text
State matrix story: <story id>
State coverage: complete | incomplete (<gap>)
Automated visual baseline: passed | updated and inspected | not applicable (<reason>)
Human Material visual review: required | passed | blocked (<reason>)
```

An automated agent must not claim human review passed.

## Commands

Run the visual gate through the repository verification entry point:

```bash
pnpm verify --only visual --files <changed-source-story-or-visual-spec-paths...>
```

Update snapshots only when the visual change is intentional and after inspecting the diff:

```bash
pnpm test:visual:update
pnpm verify --only visual --files <changed-source-story-or-visual-spec-paths...>
```

Do not invoke Playwright directly as a verification substitute. Final completion still requires the read-only `pnpm verify` defined by the `verification` skill.

If a test intentionally verifies typography or text rendering, keep it explicit and separate from general-purpose visual baselines.

## Review checklist

Reject or rewrite a visual test when:

1. It can be covered better by a pure unit or component contract test.
2. It captures a broad page without a clear visual invariant.
3. It depends on random, time-based, network, storage, or uncontrolled loading state.
4. It renders through `MainApp.vue`, the product playground, or another product route instead of Storybook.
5. It inherits product app behavior that can affect screenshots.
6. It updates snapshots without explaining and inspecting the intended visual change.
7. It duplicates behavior assertions instead of checking appearance.
8. A shared Material fixture lacks the canonical checkerboard backdrop or duplicates it locally.
9. A new or migrated Material component lacks exactly one canonical state matrix and visual assertion.
10. Matrix cases are not visibly identifiable.
11. Equivalent configuration combinations create snapshot bloat without covering a new visual route.
12. Forced states are presented as proof of real browser behavior.
