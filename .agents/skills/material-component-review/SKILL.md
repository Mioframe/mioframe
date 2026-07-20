---
name: material-component-review
description: 'Use for an independent review-only assessment of one complete Material component family against current official sources, its repository contract, implementation decomposition, rendered behavior, proof, consumers, and cleanup. Never modify production files.'
---

# Material component review

This is the only review-only workflow for an official Material component family. It may be invoked directly or by `material-component` after implementation and adoption complete.

Do not implement or repair the family through this skill. Report consolidated findings with their correction owner.

## Independence requirement

Run from a fresh agent session or an isolated read-only context that did not implement the current patch. Receive only the family, objective, required scenarios, current repository ref, and applicable operator evidence. Reconstruct the contract from current repository and official sources.

Do not accept implementation reasoning, rejected approaches, previous self-review, green CI, or claims of correctness as evidence. When an independent context is unavailable, return `blocked — independent review handoff required`.

## Required sources

Read:

- root and applicable nested `AGENTS.md` files;
- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/sources.md`;
- `src/shared/ui/material/docs/component-development.md`;
- the current family README;
- current production code, public exports, tests, stories, snapshots, direct consumers, removed legacy ownership, and official sources.

## Review scope

Review the complete current family and resulting PR state, not only the latest diff or files named by the user.

Inspect every applicable contract:

- family ownership and dependency direction;
- supported and unsupported Material surface;
- public API and invalid combinations;
- native semantics and accessibility;
- anatomy, DOM ownership, target area, and unnecessary nodes;
- semantic and transient state, lifecycle, cancellation, interruption, disabled behavior, failure behavior, and cleanup;
- implementation decomposition, co-location decisions, and implementation order;
- public Vue composition-root focus and absence of accidental monoliths;
- style ownership, stylesheet organization, token declarations, configuration routes, state resolution, and final rendered-property ownership;
- interaction, ripple, focus, motion, responsive, and adaptive behavior;
- foundation ownership and component-agnostic inputs;
- proof map, initial-proof evidence, test ownership, and missing behavior checks;
- Storybook coverage and actual rendered output;
- representative and remaining consumer compatibility;
- obsolete implementation, exports, stories, tests, snapshots, contracts, aliases, and compatibility paths.

README text, tests, snapshots, stories, and green CI are claims or regression guards. They do not prove official correctness by themselves. Inspect the implementation and actual rendered output behind those claims.

Treat these as major issues unless a narrower severity is justified:

- production implementation began without a ready contract, decomposition, or applicable initial proof;
- a `.vue`, `.ts`, or stylesheet combines independently changing responsibilities or proof owners without a documented cohesion reason;
- a non-trivial visual contract remains embedded in a public Vue composition root without explicit style ownership;
- implementation is fragmented into files or wrapper components that add indirection, forwarding, or DOM without clearer ownership;
- tests describe the implementation after the fact instead of protecting the documented observable contract.

## Findings

Consolidate confirmed findings into:

1. blockers;
2. major issues;
3. minor issues;
4. items not required for the current change.

Every actionable finding states:

- official or repository requirement;
- concrete implementation evidence;
- mismatch and affected scenario;
- required final state;
- correction owner:
  - `material-component-contract`;
  - `material-component-implementation`;
  - `material-component-adoption`.

Do not scatter one underlying ownership or contract problem across repetitive findings.

## Verdict

End with exactly one verdict:

- `compliant`;
- `technically compliant — operator visual acceptance required`;
- `partially compliant`;
- `non-compliant`;
- `blocked — insufficient evidence`;
- `blocked — independent review handoff required`.

Green verification is necessary but never upgrades the verdict by itself.

When invoked by the orchestrator, also return:

```text
MATERIAL STAGE RESULT

Family:
Stage: review
Status: complete | blocked
Exit gate: passed | failed
Evidence:
Changed ownership: none
Independent context: confirmed | unavailable
Verdict:
Operator visual status: not required | required | accepted | rejected
Blocker: none | <exact blocker>
```

`Status: complete` requires confirmed independent context and no unresolved blocker or major issue. `Exit gate: passed` additionally requires operator visual status `not required` or `accepted`; a technically compliant result awaiting operator comparison remains `Exit gate: failed` and blocks verification completion. The agent never invents operator acceptance.

## Restrictions

- Do not modify production, consumer, test, story, snapshot, contract, roadmap, or export files.
- Do not create a durable audit, separate checklist, registry, scorecard, or second family-state document.
- Do not review only naming or token declarations while skipping decomposition, rendered anatomy, behavior, and motion.
- Do not approve while ownership, required scenarios, public contracts, visual evidence, obsolete ownership, or relevant verification remain unresolved.
- Do not invoke correction skills or the next workflow stage directly.