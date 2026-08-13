---
name: ui-browser-behavior
description: 'Use for UI behavior requiring real focus, keyboard, pointer/touch, layout, scrolling, overlays, responsive rendering, browser APIs, motion lifecycle, or mobile behavior. Choose Storybook behavior or application E2E by ownership.'
---

# UI browser behavior workflow

Follow `docs/testing/architecture.md`. For isolated reusable UI and Storybook-owned proof, also follow `docs/testing/storybook.md` and the current executable state in `docs/testing/migration-plan.md`.

Browser proof uses Playwright and real public input. It does not own deterministic logic, Vue-only contracts, private third-party implementation, or visual appearance.

## Activation

Use when behavior depends on focus, keyboard, pointer/touch, drag, geometry, scrolling, viewport, overlays, responsive rendering, browser capabilities, permissions, service-worker-visible outcomes, public motion outcomes, or an observable rendered effect that cannot be faithfully proved in Vitest.

## Supported-browser policy

`.browserslistrc` is the canonical product browser baseline. A browser matching that query is supported; one missing browser-specific capability does not make the whole browser unsupported.

- When a supported browser implements the standard Web APIs required by a scenario, Mioframe must provide the normal product behavior and the applicable browser engine must remain in the owning proof matrix.
- When a supported browser does not implement a required API, detect the capability and provide an explicit user-visible unavailable state or supported alternative. Do not expose a broken action, fail silently, or use the unrelated missing capability to exclude that browser from standards-based scenarios.
- Project applicability must follow the observable API, engine, viewport, input, lifecycle, or composition difference. Browser-name filtering without a confirmed capability or engine reason is invalid.

## Choose the execution lane

Use `storybook-behavior` when the observable contract belongs to reusable UI and can be exercised without product routing, persistence, services, or feature orchestration.

Use `e2e` when the complete product scenario crosses page, feature, widget, service, worker, persistence, navigation, permission, provider, reload, or repository boundaries.

Do not route reusable component behavior into application E2E merely because the component has product consumers.

## Storybook ownership

Before writing a Storybook behavior spec:

1. identify the truthful UI owner;
2. for Material, use the Material family owner selected by its `ARCHITECTURE.md`;
3. for other UI, use the current FSD component or cohesive local UI module;
4. use a family/module-level spec only when one shared observable browser contract belongs to that owner;
5. otherwise split proof by owner.

The durable and current executable default for ordinary reusable UI is an owner-local `*.browser.spec.ts` under `src/`. Filesystem-derived owner-local discovery owns the impact relation.

Central `tests/e2e/storybook/**/*.spec.ts` remains only for truthful cross-owner or Storybook-infrastructure contracts that cannot belong to one source owner. Do not add a new central registry mapping for an ordinary component/family merely because older examples used that migration-era structure.

Always re-read `docs/testing/migration-plan.md` before choosing placement; it is the executable-state owner and may advance independently of older family artifacts or examples.

## Workflow

1. Name the browser-owned contract and truthful owner.
2. Choose `storybook-behavior` or application `e2e` by contract ownership.
3. Inspect native owners, rendered hierarchy, focus order, layout ownership, and public inputs that matter.
4. Establish deterministic initial state without performing the action under test.
5. Drive public controls through real user input.
6. Wait for observable readiness/outcomes.
7. Assert the exact public result, not a proxy that merely correlates with it.
8. Use owner-local discovery for ordinary reusable UI; use central proof only for a demonstrated cross-owner/infrastructure contract.
9. Preserve the current browser project matrix unless a dedicated audited project-applicability migration changes it.
10. Run focused verifier-managed proof and return to the top-level task. This skill does not run a separate final gate.

## Scenario selection

Test materially distinct current scenarios, not every theoretical path.

Separate paths when they have different owners or failure risks, for example:

- Enter and Space when the adapter/current scenario could treat them differently;
- submit and reset when both are used or changed;
- pointer and keyboard controlled-state intent when wrapper normalization differs;
- accepted versus rejected controlled intent when renderer-local mutation could drift from the controlling prop;
- attempted disabled activation when the adapter owns disabled forwarding;
- programmatic state updates when hidden renderer drift is a real risk;
- composition pass-through when a decorative child suppresses its own actionability so an enclosing owner must receive input on the same visible region.

For controlled custom-element adapters, real-browser proof must validate the observable renderer event lifecycle selected by architecture. When the renderer exposes a cancelable pre-mutation intent, prove one real action produces one public intent and that rejecting the intent leaves the rendered state controlled by the unchanged prop.

