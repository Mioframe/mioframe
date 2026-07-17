# Material 3 foundation architecture

This document defines ownership and change rules for cross-family Material foundations used by public components and product composition.

Foundation is not a universal base component or a framework built in advance. It is a set of independently owned, source-backed contracts expanded only when a current component or product scenario requires them.

## Goals

Foundation must:

- provide one accepted owner for each cross-family Material concern;
- remain free of component-family and product knowledge;
- prevent local substitutes and duplicate mechanisms;
- make shared consumer impact explicit before contract changes;
- support incremental relocation into `src/shared/ui/material/foundation`;
- stay smaller and simpler than repeated family-local implementations.

## Scope

Foundation may own current cross-family contracts for:

- reference and system tokens;
- theme contexts;
- authoring units and centralized conversion;
- typography, shape, elevation, and motion roles;
- generic interaction-state acquisition, state layer, ripple, and focus;
- Material Symbols rendering;
- Material-facing overlay adapters;
- policy or verification capability shared across families.

Foundation does not own:

- component-family `--md-comp-*` tokens;
- component API, anatomy, semantic state, or property precedence;
- product workflow, placement, or information architecture;
- screen-specific layout;
- public project extensions under `--app-*`;
- behavior used by one family only when no cross-family contract exists.

## Dependency direction

```text
official Material evidence
→ foundation contracts
→ component-family contracts
→ Material patterns
→ product composition
```

Foundation code must not import or name consuming families. Components map their own final values and semantics into narrow generic foundation contracts.

Generic DOM, browser, event, geometry, lifecycle, and teleport utilities remain in their generic owner. Foundation may compose them through a Material-facing adapter without taking ownership of the generic mechanism.

## Sources of truth

1. This document owns repository-wide foundation architecture and change modes.
2. `foundation-registry.md` owns current status, snapshot, owner, supported contract, gaps, and verification.
3. A domain owner document owns detailed runtime or policy behavior when needed.
4. Production code and tests implement the accepted contract.
5. A task handoff owns only the approved current delta.

Historical audits are evidence, not current contracts.

## Registry model

Create or update a registry record when current work depends on or changes a foundation domain.

Record only applicable facts:

```text
Domain:
Status: missing | partial | verified | deviated | blocked
Official sources and snapshot:
Current owner:
Canonical owner:
Migration status: legacy | migrating | migrated
Supported public/private/testing contract:
Known consumers:
Known relevant gaps:
Verification:
Last reviewed:
```

Rules:

- `missing` — no accepted required capability exists;
- `partial` — an owner exists with a named relevant gap;
- `verified` — the supported contract is source-backed and verified against a concrete snapshot;
- `deviated` — the accepted contract intentionally differs from current Material guidance;
- `blocked` — required source meaning or ownership remains unresolved.

`missing` and `blocked` prevent a dependent component from reporting readiness. `verified` applies only to the supported contract, not every optional Material capability.

Do not update unrelated registry fields or domains merely because a component migration occurs.

## Ownership classes

### Tokens and theme

Own official `md.ref.*` and `md.sys.*` values and theme-role mapping.

- one canonical declaration per token;
- no component tokens in reference/system owners;
- no project-only public values under `--md-*`;
- theme contexts override system roles rather than component CSS;
- deprecated aliases name a replacement and removal target;
- file splitting is optional while ownership remains clear.

### Authoring and build

Own centralized Material-oriented units and conversion.

- components do not perform local conversion;
- conversion changes are cross-library behavior changes;
- build configuration and generated output are verified together.

### Runtime interaction

Own generic hover, focus, pressed acquisition, state layer, ripple, and focus capability.

- expose generic inputs only;
- do not decide semantic state or universal property precedence;
- native host semantics remain component-owned;
- forced visual state is verification infrastructure, not product state.

### Visual roles

Own cross-family typography, shape, elevation, and motion roles.

- use verified system roles or documented Web adaptations;
- arbitrary values do not originate in component code;
- components consume only roles required by their supported surface.

### Icons and overlays

