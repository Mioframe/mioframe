---
name: material-foundation
description: 'Use when changing a real cross-family Material foundation or style contract, including accessibility, adaptive/layout, interaction, color, elevation, icons, motion, shape, typography, theme, or units.'
paths:
  - 'src/shared/ui/material/foundations/**'
  - 'src/shared/ui/material/styles/**'
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

# Material foundations and styles

Use this workflow only for a real cross-family Material contract.

## Evidence boundary

Use current workspace files, official Material sources, and local project verification.

Do not run, inspect, or cite `git`, `gh`, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history as foundation evidence.

Review current ownership, current consumers, current behavior, and current blast radius.

## Official navigation

```text
material/foundations/<official-slug>
material/styles/<official-slug>
```

Use `foundations` for accessibility, adaptive/layout, interaction, and other official foundation domains.

Use `styles` for color, elevation, icons, motion, shape, typography, and other official style domains.

Do not create `material/foundation`, a generic catch-all owner, or a top-level patterns owner without an official equivalent.

## Canonical source status

Record one:

- `current-complete`;
- `snapshot-complete-stale`;
- `partial`;
- `conflicting`;
- `unavailable`.

A current-complete claim requires all applicable current domain pages and structured sources to be available and inspected without partial, truncated, suspicious, or unresolved coverage.

A stale snapshot may be snapshot-complete, not current-complete. Spot checks verify specific facts, not complete domain coverage.

## Preflight

Record only applicable:

- official domain, exact sources, and source status;
- current and canonical owner;
- current affected families and consumers;
- required public, private, or testing-only contract;
- change mode: relocation, additive, correction, replacement, or source refresh;
- expected behavior or rendering delta;
- known omissions, source gaps, and verification needs.

A shared change is blocked when source meaning, ownership, affected consumers, or safe blast radius cannot be resolved.

## Ownership

```text
shared generic infrastructure
  → material/foundations and material/styles
  → material/components
  → project-specific UI and product composition
```

- foundations and styles contain no component-family or product knowledge;
- generic browser, event, geometry, lifecycle, and teleport utilities remain in their generic owner;
- behavior used by one family remains family-local unless official evidence or multiple real consumers prove shared ownership;
- foundations and styles do not import component families or the root Material barrel.

## Local documentation

Each implemented shared domain owns:

```text
README.md
AUDIT.md  # only after independent review
```

README records:

- official mapping and canonical source status;
- implemented contract;
- partial, defective, provisional, or unverified contract;
- actual capability not implemented;
- officially unsupported or invalid routes when applicable;
- known issues and required follow-up;
- affected consumers and blast radius;
- representative verification;
- review status.

Authoring never edits AUDIT.

Do not classify an officially invalid route as missing capability. Do not inflate optional or non-normative guidance into required foundation capability.

## Change modes

### Relocation

Move one cohesive owner without changing semantics. Migrate imports and remove the obsolete path.

### Additive

Add the smallest source-backed capability required by current consumers. Do not create a broad catalog or extension framework.

### Correction

Document the current defective contract, corrected contract, affected families, expected delta, and representative proof. Historical provenance is not required.

### Replacement

Replace one owner completely and remove obsolete implementation and compatibility paths.

### Source refresh

Compare current official evidence with current documentation and implementation. Classify source limitations before changing behavior. A source refresh does not require a production change.

## Actual dependency rule

A shared contract is consumed only when changing its source input can affect the final output through a real implementation dependency.

These are not routes:

- adjacent declarations;
- aliases to unchanged constants;
- equality assertions;
- comments claiming derivation;
- stories or tests that restate definitions.

When official numeric spring parameters cannot drive CSS directly, record them as canonical source evidence and expose one honestly documented Web runtime adaptation. Do not invent fake consumption or describe the adaptation as the original spring model.

## Blast radius

Changes to root/system tokens, universal selectors, pseudo-elements, shared formulas, theme roles, or public shared APIs affect multiple consumers.

Before retaining such a change:

1. identify current affected families from current code;
2. prefer the narrowest valid owner;
3. document changed cascade, inheritance, or runtime semantics;
4. add representative proof that actually exercises the route across affected contract classes;
5. record remaining uncertainty in the shared-domain README and affected family READMEs.

Unchanged consumer tests that never exercise the route are not representative proof.

Do not move large token sets onto `*`, `::before`, or `::after` only to make one family scenario pass.

## Motion foundation proof

Verify a shared motion foundation deeply once:

- canonical requirement and documented Web adaptation;
- source-to-runtime dependency;
- timing/easing or owned runtime model;
- interruption behavior;
- reduced-motion contract;
- representative consumers.

Component families then need only proportional evidence that they consume the shared contract correctly. Do not require frame-by-frame verification in every family.

A known operator-rejected perceived motion result remains open at the affected family until production behavior changes and new evidence is accepted, even when the shared route is technically honest.

## Domain invariants

- Reference/system owners contain no component-family tokens.
- Theme contexts override system roles rather than component CSS.
- Unit conversion remains centralized.
- Typography, shape, elevation, and motion use verified roles or documented adaptations.
- Interaction foundations own generic state/ripple/focus capability, not component semantics or precedence.
- Icons own symbol rendering, not product icon choice.
- Verification helpers remain testing-only and do not prove real behavior by themselves.

## Proportional proof

Use only proof owned by the changed contract:

- focused shared-owner tests;
- computed CSS or browser checks when cascade or platform behavior is genuinely involved;
- representative component consumers for cross-family changes;
- bounded visuals when rendered output changes;
- independent audit after implementation changes.

Do not build a universal validation framework, motion catalog, state machine, theme manager, generic test DSL, or placeholder directory tree.

## Completion

Shared implementation work is finished when:

- code, README, exports, and current consumers agree;
- source status is honest;
- representative blast-radius proof exists;
- every remaining gap and visual rejection is explicit;
- applicable local verification passes;
- local review status is `review required after changes`.

Run independent review separately.
