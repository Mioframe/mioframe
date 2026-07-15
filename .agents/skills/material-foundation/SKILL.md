---
name: material-foundation
description: 'Use when changing Material reference/system tokens, theme contexts, units, typography, shape, elevation, motion, state/ripple/focus, icon, overlay, accessibility, density, or adaptive foundation contracts. Enforces registry-backed ownership, source refresh, bounded expansion, consumer impact, and representative verification.'
paths:
  - 'src/shared/lib/md/**'
  - 'src/shared/ui/State/**'
  - 'src/shared/ui/Icon/**'
  - 'src/shared/ui/Overlay/**'
  - 'postcss.config.js'
  - 'config/postcss.config.test.ts'
  - 'docs/material-3/**'
---

# Material foundation

Use with `material3-guidelines` and `docs/material-3/foundation-architecture.md` when a task changes or adds a cross-family Material contract.

Do not use foundation work as a reason to redesign unrelated components or reorganize the whole shared UI tree.

## Preflight

Before production edits, record:

- affected foundation domain and current registry record;
- exact official source and verified snapshot;
- current production owner and public/private contract;
- change mode: `foundation-additive`, `foundation-correction`, `foundation-replacement`, or `foundation-refresh`;
- direct consumer inventory;
- expected behavior/rendering delta;
- compatibility and migration decision;
- focused foundation checks and representative consumer verification.

Use `foundation-impact: none` when component work only consumes an existing accepted contract.

Use `blocked` when source meaning, ownership, compatibility, or required verification is unresolved.

## Ownership

Foundation dependency direction is:

```text
official evidence → foundation owner → component family → product composition
```

Foundation code must not import or name a consuming component family.

Generic private bridges may expose only the minimum value or capability needed by consumers. Component families map their own final values into those bridges.

Do not create a universal Material base component, runtime token registry, generic resolver, cross-family state machine, or second theme/overlay system.

## Registry

`docs/material-3/foundation-registry.md` is the current status source.

Every foundation change updates the affected record with:

- status;
- exact source snapshot;
- owner paths;
- public and private contracts;
- consumers;
- remaining gaps;
- verification;
- last-reviewed date.

Historical audits do not replace the registry.

## Change modes

### Additive

Keep an additive change in a component PR only when it is unambiguously source-backed, backward-compatible, owned by one existing foundation domain, adds no lifecycle/context/dependency, and fits focused verification.

### Correction

A correction may change current consumers. Inventory all direct consumers, document old/new meaning, verify representative distinct paths, and normally use a focused foundation PR.

### Replacement

A replacement requires a ready architecture handoff, complete migration, removal of the replaced path, and blocking verification. Do not leave parallel accepted mechanisms without a temporary compatibility contract and removal target.

### Refresh

A newer Material snapshot is evidence, not an automatic production update. Classify changes as clarification, addition, changed meaning/value, deprecation, removal, or repository deviation before changing behavior.

## Bounded expansion

Add an official reference/system token only when a current component or theme scenario needs it and the exact official path is verified.

Add or expand a runtime primitive only when:

- Material or a platform boundary defines the concern as cross-family;
- the existing mechanism is insufficient;
- the contract remains component-agnostic;
- total complexity is lower than local implementations.

For project-derived generic behavior without an official foundation owner, require at least two unrelated current component families or one unavoidable platform-wide owner such as overlay containment.

Do not complete entire palettes, motion catalogs, adaptive managers, or state systems for hypothetical future use.

## Domain constraints

- Reference/system token owners contain no component-family tokens.
- Theme contexts override system roles, not component CSS.
- Units and conversion stay centralized in PostCSS/base variables.
- Typography uses system roles and the shared typography utility.
- Shape, elevation, and motion values use verified roles or documented private platform adaptations.
- State/ripple/focus primitives own generic visual/interaction capability, not host semantics or component property precedence.
- Icon foundation owns symbol rendering, not product icon choice or component anatomy.
- Overlay foundation owns containment and generic lifecycle capability, not component-specific modal policy or anatomy.
- Accessibility, density, target area, and adaptivity remain cross-library policies; do not turn them into generic runtime managers without a concrete need.

## Removal and compatibility

Deprecated foundation contracts must:

- be unused by new code;
- name the accepted replacement;
- have a consumer migration plan;
- have a removal target.

Remove obsolete tokens, bridges, exports, tests, and comments with their replacement unless explicit compatibility is required.

## Verification

Use the smallest proof set covering the changed contract:

- static vocabulary, ownership, export, bridge, and registry checks;
- focused unit/contract tests for the owner;
- browser checks for focus, pointer/touch, ripple, overlays, viewport behavior, computed tokens, or platform adaptation as applicable;
- representative visual/browser consumers for every distinct affected path;
- final repository verification.

Do not test component-family behavior that the foundation does not own. Do not use green component screenshots as the only proof of a foundation contract.

## Completion

Do not report completion until:

- registry, owner docs, production code, and tests agree;
- source snapshot and meaning are explicit;
- all affected consumers are accounted for;
- no family-specific knowledge entered foundation code;
- replaced mechanisms are removed;
- component blueprints reference the accepted resulting contract;
- remaining gaps and deviations are honest.
