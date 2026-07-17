---
name: ui-browser-behavior
description: 'Use for UI behavior that requires real focus, keyboard, pointer or touch input, layout, scrolling, overlays, responsive rendering, browser APIs, Material state acquisition, motion lifecycle, or mobile behavior. Choose isolated Storybook behavior or complete app e2e according to ownership.'
---

# UI browser behavior workflow

Follow `docs/testing/architecture.md`. This skill proves browser-owned behavior through real public input. It does not own pure logic, Vue-only contracts, or visual appearance.

For new or migrated public Material components, also follow `docs/material-3/component-testing.md`.

## Activation check

Use this workflow when behavior depends on any of:

- focus, focus-visible, keyboard activation, navigation, or restoration;
- pointer, mouse, touch, drag, gestures, capture, cancellation, or expanded targets;
- layout, geometry, scrolling, viewport sizing, sticky or fixed positioning;
- teleport, dialog, sheet, menu, tooltip, popover, containment, escape, or outside interaction;
- responsive rendering or mobile browser behavior;
- browser APIs, capability prompts, permissions, clipboard, file-system access, or service-worker-visible outcomes;
- Material interaction-state acquisition, release, motion completion, or reduced motion.

Do not use this skill for pure helpers, schemas, migrations, services, storage helpers, CRDT operations, validation, normalization, filtering, sorting, or transformations. Use focused unit tests.

## Choose the owning browser lane

### Storybook browser behavior

Use `tests/e2e/storybook/` when:

- the behavior belongs to a reusable component, foundation primitive, or isolated UI composition;
- the component can be exercised with deterministic fixture data;
- product routing, persistence, services, or feature orchestration are not part of the contract.

Typical ownership: focus indicator acquisition, keyboard behavior, pointer/touch interaction, expanded targets, drag lifecycle, overlay containment, isolated scrolling, responsive component behavior, and component-owned motion.

### App e2e

Use `tests/e2e/*.spec.ts` when:

- the complete user scenario is the contract;
- behavior crosses page, feature, widget, service, worker, persistence, navigation, permission, provider, reload, import/export, or repository boundaries;
- isolated component proof would omit a material integration risk.

Do not route reusable component behavior into app e2e merely because the component has product consumers. Test the reusable owner once and keep product coverage focused on the complete outcome.

## Workflow

1. Name the user-visible behavior and its owning layer.
2. Inspect rendered hierarchy, native owners, focus order, scroll ownership, teleport boundaries, and responsive composition relevant to the change.
3. Extract only genuinely pure decisions into helpers or composables owned by the correct layer.
4. Select Storybook behavior or app e2e using the ownership rules above.
5. Establish deterministic initial state without completing the action under test.
6. Drive the scenario through public controls and real browser input.
7. Wait for observable readiness and outcomes.
8. Assert the user-visible result, persisted result, focus result, URL, or other named contract.
9. Run the focused verify-managed lane, then final verification.

## Interaction fidelity

- Prefer semantic locators based on role, accessible name, and label.
- Use the same public input mechanism available to users.
- Do not invoke component methods, internal handlers, private APIs, or application internals to complete the tested behavior.
- Do not mutate Vue state, dispatch synthetic internal events, or directly write storage for the action under test.
- Lower-level setup is allowed only outside the behavior under test and must produce a valid user-reachable initial state.
- Wait for visible or enabled controls, focus, rendered content, URL, persisted state, or another observable contract.
- Do not synchronize against Vue callbacks, DOM identity, arbitrary sleeps, assumed animation durations, or human-reaction delays.
- Treat detachment, replacement during action, lost ordinary clicks, or unexplained scrolling as possible product defects before changing the test.
- Do not hide uncertain input with `force`, fixed timeouts, broad retries, or recovery loops that may repeat an already-delivered action.

## Storybook behavior rules

- Use isolated deterministic stories with only rendering dependencies.
- Keep product bootstrap, storage, navigation, network, and diagnostics outside the fixture.
- Browser behavior specs contain no screenshots.
- Forced visual state may prepare appearance but never proves acquisition, transition, cancellation, cleanup, or actionability.
- A component with no browser-owned behavior may record `Browser behavior: not applicable` with an ownership-based reason. This does not remove mandatory Material contract or visual proof.

## Browser capability prompts

Treat capability prompts as explicit user-action flows.

- Do not trigger prompts on startup, route load, background refresh, or render.
- The UI may perform the browser-only prompt action but must not own provider state, credentials, mounts, clients, or persisted capabilities.
- The owning provider or service surfaces typed recovery state; UI renders recovery, performs the explicit prompt action, and reports the result.
- Do not pass capabilities, credentials, clients, callbacks, or service objects through ordinary display props.

## Mobile and responsive checks

Mobile browsers and low-end devices are first-class risks, but not every scenario requires duplicate desktop and mobile execution.

Use both projects when viewport, touch versus pointer, responsive composition, overlay behavior, browser capability, or lifecycle changes the contract. Keep platform-independent scenarios on one canonical project unless a known regression justifies broader coverage.

Prefer focused Storybook viewports for reusable responsive UI. Do not rely on hover, precise pointer input, desktop-only dimensions, or unbounded main-thread work.

## Commands

```bash
pnpm verify --only storybook-behavior --files <story-spec-or-source-paths...>
pnpm verify --only e2e --files <app-spec-or-source-paths...>
```

A reproducible manual browser smoke check is acceptable only when no suitable target exists and adding one would broaden the task. New or migrated Material browser behavior should normally receive a focused Storybook behavior spec.

## Limits

- Do not introduce broad app e2e coverage when focused Storybook behavior is the owner.
- Do not use component unit tests or visual tests for browser-owned behavior.
- Do not bypass architectural boundaries to simplify setup.
- Do not duplicate appearance already owned by canonical visual evidence.
- Do not require desktop and mobile duplication without platform-specific risk.
- Do not move wrappers, native owners, scroll owners, or teleport boundaries without reviewing focus, layout, and lifecycle impact.
