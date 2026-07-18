---
name: ui-browser-behavior
description: 'Use for UI behavior requiring real focus, keyboard, pointer/touch, layout, scrolling, overlays, responsive rendering, browser APIs, motion lifecycle, or mobile behavior. Choose Storybook behavior or app E2E by ownership.'
---

# UI browser behavior workflow

Use this skill only when correctness depends on browser behavior rather than pure state, static structure, or ordinary CSS wiring. Follow `docs/testing/architecture.md`; browser proof uses Playwright and real public input and does not own deterministic logic, Vue-only contracts, or visual appearance.

For new or migrated public Material components, also follow `docs/material-3/component-testing.md`.

## Activation

Use when behavior depends on focus, keyboard, pointer/touch, drag, geometry, scrolling, viewport, overlays, responsive rendering, browser capabilities, permissions, service-worker-visible outcomes, Material state acquisition/release, motion completion, or reduced motion. This includes when the change owns or constrains:

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

Do not use it for pure helpers, schemas, services, storage logic, validation, normalization, static component contracts, token mapping, selector review, or visual appearance alone.

Do not add Playwright merely to prove that the browser interpolates a correctly configured CSS transition or renders ordinary static CSS.

## Choose the execution lane

Use `storybook-behavior` when the behavior belongs to reusable UI or foundation and can be exercised with deterministic fixture data without product routing, persistence, services, or feature orchestration. Isolated Storybook behavior specs cover component-owned browser interaction; pointer, touch, scrolling, focus acquisition, and overlay lifecycle assertions belong in `tests/e2e/storybook`, not visual specs.

Use `e2e` when the complete user scenario is the contract or behavior crosses page, feature, widget, service, worker, persistence, navigation, permission, provider, reload, import/export, or repository boundaries.

Do not route reusable component behavior into app E2E merely because the component has product consumers.

Use a reproducible smoke check only when no suitable spec exists and adding one would be disproportionate.

## Workflow

1. Name the browser-owned contract and owning lane.
2. Inspect native owners, rendered hierarchy, focus order, scroll ownership, teleport boundaries, and responsive composition that matter.
3. Establish deterministic initial state without performing the action under test.
4. Extract pure state transitions or lifecycle logic when that reduces browser-test scope.
5. Drive public controls through real keyboard, pointer, touch, drag, scroll, or browser input.
6. Wait for observable readiness and outcomes.
7. Assert user-visible state, focus, URL, persisted result, or another accepted contract.
8. Add or update the owning source-to-spec mapping when the stable repository impact relation changes.
9. Preserve the current browser project matrix unless a dedicated audited project-applicability migration explicitly changes it.
10. Run the focused lane, then final verification.

## Interaction fidelity

- Drive the same public surface and input mechanism available to users; prefer role, accessible name, and label locators.
- Do not invoke private APIs, component methods, internal handlers, or synthetic internal events to complete the behavior.
- Lower-level setup may create a valid initial state only outside the behavior under test.
- Wait for observable readiness and outcomes, not Vue callbacks, DOM identity, arbitrary sleeps, or assumed animation durations.
- Treat detachment, lost ordinary input, or unexplained scrolling as possible product defects before changing the test.
- Do not use `force`, broad retries, inflated timeouts, or recovery loops that may repeat an already-delivered action.
- Assert user-visible outcomes rather than render counts or DOM identity unless explicitly contractual.
- Test only materially different input paths.

## Accessibility

This proof owns real focus order, keyboard operation, focus restoration, pointer target actionability, overlay containment, and other browser-observable accessibility behavior. Automated accessibility scans are supplemental only.

## Storybook rules

- Fixtures contain only rendering dependencies.
- Keep product bootstrap, storage, navigation, network, and diagnostics outside isolated stories.
- Specs contain no screenshots.
- Forced visual state never proves acquisition, transition, cancellation, cleanup, or actionability.

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

## Impact metadata

For the owning Playwright lane:

- map production, story, fixture, or owned support sources to specs;
- do not use spec paths as source prefixes to group tests;
- a changed spec selects itself;
- use standalone only when no truthful stable source mapping exists;
- shared config/helpers require full-lane fallback unless all consumers are explicit and validated;
- new, moved, renamed, or removed specs update the registry in the same change.

## Mobile and responsive execution

Source impact chooses scenarios; project applicability belongs to persistent test metadata.

Current selected app E2E scenarios continue to use the existing desktop/mobile project matrix until every scenario is audited and a separate migration proves that narrower execution preserves mobile-risk coverage.

Do not introduce a generic criticality tag as a substitute for real touch, viewport, responsive composition, overlay, capability, lifecycle, or platform differences.

Reusable responsive UI normally uses focused Storybook viewports rather than duplicating complete product scenarios.

## Commands

```bash
pnpm verify --only storybook-behavior --files <paths...>
pnpm verify --only e2e --files <paths...>
```

## Forbidden

- deterministic logic, schemas, migrations, service/storage/CRDT transformations;
- component unit or visual tests as substitutes for browser proof;
- broad app E2E when Storybook owns reusable behavior or a focused check is enough;
- duplicating appearance assertions owned by the canonical visual story;
- screenshots in behavior specs;
- architectural boundary violations to simplify setup, including moving composition boundaries without reviewing DOM parentage, focus, scroll, teleport, and overlay ownership;
- browser tests for behavior owned entirely by native HTML and unchanged by the component;
- source mappings overloaded with spec grouping;
- reducing desktop/mobile coverage without the dedicated audited migration.

New or migrated Material components still require their colocated component-contract test.
