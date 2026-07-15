---
name: material-foundation
description: 'Use when changing Material reference/system tokens, theme, units, typography, shape, elevation, motion, state/ripple/focus, icons, overlays, accessibility, density, or adaptive foundation contracts. Enforces registry-backed ownership, bounded expansion, consumer impact, and representative verification.'
paths:
  - 'src/shared/lib/md/**'
  - 'src/shared/ui/State/**'
  - 'src/shared/ui/Icon/**'
  - 'src/shared/ui/Overlay/**'
  - 'postcss.config.js'
  - 'config/postcss.config.test.ts'
  - 'docs/material-3/foundation-*.md'
  - 'docs/material-3/source-of-truth.md'
  - 'docs/material-3/units.md'
  - 'docs/material-3/tokens.md'
  - 'docs/material-3/baseline-theme.md'
  - 'docs/material-3/interaction-states.md'
  - 'docs/material-3/accessibility.md'
  - 'docs/material-3/layout-adaptive.md'
  - 'docs/material-3/density-spacing.md'
  - 'docs/material-3/icons.md'
  - 'docs/material-3/overlays.md'
---

# Material foundation

Use with `material3-guidelines` and `foundation-architecture.md` for cross-family Material contracts. Do not broaden foundation work into unrelated component or source-tree reorganization.

## Preflight

Record:

- affected registry domain and exact official source snapshot;
- current owner and public/private contract;
- mode: `foundation-additive`, `foundation-correction`, `foundation-replacement`, or `foundation-refresh`;
- direct consumers and expected delta;
- compatibility/migration decision;
- owner checks and representative consumer verification.

Use `foundation-impact: none` when a component only consumes an accepted contract. Use `blocked` when source meaning, ownership, compatibility, or verification is unresolved.

## Ownership

```text
official evidence → foundation owner → component family → product composition
```

Foundation code must not import or name consuming families. Generic private bridges expose only minimum component-agnostic inputs.

Do not create a universal Material base, runtime token registry, generic resolver, cross-family state machine, or second theme/overlay system.

## Registry

`foundation-registry.md` is current status. Every change updates status, snapshot, owners, contracts, consumers, gaps, verification, and last-reviewed date. Historical audits are evidence only.

## Change modes

- **Additive:** may share a component PR only when source-backed, backward-compatible, owned by one existing domain, adding no lifecycle/context/dependency, and fitting focused verification.
- **Correction:** may affect current consumers; document old/new meaning, inventory consumers, verify distinct paths, and normally use a focused PR.
- **Replacement:** requires a ready handoff, complete migration, removal of the old path, and blocking verification.
- **Refresh:** classify newer source evidence as clarification, addition, changed meaning/value, deprecation, removal, or deviation before changing behavior.

## Bounded expansion

Add official reference/system tokens only for current component or theme needs with exact verified paths.

Add or expand a runtime primitive only when:

- Material or a platform boundary defines a cross-family concern;
- the current owner is insufficient;
- the contract stays family-agnostic;
- total complexity is lower than local implementations.

For project-derived generic behavior without an official owner, require at least two unrelated current families or one unavoidable platform-wide owner such as overlay containment.

Do not complete palettes, motion catalogs, adaptive managers, or state systems for hypothetical future use.

## Domain constraints

- Reference/system owners contain no component tokens.
- Theme contexts override system roles, not component CSS.
- Units remain centralized in PostCSS/base variables.
- Typography uses system roles and shared utilities.
- Shape, elevation, and motion use verified roles or documented private platform adaptations.
- State/ripple/focus own generic capability, not host semantics or component precedence.
- Icons own symbol rendering, not product icon choice or component anatomy.
- Overlays own containment/lifecycle capability, not component-specific anatomy or policy.
- Accessibility, density, target area, and adaptivity remain policies unless a concrete runtime owner is required.

Deprecated contracts must be unused by new code, name their replacement, and have migration/removal targets. Remove obsolete paths with their replacement unless compatibility is explicit.

## Verification

Use applicable:

- static vocabulary, ownership, export, bridge, and registry checks;
- focused owner contract tests;
- browser checks for focus, pointer/touch, ripple, overlays, viewport behavior, computed tokens, or platform adaptations;
- representative consumers for each distinct affected path;
- final repository verification.

Do not test component behavior the foundation does not own or use screenshots as the only proof.

## Completion

Registry, owner docs, production code, tests, source meaning, and consumer impact must agree. No family-specific knowledge, parallel replacement, or hidden gap may remain. Component blueprints must reference the accepted resulting contract.
