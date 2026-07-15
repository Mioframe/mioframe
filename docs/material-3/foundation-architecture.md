# Material 3 foundation architecture

This document defines the ownership and change contract for cross-family Material foundations used by public shared UI components and product composition.

The foundation is not a universal base component and not a complete framework built in advance. It is a set of independently owned, source-backed contracts expanded only when a current component or product scenario requires them.

## Goals

The foundation must:

- provide one accepted owner for each cross-family Material concern;
- keep source evidence, ownership, supported contract, gaps, and verification current;
- prevent component-local substitutes and duplicate mechanisms;
- make consumer impact explicit before shared behavior changes;
- support incremental relocation into `src/shared/ui/material/foundation`;
- remain small and free of component-family or product knowledge.

## Scope

Foundation domains include:

- official source evidence and snapshot metadata;
- Material authoring units and build-time conversion;
- reference and system tokens;
- theme contexts;
- typography, shape, elevation, and motion roles;
- generic interaction-state acquisition, state layer, ripple, and focus;
- Material Symbols rendering;
- Material-facing overlay containment and lifecycle adapters;
- cross-library accessibility, density, target-area, layout, and adaptivity policies;
- verification-only adapters for generic transient visual states.

Foundation does not own:

- component-family `--md-comp-*` tokens;
- component anatomy, public props, slots, emits, semantic-state meaning, or property precedence;
- product information architecture, workflow, placement, or adaptive component choice;
- screen-specific layout;
- public project extensions under `--app-*`;
- compatibility behavior used by one family only.

## Dependency direction

```text
official Material evidence
→ foundation contracts
→ component-family contracts
→ Material patterns
→ product composition
```

Foundation code and contracts must not import or name consuming component families. A generic foundation primitive may expose a narrow public contract or private bridge; the component maps its own final value into that bridge.

Component-family code must not recreate an accepted foundation concern locally. Product composition must not move product rules into foundation merely to make them reusable.

Generic DOM, browser, event, geometry, lifecycle, and teleport utilities remain in the correctly owned generic layer. A Material foundation domain may compose them through a narrow Material-facing adapter without taking ownership of the generic mechanism.

## Sources of truth

Authority is layered:

1. this document owns repository-wide foundation architecture and change modes;
2. [Foundation registry](./foundation-registry.md) owns current status, source snapshot, current/canonical owner, contracts, gaps, and verification;
3. a domain owner document owns the detailed accepted runtime or policy contract;
4. production code and tests implement that contract;
5. a task handoff owns only the approved delta for the current change.

Historical audits are evidence only. When an audit conflicts with the registry, owner contract, or code, reconcile the current sources before changing production.

## Registry schema

Every foundation domain has one registry record with these fields:

```text
Domain:
Status: missing | partial | verified | deviated | blocked
Official sources:
Verified snapshot:
Current production owner:
Canonical library owner:
Migration status: legacy | migrating | migrated
Public contract:
Private bridge contract:
Verification-only contract:
Known consumers:
Known gaps:
Verification:
Last reviewed:
```

Rules:

- `missing`: no accepted contract exists;
- `partial`: an owner exists, but source coverage, contract completeness, consistency, or verification has known gaps;
- `verified`: the supported contract is source-backed, implemented, and verified against an exact recorded snapshot;
- `deviated`: the accepted Mioframe contract intentionally differs from current Material guidance and names the deviation;
- `blocked`: required source meaning or ownership is unresolved.

`missing` and `blocked` prevent a dependent component from reporting readiness. `verified` applies only to the supported contract and does not claim every optional Material capability.

For legacy `partial` records, `Verified snapshot` may explicitly state `not yet recorded — legacy owner`. A record must not use `verified` without a concrete snapshot and named verification.

A domain without a registry record is not an accepted dependency for a new or aligned component.

## Foundation ownership classes

### Tokens and theme

Own official `md.ref.*` and `md.sys.*` values and theme-role mapping.

Rules:

