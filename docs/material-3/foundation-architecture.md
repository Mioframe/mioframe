# Material 3 foundation architecture

This document defines the architecture and maintenance workflow for Material foundations used by public shared UI components and product composition.

The foundation is not one base component and not a complete framework implemented in advance. It is a set of independently owned, source-backed contracts that are expanded only when a current component or product scenario requires them.

## Goals

The foundation must:

- give components one reusable owner for cross-family Material concerns;
- keep official reference and system contracts current as Material guidance changes;
- let component work discover and close real foundation gaps without local duplication;
- make the impact of foundation changes explicit across all consumers;
- preserve a small implementation surface and avoid speculative infrastructure;
- separate Material component implementation, foundation behavior, and product composition.

## Scope

Foundation domains include:

- official source evidence and snapshot metadata;
- Material authoring units and their build-time conversion;
- reference tokens and system tokens;
- light, dark, and future theme contexts;
- typography roles and typography utilities;
- shape roles;
- elevation roles and generic elevation bridges;
- motion roles and verified platform adaptations;
- state-layer, ripple, focus-visible, and interaction-state acquisition;
- icon system and Material Symbols behavior;
- density, target-area, and spacing policy;
- accessibility rules shared across component families;
- overlay containment and shared overlay lifecycle infrastructure;
- canonical layout and adaptive-surface policy.

The following are not foundation-owned:

- component-family `--md-comp-*` tokens;
- component anatomy, public props, slots, emits, and property-state resolution;
- product information architecture and feature behavior;
- screen-specific layout decisions;
- app-specific public contracts under `--app-*`;
- compatibility behavior that belongs to one component family.

## Dependency direction

Use this direction only:

```text
official Material evidence
→ foundation contracts
→ component-family contracts
→ features/widgets/pages composition
```

Foundation code and contracts must not import or name a consuming component family. A generic primitive may expose a narrow private bridge, but the component maps its own final value into that bridge.

Component-family code must not recreate a foundation concern locally when an accepted foundation contract can express it.

Product composition chooses components and patterns. It must not move product rules into foundation or component internals merely to make them reusable.

## Sources of truth

Authority is layered:

1. this document owns repository-wide foundation architecture and change rules;
2. [Foundation registry](./foundation-registry.md) owns current domain status, owner paths, source snapshot, gaps, and verification;
3. a domain owner document, such as `src/shared/ui/State/README.md` or [Overlays](./overlays.md), owns the detailed accepted runtime contract;
4. production code and tests implement that contract;
5. a task handoff, when present, owns only the proposed delta for the current task.

Historical foundation audits are evidence, not current status sources. When an audit conflicts with the registry or current code, the registry and current code must be reviewed and reconciled.

## Foundation registry record

Every foundation domain has one registry record containing:

```text
Domain:
Status: missing | partial | verified | deviated | blocked
Official sources:
Verified snapshot:
Production owner:
Public contract:
Private bridge contract:
Known consumers:
Known gaps:
Verification:
Last reviewed:
```

`verified` means the supported repository contract is source-backed, implemented, and verified. It does not claim that every optional Material capability has been implemented.

A domain without a current registry record is not an accepted foundation dependency for a newly aligned component.

## Foundation ownership classes

### Token foundation

Owns official `md.ref.*` and `md.sys.*` values and theme-role mapping.

Rules:

- one canonical declaration per official token;
- no component-family tokens in the system token owner;
- no project-only public value under `--md-*`;
- theme contexts override system roles, not component CSS;
- deprecated aliases are explicit, unused by new code, and have a removal target;
- token structure may remain monolithic while ownership is clear; file splitting is not an alignment requirement.

### Authoring and build foundation

Owns Material-oriented authoring units and build-time conversion.

Rules:

- `dp` and `sp` conversion remains centralized;
- components do not perform local unit conversion;
- a conversion change is a cross-library behavior change, not a local CSS cleanup;
- build configuration and base variables must be verified together.

### Runtime interaction foundation

Owns generic interaction-state acquisition, state layer, ripple, and focus contracts.

