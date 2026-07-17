---
name: ui-browser-behavior
description: 'Use for UI behavior that requires real focus, keyboard, pointer/touch, layout, scrolling, overlays, responsive rendering, browser APIs, motion lifecycle, or mobile behavior. Choose Storybook behavior or app E2E by ownership.'
---

# UI browser behavior workflow

Follow `docs/testing/architecture.md`. Browser proof uses Playwright and real public input. It does not own pure logic, Vue-only contracts, or visual appearance.

For new or migrated public Material components, also follow `docs/material-3/component-testing.md`.

## Activation

Use when behavior depends on focus, keyboard, pointer/touch, drag, geometry, scrolling, viewport, overlays, responsive rendering, browser capabilities, permissions, service-worker-visible outcomes, Material state acquisition/release, motion completion, or reduced motion.

## Choose the execution lane

Use `storybook-behavior` when the behavior belongs to reusable UI or foundation and can be exercised with deterministic fixture data without product routing, persistence, services, or feature orchestration.

Use `e2e` when the complete user scenario is the contract or behavior crosses page, feature, widget, service, worker, persistence, navigation, permission, provider, reload, import/export, or repository boundaries.

Do not route reusable component behavior into app E2E merely because the component has product consumers.

## Workflow

1. Name the browser-owned contract and owning lane.
2. Inspect native owners, rendered hierarchy, focus order, scroll ownership, teleport boundaries, and responsive composition that matter.
3. Establish deterministic initial state without performing the action under test.
4. Drive public controls through real keyboard, pointer, touch, drag, scroll, or browser input.
5. Wait for observable readiness and outcomes.
6. Assert user-visible state, focus, URL, persisted result, or another accepted contract.
7. Apply `@mobile` or `@critical` only when required by `TEST IMPACT`.
8. Run the focused lane, then final verification.

## Interaction fidelity

- Prefer role, accessible name, and label locators.
- Do not invoke private APIs, component methods, internal handlers, or synthetic internal events.
- Lower-level setup may create a valid initial state only outside the behavior under test.
- Wait for observable contracts, not Vue callbacks, DOM identity, arbitrary sleeps, or assumed animation durations.
- Treat detachment, lost ordinary input, or unexplained scrolling as possible product defects before changing the test.
- Do not use `force`, broad retries, or recovery loops that may repeat an already-delivered action.

## Accessibility

This proof owns real focus order, keyboard operation, focus restoration, pointer target actionability, overlay containment, and other browser-observable accessibility behavior. Automated accessibility scans are supplemental only.

## Storybook rules

- Fixtures contain only rendering dependencies.
- Keep product bootstrap, storage, navigation, network, and diagnostics outside isolated stories.
- Specs contain no screenshots.
- Forced visual state never proves acquisition, transition, cancellation, cleanup, or actionability.

## Mobile and responsive execution

The canonical app project runs all selected product scenarios. Tag a scenario `@mobile` only for touch, viewport, responsive composition, overlay, mobile capability, or mobile lifecycle risk. Tag only the small essential cross-platform smoke set `@critical`.

Reusable responsive UI normally uses focused Storybook viewports rather than duplicated product E2E.

## Commands

```bash
pnpm verify --only storybook-behavior --files <paths...>
pnpm verify --only e2e --files <paths...>
```

## Forbidden

- pure logic, schemas, migrations, service/storage/CRDT transformations;
- component unit or visual tests as substitutes for browser proof;
- broad app E2E when Storybook owns the reusable behavior;
- screenshots in behavior specs;
- architectural boundary violations to simplify setup;
- desktop/mobile duplication without `@mobile` or `@critical` justification.
