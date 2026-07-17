# Buttons implementation audit

Reviewed: 2026-07-17
Result: non-compliant
Project implementation documentation: `README.md`
Visual review: blocked

## Evidence

### Project documentation reviewed

- `README.md` beside the Button implementation.
- `docs/material-3/component-architecture.md`.
- `docs/material-3/component-testing.md`.
- `docs/material-3/autonomous-review.md`.
- Applicable shared motion and elevation ownership documented by the project.

### Material 3 Expressive evidence

- Material Buttons overview, specs, and accessibility guidance.
- Material motion guidance applicable to the Button pressed-shape contract.
- Verified fallback snapshot: `Vyachean/m3-docs-cache` commit `49ffae58a61f86c28b23720696dc9d07b6945483`, captured `2026-07-13T12:48:04.850Z`.
- Official pressed-shape source values: fast-spatial spring stiffness `800`, damping `0.6`.
- Button guidelines evidence remains inconsistent in project records and is listed as a Stage 2 finding.

## Stage 1 — implementation vs project documentation

### Findings

#### 1. Motion runtime does not satisfy the documented project contract

Severity: high

Project requirement: the family README and component architecture require one honest Web runtime motion contract. Canonical spring stiffness/damping may be retained as source evidence, but aliases, colocation, or equality assertions must not imply a runtime dependency that does not exist.

Implementation evidence: size scopes declare stiffness/damping tokens and separately alias private corner duration/easing to the pre-existing shared Web approximation. The final `border-radius` transition consumes only duration/easing. Changing stiffness or damping cannot affect the rendered transition.

Implementation-to-project mismatch: the implementation still contains token and test structure that suggests spring consumption, while the project documentation explicitly states that no such dependency exists and requires its correction.

Required correction: remove the fake dependency model. Keep the official spring values as documented canonical evidence, define one explicit Web adaptation as the project runtime contract, wire `border-radius` directly to that contract, and remove tests or component-token routes that imply derivation from stiffness/damping.

#### 2. Shared elevation implementation lacks project-required impact evidence

Severity: high

Project requirement: broad root/system-token, universal-selector, pseudo-element, or shared-formula changes require explicit affected-family analysis and representative proof. The narrowest valid owner is preferred.

Implementation evidence: all elevation-level custom-property formulas are declared on `*, ::before, ::after` so every element and pseudo-element recomputes against its local shadow-color bridge. Button-only browser proof confirms the Button route.

Implementation-to-project mismatch: the implementation changes cascade and inheritance behavior for the whole application, but the project-required cross-family impact analysis and representative elevated-family proof are absent.

Required correction: move recomputation to a narrower elevation owner, or document the shared contract and prove representative affected families before retaining the universal-selector implementation.

#### 3. Numeric loading contract is not coherent at zero

Severity: medium

Project requirement: the documented Mioframe `loading` extension accepts boolean or numeric progress and must have coherent behavior for every accepted value.

Implementation evidence: `loading=0` activates loading, while the current progress-indicator route renders zero through its indeterminate visual path.

Implementation-to-project mismatch: the documented numeric-progress surface includes zero, but the implementation does not provide a clearly determinate zero result.

Required correction: define and test determinate zero behavior, or narrow the accepted numeric contract and update the project documentation accordingly.

### Verified agreement

- The implementation provides the documented five styles, five sizes, round/square shapes, and default/toggle modes.
- Native button ownership, `nativeType`, disabled state, accessible name, controlled `aria-pressed`, and loading `aria-busy` are represented in implementation and colocated contract coverage.
- Canonical Button ownership and the curated `@shared/ui/material` export exist.
- The legacy MDButton implementation/export is removed and direct consumers are migrated.
- The README explicitly records unsupported text-toggle usage, Split Button, Standard Button Group, and Connected Button Group.
- The README does not hide the current motion, elevation, loading-zero, source-evidence, or visual-review gaps.

## Stage 2 — project documentation vs Material 3 Expressive

### Findings

#### 1. Canonical source record for Button guidelines is inconsistent

Severity: medium

Material 3 Expressive requirement: claims about supported behavior, usage, placement, and omissions must be grounded in an exact and consistent set of current official family pages.

Project documentation claim: the family README names overview, specs, and accessibility as inspected and says guidelines must be reconciled before being claimed as reviewed everywhere; other project records have previously disagreed about whether the guidelines page was inspected.

Project-to-Material mismatch: the project evidence set is internally inconsistent, so guideline-dependent claims cannot yet be traced reliably to one canonical source record.

Required correction: inspect the current Button guidelines once, record the exact snapshot and conclusions consistently in the family README and any source-bearing stories or documentation, and remove contradictory statements.

### Verified agreement

- The project documentation maps the implementation to the official `components/buttons` family.
- Elevated, filled, tonal, outlined, and text styles; five documented sizes; round/square shape routes; and controlled toggle behavior are represented as the supported project surface.
- The documentation distinguishes canonical Material behavior from the Mioframe `loading` extension.
- Text-toggle and Button Group capabilities outside the supported surface are named explicitly rather than implied as implemented.
- The documentation now distinguishes official spring values from the unresolved Web runtime adaptation instead of treating equality of aliases as canonical spring execution.
- No confirmed undocumented canonical deviation was found beyond the unresolved evidence and implementation findings listed above.

## Evidence gaps

- Cross-family safety of the universal elevation declarations.
- Corrected runtime motion adaptation and its actual consumption.
- One consistent inspection record for current Button guidelines.
- Operator visual comparison after the high technical findings are resolved.

## Required next work

1. Correct the motion implementation to match the documented honest Web adaptation contract.
2. Narrow the elevation implementation or add the project-required shared impact contract and representative proof.
3. Reconcile the project Button source record with current Material 3 Expressive guidelines.
4. Resolve the numeric loading-zero extension contract in implementation and documentation.
5. Update `README.md`, run applicable local verification, and rerun `material-component-review Button`.
6. Perform operator visual review only after the high Stage 1 findings are closed.