Rules:

- it exposes generic inputs only;
- it does not decide component semantic state or component property precedence;
- native host semantics remain component-owned;
- component families map final colors, opacities, and other values into generic bridges;
- forced visual state is verification infrastructure, not public production state.

### Visual role foundation

Owns cross-family typography, shape, elevation, and motion roles.

Rules:

- official system roles are canonical;
- components consume the narrow role or component token required by their spec;
- platform adaptations are private and documented when Material publishes a concept that the Web platform cannot express directly;
- arbitrary durations, easing, shadows, radii, or typography values must not be introduced in component code.

### Icon foundation

Owns the Material Symbols primitive and shared symbol configuration behavior.

It does not decide which icon a product action uses or which anatomy positions are supported by a component family.

### Overlay foundation

Owns containment, teleport ownership, nested-overlay registration, outside-interaction boundaries, and shared lifecycle capabilities.

A component family still owns whether its surface is modal, its Material anatomy, role, scrim, and allowed dismissal behavior. It composes the existing overlay capabilities rather than creating another overlay system.

### Policy foundations

Accessibility, target area, density, layout, and adaptivity are cross-library policies even when they do not map to one runtime module.

Each component owns its native semantics and target area. Pages and layout primitives own product-level adaptive composition. The policy foundation defines the constraints and required evidence; it does not become a generic runtime manager.

## Component usage contract

Material alignment includes correct use, not only internal implementation.

Every new or materially changed public component family blueprint must add:

```text
Material usage contract

Intended scenarios:
Do not use for:
Component-choice evidence:
Action/content hierarchy:
Allowed Material compositions:
Placement constraints:
Adaptive behavior and owner:
Product integration in this PR: none | <named consumers>
```

For a library-only request with no product placement, use canonical Material usage as the intended scenario and record `Product integration in this PR: none`. Do not invent a product integration to demonstrate the component.

Features, widgets, and pages must verify component choice and composition against this contract when integrating the component.

## Component foundation dependency contract

Every new, migrated, or materially changed public component family blueprint must also add:

```text
Foundation dependencies

| Domain | Required capability | Accepted owner/contract | Registry status | Change in this PR |
| --- | --- | --- | --- | --- |
```

Include only applicable domains. Typical rows are tokens/theme, units, typography, shape, elevation, motion, state layer/ripple, focus, icons, target area, accessibility, overlay, and adaptivity.

Rules:

- `Registry status` must be `verified`, `partial`, `deviated`, or `blocked` from the current registry;
- a `partial` or `deviated` dependency must name the exact gap relevant to the supported component surface;
- `blocked` prevents component completion;
- `Change in this PR` is `none`, `additive`, `correction`, or `replacement`;
- component production code must consume the named owner rather than reconstruct its behavior.

## Discovering a foundation gap during component work

Use this workflow:

1. Confirm the component scenario and the official component/foundation evidence.
2. Check the foundation registry and current owner implementation.
3. Reuse the accepted contract when it is sufficient.
4. When the capability is missing, classify the required delta before editing production code.
5. Update the registry, owner contract, production code, verification, and component blueprint atomically for an accepted delta.
6. Remove any temporary local workaround introduced during investigation before completion.

A component must not silently create a family-local substitute for a missing foundation capability.

## Foundation change modes

### `foundation-impact: none`

The component consumes an existing accepted foundation contract without changing it.

### `foundation-additive`

Adds a source-backed capability without changing existing consumer behavior or public meaning.

It may remain in the component PR only when all conditions hold:

- the official foundation concept and exact contract are unambiguous;
- one existing foundation owner clearly owns it;
- the delta is backward-compatible;
- it introduces no new lifecycle manager, context hierarchy, dependency, or public extension;
- focused foundation tests and affected component verification fit the same review scope.

### `foundation-correction`

Corrects a token, behavior, platform adaptation, or policy and may change existing consumers.

Requires:

