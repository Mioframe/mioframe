# Material foundation convergence workflow

This is the single workflow for cross-family Material foundations.

## Purpose

Foundation provides one accepted owner for a Material concern genuinely shared by current component families. It is not a universal framework built before components.

Create, expand, or correct a foundation only when:

- a current component or unavoidable Material/platform contract requires it;
- the concern is family-agnostic;
- ownership remains explicit;
- the shared solution is simpler than family-local substitutes;
- for new capability, the existing mechanism is insufficient;
- for correction, the current owner can be assessed and improved without creating a parallel system.

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

## Convergence model

Existing foundation code is current state to assess and improve. It is not Material authority and is not replaced by default.

Use two independent passes:

1. **Canonical foundation target** — resolve current applicable official Material or unavoidable platform behavior before relying on legacy implementation choices.
2. **Current implementation assessment** — inspect existing contracts, code, styles, adapters, proof, affected families, local substitutes, and known defects after the target is recorded.

Classify each applicable concern as:

- `confirmed-compliant`;
- `project-extension` or explicit Web/platform adaptation;
- `misaligned`;
- `unresolved`;
- `obsolete`.

Passing tests, widespread reuse, stable snapshots, or generic naming do not establish correctness.

Correct foundations through bounded units. Preserve confirmed owners. Replace only the smallest owner whose contract is predominantly wrong or whose repair would add more workaround logic than replacement.

A fresh session reloads the current repository, domain README, alignment map, confirmed owners, affected consumers, and next correction unit. It does not reset valid implementation.

## Domain README

Create `foundation/<domain>/README.md` only when a real runtime, public, private, testing, or correction contract exists. Do not pre-create domain folders or status records.

Record only applicable facts:

```text
MATERIAL FOUNDATION CONTRACT

Domain:
Mode: new-foundation | align-existing | focused-correction
Current correction objective:
Required scenarios:
Non-goals:
Official sources and snapshot:
Current owner:
Canonical owner:
Public contract:
Private bridge contract:
Testing-only contract:
Known affected consumers:
Compatibility or migration decision:

CURRENT IMPLEMENTATION ASSESSMENT
Concern:
Canonical target:
Current behavior:
Classification: confirmed-compliant | project-extension | misaligned | unresolved | obsolete
Implementation owner:
Primary proof:
Required correction: none | <exact correction>

IMPLEMENTATION DECOMPOSITION
Public entry point:
Deterministic contract owner:
Reactive or lifecycle owner:
Rendered artifact owner:
Style owner:
Motion owner:
Browser or platform adapter owner:
Testing-only owner:
Co-location decisions:

PROOF MAP
Observable contract → primary proof owner:
Existing proof classification:
Initial failing or prepared proof:
Browser scenarios prepared before implementation:
Visual acceptance surface:
Representative consumers:

CORRECTION UNITS
Current correction units:
Implementation order:
Obsolete-owner removal:
Required unresolved decisions: none | <blocking decisions>
Remaining known gaps: none | <non-blocking gaps>
Current objective readiness: ready | blocked
Domain alignment status: aligned | converging | blocked
```

The decomposition describes responsibility owners, not a fixed file tree. A responsibility with an independent reason to change or proof owner needs one explicit implementation owner. Co-location is valid only when responsibilities change and are proved together. A non-trivial rendered contract has explicit owner-local style and motion ownership.

The domain README, code, exports, proof, accepted snapshots, and affected consumers are the current record. Do not maintain a separate foundation registry, audit, or durable checklist.

**Contract gate:** canonical target resolved for the current objective; assessment and proof classifications complete; correction units, ownership, affected consumers, compatibility impact, and completion conditions explicit; `Current objective readiness: ready`.

## Modes

Choose one:

- `new-foundation` — no active owner exists and a current cross-family contract requires one;
- `align-existing` — default when any current owner exists, regardless of quality or location;
- `focused-correction` — one exact documented gap is already established and the surrounding target is stable.

Relocation, additive capability, correction, replacement, and refresh are actions or correction-unit types, not modes.

Physical relocation must not hide a correction or preserve unverified meaning. Use a focused PR when foundation blast radius is materially wider than the selected component family.

## Implementation sequence

```text
canonical foundation target
→ current implementation assessment
→ alignment map
→ correction units, decomposition, and proof map
→ applicable failing or prepared proof
→ smallest owner correction or replacement
→ rendered or lifecycle integration
→ representative affected consumers
→ obsolete-owner removal when in scope
→ independent review when required by blast radius
→ verification
```

### Initial executable proof

Before production edits, create or update the smallest faithful proof for the canonical expected behavior:

- deterministic tests for token mapping, normalization, state precedence, conversion, or pure lifecycle decisions;
- focused public or private bridge contract tests;
- a regression test for a reproducible defect when applicable.

Confirm the proof fails for the expected missing or incorrect contract when a pre-code executable proof is applicable. For real browser, layout, focus, pointer, overlay, motion, or platform behavior, define public inputs and expected observable results before implementation; do not force them into unit tests merely to obtain a red check.

