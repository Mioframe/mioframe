---
name: visual-regression-testing
description: 'Use this skill when adding or reviewing visual appearance checks, screenshot snapshots, Material visual states, responsive layout snapshots, or visual regression coverage. Use Playwright screenshots against Storybook stories; do not use Vitest, happy-dom, or Vue Test Utils for appearance.'
---

# Visual regression testing

Use this skill only for appearance regressions. Visual tests are a narrow browser verification layer, not a replacement for unit, component contract, or e2e behavior tests.

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

Storybook is intended for stable component surfaces and visual states. It should stay a rendering harness, not an alternate product application or an e2e runner.

## Isolation review

Before adding visual snapshots, check whether the story is rendered under an isolated Storybook runtime. If it depends on the normal product root app, refactor the setup so the screenshot cannot be affected by product effects.

Reject or refactor the setup when visual tests can be affected by:

- onboarding, permission, diagnostics, or storage dialogs;
- snackbars or error reporting side effects;
- optional integration setup;
- background writes, workers, timers, or unload guards;
- live performance overlays;
- network or account state;
- route guards or product navigation state unrelated to the component surface.

Do not solve isolation by sprinkling `if Storybook` or route checks through product features. Keep the isolation in Storybook config and story fixtures.

## Test location

Place visual Playwright specs under the existing Playwright tree so current verification can discover focused changes:

```text
tests/e2e/visual/<surface>.spec.ts
```

Prefer one spec per stable visual surface or component family. Do not mix unrelated components in one visual spec unless they intentionally share a single visual gallery.

## When to add visual tests

Add visual tests for:

- shared UI primitives and Material-style surfaces;
- important component states such as enabled, disabled, selected, checked, unchecked, error, loading, focus-visible, hover, or pressed;
- mobile and desktop layout regressions;
- previously broken visual states;
- CSS-heavy components where visual regressions are likely and costly.

Do not add visual tests for every component by default.

## Snapshot scope

Prefer surface screenshots over full-page screenshots.

Good targets:

- a single component gallery container;
- one dialog/sheet/menu surface;
- one responsive layout surface;
- one stable visual state group.

Avoid full-page screenshots unless the page layout itself is the behavior under test.

## Determinism checklist

Before adding or updating snapshots:

1. Use stable fixture data.
2. Use a fixed viewport or explicit Playwright project viewport.
3. Disable or settle animations and transitions when possible.
4. Avoid live dates, random IDs, timers, network content, loading spinners, and progress indicators.
5. Wait for fonts, icons, and async rendering to settle before taking the screenshot.
6. Mask dynamic regions when they cannot be made deterministic.
7. Keep screenshots small enough for reviewers to understand the diff.

## Interaction state rule

For visual states such as hover, pressed, focused, checked, expanded, or open:

- prefer explicit deterministic state props when the component exposes them;
- otherwise use Playwright interaction APIs in a minimal setup step;
- capture the smallest stable surface after the state is reached.

Do not assert business behavior in visual tests. Use e2e tests for behavior and visual tests for rendered appearance.

## Commands

Run the focused visual spec while developing:

```bash
pnpm exec playwright test tests/e2e/visual/<surface>.spec.ts
```

Update snapshots only when the visual change is intentional:

```bash
pnpm exec playwright test tests/e2e/visual/<surface>.spec.ts --update-snapshots
```

Do not update snapshots as a reflex. Inspect the diff first and confirm the appearance change is intended.

## Review checklist

Reject or rewrite a visual test when:

1. It can be covered better by a pure unit test or component contract test.
2. It captures a broad page without a clear visual invariant.
3. It depends on random, time-based, network, storage, or loading state.
4. It renders through `MainApp.vue`, the product `/playground`, or any other product route instead of Storybook stories.
5. It inherits product app behavior that can affect screenshots.
6. It updates snapshots without explaining the intended visual change.
7. It duplicates an e2e behavior assertion instead of checking appearance.