Icon foundation owns Material Symbols rendering, not product icon choice.

Overlay foundation owns Material-facing containment and lifecycle adapters, not product modal meaning or generic teleport/event/geometry infrastructure.

### Policy foundations

Accessibility, target area, density, layout, and adaptivity may remain policy-only until a concrete shared runtime artifact is required.

Policy does not justify a generic manager by itself.

## Component dependency contract

A family contract lists only foundation domains required by its supported surface.

For each applicable dependency record:

- required capability;
- accepted current owner;
- relevant status or gap;
- whether this migration changes the shared contract.

A component may use a legacy current owner until focused migration, provided it remains the single accepted owner and the gap is non-blocking.

Do not require a complete foundation inventory before starting a family migration.

## Discovering a gap

1. Confirm the component scenario and official evidence.
2. Inspect the registry and current owner.
3. Reuse the accepted contract when sufficient.
4. Classify only the required delta.
5. Decide whether it fits the family PR or needs a focused foundation PR.
6. Update the affected owner, tests, registry fields, and family contract.
7. Remove investigation-only workarounds.

A component must not silently create a local substitute.

## Change modes

### `foundation-impact: none`

The family consumes an accepted contract without changing it.

### `library-relocation-only`

Move one cohesive accepted owner without changing meaning, values, behavior, rendering, or verification semantics.

### `foundation-additive`

Add a source-backed backward-compatible capability to one clear owner.

It may share a component PR when the delta is small, unambiguous, introduces no broad lifecycle or public extension, and fits focused review.

### `foundation-correction`

Correct meaning, value, behavior, or platform adaptation and review affected consumers. Use a focused PR when blast radius exceeds the selected family.

### `foundation-replacement`

Replace an accepted owner or mechanism. Requires an explicit architecture decision, complete migration, removal of the old owner, and blocking proof.

### `foundation-refresh`

Revalidate a domain against a newer official snapshot. Classify differences before changing production behavior.

Physical relocation must not hide a correction or replacement.

## Objective expansion

Add or expand a foundation capability only when:

- a current component or product scenario requires it;
- Material or an unavoidable platform/testing boundary defines it as cross-family;
- the current mechanism is insufficient;
- the contract remains family-agnostic;
- total complexity is lower than local implementations.

For project-derived generic behavior without an official foundation owner, require multiple current unrelated families or an unavoidable platform-wide concern.

Do not prebuild palettes, motion catalogs, responsive managers, runtime state registries, test DSLs, or extension APIs.

## Public, private, and testing contracts

- Public contracts are intentionally consumed by component families.
- Private bridges remain component-agnostic.
- Verification-only contracts remain outside product API and prove appearance only.
- No foundation contract may contain family names, anatomy, component token routing, or family-specific precedence.

Forbidden:

- foundation imports from component families;
- universal Material base components;
- duplicate theme, overlay, state, ripple, focus, icon, or motion systems;
- abstractions justified only by similar syntax or hypothetical reuse.

## Rule refinement

When real migration evidence exposes an inaccurate or needlessly complex foundation rule, correct the owning source with the smallest evidence-backed change. Do not create a domain or family exception to preserve the old rule.

## Proportional verification

Use proof owned by the changed contract:

- focused owner contract tests;
- real browser checks for focus, pointer/touch, ripple, overlays, viewport behavior, computed tokens, and platform adaptations when applicable;
- representative component visuals when output changes;
- representative consumers for meaningfully different affected paths;
- agent review for source meaning, ownership, and deviations;
- operator visual review for intentional rendered changes.

Use existing static checks when they actually exist and apply. Add a new guard only after real work demonstrates a stable repeated and precisely detectable need.

Automation must not claim to prove source meaning, ownership rationale, representative consumer sufficiency, or visual correctness.

## Completion

Foundation work is complete when the affected registry fields, owner contract, code, exports, tests, source evidence, migration map, and consumer impact agree. No family-specific knowledge, parallel permanent owner, hidden blocking gap, permanent compatibility path, or local substitute may remain.
