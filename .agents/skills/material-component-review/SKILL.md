---
name: material-component-review
description: 'Use for a source-backed review of an existing Material component family without production changes.'
---

# Material component review

Review the named family against:

- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/sources.md`;
- `src/shared/ui/material/docs/component-development.md`;
- the current family README, code, exports, stories, tests, consumers, and official sources.

Inspect every applicable claimed contract: family ownership, supported surface, API, native semantics, accessibility, anatomy, DOM, states, tokens, behavior, motion, foundations, proof, consumer migration, and obsolete ownership.

Report blockers, major issues, minor issues, and items not required for the current change. Every finding must name the official requirement, implementation evidence, mismatch, and required correction.

Do not modify production files and do not create a durable audit document. The family README remains the only durable family contract; Git and PR review preserve review history.
