---
name: material-component-review
description: 'Use for a review-only assessment of one complete Material component family without production changes.'
---

# Material component review

This is the only review-only workflow for an official Material component family.

Do not use it to implement or repair the family. When correction is requested, report the consolidated findings and hand implementation to `material-component`.

## Required sources

Read:

- root and applicable nested `AGENTS.md` files;
- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/sources.md`;
- `src/shared/ui/material/docs/component-development.md`;
- the current family README;
- current production code, public exports, tests, stories, snapshots, direct consumers, and official sources.

## Review scope

Review the complete current family and resulting PR state, not only the latest diff or the files named by the user.

Inspect every applicable contract:

- family ownership and dependency direction;
- supported and unsupported Material surface;
- public API and invalid combinations;
- native semantics and accessibility;
- anatomy, DOM ownership, target area, and unnecessary nodes;
- semantic state, transient state, lifecycle, cancellation, interruption, disabled behavior, failure behavior, and cleanup;
- token declarations, configuration routes, state resolution, and final rendered-property ownership;
- interaction, ripple, focus, motion, responsive, and adaptive behavior;
- foundation ownership and component-agnostic inputs;
- Storybook coverage and actual rendered output;
- proof ownership and missing behavior checks;
- consumer migration and product compatibility;
- obsolete implementation, exports, stories, tests, snapshots, contracts, and compatibility paths.

README text, tests, snapshots, stories, and green CI are claims or regression guards. They do not prove official correctness by themselves. Inspect the implementation and actual rendered output behind those claims.

## Findings

Consolidate all confirmed findings into:

1. blockers;
2. major issues;
3. minor issues;
4. items not required for the current change.

Every actionable finding must state:

- official or repository requirement;
- concrete implementation evidence;
- mismatch and affected scenario;
- required final state;
- correction boundary and owner.

Do not scatter one underlying ownership or contract problem across multiple repetitive findings.

## Verdict

End with exactly one verdict:

- `compliant`;
- `technically compliant — operator visual acceptance required`;
- `partially compliant`;
- `non-compliant`;
- `blocked — insufficient evidence`.

Green verification is necessary but never upgrades the verdict by itself.

## Restrictions

- Do not modify production files.
- Do not create a durable audit, checklist, registry, scorecard, or second family-state document.
- Do not review only naming or token declarations while skipping rendered anatomy, behavior, and motion.
- Do not approve while ownership, required scenarios, public contracts, visual evidence, or relevant verification remain unresolved.
