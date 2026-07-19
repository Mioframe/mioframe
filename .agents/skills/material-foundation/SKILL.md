---
name: material-foundation
description: 'Use when a cross-family Material token, theme, unit, typography, shape, elevation, motion, interaction, icon, overlay, accessibility, density, or adaptive contract changes.'
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

This skill only executes that policy.

## Workflow

1. Confirm the current component scenario and why an existing mechanism is insufficient.
2. Verify that the concern is inherently cross-family and remains family-agnostic.
3. Resolve official evidence, current owner, canonical owner, change mode, affected consumers, compatibility, and proof.
4. Create or update a domain README only when a real runtime, public, private, or testing contract exists.
5. Implement the minimum complete shared contract without family knowledge or a parallel owner.
6. Verify the owner and representative affected components/consumers in proportion to blast radius.
7. Remove local substitutes, obsolete owners, and temporary compatibility where the change replaces them.
8. Run focused checks and final repository verification.

Do not create registries, universal bases, runtime token/state managers, generic resolvers, cross-family state machines, duplicate theme/overlay/interaction systems, or speculative foundation domains.
