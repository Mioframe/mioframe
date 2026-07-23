---
name: material-foundation
description: 'Use to implement one explicitly approved Material foundation contract such as tokens, theme, typography, shape, elevation, motion, interaction, icons, overlays, accessibility, density, or adaptive policy. Requires a ready architecture decision and does not own independent review or merge readiness.'
paths:
  - 'src/shared/ui/material/foundation/**'
  - 'src/shared/lib/md/**'
  - 'src/shared/ui/State/**'
  - 'src/shared/ui/Icon/**'
  - 'src/shared/ui/Overlay/**'
  - 'postcss.config.js'
  - 'config/postcss.config.test.ts'
  - 'src/shared/ui/material/docs/foundation-*.md'
  - 'src/shared/ui/material/docs/library-architecture.md'
  - 'src/shared/ui/material/docs/source-of-truth.md'
---

# Material foundation implementation

Use this skill only when an architect-approved handoff or family contract explicitly requires a cross-family Material foundation change.

Canonical rules live in:

- `src/shared/ui/material/docs/workflow.md`;
- `src/shared/ui/material/docs/source-of-truth.md`;
- `src/shared/ui/material/docs/library-architecture.md`;
- `src/shared/ui/material/docs/foundation-architecture.md`;
- `src/shared/ui/material/docs/foundation-registry.md`.

This skill implements the approved foundation delta. It does not select a domain, invent ownership, broaden guarantees, approve architecture, perform independent family review, or claim merge readiness.

## Required ready decision

Before production edits, the approved contract or handoff must record:

- exact foundation domain;
- problem and current requirement;
- official source snapshot;
- current and canonical owner;
- public, private, or testing-only contract;
- affected consumers;
- compatibility and migration decision;
- acceptance criteria and proof owners;
- expected visual/behavior delta;
- unresolved decisions as `none`;
- `Readiness: ready`.

Stop when any implementation-affecting decision is missing or when a narrower existing mechanism satisfies the same requirements.

## Ownership

```text
shared/lib generic infrastructure
  → material/foundation
  → material/components
  → material/patterns
  → product composition
```

Foundation remains free of consuming-family and product knowledge. Generic DOM, browser, event, geometry, lifecycle, and teleport utilities stay in their generic owner; Material foundation may compose narrow Material-facing adapters only when approved current work requires them.

Do not create a universal base, runtime registry, generic resolver, cross-family state machine, duplicate theme/overlay system, generic test DSL, manager agent, or speculative extension point.

## Implementation preflight

Record:

- approved foundation contract and owner;
- existing mechanism and why it is insufficient;
- minimum sufficient design and simpler alternative;
- exact consumers and blast radius;
- migration/compatibility plan;
- acceptance and risk matrix;
- `TEST IMPACT`;
- focused and final verification.

The preflight must not redefine the approved contract.

## Change modes

Use only the approved mode:

- `library-relocation-only` — move one cohesive owner without changing meaning, values, behavior, rendering, or verification semantics;
- `additive` — add a required backward-compatible capability to one existing owner;
- `correction` — replace an incorrect contract with the approved corrected contract;
- `replacement` — introduce the approved new owner, migrate all affected consumers, and remove the old owner;
- `refresh` — compare a newer official snapshot and implement only approved resulting deltas.

Physical relocation must not hide a correction or replacement.

## Bounded expansion

A foundation capability may be added or expanded only when:

- a current component or product scenario requires it;
- Material or an unavoidable platform/testing boundary defines it as cross-family;
- the existing mechanism is insufficient;
- the approved owner remains family-agnostic;
- total complexity is lower than local substitutes.

Do not prebuild palettes, motion catalogs, adaptive managers, state systems, testing frameworks, or future APIs.

## Domain invariants

- Reference/system owners contain no component tokens.
- Theme contexts override system roles, not component CSS.
- Unit conversion remains centralized.
- Typography, shape, elevation, and motion use verified roles or approved adaptations.
- State/ripple/focus own generic capability, not host semantics or family precedence.
- Verification adapters force generic appearance only and do not prove real behavior.
- Icons own symbol rendering, not product icon choice.
- Overlay foundation owns Material-facing adapters; generic mechanisms may remain outside.
- Accessibility, density, target area, and adaptivity remain policy until approved work requires a runtime owner.

## Contract invalidation

When implementation evidence invalidates ownership, public contract, compatibility, consumer impact, or proof ownership, return the `CONTRACT BLOCKER` defined by `src/shared/ui/material/docs/workflow.md`.

Do not silently rewrite foundation policy or create a family-specific exception.

## Verification

Use proof owned by the approved contract:

- focused owner tests;
- browser checks for focus, pointer/touch, ripple, overlay, viewport, computed token, lifecycle, and platform behavior when applicable;
- deterministic representative visuals when rendered output changes;
- representative consumers for materially different affected paths;
- final read-only `pnpm verify`.

Forced state proves appearance only. Screenshots alone do not prove foundation behavior.

## Completion

Foundation implementation is complete when:

- the approved contract is implemented without family knowledge or parallel ownership;
- registry fields and physical ownership are accurate;
- affected consumers and exports are migrated;
- obsolete owners and unapproved compatibility are removed;
- required proof and final verification pass;
- remaining limitations are explicit.

Implementation completion is not independent review or merge readiness.
