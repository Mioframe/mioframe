---
name: material-component-review
description: 'Use for an independent review-only assessment of one Material component family and its current correction objective against official sources, the alignment map, implementation ownership, rendered behavior, proof, consumers, and cleanup. Never modify production files.'
---

# Material component review

This is the only review-only workflow for an official Material component family. It may be invoked directly or by `material-component` after the current correction objective and any conditional adoption complete.

Do not implement or repair the family through this skill. Report consolidated findings with their correction owner.

## Independence requirement

Run from a fresh agent session or isolated read-only context that did not implement the current patch. Receive only the family, current correction objective, required scenarios, current repository ref, and applicable operator evidence. Reconstruct the canonical target and current state from repository and official sources.

Do not accept implementation reasoning, rejected approaches, previous self-review, green CI, or claims of correctness as evidence. When an independent context is unavailable, return `blocked — independent review handoff required`.

## Required sources

Read:

- root and applicable nested `AGENTS.md` files;
- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/sources.md`;
- `src/shared/ui/material/docs/component-development.md`;
- the current family README;
- current and previous production owners, public exports, tests, stories, snapshots, direct consumers, compatibility paths, and official sources.

## Review questions

Answer separately:

1. **Current objective:** Is the documented correction objective complete, correct, independently valid, and mergeable?
2. **Family alignment:** Is the whole family `aligned`, `converging`, or `blocked`?

A family may remain `converging` after a successful focused correction. This is acceptable only when remaining gaps are honestly classified, outside the objective, and do not make the merged repository state incorrect.

## Review scope

Review the complete current family state and resulting PR, not only the latest diff.

Inspect:

- canonical target provenance and unresolved source conflicts;
- separation between canonical target and legacy current-state assessment;
- alignment classifications and remaining known gaps;
- current correction units and completion conditions;
- family ownership and dependency direction;
- supported and unsupported Material surface;
- public API and invalid combinations;
- native semantics and accessibility;
- anatomy, DOM ownership, target area, and unnecessary nodes;
- semantic and transient state, lifecycle, cancellation, interruption, disabled and failure behavior;
- implementation decomposition, co-location decisions, and actual owner boundaries;
- public Vue composition-root focus and absence of accidental monoliths;
- style and motion ownership, token declarations, configuration routes, state resolution, and final rendered-property ownership;
- interaction, ripple, focus, responsive, and adaptive behavior;
- foundation ownership and component-agnostic inputs;
- proof map and classification of existing tests, stories, snapshots, and fixtures;
- actual rendered Storybook output;
- representative and remaining consumer compatibility;
- obsolete implementation, exports, proof, contracts, aliases, and compatibility paths.

Compare semantic and architectural delta from the previous owner. A relocation, decomposition, renamed file, extracted function, copied stylesheet, stable snapshot, or new test is not Material improvement by itself.

README text, tests, snapshots, stories, and green CI are claims or regression guards. They do not prove official correctness by themselves.

## Mandatory defect patterns

Treat these as blockers or major issues unless a narrower severity is justified:

- canonical target was derived from legacy code before official requirements were independently resolved;
- source contradiction affecting the objective was hidden as `Unresolved: none`;
- behavior was preserved through blanket `no behavior change`, `relocation only`, or `verbatim copy` without alignment classification;
- existing proof was reused without classifying whether it protects canonical behavior, compatibility, implementation detail, or a legacy defect;
- a new failing test merely protects extraction or relocation while the Material behavior remains unverified;
- the current correction objective does not produce a source-backed or ownership-backed improvement;
- production began without a ready correction unit and faithful proof;
- a `.vue`, `.ts`, or stylesheet combines independently changing responsibilities or proof owners without documented cohesion;
- implementation is fragmented into files or wrappers that add indirection, forwarding, or DOM without clearer ownership;
- foundation dependencies were accepted only because they already existed rather than because their required contract is sufficient;
- known misaligned consumers were migrated onto a new public path;
- the README reports the family aligned while required `misaligned`, `unresolved`, or `obsolete` concerns remain.

## Findings

Consolidate confirmed findings into:

1. blockers;
2. major issues;
3. minor issues;
4. items not required for the current correction objective.

Every actionable finding states:

- official or repository requirement;
- concrete implementation evidence;
- mismatch and affected scenario;
- required final state;
- whether it blocks the current objective or only family completion;
- correction owner:
  - `material-component-contract`;
  - `material-component-implementation`;
  - `material-component-adoption`.

Do not scatter one underlying contract or ownership problem across repetitive findings.

## Verdict

Report two explicit results.

### Current objective verdict

Use exactly one:

- `correction objective complete`;
- `correction objective complete — operator visual acceptance required`;
- `correction objective incomplete`;
- `blocked — insufficient evidence`;
- `blocked — independent review handoff required`.

### Family alignment status

Use exactly one:

- `aligned`;
- `converging`;
- `blocked`.

Green verification is necessary but never upgrades either result by itself.

When invoked by the orchestrator, return:

```text
MATERIAL STAGE RESULT

Family:
Stage: review
Status: complete | blocked
Exit gate: passed | failed
Current objective result:
Family alignment status: aligned | converging | blocked
Evidence:
Changed ownership: none
Independent context: confirmed | unavailable
Operator visual status: not required | required | accepted | rejected
Remaining known gaps:
Next correction unit: none | <exact unit>
Blocker: none | <exact blocker>
```

`Status: complete` requires confirmed independent context and no blocker or major issue in the current correction objective. `Exit gate: passed` additionally requires operator visual status `not required` or `accepted` for changed visible output.

Family completion requires `Family alignment status: aligned`. A successful correction may pass with `converging` when remaining gaps are non-blocking and explicit.

## Restrictions

- Do not modify production, consumer, test, story, snapshot, contract, roadmap, or export files.
- Do not create a durable audit, separate checklist, registry, scorecard, or second family-state document.
- Do not review only naming or token declarations while skipping canonical-target provenance, alignment classifications, decomposition, rendered anatomy, behavior, and motion.
- Do not approve the current objective while its ownership, scenarios, proof, compatibility, visual evidence, or verification remain unresolved.
- Do not declare the family aligned while required gaps remain.
- Do not require deleting or rewriting already confirmed owners merely because another owner is defective.
- Do not invoke correction skills or the next workflow stage directly.