- one canonical declaration per official token;
- no component-family tokens in reference/system owners;
- no project-only public value under `--md-*`;
- theme contexts override system roles, not component CSS;
- deprecated aliases name a replacement and removal target;
- file splitting is not required while ownership remains clear.

### Authoring and build

Own Material-oriented authoring units and centralized conversion.

Rules:

- `dp` and `sp` conversion remains centralized;
- components do not perform local conversion;
- a conversion change is a cross-library behavior change;
- build configuration and base variables are verified together.

### Runtime interaction

Own generic hover/focus/press acquisition, state layer, ripple, and focus contracts.

Rules:

- expose generic inputs only;
- do not decide semantic state or one global property precedence;
- native host semantics remain component-owned;
- components map final property values into generic bridges;
- forced visual state is verification infrastructure, not product state.

### Visual roles

Own cross-family typography, shape, elevation, and motion roles.

Rules:

- official system roles are canonical;
- components consume only the role or component token required by their supported surface;
- Web adaptations are private, documented, and source-backed;
- arbitrary durations, easing, shadows, radii, or typography values do not originate in component code.

### Icons

Own Material Symbols rendering and shared symbol configuration behavior. Product icon choice and supported component anatomy remain outside the icon foundation.

### Overlays

Own Material-facing containment, nested-overlay registration, outside-interaction boundaries, and shared lifecycle capabilities.

Generic teleport, event, and geometry mechanisms may remain outside the Material library. The overlay foundation composes them rather than duplicating them.

A component family still owns its Material anatomy, native/ARIA role, modal meaning, scrim, allowed dismissal behavior, and component-specific focus contract.

### Policy foundations

Accessibility, target area, density, layout, and adaptivity may remain policy-only until a concrete runtime artifact is required.

Each component owns its native semantics and target area. Pages and layout primitives own product-level adaptive composition. Policy does not justify a generic runtime manager.

## Component usage contract

Material alignment includes correct component choice and composition, not only internal rendering.

Every new, migrated, or materially changed public component family blueprint records:

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

For library-only work, use canonical Material usage and record `Product integration in this PR: none`. Do not invent a product consumer to demonstrate the component.

## Component foundation-dependency contract

Every new, migrated, or materially changed public component family blueprint includes:

```text
Foundation dependencies

| Domain | Required capability | Accepted owner/contract | Registry status | Change in this PR |
| --- | --- | --- | --- | --- |
```

Include only applicable domains.

Allowed registry statuses:

```text
missing | partial | verified | deviated | blocked
```

Allowed change values:

```text
none | library-relocation-only | additive | correction | replacement | refresh
```

Rules:

- `missing` and `blocked` prevent component readiness;
- `partial` or `deviated` must name the exact relevant gap and why the supported component surface remains valid;
- component code consumes the named owner rather than reconstructing the capability;
- a dependency row may reference a current legacy owner until focused migration, but the canonical owner and migration status remain explicit.

## Discovering a foundation gap

1. Confirm the component scenario and official component/foundation evidence.
2. Check the registry and current owner implementation.
3. Reuse the accepted contract when sufficient.
4. Classify the required delta before production edits.
5. Update registry, owner contract, production code, verification, and component blueprint atomically.
6. Remove investigation-only workarounds before completion.

A component must not silently create a local foundation substitute.

## Change modes

### `foundation-impact: none`

The component consumes an accepted foundation contract without changing it.

### `library-relocation-only`

Moves one cohesive accepted owner without changing public meaning, values, behavior, rendering, or verification semantics.

Requirements:

- complete import/export and consumer migration;
- current/canonical owner and migration map update;
- obsolete path removal;
- no hidden correction or replacement.

### `foundation-additive`

Adds a source-backed capability without changing existing public meaning or current consumer behavior.

It may share a component PR only when:

- the official concept and exact contract are unambiguous;
- one current owner clearly owns the capability;
- the delta is backward-compatible;
- it adds no new lifecycle manager, context hierarchy, dependency, or public extension;
- focused owner tests and affected component verification fit the same review scope.

