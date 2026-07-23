# src/shared/ui/material

Inherits `src/shared/ui/AGENTS.md`. This directory is the canonical Material 3 Expressive library boundary.

## Canonical target

- Official components implement the current applicable Material 3 Expressive contract.
- Baseline Material 3 is not a silent fallback.
- Existing code, snapshots, third-party implementations, and memory are not Material authority.
- Missing or conflicting official evidence must remain explicit; do not invent values or behavior.

## Contains

Only:

- `docs` — Material-library source policy and focused technical domain documentation;
- `foundation` — cross-family Material contracts required by confirmed current work;
- `components` — official public Material component families;
- `patterns` — accepted reusable official Material compositions;
- local family/domain documentation and curated public entry points.

Product documentation, product-specific UI, and generic platform infrastructure remain outside.

## Dependency direction

```text
shared/lib generic infrastructure
  ├─→ material/foundation
  ├─→ material/components
  └─→ material/patterns

material/foundation → material/components → material/patterns
material library → project-specific shared UI and product layers
```

- Any Material layer may use a correctly owned generic utility directly.
- Foundation must not import components or patterns.
- Families must not deep-import another family's private files.
- Patterns use public component and foundation contracts only.
- Library code must not import product layers.
- Generic infrastructure must not depend on Material family knowledge.

## Documentation ownership

- `src/shared/ui/material/docs/**` is the only canonical Material-library documentation tree.
- Root `docs/**` must not contain Material-library policy or workflow documents.
- Component-family artifacts belong beside the owning family under `components/<family>`.
- Executable agent procedures belong under `.agents/skills` and must not duplicate documentation ownership.

## Public API

- Product consumers use `@shared/ui/material` after the root entry point exists.
- Internal library code does not import the root barrel.
- External deep imports into private implementation or testing files are forbidden.
- Every public export has one clear owner.

## Ownership rules

- New official components belong under `components/<family>`.
- New foundation artifacts belong under `foundation/<domain>` only when a confirmed cross-family requirement cannot be served by an existing owner.
- New patterns require official composition evidence and a current product-independent scenario.
- Existing Material code outside this directory is legacy, not a template for new ownership.
- Do not add placeholder layers, universal bases, runtime registries, generic resolvers, cross-family state machines, or speculative extension points.

## Verification

- Verify each changed contract at its owning layer.
- Use browser proof for browser-owned interaction and visual proof for rendered appearance.
- Automated checks do not establish Material correctness by themselves.
- Shared changes require consumer and blast-radius review.