- consumer inventory;
- old and new contract;
- expected rendered or behavioral change;
- migration or compatibility decision;
- risk-specific verification for representative consumers;
- a separate focused PR unless the correction is inseparable from a small first consumer and the handoff explicitly approves the combined scope.

### `foundation-replacement`

Replaces an accepted mechanism or owner.

Requires an architecture handoff, complete consumer migration, removal of the replaced path, and blocking verification. Do not keep two foundation mechanisms active without an explicit temporary compatibility contract and removal target.

### `foundation-refresh`

Revalidates a domain against a newer Material documentation snapshot.

The refresh must classify every observed delta as:

- source-only clarification;
- additive official capability;
- changed meaning or value;
- deprecation;
- removal;
- repository deviation.

A newer snapshot does not automatically change production behavior. Apply behavioral changes only through `foundation-additive`, `foundation-correction`, or `foundation-replacement`.

## Objective expansion rules

Add an official reference or system token when a current supported component or theme scenario requires it and the exact official path and meaning are verified.

Add or expand a runtime primitive only when:

- the required behavior is explicitly cross-family in Material guidance or a platform boundary; and
- the existing repository mechanism is insufficient; and
- the generic contract can remain free of component-family knowledge; and
- total implementation and verification complexity is lower than independent local implementations.

For a project-derived generic behavior without an explicit Material foundation owner, require at least two current unrelated component families or one unavoidable platform-wide owner such as overlay containment.

Do not implement complete palettes, motion catalogs, responsive managers, state machines, or extension APIs in anticipation of future components.

## Public and private contracts

Public foundation contracts include verified `--md-ref-*`, `--md-sys-*`, documented utilities, and public shared primitives intended for component-family use.

Private foundation bridges use `--md-private-*` or private typed APIs and remain generic. They are not consumer customization surfaces.

Forbidden:

- component-specific token names in foundation code;
- foundation primitives importing component families;
- components reading another family's private bridge;
- app-specific values presented as Material foundation;
- a runtime registry or generic resolver for all Material tokens or states;
- a universal Material base component;
- a foundation abstraction justified only by similar syntax or possible reuse.

## Verification

Foundation verification is risk-based and owner-specific.

### Static checks

Verify where practical:

- official token vocabulary and one canonical owner;
- no component tokens in system-token owners;
- no family-specific inputs in generic primitives;
- registry owner paths and source snapshots exist;
- component blueprints declare applicable dependencies;
- no unregistered public foundation export or token;
- deprecated contracts are not used by new code.

### Contract tests

Verify public utilities, generic bridge defaults, disabled behavior, lifecycle cleanup, and platform-adaptation contracts owned by the foundation domain.

### Browser verification

Use browser tests for real focus-visible behavior, pointer/touch state, ripple, overlays, focus restoration, scrolling, viewport/adaptive behavior, computed tokens, and actual property owners.

### Visual verification

Use representative consumers to prove foundation changes. Do not create a screenshot matrix for every consumer. A system-token or primitive change must include at least one high-risk representative for every meaningfully different affected path.

### Consumer blast radius

Every `foundation-correction` or `foundation-replacement` records all direct consumers and the representative verification chosen for each distinct contract path.

## Maintenance loop

Foundation maintenance is continuous and demand-driven:

1. component or product work declares foundation dependencies;
2. the registry reveals accepted capabilities and gaps;
3. source-backed gaps are added or corrected through the smallest change mode;
4. validator and representative tests become blocking for the accepted contract;
5. the registry records the new status and remaining gaps;
6. later component work reuses the accepted owner;
7. periodic or source-triggered refreshes reconcile newer Material guidance.

The foundation is healthy when new component work usually consumes existing contracts, real gaps produce focused owner changes, and no family-local substitutes accumulate.

## Completion

Foundation architecture work is complete only when:

- the affected registry records are current;
- owner contracts, production code, and tests agree;
- source evidence and snapshot are recorded;
- consumer impact is explicit;
- no component-specific knowledge entered a generic owner;
- replaced mechanisms are removed;
- component blueprints reference the resulting accepted contracts;
- unsupported capabilities and deviations remain explicit.
