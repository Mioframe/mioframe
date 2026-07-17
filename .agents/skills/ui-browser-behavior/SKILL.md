---
name: ui-browser-behavior
description: 'Use for UI changes involving real DOM layout, focus, keyboard navigation, pointer or touch input, teleport, overlays, scrolling, responsive styling, browser APIs, Material state acquisition, or mobile behavior. Prefer Playwright/e2e over Vue component tests for these behaviors.'
---

# UI browser behavior workflow

Use this skill only when correctness depends on browser behavior rather than pure state, static structure, or ordinary CSS wiring.

For public Material components, also follow `docs/material-3/component-testing.md`.

## Do not use this skill

Do not use it for pure helpers, schemas, services, storage logic, validation, normalization, static component contracts, token mapping, selector review, or visual appearance alone.

Do not add Playwright merely to prove that the browser interpolates a correctly configured CSS transition or renders ordinary static CSS.

## Activation check

Use this workflow when the change owns or constrains:

- real layout, measurement, scrolling, sticky/fixed, or viewport behavior;
- focus, focus-visible, keyboard navigation, or accessibility interaction;
- pointer, drag, touch, gesture, capture, cancellation, or mobile behavior;
- teleport, dialog, sheet, menu, tooltip, or overlay lifecycle;
- responsive or container-dependent behavior;
- browser APIs;
- JavaScript or WAAPI timing/lifecycle;
- Material interaction-state acquisition or release that is not purely native and unchanged;
- computed CSS cascade, inheritance, or custom-property propagation whose final result cannot be established reliably from source and contract tests.

A component with none of these may record `Browser behavior: not applicable` with an ownership-based reason.

## Workflow

1. Identify the observable behavior and its owner.
2. Confirm that a unit, component-contract, or visual test cannot prove it more directly.
3. Use public component surfaces and real browser actions.
4. Assert the observable outcome, not framework internals.
5. Extract pure state transitions or lifecycle logic when that reduces browser-test scope.
6. Run the narrowest applicable Storybook or application Playwright check.
7. Follow final repository verification from `AGENTS.md`.

## Material component behavior

Browser checks may cover applicable:

- keyboard activation or navigation;
- focus entry, movement, visibility, and restoration;
- pointer/touch acquisition, drag, gesture, and cancellation;
- expanded target-area hit testing;
- overlay containment, outside interaction, escape/back, and lifecycle;
- responsive or container-dependent behavior;
- JavaScript/WAAPI motion completion and reduced-motion behavior;
- final computed token/property propagation when source inspection cannot resolve it.

For ordinary CSS motion:

- verify official motion ownership and component/foundation wiring in source and contract tests;
- do not sample frames, measure browser interpolation, or duplicate equivalent input paths;
- use a browser check only when state acquisition, final computed routing, or a reported runtime defect requires it.

Forced visual states prove appearance only. They do not prove acquisition, cancellation, or cleanup.

The canonical visual story may be a `StateMatrix` when multiple visual routes exist or a bounded ordinary story when one route is sufficient.

## Browser capability prompts

For browser permission prompts, pickers, clipboard, file-system access, or similar capability flows:

- trigger only from an explicit user action;
- keep provider state, credentials, mounts, and domain data in their owning service;
- surface typed recovery state to UI;
- keep display components declarative;
- do not pass clients, capabilities, or service objects through display props.

## Rendered structure checks

For panes, docs, settings, dialogs, and app bars, verify applicable:

- one clear page/app-bar heading;
- slots preserve navigation and trailing actions;
- browser APIs are guarded;
- text and diagnostics use the correct format;
- typography and spacing reuse accepted tokens/components;
- new Vue components render one stable root element and parents own conditional rendering.

## Test placement

Use isolated Storybook behavior specs for component-owned browser interaction. Pointer, touch, scrolling, focus acquisition, and overlay lifecycle assertions belong in `tests/e2e/storybook`, not visual specs.

Use application E2E only when product composition is part of the contract.

Use a reproducible smoke check only when no suitable spec exists and adding one would be disproportionate.

## Interaction fidelity

- Drive the same public surface and input mechanism available to users.
- Prefer semantic locators by role and accessible name.
- Do not call private methods, mutate Vue state, invoke app internals, or dispatch synthetic internal events to complete the behavior.
- Wait for observable readiness and outcomes.
- Do not synchronize against framework internals or arbitrary sleeps.
- Do not hide instability with `force`, broad retries, or inflated timeouts.
- Assert user-visible outcomes rather than render counts or DOM identity unless explicitly contractual.
- Test only materially different input paths.

## Limits

- Do not introduce broad E2E coverage when a focused check is enough.
- Do not duplicate appearance assertions owned by the canonical visual story.
- Do not move composition boundaries without reviewing DOM parentage, focus, scroll, teleport, and overlay ownership.
- Do not require browser tests for behavior owned entirely by native HTML and unchanged by the component.
- New or migrated Material components still require their colocated component-contract test.
