# Buttons implementation audit

Reviewed: 2026-07-17
Result: non-compliant
Implementation documentation: `README.md`
Visual review: blocked

## Official evidence

- Material Buttons overview, specs, and accessibility guidance.
- Material motion guidance applicable to the Button pressed-shape contract.
- Verified fallback snapshot: `Vyachean/m3-docs-cache` commit `49ffae58a61f86c28b23720696dc9d07b6945483`, captured `2026-07-13T12:48:04.850Z`.
- Official pressed-shape source values: fast-spatial spring stiffness `800`, damping `0.6`.

## Documentation claims reviewed

- Five styles, five sizes, two shapes, default and toggle variants.
- Native button and accessibility semantics.
- Public token routing, state layer, ripple, focus, elevation, and shape motion.
- Loading extension.
- Canonical ownership and consumer migration.
- Unsupported text toggle, Split Button, and Button Groups.

## Confirmed findings

### 1. High — motion contract has no real dependency from spring inputs

Severity: high

Official requirement: pressed container shape uses the official fast-spatial motion contract.

Implementation evidence: size scopes declare stiffness/damping tokens and separately alias private corner duration/easing to the same pre-existing global Web approximation. The final `border-radius` transition consumes only duration/easing. Changing stiffness or damping cannot affect the output.

Documentation claim: Button implements Expressive pressed-shape spring motion.

Mismatch: declaration proximity and alias equality were treated as runtime consumption, but no derivation or lookup exists.

Required correction: use one honest runtime contract. Keep stiffness/damping as source evidence when they cannot drive CSS directly, document and validate the Web adaptation independently, wire `border-radius` directly to it, and remove tests or component tokens that imply a nonexistent dependency.

### 2. High — elevation solution has insufficiently reviewed shared impact

Severity: high

Official requirement: supported shadow-color overrides must reach the final rendered elevation shadow without breaking shared elevation behavior.

Implementation evidence: all elevation-level custom-property formulas are declared on `*, ::before, ::after` so each node recomputes against its local shadow-color bridge.

Documentation claim: final shadow-color routing is fixed.

Mismatch: the Button route works, but the solution changes cascade and inheritance for every element and pseudo-element. Button-only proof does not establish safety for all elevated families.

Required correction: prefer a narrower elevation owner or add explicit representative cross-family evidence and document the shared contract before retaining the universal-selector solution.

### 3. Medium — source claims are inconsistent

Severity: medium

Official requirement: implementation documentation must record the exact official evidence used.

Implementation evidence: family and Storybook records have disagreed about whether Button guidelines were inspected.

Documentation claim: current README now marks this as requiring reconciliation.

Mismatch: earlier terminal claims were based on inconsistent source records.

Required correction: inspect the page once, record the result consistently in README and applicable stories, and remove contradictory claims.

### 4. Medium — loading-zero extension behavior remains unresolved

Severity: medium

Official requirement: not applicable; loading is a project extension, but the extension must have a coherent documented result.

Implementation evidence: `loading=0` activates loading while the current progress indicator follows its indeterminate visual path at zero.

Documentation claim: README records this behavior as requiring a decision.

Mismatch: the API accepts determinate zero, but rendered behavior is not clearly determinate.

Required correction: decide and test the intended extension behavior or narrow the accepted numeric contract.

## Evidence gaps

- Cross-family safety of the universal elevation declarations.
- Corrected runtime motion adaptation and wiring.
- Consistent inspection record for Button guidelines.
- Operator visual comparison after technical findings are resolved.

## Verified areas

- Canonical Button directory and curated public export exist.
- Legacy MDButton implementation/export is removed.
- Direct consumers were migrated.
- Supported styles, sizes, shapes, default/toggle API, and native semantics have implementation and colocated test coverage.
- Unsupported text toggle and Button Group capabilities are documented rather than silently implied.

## Required next work

1. Correct the motion contract without fake stiffness/damping consumption.
2. Narrow or validate the elevation implementation across representative consumers.
3. Reconcile official source documentation.
4. Resolve the loading-zero extension contract.
5. Update `README.md`, run local verification, and rerun `material-component-review Button`.
6. Perform operator visual review only after the high findings are closed.