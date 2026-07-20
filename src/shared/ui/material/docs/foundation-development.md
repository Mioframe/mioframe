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

## Domain contract and implementation blueprint

Create `foundation/<domain>/README.md` only when a real runtime, public, private, or testing contract exists. Do not pre-create domain folders or status records.

Before production edits, resolve official evidence, ownership, supported scenarios, affected consumers, implementation decomposition, style ownership when applicable, proof ownership, and implementation order.

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

IMPLEMENTATION DECOMPOSITION
Public entry point:
Deterministic contract owner:
Reactive or lifecycle owner:
Rendered artifact owner:
Style owner:
Browser or platform adapter owner:
Testing-only owner:
Co-location decisions:

PROOF MAP
Observable contract → primary proof owner:
Initial failing proof:
Browser scenarios prepared before implementation:
Visual acceptance surface:
Representative consumers:

Implementation order:
Unresolved: none | <blocking decisions>
Readiness: ready | blocked
```

The decomposition describes responsibility owners, not a fixed file tree. A responsibility with an independent reason to change or proof owner needs one explicit implementation owner. Co-location is valid only when the responsibilities change and are proved together. A non-trivial rendered visual contract normally has an owner-local stylesheet separate from its Vue composition root.

The domain README, code, exports, tests, stories or fixtures when required, and accepted snapshots are the current record. Do not maintain a separate foundation registry or durable checklist.

**Contract gate:** `Unresolved: none`, `Readiness: ready`, decomposition and proof ownership are complete, and implementation order is explicit.

## Change modes

Choose one:

- `none` — component consumes an accepted contract without changing it;
- `library-relocation-only` — move one cohesive owner without changing meaning, value, behavior, rendering, or verification semantics;
- `additive` — add a source-backed backward-compatible capability to one owner;
- `correction` — correct meaning, value, behavior, or Web adaptation and review affected consumers;
- `replacement` — replace an owner or mechanism with explicit architecture, complete migration, and old-owner removal;
- `refresh` — revalidate against newer official evidence before deciding whether production changes are needed.

Physical relocation must not hide a correction or replacement. Use a focused PR when foundation blast radius is materially wider than the selected family.

## Implementation sequence

Follow this order:

```text
official evidence
→ domain README and implementation decomposition
→ proof map and implementation order
→ applicable initial failing proof
→ implementation units
→ rendered or lifecycle integration
→ representative affected consumers
→ obsolete-owner removal
→ independent review when required by blast radius
→ verification
```

### Initial executable proof

Before production edits, create or update the smallest applicable executable proof for resolved observable contracts:

- deterministic tests for token mapping, normalization, state precedence, conversion, or pure lifecycle decisions;
- focused public or private bridge contract tests;
- a regression test for a reproducible defect when applicable.

Confirm the focused proof fails for the expected missing or incorrect contract. For real browser, layout, focus, pointer, overlay, or platform behavior, define the public-input scenario and expected observable result before implementation; do not force it into unit tests merely to obtain a red check.

Do not create or update visual baselines before the rendered result is implemented, compared with official evidence, and accepted.

### Implementation units

Implement the responsibility owners from the domain README in order. Keep deterministic logic, reactive lifecycle, rendered artifacts, styles, browser adapters, and testing-only bridges separate when they have different reasons to change or proof owners.

A public Vue artifact remains a thin composition root. A non-trivial style contract belongs in an owner-local stylesheet. Do not introduce wrapper components, managers, contexts, registries, or DOM nodes merely to split files.

Run focused proof after each independently testable unit. If implementation evidence invalidates ownership, supported scenarios, compatibility, or decomposition, return to the domain contract instead of adding a local workaround.

### Representative consumers and cleanup

Verify representative affected components or consumers in proportion to blast radius. A component proves only its narrow route into the foundation; generic foundation behavior is proved by the foundation owner.

Remove local substitutes, obsolete owners, stale exports, and temporary compatibility when the change replaces them. Exactly one canonical owner must remain.

### Independent review

A correction or replacement affecting multiple families, shared rendering, interaction lifecycle, or platform adaptation requires review from a fresh agent session or isolated read-only context that did not implement the patch. The reviewer reconstructs the domain contract from current repository and official evidence and receives no implementation reasoning as proof.

When such an independent context is unavailable, report `independent review handoff required` instead of treating same-context self-review as completion.

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

- focused deterministic and bridge contract tests;
- real browser checks for interaction, focus, overlays, viewport behavior, computed roles, or Web adaptations when applicable;
- representative component visuals when rendered output changes;
- representative consumers for meaningfully different affected paths after correction or replacement;
- repository verification;
- operator visual review for intentional rendered changes.

Automation may protect precise deterministic invariants only after real work proves a repeated need. It must not infer source meaning, ownership rationale, semantic completeness, or visual correctness from prose.

## Completion

Foundation work is complete when the domain contract, decomposition, code, exports, focused tests, source evidence, affected consumers, cleanup, applicable independent review, and final verification agree; one owner remains; and no family-specific knowledge, hidden blocking gap, permanent compatibility path, or local substitute remains.

## Forbidden

- production edits before the contract and applicable initial-proof gates pass;
- universal Material base components;
- runtime token or state registries;
- generic resolvers or cross-family state machines;
- duplicate theme, overlay, state, ripple, focus, icon, or motion systems;
- foundation wrappers justified only by similar syntax or hypothetical reuse;
- monolithic artifacts that combine independently changing deterministic, lifecycle, rendering, and style responsibilities;
- file fragmentation that only moves lines without clarifying ownership or proof;
- prebuilt palettes, motion catalogues, adaptive managers, test DSLs, or empty structural layers.
