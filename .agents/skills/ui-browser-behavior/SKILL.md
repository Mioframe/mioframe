---
name: ui-browser-behavior
description: 'Use for UI changes involving real DOM layout, focus, keyboard navigation, pointer or touch input, teleport, overlays, scrolling, responsive styling, browser APIs, Material state acquisition, or mobile behavior. Prefer Playwright/e2e over Vue component tests for these behaviors.'
---

# UI browser behavior workflow

Use this skill when a UI change depends on browser behavior rather than only pure state or simple rendering.

For new or migrated public Material components, also follow `docs/material-3/component-testing.md`: browser behavior tests prove real state acquisition and outcomes, while the canonical `StateMatrix` visual test proves appearance.

## Do not use this skill

Do not use this skill for pure helpers, schemas, migrations, services, storage helpers, CRDT write helpers, validation, normalization, or pure transformations. Use unit tests for those instead.

Do not add Vue component tests for behavior that depends on layout, focus, keyboard navigation, pointer or touch input, teleport, overlays, scrolling, responsive styling, browser APIs, or Material interaction-state acquisition.

## Activation check

Use this workflow when the change touches any of these areas:

- layout or rendered hierarchy;
- focus, keyboard navigation, or accessibility interactions;
- pointer, mouse, drag, touch, or mobile interactions;
- teleport, dialog, sheet, menu, tooltip, or overlay wiring;
- scroll containers, sticky/fixed surfaces, or viewport sizing;
- responsive styling or Material state acquisition/release;
- browser APIs or DOM measurements;
- page, pane, widget, feature, or shared UI components with observable user behavior.

## Workflow

1. Identify the user-visible behavior and owning layer.
2. Check rendered hierarchy before moving wrappers, teleports, scroll owners, or composition boundaries.
3. For panes, docs, markdown, settings, dialogs, and app bars, apply the rendered structure checklist.
4. Keep component contracts narrow: prefer explicit props, named handlers, explicit emits, and slots over service bags or large config objects.
5. Move reusable state transitions or business rules into composables or pure helpers when they can be tested without the browser.
6. Verify browser-dependent behavior with Playwright/e2e or a reproducible browser smoke check.
7. Use component contract tests only for API/native/structural contracts that do not depend on browser semantics.
8. Use visual Playwright tests only for rendered appearance.
9. Run the narrowest relevant UI verification, then follow the final verification rule from `AGENTS.md`.

## Material component behavior

For a new or migrated Material component, browser tests cover applicable real behavior:

- keyboard activation/navigation;
- focus entry, focus-visible, movement, and restoration;
- pointer, touch, drag, gesture, and cancellation;
- expanded target-area hit testing;
- overlay containment, outside interaction, escape/back, and lifecycle;
- responsive or container-dependent behavior;
- motion completion/reduced-motion behavior when owned by the component;
- actual DOM property owners when browser rendering is required.

Do not use verification-only forced-state providers, state classes, direct Vue mutation, or synthetic internal events to prove acquisition, transition, cancellation, or cleanup.

The Storybook `StateMatrix` may force transient states for deterministic appearance, but it is never behavior evidence.

A component with no browser-owned behavior may record `Browser behavior: not applicable` with an ownership-based reason. This does not remove the mandatory Material contract test or state-matrix visual test.

## Browser capability prompts

Use this section for browser APIs that require a user gesture, browser permission prompt, account prompt, picker, clipboard access, file-system access, or another main-thread capability flow.

- Treat browser prompts as user-action flows. Do not trigger them on startup, route load, background refresh, or render.
- UI may perform the browser-only prompt action, but must not become the owner of provider state, persisted capabilities, credentials, mounts, or domain data.
- The provider/service that detects missing access should surface a typed recovery state or domain error. UI should render recovery, run the prompt from an explicit user action, report the result, and let the owner retry or continue.
- Keep prompt-related components stable and declarative. Extract request loading, result handling, and retry state into a feature/entity composable when more than simple event wiring is needed.
- Do not pass capabilities, credentials, clients, callbacks, or service objects through ordinary display props. Use explicit recovery/action APIs.

## Rendered structure checklist

For rendered panes, docs, markdown, settings, dialogs, and app bars, check before implementation is complete:

- one clear page-level heading or app-bar heading; avoid duplicate top-level headings;
- slots preserve navigation and trailing actions;
- browser APIs are guarded when unavailable or prototype-defined;
- user-visible text and diagnostics use the correct format;
- Material typography and spacing reuse shared tokens or components before local CSS;
- new Vue components render one stable root DOM element with the component block class; parents own conditional rendering.

## Choosing verification

Use Playwright/e2e when behavior involves:

- real focus movement;
- keyboard navigation;
- pointer/touch input;
- scrolling;
- overlays or teleport;
- responsive layout;
- browser APIs;
- mobile behavior;
- Material interaction-state acquisition or release.

Use focused unit tests only when logic is extracted into a composable/helper, or the component check is a simple contract.

Use a reproducible browser smoke check only when no suitable Playwright spec exists and adding one would be broader than the task. New or migrated Material component behavior should normally receive a focused Storybook Playwright spec instead of an undocumented smoke check.

Pointer, touch, scrolling, focus, and browser lifecycle assertions against an isolated Storybook story belong in `tests/e2e/storybook` (`playwright.storybook.config.ts`), not `tests/e2e/visual`. They must not assert screenshots.

## E2E interaction fidelity

- Drive scenarios through the same public surfaces and input mechanisms available to users. Prefer semantic locators based on role and accessible name/label.
- Do not complete the behavior by calling component methods, dispatching internal synthetic events, mutating Vue state, invoking application internals, or writing storage directly.
- Lower-level setup is allowed only outside the behavior under test, through an accepted fixture/helper, producing a valid user-reachable initial state.
- Wait for observable readiness and outcomes: visible/enabled controls, focus, rendered content, URL, persisted state, or another user-visible contract.
- Do not synchronize against Vue internals, implementation callbacks, arbitrary sleeps, or assumed animation durations.
- Do not add human-reaction delays.
- Treat a target that detaches, is replaced during action, or loses an ordinary click as possible product instability; investigate before changing the test.
- Do not hide uncertain input with `force`, fixed timeouts, broad retries, or custom loops that may repeat an already-delivered action.
- Assert resulting user-visible state. Avoid render counts, framework lifecycle, handler internals, or DOM identity unless explicitly contractual.

## Mobile-first checks

Assume mobile browsers and low-end devices are important. Avoid solutions that rely on hover, precise pointer input, desktop viewport assumptions, or unbounded main-thread work.

When progress is knowable, surface determinate progress instead of an indeterminate spinner.

## Limits

- Do not introduce broad e2e coverage when a focused browser check is enough.
- Do not bypass layer ownership by importing background services directly into UI-facing layers.
- Do not move wrappers or composition boundaries without considering DOM parentage, focus, scroll ownership, teleport, and overlay contracts.
- Do not treat the absence of a Vue component unit test as a regression for generic UI when browser coverage owns the behavior; new or migrated Material components still require the standard colocated contract test.
- Do not duplicate appearance assertions already owned by the Material state matrix.
