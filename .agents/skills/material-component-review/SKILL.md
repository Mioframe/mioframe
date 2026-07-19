---
name: material-component-review
description: 'Review-only assessment of one complete Material component family without production changes.'
---

# Material component review

This is the only review-only workflow for an official Material component family. It may be invoked directly or by `material-component` after implementation and adoption complete.

Do not implement or repair the family through this skill. Report consolidated findings with their correction owner.

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
- token declarations, configuration routes, state resolution, and final rendered-property ownership;
- interaction, ripple, focus, motion, responsive, and adaptive behavior;
- foundation ownership and component-agnostic inputs;
- Storybook coverage and actual rendered output;
- proof ownership and missing behavior checks;
- representative and remaining consumer compatibility;
- obsolete implementation, exports, stories, tests, snapshots, contracts, aliases, and compatibility paths.

README text, tests, snapshots, stories, and green CI are claims or regression guards. They do not prove official correctness by themselves. Inspect the implementation and actual rendered output behind those claims.

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
- `blocked — insufficient evidence`.

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
Verdict:
Operator visual status: not required | required | accepted | rejected
Blocker: none | <exact blocker>
```

`Status: complete` requires no unresolved blocker or major issue. The agent never invents operator acceptance.

## Restrictions

- Do not modify production, consumer, test, story, snapshot, contract, roadmap, or export files.
- Do not create a durable audit, checklist, registry, scorecard, or second family-state document.
- Do not review only naming or token declarations while skipping rendered anatomy, behavior, and motion.
- Do not approve while ownership, required scenarios, public contracts, visual evidence, obsolete ownership, or relevant verification remain unresolved.
- Do not invoke correction skills or the next workflow stage directly.
