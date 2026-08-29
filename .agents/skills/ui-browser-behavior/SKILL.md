---
name: ui-browser-behavior
description: 'Use for browser-observable UI behavior and choose behavior, browser-integration, or E2E by contract ownership. Follow the current suffix/ownership model from docs/testing/architecture.md and executable state from migration-plan.md.'
---

# UI browser behavior workflow

Follow `docs/testing/architecture.md`. For isolated reusable UI and Storybook-owned fixtures also follow `docs/testing/storybook.md`. `docs/testing/migration-plan.md` records the current executable verification state.

Browser proof uses Playwright and real public input. It does not own deterministic logic, Vue-only contracts, private third-party implementation, or screenshot appearance unless the selected type is visual.

## Choose the verification type

Use **behavior** when the observable contract belongs to interactive UI and can be exercised without complete product orchestration.

Typical behavior contracts:

- focus and focus restoration;
- keyboard navigation;
- pointer/touch interaction;
- drag and scrolling behavior;
- overlay actionability/containment;
- responsive interaction;
- browser-observable accessibility interaction;
- public motion lifecycle.

Use **browser-integration** when the contract belongs to a concrete runtime/service/worker/entity boundary rather than UI interaction.

Typical browser-integration contracts:

- browser storage;
- workers;
- browser APIs;
- service-worker lifecycle;
- cache/install/update/runtime behavior;
- provider/runtime integration requiring a real browser.

Use **e2e** when the complete product scenario crosses composition and product boundaries such as page/widget flow, feature orchestration, services, workers, persistence, navigation, permissions, providers, reload, import/export, or repository state.

Do not route reusable component behavior into E2E merely because the component has product consumers. Do not route service-worker/runtime mechanics into UI behavior merely because the result is visible somewhere in the product.

## Current naming and placement

### Behavior

Ordinary behavior proof is owner-local:

```text
<Owner>.behavior.spec.ts
```

Use one file when practical. A small owner-local directory is allowed when several behavior specs are genuinely needed.

Storybook may provide the deterministic isolated fixture, but the behavior spec owns real input and assertions. Storybook infrastructure behavior with no FSD UI owner may live under `.storybook/**/*.behavior.spec.ts`.

### Browser integration

Runtime integration proof is colocated with the concrete runtime owner:

```text
<Owner>.browser-integration.spec.ts
```

Do not create a central browser-integration dumping ground merely because Playwright runs the test.

### E2E

Complete product scenarios live in dedicated E2E territory:

```text
tests/e2e/pages/<Owner>/<scenario>.e2e.spec.ts
tests/e2e/widgets/<Owner>/<scenario>.e2e.spec.ts
```

The directory defines the primary product owner.

Additional E2E owners are exceptional validated Playwright-native owner metadata. Do not add owner tags to every scenario.

## Removed compatibility

Legacy owner-local `*.browser.spec.ts`, central `tests/e2e/storybook/**/*.spec.ts`, legacy root application E2E discovery, and manual production-path -> E2E-spec mappings are no longer current execution mechanisms. Do not restore or extend them. Historical implementation records may mention them only as migration history.

Current discovery, ownership, and fallback rules come from `docs/testing/architecture.md`, `docs/testing/storybook.md`, and `docs/testing/migration-plan.md`.

## Supported-browser policy

`.browserslistrc` is the canonical product browser baseline.

A missing browser-specific capability does not make the whole browser unsupported. Detect missing required APIs and provide the product's explicit unavailable/fallback behavior where applicable.

Project applicability must follow real engine, viewport, input, lifecycle, or capability differences. Browser-name filtering without a confirmed observable reason is invalid.

## Behavior workflow

1. Name the observable browser contract.
2. Identify the truthful owner.
3. Choose behavior, browser-integration, or E2E by ownership and orchestration boundary.
4. Inspect native owners, rendered hierarchy, focus order, layout/runtime ownership, and public inputs that matter.
5. Establish deterministic initial state without performing the action under test.
6. Drive public controls through real user/browser input.
7. Wait for observable readiness/outcomes.
8. Assert the exact public result, not a correlated proxy.
9. Preserve platform applicability unless a dedicated audited decision changes it.
10. Run the smallest useful verifier-managed focused proof during implementation.