For decorative/presentation composition, do not stop at proving the child is inert. Also prove real input on the child’s visible region reaches the intended owner action and owner-controlled state is reflected back into the child.

Do not duplicate native or renderer behavior merely because the underlying component supports it. Use current scenarios and changed risk to choose proof.

## Public CSS token proof

Only an active Mioframe public token requires browser proof.

When a token is part of the accepted contract:

- set a distinctive non-default value through the public surface;
- assert the intended rendered result when observable;
- do not inspect private renderer DOM;
- do not treat a declaration or resolved custom-property value alone as proof.

Do not test every third-party renderer variable or internal default.

## Motion and transient state

Distinguish Mioframe-owned/publicly observable motion from private renderer-owned animation.

For Mioframe-owned/public motion, use real input and assert exact acquisition, release, interruption, completion, or final-state behavior.

For private renderer animation that Mioframe cannot observe through the public boundary:

- do not invent host-level proxy assertions;
- do not inspect private renderer DOM;
- do not use screenshots as transition-lifecycle proof;
- test only Mioframe-owned integration and report the unautomated renderer-owned part accurately.

## Interaction fidelity

- Prefer role, accessible name, and label locators.
- Do not invoke private APIs, component methods, internal handlers, or synthetic internal events.
- Lower-level setup may establish initial state only outside the behavior under test.
- Wait for observable contracts, not framework callbacks, DOM identity, arbitrary sleeps, or assumed animation durations.
- Treat detachment, lost ordinary input, or unexplained scrolling as possible product defects before weakening tests.
- Do not use `force`, broad retries, or recovery loops that may repeat an already-delivered action.

## Accessibility

Browser proof owns real focus order, keyboard operation, focus restoration, pointer target actionability, overlay containment, and other browser-observable accessibility behavior. Automated scans are supplemental only.

## Storybook fixture rules

- Follow `docs/testing/storybook.md` for story roles and catalogue naming.
- A fixture prepares deterministic state only; the spec performs the behavior.
- Keep product bootstrap, storage, services, navigation, network, diagnostics, and business rules outside isolated stories.
- Specs contain no screenshots.
- Storybook `play` is not merge proof.
- Forced visual state never proves acquisition, transition, cancellation, cleanup, or actionability.

## Impact ownership

For `storybook-behavior`:

- a changed owner-local spec selects itself;
- ordinary reusable UI uses deterministic owner-local relation when the current resolver supports it;
- use one explicit central mapping only for a truthful cross-owner or infrastructure relation that local ownership cannot express;
- never create duplicate registry metadata for a relation already expressed by supported local ownership;
- never use spec paths as `sourcePrefixes` merely to group tests;
- shared config/helpers use full-lane fallback unless every consumer is explicit, small, stable, and validated;
- removed/moved/unresolved relevant ownership uses full owning-lane fallback or blocking validation, never silent skip.

For application E2E, source-to-product-scenario impact remains explicit because product scenarios are intentionally centralized rather than colocated.

## Mobile and responsive execution

Source impact chooses scenarios; project applicability belongs to persistent test metadata.

Current selected application E2E scenarios retain the existing desktop/mobile matrix until a separate migration audits every scenario and proves narrower execution preserves mobile-risk coverage.

Reusable responsive UI normally uses focused Storybook viewports rather than duplicating complete product scenarios.

## Commands

```bash
pnpm verify --only storybook-behavior --files <paths...>
pnpm verify --only e2e --files <paths...>
```

Use readable existing paths accepted by the current verifier. Preserve applicable `--profile` and `--files` scope when rerunning a failed browser lane. For PR work, required GitHub CI on the exact published head owns the broad repository gate; this skill adds no separate broad local completion run.

## Forbidden

- deterministic logic, schemas, migrations, service/storage/CRDT transformations;
- component unit or visual tests as substitutes for browser proof;
- broad application E2E when Storybook owns reusable behavior;
- complete product flows in Storybook fixtures;
- screenshots in browser specs;
- central registry metadata for an ordinary owner-local component/family proof;
- architectural boundary violations to simplify setup;
- duplicate registry metadata for a relation already expressed by supported local ownership;
- source mappings overloaded with spec grouping;
- reducing desktop/mobile coverage without the dedicated audited migration;
- declaration-only CSS assertions presented as rendered proof;
- private renderer DOM or animation parameters;
- proxy assertions presented as proof of a different contract;
- proving only decorative-child non-action when the contract requires pass-through to an enclosing owner;
- exhaustive testing of third-party behavior unchanged by Mioframe.
