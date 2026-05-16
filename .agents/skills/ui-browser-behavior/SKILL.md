---
name: ui-browser-behavior
description: 'Use this skill for UI changes involving real DOM layout, focus, keyboard navigation, pointer or touch input, teleport, overlays, scrolling, responsive styling, browser APIs, Material state visuals, or mobile behavior. Prefer Playwright/e2e or browser smoke checks over Vue component unit tests for these behaviors.'
---

# UI browser behavior workflow

Use this skill when a UI change depends on browser behavior rather than only pure state or simple rendering.

## Do not use this skill

Do not use this skill for pure helpers, schemas, migrations, services, storage helpers, CRDT write helpers, validation, normalization, or pure transformations. Use unit tests for those instead.

Do not add Vue component unit tests for behavior that depends on layout, focus, keyboard navigation, pointer or touch input, teleport, overlays, scrolling, responsive styling, browser APIs, or Material state visuals.

## Activation check

Use this workflow when the change touches any of these areas:

- layout or rendered hierarchy;
- focus, keyboard navigation, or accessibility interactions;
- pointer, mouse, drag, touch, or mobile interactions;
- teleport, dialog, sheet, menu, tooltip, or overlay wiring;
- scroll containers, sticky/fixed surfaces, or viewport sizing;
- responsive styling or Material state visuals;
- browser APIs or DOM measurements;
- page, pane, widget, feature, or shared UI components with observable user behavior.

## Workflow

1. Identify the user-visible behavior and the owning layer.
2. Check the rendered hierarchy before moving wrappers, teleports, scroll owners, or composition boundaries.
3. For panes, docs, markdown, settings, dialogs, and app bars, apply the rendered structure checklist.
4. Keep component contracts narrow: prefer explicit props, named handlers, explicit emits, and slots over service bags or large config objects.
5. Move reusable state transitions or business rules into composables or pure helpers when they can be tested without the browser.
6. Verify browser-dependent behavior with Playwright/e2e or a reproducible browser smoke check.
7. Use component unit tests only for small render or wiring contracts that do not depend on browser semantics.
8. Run the narrowest relevant UI verification, then follow the final verification rule from `AGENTS.md`.

## Rendered structure checklist

For rendered panes, docs, markdown, settings, dialogs, and app bars, check before implementation is complete:

- one clear page-level heading or app-bar heading; avoid duplicate top-level headings;
- slots preserve navigation and trailing actions;
- browser APIs are guarded when unavailable or prototype-defined;
- user-visible text and diagnostics use the correct format for their purpose;
- Material typography and spacing reuse shared tokens or shared components before local CSS.

## Choosing verification

Use Playwright/e2e when the behavior involves:

- real focus movement;
- keyboard navigation;
- pointer/touch input;
- scrolling;
- overlays or teleport;
- responsive layout;
- browser APIs;
- mobile behavior;
- Material visual state behavior.

Use focused unit tests only when the tested logic is extracted into a composable or helper, or the component check is a simple render/wiring contract.

Use a reproducible browser smoke check when no suitable Playwright spec exists and adding one would be broader than the task.

## Mobile-first checks

Assume mobile browsers and low-end devices are important. Avoid solutions that rely on hover, precise pointer input, desktop viewport assumptions, or unbounded main-thread work.

When progress is knowable, surface determinate progress instead of an indeterminate spinner.

## Limits

- Do not introduce broad e2e coverage when a focused browser smoke check is enough.
- Do not bypass layer ownership by importing background services directly into UI-facing layers.
- Do not move wrappers or composition boundaries without considering DOM parentage, focus, scroll ownership, teleport, and overlay contracts.
- Do not treat the absence of a Vue component unit test as a regression when behavior is covered by e2e, browser smoke, or extracted helper/composable tests.
