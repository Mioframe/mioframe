---
name: material-component
description: 'Use when creating, migrating, repairing, aligning, completing, or materially changing one official Material component family. This is the sole implementation orchestrator from source-backed contract through decomposition, proof-first implementation, adoption, independent review, and verification.'
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
material-component-contract
→ material-foundation             # only when the contract reports required cross-family work
→ material-component-implementation
→ material-component-adoption
→ independent material-component-review
→ verification
```

Only this skill chooses and starts the next stage. Internal stage skills do not invoke each other or update the roadmap.

For each stage:

1. name the current family, phase, objective, exit gate, and blocker or `none`;
2. invoke the owning stage skill;
3. inspect its `MATERIAL STAGE RESULT`;
4. advance only when `Status: complete` and `Exit gate: passed`;
5. update `docs/roadmap.md` only when active family, status, blocker, or one next action changes.

The contract exit gate includes the family README, implementation decomposition, style ownership, proof map, implementation order, representative consumer, and exact foundation requirements. Production edits remain forbidden until required foundation work and the implementation stage's initial-proof gate pass.

## Independent review handoff

The final review must run in a fresh agent session or an isolated read-only review context that did not implement the current patch. Provide only the family, objective, required scenarios, current repository ref, and applicable operator evidence. Do not pass implementation reasoning or claims of correctness as review evidence.

If the environment cannot create an independent review context, stop with `independent review handoff required`. Do not silently substitute same-context self-review.

## Review corrections

When `material-component-review` reports blockers or major issues, route them to exactly one owner:

- source, ownership, supported surface, public API, anatomy contract, state contract, implementation decomposition, style ownership, proof map, or foundation decision → `material-component-contract`;
- production units, composition roots, token routing, rendered properties, behavior, Storybook, or proof → `material-component-implementation`;
- consumers, compatibility, parallel ownership, stale references, or cleanup → `material-component-adoption`.

After corrections, run the complete independent review again. Do not patch findings inside the review skill.

If two correction rounds retain the same underlying defect, add workaround logic, or preserve ownership ambiguity, stop the current implementation context. Report `fresh agent session required`, record the family, responsible stage, exact unresolved defect, and repository state needed to resume. Continue only from a fresh agent session that reloads the current repository and reconstructs the responsible contract; do not carry rejected implementation assumptions forward.

## Focus rules

- Complete exactly one family per task and PR.
- Do not create a second plan, workflow, durable checklist, audit, or stage tracker.
- Do not edit production code before the contract, foundation, and applicable initial-proof gates pass.
- Do not skip representative consumer validation before completing the family.
- Do not start adoption before the supported family is complete.
- Do not stop after research, contract writing, initial proof, Storybook preparation, a primary slice, or focused checks when end-to-end implementation was requested.
- Do not leave an obsolete owner or compatibility path for later cleanup.
- Do not pre-plan or start another family while the current family is active or blocked.
- If new evidence invalidates the contract, return explicitly to `material-component-contract` instead of adding workaround logic.
- Persistent agent memory is never Material authority. Ignore entries that conflict with the current repository and do not delete unrelated memory automatically.

## Stop conditions

Stop only for an exact unresolved blocker in one of these categories:

- official source or supported-surface decision;
- family ownership or dependency direction;
- required user or component scenario;
- public contract requiring product approval;
- unsafe cross-family foundation blast radius;
- missing independent review context;
- repeated correction failure requiring a fresh agent session;
- unresolved verification failure;
- rejected required visual evidence.

Report the exact blocker and keep the current family and phase recorded. Do not continue with assumptions or select another family.

## Final result

Report:

- family and change mode;
- objective, supported surface, and unsupported surface;
- current and canonical owners;
- contract, decomposition, style ownership, proof map, and implementation order result;
- foundation impact;
- initial proof, implementation units, and representative-consumer result;
- migrated consumers and removed obsolete ownership;
- independent review verdict;
- operator visual status;
- final verification;
- exact remaining blocker, or `none`.
