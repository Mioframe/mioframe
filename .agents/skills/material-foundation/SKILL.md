---
name: material-foundation
description: 'Use when changing Material reference/system tokens, theme, units, typography, shape, elevation, motion, state/ripple/focus, verification adapters, icons, overlays, accessibility, density, or adaptive foundation contracts.'
paths:
  - 'src/shared/ui/material/foundation/**'
  - 'src/shared/lib/md/**'
  - 'src/shared/ui/State/**'
  - 'src/shared/ui/Icon/**'
  - 'src/shared/ui/Overlay/**'
  - 'postcss.config.js'
  - 'config/postcss.config.test.ts'
  - 'docs/material-3/foundation-*.md'
  - 'docs/material-3/library-architecture.md'
  - 'docs/material-3/source-of-truth.md'
---

# Material foundation

Canonical rules live in:

- `docs/material-3/source-of-truth.md`;
- `docs/material-3/library-architecture.md`;
- `docs/material-3/foundation-architecture.md`;
- `docs/material-3/foundation-registry.md`.

This skill defines the execution sequence and stop conditions. Do not duplicate the full registry or domain contracts here.

## Preflight

Record:

- affected registry domain;
- exact official documentation snapshot and Design Kit evidence when applicable;
- current production owner and canonical library owner;
- migration status;
- public, private, and verification-only contracts;
- mode: `none`, `library-relocation-only`, `additive`, `correction`, `replacement`, or `refresh`;
- direct consumers and expected delta;
- compatibility/migration decision;
- owner verification and representative consumer proof.

Use `blocked` when source meaning, ownership, compatibility, migration, verification, or consumer impact remains unresolved.

## Ownership

```text
shared/lib generic infrastructure
  → material/foundation
  → material/components
  → material/patterns
  → product composition
```

Foundation code must remain free of consuming-family knowledge. Generic DOM, browser, event, geometry, lifecycle, and teleport utilities remain in their generic owner; Material foundation may compose them through narrow adapters.

Do not create a universal base, runtime token/state registry, generic resolver, cross-family state machine, second theme/overlay system, production state-matrix component, or generic test DSL.

## Registry and migration

`foundation-registry.md` is the current correctness/status source. `src/shared/ui/material/README.md` is the physical migration map.

Every change updates the affected record's:

- status and exact snapshot;
- current/canonical owners and migration status;
- public/private/testing contracts;
- consumers, gaps, verification, and review date.

A `verified` record requires a concrete snapshot and named verification.

## Change-mode rules

### `library-relocation-only`

Move one cohesive owner without changing meaning, values, behavior, rendering, or verification semantics. Update all imports/exports/consumers and remove the old path.

### `additive`

May share a component PR only when source-backed, backward-compatible, owned by one domain, adding no lifecycle/context/dependency/public extension, and fitting focused verification.

For a legacy domain:

- an existing file in the current legacy owner may be extended when it remains the single active owner;
- a new standalone runtime/testing artifact requires relocation to the canonical owner first or in the same explicit migration;
- do not create parallel active legacy and canonical production owners without a temporary migration contract and removal target.

### `correction`

Document old/new contract, complete direct consumers, expected delta, compatibility decision, and representative verification. Normally use a focused PR.

### `replacement`

Requires a ready architecture handoff, complete migration, removal of the old owner, and blocking verification.

### `refresh`

Compare a newer source snapshot and classify each delta before changing behavior. A refresh alone does not imply a production change.

Physical relocation must not hide correction or replacement.

## Bounded expansion

Add or expand a foundation capability only when:

- a current component/product scenario requires it;
- Material or an unavoidable platform/testing boundary defines it as cross-family;
- the existing mechanism is insufficient;
- the contract remains family-agnostic;
- total complexity is lower than local implementations.

A verification adapter may be added for a first component only when the state is already a generic foundation concern, the adapter is testing-only, and family-local duplication would otherwise be unavoidable.

Do not prebuild complete palettes, motion catalogs, adaptive managers, state systems, or testing frameworks.

## Domain invariants

- Reference/system owners contain no component tokens.
- Theme contexts override system roles, not component CSS.
- Unit conversion remains centralized.
- Typography, shape, elevation, and motion use verified roles or documented private adaptations.
- State/ripple/focus own generic capability, not host semantics or component precedence.
- Verification adapters force generic appearance only and do not prove real behavior.
- Icons own symbol rendering, not product icon choice.
- Overlay foundation owns Material-facing containment/lifecycle adapters; generic teleport/event/geometry helpers may remain outside.
- Accessibility, density, target area, and adaptivity remain policy until a concrete runtime owner is required.

## Public and testing API

- Components consume accepted foundation entry points, not implementation files.
- Foundation modules do not import the root Material barrel.
- Product code does not deep-import foundation internals or testing adapters.
- Public production exports require registry ownership and accurate TSDoc.
- Verification adapters use a testing-only entry point and are never product API.
- Temporary legacy exports require exact consumers and a removal target.

## Verification

Apply the proof required by `foundation-architecture.md`:

- static location, dependency, export, vocabulary, and ownership checks;
- structured registry consistency;
- focused owner contract tests;
- real browser checks for focus, pointer/touch, ripple, overlays, viewport behavior, computed tokens, and platform adaptations;
- deterministic component visual checks for adapter output;
- representative consumers for each distinct affected path;
- architecture/Material review for source meaning, ownership, and deviations;
- human visual review for intentional rendered changes.

Forced state proves appearance only. Screenshots alone do not prove foundation behavior.

## Completion

Registry, migration map, owner contracts, production/testing code, exports, source evidence, tests, and consumer impact must agree. No family-specific knowledge, parallel owner, hidden gap, permanent compatibility path, or local substitute may remain.
