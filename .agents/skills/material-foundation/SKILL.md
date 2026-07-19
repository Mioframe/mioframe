---
name: material-foundation
description: 'Use when changing Material reference/system tokens, theme, units, typography, shape, elevation, motion, state/ripple/focus, verification adapters, icons, overlays, accessibility, density, or adaptive foundation contracts.'
paths:
  - 'src/shared/ui/material/foundation/**'
  - 'src/shared/ui/material/docs/foundation-*.md'
  - 'src/shared/ui/material/docs/library-architecture.md'
  - 'src/shared/ui/material/docs/source-of-truth.md'
  - 'src/shared/lib/md/**'
  - 'src/shared/ui/State/**'
  - 'src/shared/ui/Icon/**'
  - 'src/shared/ui/Overlay/**'
  - 'postcss.config.js'
  - 'config/postcss.config.test.ts'
---

# Material foundation

Canonical Material-specific rules live only in:

- `src/shared/ui/material/AGENTS.md`;
- `src/shared/ui/material/docs/source-of-truth.md`;
- `src/shared/ui/material/docs/library-architecture.md`;
- `src/shared/ui/material/docs/foundation-architecture.md`;
- `src/shared/ui/material/docs/foundation-registry.md`.

This repository-level skill owns only execution routing, order, and stop conditions. Do not duplicate registry or domain contracts here.

## Preflight

Record only applicable:

- affected registry domain;
- exact official snapshot and Design Kit evidence when required;
- current and canonical owners;
- migration status;
- required public, private, or verification-only contract;
- mode: `none`, `library-relocation-only`, `additive`, `correction`, `replacement`, or `refresh`;
- affected consumers and expected delta;
- compatibility or migration decision;
- owner and representative consumer proof.

Use `blocked` when source meaning, ownership, compatibility, consumer impact, or required proof remains unresolved.

## Ownership

```text
shared/lib generic infrastructure
  → material/foundation
  → material/components
  → material/patterns
  → product composition
```

Foundation remains free of consuming-family and product knowledge. Generic DOM, browser, event, geometry, lifecycle, and teleport utilities stay in their generic owner; Material foundation may compose narrow Material-facing adapters.

Do not create a universal base, runtime token/state registry, generic resolver, cross-family state machine, duplicate theme/overlay system, production state-matrix component, or generic test DSL.

## Registry and migration

`src/shared/ui/material/docs/foundation-registry.md` owns current correctness and status. `src/shared/ui/material/README.md` owns physical migration.

Update only fields whose owned facts changed:

- status or snapshot;
- current/canonical owner and migration status;
- public/private/testing contract;
- consumers, gaps, verification, or review date.

A `verified` record requires a concrete snapshot and named verification.

## Change modes

### `library-relocation-only`

Move one cohesive owner without changing meaning, values, behavior, rendering, or verification semantics. Migrate affected imports and consumers and remove the old path.

### `additive`

May share a component PR when source-backed, backward-compatible, owned by one domain, free of a new lifecycle/context/public extension, and small enough for focused review.

For a legacy domain:

- extend the current owner only when it remains the single active owner;
- create a new standalone artifact under the canonical owner, relocating the cohesive owner when required;
- do not create parallel permanent legacy and canonical implementations.

### `correction`

Document old and new contract, affected consumers, expected delta, compatibility decision, and representative proof. Use a focused PR when blast radius exceeds the selected family.

### `replacement`

Requires a ready architecture decision, complete migration, removal of the old owner, and blocking proof.

### `refresh`

Compare a newer snapshot and classify differences before changing behavior. Refresh alone does not imply a production change.

Physical relocation must not hide a correction or replacement.

## Bounded expansion

Add or expand a foundation capability only when:

- a current Material component or explicit shared-library requirement needs it;
- Material or an unavoidable platform/testing boundary defines it as cross-family;
- the existing mechanism is insufficient;
- the contract remains family-agnostic and product-independent;
- total complexity is lower than local implementations.

A verification adapter may be added for a first family when the state is already a generic foundation concern and a family-local substitute would be worse.

Do not prebuild palettes, motion catalogs, adaptive managers, state systems, or testing frameworks.

## Domain invariants

- Reference/system owners contain no component tokens.
- Theme contexts override system roles, not component CSS.
- Unit conversion remains centralized.
- Typography, shape, elevation, and motion use verified roles or documented adaptations.
- State/ripple/focus own generic capability, not host semantics or component precedence.
- Verification adapters force generic appearance only and do not prove real behavior.
- Icons own symbol rendering, not product icon choice.
- Overlay foundation owns Material-facing adapters; generic mechanisms may remain outside.
- Accessibility, density, target area, and adaptivity remain policy until a concrete runtime owner is required.

## Public and testing API

- Components consume accepted foundation entry points, not implementation files.
- Foundation modules do not import the root Material barrel.
- Product code does not deep-import foundation internals or testing adapters.
- Public exports require registry ownership.
- Verification adapters remain testing-only.
- Temporary legacy exports require exact consumers and a removal target.

## Rule refinement

When a real component or foundation change proves a rule inaccurate or needlessly complex, correct the owning document under `src/shared/ui/material/docs` with the smallest evidence-backed change. Do not add a domain-specific exception merely to preserve the old rule.

## Proportional verification

Use existing repository checks and proof owned by the changed contract:

- focused owner contract tests;
- real browser checks for focus, pointer/touch, ripple, overlays, viewport behavior, computed tokens, and platform adaptations when applicable;
- deterministic representative component visuals when rendered output changes;
- representative consumers for meaningfully different affected paths;
- agent review for source meaning, ownership, and deviations;
- operator visual review for intentional rendered changes.

Use existing static or structured checks when they actually exist and apply. Add a new guard only after real work proves a stable repeated and precisely detectable need.

Forced state proves appearance only. Screenshots alone do not prove foundation behavior.

## Completion

Foundation work is complete when applicable registry fields, migration map, owner contracts, production/testing code, exports, source evidence, tests, and consumer impact agree. No family-specific knowledge, parallel permanent owner, hidden gap, permanent compatibility path, or local substitute may remain.
