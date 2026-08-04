---
name: ui-browser-behavior
description: 'Use for UI behavior requiring real focus, keyboard, pointer/touch, layout, scrolling, overlays, responsive rendering, browser APIs, motion lifecycle, or mobile behavior. Choose Storybook behavior or application E2E by ownership.'
---

# UI browser behavior workflow

Follow `docs/testing/architecture.md`. Browser proof uses Playwright and real public input. It does not own deterministic logic, Vue-only contracts, private third-party implementation, or visual appearance.

## Activation

Use when behavior depends on focus, keyboard, pointer/touch, drag, geometry, scrolling, viewport, overlays, responsive rendering, browser capabilities, permissions, service-worker-visible outcomes, public motion outcomes, or the observable effect of an active public CSS token override.

## Supported-browser policy

`.browserslistrc` is the canonical product browser baseline. A browser matching that query is supported; one missing browser-specific capability does not make the whole browser unsupported.

- When a supported browser implements the standard Web APIs required by a scenario, Mioframe must provide the normal product behavior and the applicable browser engine must remain in the owning proof matrix.
- When a supported browser does not implement a required API, detect the capability and provide an explicit user-visible unavailable state or supported alternative. Do not expose a broken action, fail silently, or use the unrelated missing capability to exclude that browser from standards-based scenarios.
- Project applicability must follow the observable API, engine, viewport, input, lifecycle, or composition difference. Browser-name filtering without a confirmed capability or engine reason is invalid.

## Choose the execution lane

Use `storybook-behavior` when behavior belongs to reusable UI and can be exercised without product routing, persistence, services, or feature orchestration.

Use `e2e` when the complete product scenario crosses page, feature, widget, service, worker, persistence, navigation, permission, provider, reload, or repository boundaries.

Do not route reusable component behavior into application E2E merely because the component has product consumers.

## Workflow

1. Name the browser-owned contract and owning lane.
2. Inspect native owners, rendered hierarchy, focus order, layout ownership, and public inputs that matter.
3. Establish deterministic initial state without performing the action under test.
4. Drive public controls through real user input.
5. Wait for observable readiness and outcomes.
6. Assert the exact public result, not a proxy that merely correlates with it.
7. Update source-to-spec metadata when the stable impact relation changes.
8. Preserve the current browser project matrix unless a dedicated audited project-applicability migration explicitly changes it.
9. Run the focused owning lane and return to the top-level task. This skill does not run a separate final gate.

## Scenario selection

Test materially distinct current scenarios, not every theoretical path.

Separate paths are required when they have different owners or failure risks, for example:

- Enter and Space when the adapter or current scenario could treat them differently;
- submit and reset when both are used or changed;
- pointer and keyboard controlled-state intent when wrapper normalization differs;
- attempted disabled activation when the adapter owns disabled forwarding;
- programmatic state updates when hidden renderer drift is a risk.

Do not duplicate native or renderer behavior merely because the underlying component supports it. Use current scenarios and changed risk to choose proof.

## Public CSS token proof

Only an active Mioframe public token requires browser proof.

When such a token is part of the accepted contract:

- set a distinctive non-default value through the public surface;
- assert the intended public rendered result when observable;
- do not inspect private renderer DOM;
- do not treat a declaration or resolved custom-property value alone as proof.

Do not test every third-party renderer variable or internal default.

## Motion and transient state

Distinguish Mioframe-owned motion from private renderer-owned animation.

### Mioframe-owned or publicly observable motion

Use real input and assert the exact public acquisition, release, interruption, completion, or final-state contract that Mioframe owns.

### Private renderer-owned animation

When animation occurs inside inaccessible private renderer DOM and Mioframe does not own timing or implementation:

- do not invent host-level proxy assertions;
- `element.matches(':active')` proves only browser press acquisition/release, not internal shape morph, ripple, transition, or reduced-motion handling;
- do not use screenshots as proof of a transition lifecycle;
- do not inspect private renderer DOM in tests;
- use exact installed-version source review plus operator manual testing as required by the owning component workflow;
- test only Mioframe-owned integration.

Report limitations accurately instead of claiming unobservable animation was automated.

## Interaction fidelity

- Prefer role, accessible name, and label locators.
- Do not invoke private APIs, component methods, internal handlers, or synthetic internal events.
- Lower-level setup may establish initial state only outside the behavior under test.
- Wait for observable contracts, not framework callbacks, DOM identity, arbitrary sleeps, or assumed animation durations.
- Treat detachment, lost ordinary input, or unexplained scrolling as possible product defects before weakening tests.
- Do not use `force`, broad retries, or recovery loops that may repeat an already-delivered action.

## Accessibility

This proof owns real focus order, keyboard operation, focus restoration, pointer target actionability, overlay containment, and other browser-observable accessibility behavior. Automated scans are supplemental only.

## Storybook rules

- Fixtures contain only rendering dependencies.
- Keep product bootstrap, storage, navigation, network, and diagnostics outside isolated stories.
- Specs contain no screenshots.
- Forced visual state never proves acquisition, transition, cancellation, cleanup, or actionability.

## Impact metadata

For the owning Playwright lane:

- map production, story, fixture, or owned support sources to specs;
- do not use spec paths as source prefixes to group tests;
- a changed spec selects itself;
- use standalone only when no truthful stable source mapping exists;
- shared config and helpers require full-lane fallback unless all consumers are explicit and validated;
- new, moved, or removed specs update the registry in the same change.

## Mobile and responsive execution

Source impact chooses scenarios; project applicability belongs to persistent test metadata.

Current selected application E2E scenarios continue to use the existing desktop/mobile matrix until every scenario is audited and a separate migration proves that narrower execution preserves mobile-risk coverage.

Do not introduce a generic criticality tag as a substitute for real touch, viewport, responsive composition, overlay, capability, lifecycle, or platform differences.

Reusable responsive UI normally uses focused Storybook viewports rather than duplicating complete product scenarios.

## Commands

```bash
pnpm verify --only storybook-behavior --files <paths...>
pnpm verify --only e2e --files <paths...>
```

Preserve applicable `--profile` and `--files` scope when rerunning a failed browser lane. The top-level task later runs one final read-only project verification.

## Forbidden

- deterministic logic, schemas, migrations, service/storage/CRDT transformations;
- component unit or visual tests as substitutes for browser proof;
- broad application E2E when Storybook owns reusable behavior;
- screenshots in behavior specs;
- architectural boundary violations to simplify setup;
- source mappings overloaded with spec grouping;
- reducing desktop/mobile coverage without the dedicated audited migration;
- declaration-only CSS assertions presented as rendered proof;
- private renderer DOM or animation parameters;
- proxy assertions presented as proof of a different contract;
- exhaustive testing of third-party behavior unchanged by Mioframe.