## Interaction fidelity

- Prefer role, accessible name, and label locators.
- Do not invoke private component APIs, internal handlers, or synthetic internal events.
- Lower-level setup may establish valid initial state only outside the behavior under test.
- Wait for observable contracts, not framework callbacks, DOM identity, arbitrary sleeps, or guessed animation durations.
- Treat detachment, lost ordinary input, unexplained scrolling, or repeated-action requirements as possible defects before weakening proof.
- Do not use `force`, broad retries, or recovery loops that may repeat an already-delivered action.

## Accessibility

Real focus order, keyboard operation, focus restoration, pointer target actionability, and overlay containment are behavior proof.

Native semantics, explicit ARIA ownership, disabled/readonly semantics, props/emits/slots, and non-browser wiring normally belong to unit/component-contract proof.

Automated accessibility scans are supplemental only.

## Storybook fixture rules

- Follow `docs/testing/storybook.md` for story roles and catalogue naming.
- A fixture prepares deterministic state only; the spec performs the behavior.
- Keep product bootstrap, persistence, services, workers, product routing, network state, diagnostics, and business orchestration outside isolated stories.
- Behavior specs contain no screenshots.
- Storybook `play` is not a parallel merge-proof system.
- Forced visual state never proves acquisition, transition, cancellation, cleanup, or actionability.

## Public CSS/token browser proof

Only an active Mioframe public token requires browser proof.

When a public token is part of the accepted contract:

- set a distinctive non-default value through the public surface;
- assert the intended rendered result when observable;
- do not inspect private renderer DOM;
- do not treat declaration/resolved-property presence alone as rendered proof.

Do not test every third-party renderer variable or internal default.

## Motion and transient state

Distinguish Mioframe-owned/publicly observable motion from private renderer animation.

For Mioframe-owned/public motion, use real input and assert exact acquisition, release, interruption, completion, or final-state behavior.

For private renderer animation outside Mioframe's observable boundary, do not invent host-level proxy assertions or inspect private renderer DOM.

## Impact ownership

### Behavior and browser integration

- a changed current spec selects itself;
- ordinary local source changes select owner-local specs through deterministic colocation;
- shared config/helpers widen to the complete owning type unless every consumer is explicit, small, stable, and validated;
- removed/moved/unresolved ownership widens safely or fails structural validation;
- do not create duplicate registry metadata for a local relation.

### E2E

Production impact resolves product owners through the reverse dependency model in `docs/testing/architecture.md`:

- traverse through lower FSD layers;
- record reachable widgets and continue upward;
- record reachable pages/panes and stop that branch;
- select E2E by primary/additional owner.

Unknown relevant owner discovery widens to full E2E. Invalid ownership structure fails verification.

Do not maintain production-path -> E2E-spec source mappings.

## Mobile and project applicability

Source impact chooses scenarios. Platform/project applicability is a separate persistent contract.

Preserve existing audited desktop/mobile/both applicability. Reclassify only through a dedicated review of observable platform, input, viewport, lifecycle, and composition requirements.

Missing/stale applicability metadata must fail closed or leave an unclassified scenario eligible for the broad fail-safe project set; it must never silently omit the scenario.

## Commands

```bash
pnpm verify --only behavior --files <paths...>
pnpm verify --only browser-integration --files <paths...>
pnpm verify --only e2e --files <paths...>
```

These are public verification-type commands. Private historical leaf labels are not a durable API.

## Forbidden

- deterministic logic, schemas, migrations, service/storage transformations in browser UI proof;
- component/unit or screenshot tests as substitutes for required browser behavior;
- broad E2E when isolated behavior owns the contract;
- complete product flows in Storybook fixtures;
- screenshots in behavior specs;
- central registry metadata for ordinary owner-local proof;
- manual production-path -> E2E mappings;
- routine owner tags on every E2E;
- custom E2E wrapper/ownership DSL;
- architectural boundary violations to simplify setup;
- changing E2E platform applicability without a dedicated audit;
- declaration-only CSS assertions presented as rendered proof;
- private renderer DOM/animation internals;
- proxy assertions presented as proof of a different contract;
- exhaustive testing of unchanged third-party behavior;
- restoring removed legacy browser/Storybook/E2E discovery or mapping paths.