Classify existing proof before reuse as canonical, compatibility-only, implementation-detail, legacy-defect preservation, or obsolete.

Do not create or update visual baselines before the rendered result is implemented, compared with official evidence, and accepted.

### Correction-unit implementation

For each correction unit:

1. keep target, owner, inputs, outputs, dependencies, affected consumers, proof, and completion condition explicit;
2. preserve unaffected `confirmed-compliant` and `project-extension` owners;
3. correct incrementally when ownership is sound and the gap is local;
4. replace one owner only when its contract is predominantly wrong or further patching adds workaround logic;
5. run focused proof before moving to a dependent unit;
6. update the alignment map from evidence.

Keep deterministic logic, reactive lifecycle, rendered artifacts, styles, motion, browser adapters, and testing-only bridges separate when they have different reasons to change or proof owners.

A public Vue artifact remains a thin composition root. Do not introduce wrapper components, managers, contexts, registries, or DOM nodes merely to split files.

If implementation evidence invalidates the canonical target, ownership, classification, compatibility, decomposition, or proof, return to the domain contract and preserve unaffected completed units.

### Representative consumers and cleanup

Verify representative affected components or consumers in proportion to blast radius. A component proves only its narrow route into the foundation; generic foundation behavior is proved by the foundation owner.

Remove local substitutes, obsolete owners, stale exports, and temporary compatibility only when the current correction objective replaces them. Exactly one active owner must remain for each contract.

A focused correction may complete while the domain remains `converging` when remaining gaps are explicit, non-blocking, and outside the objective.

### Independent review

A correction or replacement affecting multiple families, shared rendering, interaction lifecycle, or platform adaptation requires review from a fresh agent session or isolated read-only context that did not implement the patch.

The reviewer reconstructs the canonical target, current assessment, and semantic delta. Existing reuse, green CI, extracted files, or renamed owners do not prove improvement.

When independent context is unavailable, report `independent review handoff required` instead of treating same-context self-review as completion.

## Core domain invariants

### Tokens and theme

- Reference `--md-ref-*` values do not encode component usage.
- System `--md-sys-*` values represent roles and prefer reference tokens as sources.
- Public `--md-*` values require exact official meaning or an explicit documented adaptation.
- Project-only values use `--app-*`.
- Theme contexts override system roles, not component CSS.
- Legacy aliases name their replacement and removal condition.

### Units

Material dimensions and typography use the repository's centralized supported authoring units and conversion. Components do not implement local conversion. Build configuration and representative rendered output are verified together when conversion changes.

### Typography, shape, elevation, and motion

Use verified Material system roles or explicit Web adaptations. Arbitrary canonical values must not originate inside component code. Components consume only roles required by their supported surface.

Declaring official motion tokens without routing them into actual rendered behavior is not compliance.

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

A family contract lists only foundation capabilities required by its current correction objective and supported surface. For each dependency:

1. identify the required canonical capability;
2. assess the current owner against that capability;
3. reuse it only when sufficient;
4. record an exact non-blocking gap when the current objective does not depend on it;
5. treat a missing required capability as a blocker;
6. change the foundation only through this workflow;
7. remove investigation-only local substitutes.

A component may temporarily use one assessed legacy owner while focused foundation correction is planned, provided the required capability for the current objective is confirmed sufficient and no parallel canonical implementation is introduced.

## Proportional proof

Use proof owned by the changed foundation contract:

- focused deterministic and bridge contract tests;
- real browser checks for interaction, focus, overlays, viewport behavior, computed roles, motion, or Web adaptations when applicable;
- representative component visuals when rendered output changes;
- representative consumers for meaningfully different affected paths;
- repository verification;
- operator visual review for intentional rendered changes.

Automation may protect precise deterministic invariants only after real work proves a repeated need. It must not infer source meaning, ownership rationale, semantic completeness, or visual correctness from prose.

## Completion

A correction objective is complete when its contract, implementation, proof, affected consumers, cleanup, applicable independent review, and final verification agree and the repository remains independently valid.

The domain is fully aligned only when no required `misaligned`, `unresolved`, or `obsolete` concern remains; one owner exists for every contract; and no family-specific knowledge, hidden blocking gap, permanent compatibility path, or local substitute remains.

## Forbidden

- production edits before the current correction-unit and applicable proof gates pass;
- treating current foundation code or widespread reuse as canonical authority;
- universal Material base components;
- runtime token or state registries;
- generic resolvers or cross-family state machines;
- duplicate theme, overlay, state, ripple, focus, icon, or motion systems;
- foundation wrappers justified only by similar syntax or hypothetical reuse;
- monolithic artifacts that combine independently changing deterministic, lifecycle, rendering, style, and motion responsibilities;
- file fragmentation that only moves lines without clarifying ownership or proof;
- prebuilt palettes, motion catalogues, adaptive managers, test DSLs, or empty structural layers;
- full-domain rewrites when smaller complete owner corrections are sufficient;
- knowingly broken intermediate states committed for later repair.
