---
name: material-foundation
description: 'Use for a focused standalone change to a real cross-family Material token, theme, unit, typography, shape, elevation, motion, interaction, icon, overlay, accessibility, density, or adaptive contract, or only when material-component delegates an exact foundation prerequisite.'
paths:
  - 'src/shared/ui/material/foundation/**'
  - 'src/shared/lib/md/**'
  - 'src/shared/ui/State/**'
  - 'src/shared/ui/Icon/**'
  - 'src/shared/ui/Overlay/**'
  - 'postcss.config.js'
  - 'config/postcss.config.test.ts'
---

# Material foundation

Canonical policy lives in:

- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/sources.md`;
- `src/shared/ui/material/docs/foundation-development.md`;
- the owning foundation-domain `README.md` when one exists.

Use this skill standalone for a focused foundation change or conditionally when `material-component` reports a foundation prerequisite. It does not choose or advance a component stage.

## Workflow

Execute the canonical foundation workflow in order:

```text
official evidence and current scenario
→ domain README contract
→ implementation decomposition and style ownership
→ proof map and implementation order
→ applicable initial failing proof
→ implementation units
→ representative affected consumers
→ obsolete-owner removal
→ independent review when required by blast radius
→ verification
```

Confirm why the existing mechanism is insufficient and why the concern is inherently cross-family and family-agnostic. Do not begin production edits until the domain README is ready and applicable initial proof fails for the expected reason.

Keep deterministic contracts, reactive lifecycle, rendered artifacts, owner-local styles, browser adapters, and testing-only bridges separate when they have different reasons to change or proof owners. Do not impose a fixed file count and do not create wrappers or DOM merely for separation.

If implementation evidence invalidates ownership, compatibility, decomposition, or proof, return to the domain contract instead of adding a local substitute or workaround.

A correction or replacement affecting multiple families, shared rendering, interaction lifecycle, or platform adaptation requires a fresh agent session or isolated read-only review context. Report `independent review handoff required` when that context is unavailable.

When invoked by `material-component`, return:

```text
MATERIAL FOUNDATION RESULT

Domain:
Status: complete | blocked
Exit gate: passed | failed
Evidence:
Changed ownership:
Implementation decomposition:
Initial proof result:
Affected families:
Independent review: not required | confirmed | unavailable
Blocker: none | <exact blocker>
```

Return control to `material-component`; do not update the Material roadmap, start component implementation, or select another family.

Do not create registries, universal bases, runtime token/state managers, generic resolvers, cross-family state machines, duplicate theme/overlay/interaction systems, speculative foundation domains, monolithic mixed-responsibility artifacts, or file fragmentation that only moves lines.
