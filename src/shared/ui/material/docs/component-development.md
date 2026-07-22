# Material component development

This document defines the durable convergence model for one official Material component family. The executable procedure is owned by `.agents/skills/material-component/SKILL.md`; stage and review skills own only their local contracts.

## Invocation

- `material-component <family>` means full-family convergence.
- A focused correction requires an explicit bounded operator objective.
- Required Material dependencies are recursively canonicalized inside the same full-family invocation, then control returns automatically to the calling family.

A correction unit is an implementation and review boundary, not the end of the invocation. `converging` is internal progress only.

## Sequence

```text
current-state preflight
→ bounded orientation and concern selection
→ missing target/audit evidence only
→ highest-priority complete correction contract
→ independent contract review
→ recursive exact prerequisites when required
→ one bounded canonical owner implementation and proof
→ conditional adoption and cleanup
→ independent correction review
→ next correction without restarting accepted work
→ final family review
→ pnpm verify
```

## Current-state preflight

Before selecting work, reconstruct from code:

- candidate and legacy owners and actual implementations;
- public exports and migrated consumers;
- real imports, injected dependencies, styles, token declarations and references;
- dependency ownership and readiness;
- all direct consumers of changed public contracts or extensions;
- boundary/token/documentation guards and relevant proof.

Owner README files contain durable contracts only. They are evidence, not execution state or architecture authority. Current correction, prerequisite, review, and continuation state stays in the active orchestrator context.

## Recursive dependency closure

Every dependency required by the supported surface resolves to one ready canonical foundation, official family public contract, generic non-Material foundation, or explicit Mioframe extension owner.

A used Material dependency remains inside the calling family workflow even when another owner implements it. If a ready canonical owner does not exist, run the owning `material-foundation` or `material-component` workflow depth-first and return automatically.

The prerequisite must meet the same readiness standard as a directly requested Material artifact:

- one canonical owner and complete recursive dependencies;
- correct token declaration ownership;
- valid public API, semantics, lifecycle, accessibility, and platform behavior;
- compatibility of all direct consumers of the changed contract;
- forwarding/import-only legacy compatibility with no parallel active implementation;
- focused proof and independent review.

Moving legacy files, creating a canonical directory or barrel, forwarding exports, migrating imports, or passing path guards does not establish readiness.

When supported, run each prerequisite in a fresh focused writable context. One context owns one canonical prerequisite owner plus only the minimum compatibility and adoption edits required for it. Split nested owners through the orchestrator rather than combining them into one broad implementation pass.

Wrong ownership, temporary legacy Material, legacy-owned canonical token declarations, missing tokens, defective contracts, incompatible consumers, private cross-family imports, hidden fallbacks, cycles, and parallel owners block lower-priority work on the same surface.

Creating or preserving a canonical owner, root export, migrated consumer, forwarding legacy owner, or alignment claim requires complete recursive dependency closure.

## Correction and review

Select one smallest complete correction at a time in this order:

1. unresolved source or platform decision;
2. ownership and dependencies;
3. semantics and accessibility;
4. public API and state;
5. DOM and anatomy;
6. token graph;
7. layout, typography, RTL, and scaling;
8. motion and browser lifecycle;
9. extensions, adoption, and cleanup.

Independent review verifies actual implementations and owners for the affected surface. Canonicalization or adoption widens review to recursive dependency closure and direct-consumer compatibility; a bounded scope cannot hide a real dependency.

Reuse accepted evidence until contradicted. Each gate permits one initial review and at most one substantive re-review. Repeated ownership failure reopens architecture instead of adding workarounds.

## Documentation

- Owner README: durable supported surface, public API, semantics, ownership, token/style/motion contracts, extensions, unsupported behavior, and durable proof obligations only.
- Roadmap: active family, alignment status, exact external blocker, and one next action only.
- Execution state remains transient in the orchestrator and structured stage results.

Do not persist workflow-state blocks, backlog, correction/review history, shell output, commit narratives, stage diaries, scorecards, or future-pass plans.

## Terminal results

Full-family completion is `aligned` only after closed recursive dependencies, canonical prerequisite owners, valid semantic/token/DOM/style/motion contracts, direct-consumer compatibility, adoption and cleanup, sufficient proof, required operator acceptance, `material-family-review: complete`, and passing `pnpm verify`.

Return `blocked` only for an exact external condition that cannot be resolved inside the family or recursive prerequisites. A known next correction, internal prerequisite, relocation-only dependency, ownership outside the family, stale documentation, or repairable verification failure means continue.
