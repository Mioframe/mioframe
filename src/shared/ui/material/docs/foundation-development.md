# Material foundation development

This is the single workflow for cross-family Material foundations.

## Purpose

Foundation provides one accepted owner for a Material concern genuinely shared by current component families. It is not a universal framework built before components.

Create or expand a foundation only when:

- a current component or unavoidable Material/platform contract requires it;
- the existing mechanism is insufficient;
- the concern is family-agnostic;
- ownership remains explicit;
- the shared solution is simpler than current local implementations.

A first component may justify a foundation only when the concern is already inherently cross-family and a family-local substitute would create the wrong owner.

## Ownership

Foundation may own current cross-family contracts for:

- reference and system tokens and theme roles;
- centralized Material authoring units;
- typography, shape, elevation, and motion roles;
- generic interaction-state acquisition, state layer, ripple, and focus;
- Material Symbols rendering;
- Material-facing overlay adapters;
- accessibility, target area, density, layout, and adaptivity policy until a concrete runtime owner is required.

Foundation does not own:

- component `--md-comp-*` tokens;
- component API, anatomy, semantic state, or property precedence;
- product workflow, placement, information architecture, or screen layout;
- behavior used by one family only when no cross-family contract exists;
- generic DOM, browser, event, geometry, lifecycle, or teleport mechanisms that already have a correct generic owner.

Foundation code must not import or name consuming families. Components map their final values and semantics into narrow generic contracts.

## Domain contract

Create `foundation/<domain>/README.md` only when a real runtime, public, private, or testing contract exists. Do not pre-create domain folders or status records.

Record only applicable facts:

```text
MATERIAL FOUNDATION CONTRACT

Domain:
Required scenarios:
Non-goals:
Official sources and snapshot:
Current owner:
Canonical owner:
Change mode:
Public contract:
Private bridge contract:
Testing-only contract:
Known affected consumers:
Compatibility or migration decision:
Applicable proof:
Unresolved: none | <blocking decisions>
Readiness: ready | blocked
```

The domain README, code, exports, and tests are the current record. Do not maintain a separate foundation registry.

## Change modes

Choose one:

- `none` — component consumes an accepted contract without changing it;
- `library-relocation-only` — move one cohesive owner without changing meaning, value, behavior, rendering, or verification semantics;
- `additive` — add a source-backed backward-compatible capability to one owner;
- `correction` — correct meaning, value, behavior, or Web adaptation and review affected consumers;
- `replacement` — replace an owner or mechanism with explicit architecture, complete migration, and old-owner removal;
- `refresh` — revalidate against newer official evidence before deciding whether production changes are needed.

Physical relocation must not hide a correction or replacement. Use a focused PR when foundation blast radius is materially wider than the selected family.

## Core domain invariants

### Tokens and theme

- Reference `--md-ref-*` values do not encode component usage.
- System `--md-sys-*` values represent roles and prefer reference tokens as sources.
- Public `--md-*` values require exact official meaning or an explicit documented adaptation.
- Project-only values use `--app-*`.
- Theme contexts override system roles, not component CSS.
- Legacy aliases name their replacement and removal target.

### Units

Material dimensions and typography use the repository's centralized supported authoring units and conversion. Components do not implement local conversion. Build configuration and representative rendered output are verified together when conversion changes.

### Typography, shape, elevation, and motion

Use verified Material system roles or explicit Web adaptations. Arbitrary canonical values must not originate inside component code. Components consume only roles required by their supported surface.

### Interaction

Generic state layer, ripple, and focus owners expose family-agnostic inputs and render generic capability only. The component owns native host semantics, semantic state, component token selection, precedence, and final mapping into the foundation.

Forced interaction state is testing-only appearance preparation, not product state or behavior proof.

### Icons

Icon foundation owns Material Symbols rendering and generic icon geometry contracts. Product code and component families own icon choice and semantic meaning.

### Overlays

Material overlay foundation may own Material-facing containment and lifecycle adapters. Generic teleport, event, focus, and geometry infrastructure remains in its generic owner. Product code owns modal meaning and workflows.

### Accessibility, density, and adaptive policy

Keep policy declarative until a current component proves a shared runtime artifact is necessary. Policy alone does not justify a manager, context, or generic resolver.

## Component dependency decision

A family contract lists only foundation domains required by its supported surface. For each dependency:

1. identify the accepted current owner and required capability;
2. reuse it when sufficient;
3. name an exact non-blocking gap when applicable;
4. treat a missing required capability as a blocker;
5. change the foundation only through this workflow;
6. remove investigation-only local substitutes.

A component may temporarily use one accepted legacy owner until focused migration, provided no parallel canonical implementation is introduced.

## Proportional proof

Use proof owned by the changed foundation contract:

- focused owner contract tests;
- real browser checks for interaction, focus, overlays, viewport behavior, computed roles, or Web adaptations when applicable;
- representative component visuals when rendered output changes;
- representative consumers for meaningfully different affected paths after correction or replacement;
- repository verification;
- operator visual review for intentional rendered changes.

Automation may protect precise deterministic invariants only after real work proves a repeated need. It must not infer source meaning, ownership rationale, semantic completeness, or visual correctness from prose.

## Completion

Foundation work is complete when the domain contract, code, exports, focused tests, source evidence, and affected consumers agree; one owner remains; required migration is complete; and no family-specific knowledge, hidden blocking gap, permanent compatibility path, or local substitute remains.

## Forbidden

- universal Material base components;
- runtime token or state registries;
- generic resolvers or cross-family state machines;
- duplicate theme, overlay, state, ripple, focus, icon, or motion systems;
- foundation wrappers justified only by similar syntax or hypothetical reuse;
- prebuilt palettes, motion catalogues, adaptive managers, test DSLs, or empty structural layers.
