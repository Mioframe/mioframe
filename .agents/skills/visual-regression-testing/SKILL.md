---
name: visual-regression-testing
description: 'Use this skill when adding or reviewing visual appearance checks, screenshot snapshots, Material visual states, responsive layout snapshots, or visual regression coverage. Use Playwright screenshots against the dev-only playground; do not use Vitest, happy-dom, or Vue Test Utils for appearance.'
---

# Visual regression testing

Use this skill only for appearance regressions. Visual tests are a narrow browser verification layer, not a replacement for unit, component contract, or e2e behavior tests.

## Core rule

Use Playwright screenshot assertions for visual appearance.

Do not use Vitest, happy-dom, or Vue Test Utils to verify appearance, layout, responsive behavior, Material state visuals, or browser-rendered styling.

## Harness rule

Use the existing dev-only playground as the visual test harness.

- Add or reuse a playground page for the component surface under test.
- Keep playground states deterministic and fixture-driven.
- Do not add production routes only for visual tests.
- Do not create a second app bootstrap unless the playground cannot represent the required state.
- Do not put business logic, storage orchestration, or network behavior into playground pages.

The playground route is intended for stable component surfaces and visual states. It should stay a rendering harness, not an alternate application.

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
4. It uses test-only production routes instead of the dev-only playground.
5. It updates snapshots without explaining the intended visual change.
6. It duplicates an e2e behavior assertion instead of checking appearance.
