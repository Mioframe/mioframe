# Material component development

This is the single workflow for creating, migrating, aligning, testing, and reviewing an official public Material component family.

## Goal

Produce the smallest complete source-backed family that satisfies current requirements, remains isolated from product architecture, and is easy to understand, test, and change.

Documentation, Storybook, tests, and review support the rendered component. They must not become a separate program whose maintenance displaces implementation quality.

## Scope

Use this workflow for:

- a new public official `MD*` component;
- migration of a legacy `MD*` family into `src/shared/ui/material/components/<family>`;
- a Material 3 Expressive alignment change to a canonical family;
- a material change to a migrated family's API, semantics, anatomy, state, tokens, behavior, or visible contract.

A strict local repair to an unmigrated component may record `Architecture impact: none` only when location, imports, public API, native semantics, foundation dependencies, anatomy, states, behavior, tests, and unrelated output remain unchanged.

## Change modes

Choose one:

- `new-component`;
- `end-to-end-migration`;
- `library-relocation-only`;
- `alignment-only`.

Use `end-to-end-migration` by default for legacy families. Split foundation, relocation, or alignment work only when blast radius, reviewability, compatibility, or a safer independently valid state requires it.

## Development sequence

```text
official evidence
→ compact family contract
→ only required foundation decisions
→ owner-local Storybook laboratory
→ one complete primary vertical slice
→ library-owned proof
→ complete supported family surface
→ external consumer migration
→ integration proof
→ obsolete-owner removal
→ agent review
→ operator visual acceptance when required
```

Do not implement every variant before one complete primary slice is coherent.

## Bounded discovery

Before production edits:

1. inspect the current owner, public exports, direct consumers, tests, stories, and known defects;
2. resolve the current official Material 3 Expressive contract for required scenarios;
3. define the minimum complete supported surface and explicit non-goals;
4. inspect only foundation domains required by that surface;
5. stop discovery when ownership, API, semantics, states, dependencies, and proof needs are clear.

Existing consumers reveal compatibility and migration obligations. They do not define Material semantics or justify product-shaped APIs.

## Family contract

Create or update `components/<family>/README.md` before production edits. Keep a small mandatory core and add conditional sections only when they change implementation or proof.

Mandatory core:

```text
MATERIAL COMPONENT CONTRACT

Change mode:
Family:
Components:
Family ownership basis:
Current owner:
Canonical owner:
Public export:
Affected consumers:
Required scenarios:
Non-goals:
Official sources and snapshot:
Supported Material surface:
Unsupported Material surface:
Public API:
Native semantics and accessibility:
Invalid combinations:
Required foundation dependencies:
Production files:
Applicable proof:
Extensions or deviations: none | <records>
Unresolved: none | <blocking decisions>
Readiness: ready | blocked
```

Add only applicable sections:

- anatomy and DOM ownership;
- state ownership and lifecycle;
- token and rendered-property routing;
- configuration routes;
- browser behavior;
- visual evidence;
- consumer migration;
- foundation change.

Omit inapplicable sections. Do not create ceremonial fields or a second contract in a registry, audit, checklist, or PR report.

## API, state, and DOM ownership

- Prefer native HTML activation, form, navigation, and accessibility semantics.
- Keep props, emits, slots, native elements, DOM-critical attributes, and events explicit.
- Consumer semantic state exposed through props remains consumer-controlled.
- User interaction emits intent or a next value; do not keep a hidden copy of controlled state.
- Browser facts such as hover and focus-visible remain browser or foundation owned.
- Component transient state is allowed only for owned gesture, overlay, animation, or unavoidable native coordination.
- Applicable transient state defines acquisition, release, cancellation, disabled behavior, failure behavior, and unmount cleanup.

For each semantic or interactive anatomy part, identify the native owner, focus and accessible-name owner, ARIA/disabled/readonly owner, target-area owner, interaction-layer owner, and final rendered-property owner. Parent and child components must not split these responsibilities implicitly.

Avoid extra DOM nodes when native structure or existing meaningful elements can own the contract.

## Tokens and rendering

