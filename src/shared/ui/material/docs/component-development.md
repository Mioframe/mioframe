# Material component development

This document defines the durable convergence model for one official Material component family. The executable procedure is owned by `.agents/skills/material-component/SKILL.md`; stage and review skills own only their local contracts.

## Invocation

- `material-component <family>` means full-family convergence.
- A focused correction requires an explicit bounded operator objective.
- A delegated dependency call completes only the exact prerequisite contract, then returns to the calling family.

A correction unit is an implementation and review boundary, not the end of the invocation. `converging` is internal progress only.

## Sequence

```text
current-state preflight
→ bounded orientation and concern selection
→ missing target/audit evidence only
→ highest-priority complete correction contract
→ independent contract review
→ exact prerequisite when required
→ one bounded implementation and proof
→ conditional adoption and cleanup
→ independent correction review
→ next correction without restarting accepted work
→ final family review
→ pnpm verify
```

## Current-state preflight

Before selecting work, reconstruct from code:

- candidate and legacy owners;
- public exports and migrated consumers;
- real imports, injected dependencies, styles, and token references;
- dependency ownership and readiness;
- whether persisted README state is current.

The family README is reusable evidence, not authority. Preserve confirmed target and behavior facts, but replace stale scope, dependency, alignment, review-history, and next-action conclusions.

## Dependency closure

Every dependency required by the supported surface must resolve to one ready owner:

- canonical Material foundation;
- canonical official Material family public contract;
- valid generic non-Material foundation;
- explicit Mioframe extension owner.

A used dependency remains inside the calling family workflow even when another owner implements it. Complete required foundation or official-family prerequisites depth-first and return automatically.

Wrong ownership, temporary legacy Material, missing tokens, defective contracts, private cross-family imports, hidden fallbacks, cycles, and parallel owners block lower-priority work on the same surface.

Creating or preserving a canonical owner, root export, migrated consumer, forwarding legacy owner, or alignment claim requires complete dependency closure. Do not migrate or remove ownership around an open dependency.

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

Independent review verifies actual imports and owners for the affected surface. Canonicalization or adoption automatically widens review to complete dependency closure; a supplied bounded scope cannot hide a real dependency.

Reuse accepted evidence until contradicted. Each gate permits one initial review and at most one substantive re-review. Repeated ownership failure reopens architecture instead of adding workarounds.

## Workflow state

The owning README stores one compact current-state block:

```text
MATERIAL WORKFLOW STATE
Family:
Invocation scope:
Mode:
Current objective and stage:
Candidate canonical owner:
Dependency closure:
Prerequisite stack:
Current correction unit:
Correction and family review status:
Operator visual status:
Family alignment status:
Remaining required gaps:
Next action:
External blocker: none | <exact blocker>
```

Do not store review history, shell transcripts, search output, route inventories, stage diaries, scorecards, superseded objectives, or future-pass narratives.

## Terminal results

Full-family completion is `aligned` only after closed dependencies, completed prerequisites, one canonical owner, valid semantic/token/DOM/style/motion contracts, adoption and cleanup, sufficient proof, required operator acceptance, `material-family-review: complete`, and passing `pnpm verify`.

Return `blocked` only for an exact external condition that cannot be resolved inside the family or its prerequisites. A known next correction, internal prerequisite, stale state, ownership outside the family, or repairable verification failure means continue.
