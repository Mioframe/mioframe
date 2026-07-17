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

## Official navigation

Map the domain to the official Material documentation structure:

```text
material/foundations/<official-slug>
material/styles/<official-slug>
```

Use `foundations` for official foundation domains such as accessibility, adaptive/layout, and interaction.

Use `styles` for color, elevation, icons, motion, shape, typography, and other official style domains.

Do not create `material/foundation`, `material/patterns`, or a generic catch-all owner.

## Preflight

Record only applicable:

- official documentation domain and exact source evidence;
- current and canonical owner;
- affected component families and consumers;
- required public, private, or testing-only contract;
- change mode: relocation, additive, correction, replacement, or source refresh;
- expected behavior or rendering delta;
- known omissions and verification needs.

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
- a behavior used by one family remains family-local unless official evidence or multiple real consumers prove shared ownership;
- foundations and styles do not import component families or the root Material barrel.

## Local documentation

Each implemented shared domain owns:

```text
README.md
AUDIT.md  # only after independent review
```

The implementing workflow updates README and records:

- official documentation mapping;
- implemented contract;
- not implemented capability;
- known issues and required follow-up;
- affected consumers;
- verification;
- review status.

It does not edit AUDIT.md.

## Change rules

### Relocation

Move one cohesive owner without changing semantics. Migrate imports and remove the obsolete path.

### Additive

Add the smallest source-backed capability required by current consumers. Do not create a broad catalog or extension framework.

### Correction

Document the previous and corrected contract, affected families, expected delta, and representative proof.

### Replacement

Replace one owner completely and remove the obsolete implementation and compatibility paths.

### Source refresh

Compare newer official evidence and classify differences before changing behavior. A source refresh does not require a production change.

## Actual dependency rule

A shared contract is consumed only when changing its source input can affect the final output through a real implementation dependency.

Do not treat these as a route:

- adjacent declarations;
- aliases to unchanged constants;
- equality assertions;
- comments claiming derivation;
- tests that restate definitions.

When official numeric spring parameters cannot drive CSS directly, document them as source evidence and expose one honestly documented Web runtime adaptation. Do not invent fake consumption.

## Blast radius

Changes to root/system tokens, universal selectors, pseudo-elements, shared formulas, theme roles, or public shared APIs affect multiple consumers.

Before retaining such a change:

1. identify affected families;
2. prefer the narrowest valid owner;
3. document changed cascade, inheritance, or runtime semantics;
4. add representative cross-family proof;
5. record remaining uncertainty in the shared-domain README and affected family READMEs.

Do not move large token sets onto `*`, `::before`, or `::after` only to make one component scenario pass.

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

Shared implementation work is finished when code, local README, exports, affected consumers, and applicable local verification agree and every remaining gap is documented.

Set local review status to `review required after changes` and run the independent review separately.