- Public `--md-ref-*`, `--md-sys-*`, and `--md-comp-*` names map to exact verified official meanings.
- Use `--app-*` for explicit project-only values outside Material vocabulary.
- Map official component-token paths mechanically without shortening segments.
- Every canonical token has one declaration owner.
- Token declarations remain independent of active configuration and state.
- Configuration selects sources; state resolves applicable output; rendering applies final values to the actual DOM owner.
- Use the shortest route required by the property; do not add private aliases for naming convenience.
- Generic state, ripple, focus, elevation, and motion primitives accept component-agnostic inputs only.
- Dedicated token, route, state, behavior, context, or anatomy files exist only when extraction materially improves clarity or focused verification.

## Storybook laboratory

Storybook is the primary isolated development surface and readable catalogue for accepted rendered output.

Stories and fixtures remain generic and owner-local. They do not connect product stores, routing, storage, diagnostics, network state, app bootstrap, or domain fixtures.

For a visible family provide:

- one stable bounded canonical story;
- only materially distinct variants, sizes, configurations, and states;
- simultaneous states only when precedence or coexistence changes visible output;
- relevant background, theme, target-area, clipping, or responsive contexts;
- focused fixtures for browser-owned behavior.

Use `StateMatrix` only when multiple distinct component-owned visual routes exist. Do not create Cartesian prop matrices, one story or snapshot per state, or optional stories mechanically.

Forced state may stabilize appearance. It never proves acquisition, release, cancellation, interruption, trajectory, cleanup, focus movement, or actionability.

## Proportional proof

Use one primary proof owner per contract:

- component contract tests: public API, defaults, native owner, explicit attributes, ARIA, controlled state, slots, emits, invalid combinations, and non-browser wiring;
- browser behavior tests: real focus, keyboard, pointer/touch, target area, overlay, responsive behavior, ripple, motion lifecycle, cancellation, interruption, and cleanup owned by the family;
- pure tests: extracted deterministic logic or lifecycle only;
- visual regression: bounded protection of an already accepted stable rendered contract;
- consumer checks: compatibility and composition risks introduced by migration;
- repository verification: format, lint, types, tests, build, and existing dependency guards selected by `verify`.

Generic foundation behavior is proved once by its owner. A family proves only routing into that contract and its own semantics, anatomy, behavior, and rendering.

Product E2E does not prove internal Material semantics or visual fidelity. Library tests do not prove product workflow correctness.

## Migration and cleanup

For an end-to-end migration:

1. create the canonical family owner;
2. migrate every affected in-repository consumer and public export through the curated API;
3. preserve accepted product behavior except for named deltas;
4. verify only integration risks introduced by the migration;
5. remove obsolete implementation, exports, tests, stories, snapshots, and compatibility paths.

Do not report migration complete while a parallel active owner remains.

## Review and visual acceptance

The coding agent closes every non-visual decision:

- official source interpretation and supported surface;
- architecture and ownership;
- public API, native semantics, and accessibility;
- state, lifecycle, browser behavior, and cleanup;
- tokens, foundations, and rendered-property routes;
- proof proportionality;
- consumer migration and obsolete-owner removal;
- directly affected repository rules.

Green CI is necessary but is not Material approval.

When visible output is created or intentionally changed, prepare the canonical story, bounded screenshot/diff, named official visual sources, expected deviations, and confirmation that non-visual review passed. The operator reviews visible fidelity only. An automated agent reports operator acceptance as `required` or `blocked`, never `accepted`.

A family is merge-ready only when all applicable non-visual decisions are resolved and proved, repository verification passes, required operator visual acceptance is recorded, and no obsolete owner or permanent compatibility path remains.

A review-only request reports findings in the conversation or PR review. It must not create a permanent audit document or duplicate family state.

## Rule refinement

When real implementation exposes an inaccurate, contradictory, incomplete, obsolete, or needlessly complex rule:

1. identify the concrete evidence and owning source;
2. determine whether the rule or implementation is defective;
3. make the smallest evidence-backed correction;
4. update only directly affected owners;
5. continue after the applicable contract is coherent.

Do not preserve a defective rule through a family-specific exception.

If two correction rounds retain the same objective defect, add workaround logic, or create ownership ambiguity, stop patching and reconstruct the contract and implementation strategy.

## Forbidden

- product or domain dependencies inside the Material family;
- public APIs shaped around one Mioframe consumer;
- speculative variants, abstractions, managers, registries, validators, and extension points;
- universal base components or cross-family state machines;
- generic component test DSLs or public test-only API;
- fixed file profiles or mandatory artifact counts disconnected from current ownership;
- screenshots presented as proof of behavior or official correctness;
- permanent compatibility aliases or duplicated owners.