Legacy-owner rule:

- extending an existing file in the current legacy owner is allowed when it remains the single active owner and no second implementation is created;
- a new standalone runtime or verification artifact must be created under the canonical owner, which requires relocating the cohesive owner first or in the same explicitly classified migration;
- one domain must not have parallel active production owners in legacy and canonical paths without a temporary migration contract naming consumers and removal target.

### `foundation-correction`

Corrects meaning, value, behavior, or platform adaptation and may change existing consumers.

Requires:

- old and new contract;
- complete direct-consumer inventory;
- expected rendered or behavioral delta;
- migration/compatibility decision;
- representative verification for every distinct affected path;
- a focused PR unless inseparable from a small first consumer and explicitly approved.

### `foundation-replacement`

Replaces an accepted owner or mechanism.

Requires a ready architecture handoff, complete consumer migration, removal of the replaced path, and blocking verification. Two active mechanisms require an explicit temporary compatibility contract and removal target.

### `foundation-refresh`

Revalidates a domain against a newer official snapshot.

Classify every observed difference as:

- source clarification;
- additive capability;
- changed meaning or value;
- deprecation;
- removal;
- repository deviation.

A newer snapshot does not automatically change production behavior. Apply behavior changes through additive, correction, or replacement mode.

## Objective expansion rules

Add a reference/system token only when a current supported component or theme scenario requires it and the exact official path and meaning are verified.

Add or expand a runtime or verification primitive only when:

- Material or an unavoidable platform/testing boundary defines a cross-family concern;
- the current mechanism is insufficient;
- the contract remains free of family knowledge;
- total implementation and verification complexity is lower than local implementations.

For project-derived generic behavior without an official foundation owner, require at least two current unrelated families or one unavoidable platform-wide owner such as overlay containment.

Do not prebuild complete palettes, motion catalogs, responsive managers, state machines, test DSLs, or extension APIs.

## Public, private, and testing contracts

Public foundation contracts include verified reference/system tokens and shared primitives intentionally consumed by component families.

Private bridges use private CSS or typed APIs and remain component-agnostic.

Verification-only contracts:

- live under the owning domain testing surface;
- are not exported from the project-facing Material root;
- expose only generic transient state owned by the foundation;
- may support canonical component state matrices;
- do not prove real acquisition, cancellation, or cleanup behavior;
- must not contain family names, anatomy, token routing, or precedence.

Forbidden:

- component-specific names in foundation code;
- foundation imports from component families;
- runtime token/state registries;
- universal Material base components;
- duplicate theme, overlay, state, ripple, focus, icon, or motion systems;
- foundation abstraction justified only by similar syntax or hypothetical reuse.

## Verification

Foundation verification is risk-based and owner-specific.

### Static checks

Verify where enforceable:

- canonical location and dependency direction;
- registered public exports, tokens, bridges, and testing adapters;
- exact token vocabulary and one owner;
- no family-specific inputs in generic primitives;
- current/canonical owner and migration-map consistency;
- deprecated contracts unused by new code.

### Contract tests

Verify public utilities, generic bridge defaults, disabled behavior, lifecycle cleanup, and documented platform-adaptation contracts.

### Browser checks

Use a real browser for focus-visible, pointer/touch, ripple, overlays, focus restoration, scrolling, viewport behavior, computed tokens, and actual property owners.

### Visual checks

Use representative component consumers for foundation changes. Do not create a screenshot matrix for every consumer. Cover every meaningfully different affected contract path.

### Review gates

Human review confirms:

- source meaning and snapshot sufficiency;
- ownership rationale;
- correctness of deviations;
- representative consumer selection;
- intentional visual changes.

Automation must not claim to prove those decisions.

## Completion

Foundation work is complete only when registry, migration map, owner contract, production/testing code, exports, tests, source meaning, and consumer impact agree; no parallel replacement, family-local substitute, hidden gap, or permanent legacy compatibility path remains.
