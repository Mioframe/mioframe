---
name: ui-browser-behavior
description: 'Use for UI behavior requiring real focus, keyboard, pointer/touch, layout, scrolling, overlays, responsive rendering, browser APIs, motion lifecycle, or mobile behavior. Choose Storybook behavior or app E2E by ownership.'
---

# UI browser behavior workflow

Follow `docs/testing/architecture.md`. Browser proof uses Playwright and real public input. It does not own deterministic logic, Vue-only contracts, or visual appearance.

## Activation

Use when behavior depends on focus, keyboard, pointer/touch, drag, geometry, scrolling, viewport, overlays, responsive rendering, browser capabilities, permissions, service-worker-visible outcomes, Material state acquisition/release, motion completion, reduced motion, or the observable effect of a public CSS token override.

## Choose the execution lane

Use `storybook-behavior` when the behavior belongs to reusable UI or foundation and can be exercised with deterministic fixture data without product routing, persistence, services, or feature orchestration.

Use `e2e` when the complete user scenario is the contract or behavior crosses page, feature, widget, service, worker, persistence, navigation, permission, provider, reload, import/export, or repository boundaries.

Do not route reusable component behavior into app E2E merely because the component has product consumers.

## Workflow

1. Name the browser-owned contract and owning lane.
2. Inspect native owners, rendered hierarchy, focus order, scroll ownership, teleport boundaries, responsive composition, and public styling inputs that matter.
3. Establish deterministic initial state without performing the action under test.
4. Drive public controls through real keyboard, pointer, touch, drag, scroll, browser input, or a supported public CSS override.
5. Wait for observable readiness and outcomes.
6. Assert the exact accepted user-visible or browser-observable result, not a proxy that merely correlates with it.
7. Link the scenario to the exact spec in the owning contract or `TEST IMPACT` record.
8. Add or update the owning source-to-spec mapping when the stable repository impact relation changes.
9. Preserve the current browser project matrix unless a dedicated audited project-applicability migration explicitly changes it.
10. Run the focused lane, then final verification.

## Scenario completeness

When a component contract lists multiple materially distinct paths, each path must be represented explicitly or linked to evidence that one proof covers it.

Examples include:

- Enter and Space when both are required;
- pointer and keyboard toggle intent;
- submit and reset when both native types are supported scenarios;
- disabled attempted activation, not only a static disabled assertion;
- programmatic controlled-state updates without false user-action emits;
- form association and representative consumer integration.

Do not infer complete native or accessibility coverage from one successful activation path.

## Public CSS token proof

When a public CSS token is claimed as an active contract:

- set a distinctive non-default value through the public Mioframe surface;
- assert that the intended rendered property or observable behavior changes;
- use the host or another public observable surface;
- do not inspect private m3e shadow DOM or Lit implementation;
- do not treat a declaration, alias, or resolved custom-property value alone as proof of effect.

## Motion and transient state

For renderer-owned motion, test public press/release, interruption, completion or stable final state, and `prefers-reduced-motion` behavior according to risk.

- `element.matches(':active')` proves only that the browser acquired or released the press. It does not prove shape morphing, ripple, transition behavior, final rendered shape, or reduced-motion handling.
- Assert the claimed public outcome through host-observable geometry/style/state when available.
- When the visible effect is not inspectable without private renderer DOM, pair real interaction lifecycle proof with bounded visual evidence and record the limitation. Do not claim that the effect itself was proven by `:active`.
- Do not assert private spring stiffness, damping, duration constants, Lit styles, custom states, or internal animation nodes unless Mioframe explicitly owns them as an active public contract.

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
- broad app E2E when Storybook owns reusable behavior;
- screenshots in behavior specs;
- architectural boundary violations to simplify setup;
- source mappings overloaded with spec grouping;
- reducing desktop/mobile coverage without the dedicated audited migration;
- declaration-only or resolved-value-only CSS assertions presented as proof that an override affects rendered behavior;
- private renderer DOM, Lit internals, or m3e implementation parameters;
- proxy assertions presented as proof of a different observable contract.