---
name: material3-guidelines
description: 'Use for official Material 3 Expressive source lookup, component choice, usage, composition, accessibility, adaptive behavior, and supported-surface decisions.'
paths:
  - 'src/**/*.vue'
  - 'src/shared/ui/**'
  - 'src/shared/lib/md/**'
---

# Material 3 guidelines

Canonical source policy lives in `src/shared/ui/material/docs/sources.md`. Library and product ownership lives in `src/shared/ui/material/docs/architecture.md`.

## Use

- Resolve the current official Material 3 Expressive component, intended and prohibited usage, supported surface, accessibility, interaction, motion, and adaptive behavior.
- Start from the user scenario and current official guidance, not from the component already present.
- Prefer an existing official component or documented composition when it covers the need.
- Do not create an `MD*` surface for a product-specific workflow merely because it resembles Material visually.
- Use baseline Material only when the supported surface has no applicable Expressive contract or an explicit deviation requires it.
- Record exact source pages and snapshot or verification dates in the owning family or foundation contract.
- Treat repository code, tests, stories, snapshots, and third-party implementations as evidence, not Material authority.

For official family implementation, return resolved evidence to `material-component-contract`; do not create or advance a parallel implementation plan. For review-only work, return evidence to `material-component-review`. For a cross-family foundation change, use `material-foundation`.
