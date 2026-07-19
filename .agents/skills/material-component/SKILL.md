---
name: material-component
description: 'Sole implementation entry point that orchestrates one official Material component family through contract, implementation, adoption, review, and verification.'
---

# Material component

This is the only implementation entry point for an official Material component family.

A family name is optional only when `src/shared/ui/material/docs/roadmap.md` already names one active family. Otherwise a component or family name is sufficient input. Resolve variants, API, foundations, files, consumers, tests, and expected defects from official sources and repository evidence rather than asking the user to design the component.

Do not use this skill for review-only work. Use `material-component-review` instead.

## Required sources

Read:

1. root and applicable nested `AGENTS.md` files;
2. `src/shared/ui/material/docs/architecture.md`;
3. `src/shared/ui/material/docs/sources.md`;
4. `src/shared/ui/material/docs/component-development.md`;
5. `src/shared/ui/material/docs/roadmap.md` when selecting or advancing active work;
6. the owning family README when it exists.

## Orchestration

Lock one family, change mode, objective, required scenarios, and non-goals. Then execute exactly this sequence:

```text
1 material-component-contract
2 material-foundation             # only when the contract reports required cross-family work
3 material-component-implementation
4 material-component-adoption
5 material-component-review
6 verification
```

Only this skill chooses and starts the next stage. Internal stage skills do not invoke each other or update the roadmap.

For each stage:

1. name the current family, stage, objective, exit gate, and blocker or `none`;
2. invoke the owning stage skill;
3. inspect its `MATERIAL STAGE RESULT`;
4. advance only when `Status: complete` and `Exit gate: passed`;
5. update `docs/roadmap.md` only when active family, status, blocker, or one next action changes.

## Review corrections

When `material-component-review` reports blockers or major issues, route them to exactly one owner:

- source, ownership, supported surface, public API, anatomy contract, state contract, or foundation decision → `material-component-contract`;
- production family, token routing, rendered properties, behavior, Storybook, or proof → `material-component-implementation`;
- consumers, compatibility, parallel ownership, stale references, or cleanup → `material-component-adoption`.

After corrections, run the complete review again. Do not patch findings inside the review skill.

## Focus rules

- Complete exactly one family per task and PR.
- Do not create a second plan, workflow, checklist, audit, or stage tracker.
- Do not edit production code before the contract exit gate passes.
- Do not skip representative consumer validation before completing the family.
- Do not start adoption before the supported family is complete.
- Do not stop after research, contract writing, Storybook preparation, a primary slice, or focused checks when end-to-end implementation was requested.
- Do not leave an obsolete owner or compatibility path for later cleanup.
- Do not pre-plan or start another family while the current family is active or blocked.
- If new evidence invalidates the contract, return explicitly to `material-component-contract` instead of adding workaround logic.

## Stop conditions

Stop only for an exact unresolved blocker in one of these categories:

- official source or supported-surface decision;
- family ownership or dependency direction;
- required user or component scenario;
- public contract requiring product approval;
- unsafe cross-family foundation blast radius;
- unresolved verification failure;
- rejected required visual evidence.

Report the exact blocker and keep the current family and stage recorded. Do not continue with assumptions or select another family.

## Final result

Report:

- family and change mode;
- objective, supported surface, and unsupported surface;
- current and canonical owners;
- contract result;
- foundation impact;
- implementation and representative-consumer result;
- migrated consumers and removed obsolete ownership;
- complete review verdict;
- operator visual status;
- final verification;
- exact remaining blocker, or `none`.