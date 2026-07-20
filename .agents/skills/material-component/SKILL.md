---
name: material-component
description: 'Use when creating, repairing, aligning, migrating, continuing, or materially improving one official Material component family. This is the sole convergence orchestrator from independent canonical target and current-state assessment through correction units, conditional adoption, independent review, and verification.'
---

# Material component

This is the only implementation entry point for an official Material component family.

A family name is optional only when `src/shared/ui/material/docs/roadmap.md` already names one active family. Otherwise a component or family name is sufficient input. Resolve target behavior, current defects, ownership, foundations, consumers, proof, and next correction unit from official sources and repository evidence rather than asking the user to design the component.

Do not use this skill for review-only work. Use `material-component-review` instead.

## Required sources

Read:

1. root and applicable nested `AGENTS.md` files;
2. `src/shared/ui/material/docs/architecture.md`;
3. `src/shared/ui/material/docs/sources.md`;
4. `src/shared/ui/material/docs/component-development.md`;
5. `src/shared/ui/material/docs/roadmap.md` when selecting or advancing active work;
6. the owning family README when it exists.

## Task lock

Lock:

- one family;
- one mode: `new-component`, `align-existing`, or `focused-correction`;
- one current correction objective;
- required scenarios and non-goals;
- current phase and next exit gate.

Use `align-existing` by default whenever an implementation already exists, regardless of its quality or location. Relocation, API preservation, decomposition, adoption, and cleanup are actions, not modes and not proof of correctness.

One PR may complete the family or one bounded correction objective. It must leave a complete independently valid repository state and may record remaining non-blocking family gaps for later correction.

## Orchestration

Execute:

```text
material-component-contract
→ material-foundation             # only for an exact required cross-family prerequisite
→ material-component-implementation
→ material-component-adoption     # only when canonical ownership is ready and adoption is in scope
→ independent material-component-review
→ verification
→ next correction unit or family completion
```

Only this skill chooses and starts the next stage. Internal stage skills do not invoke each other or update the roadmap.

For each stage:

1. name the family, mode, correction objective, phase, exit gate, family alignment status, and blocker or `none`;
2. invoke the owning stage skill;
3. inspect its `MATERIAL STAGE RESULT`;
4. advance only when the current objective reports `Status: complete` and `Exit gate: passed`;
5. update `docs/roadmap.md` only when active family, status, blocker, or one next action changes.

The contract stage must independently resolve the canonical target before assessing current implementation. It then records the alignment map, proof classification, correction units, decomposition, compatibility impact, and exact foundation requirements. Production edits remain forbidden until the next correction unit and its applicable proof gate are ready.

## Existing implementation policy

Treat current implementation as evidence and editable state, never as Material authority and never as disposable by default.

Preserve an existing owner only when the alignment map classifies it `confirmed-compliant` or `project-extension`. Correct `misaligned` owners through bounded correction units. Block or narrow `unresolved` surface. Remove `obsolete` owners when their replacement is complete.

A local rewrite is allowed only for the smallest owner whose contract is predominantly wrong or whose incremental repair would add more workaround logic than replacement. Do not reset the whole family merely because one owner is wrong.

Existing tests, stories, snapshots, and consumer behavior must be classified before reuse. Passing legacy proof does not establish canonical correctness.

## Independent review handoff

The review must run in a fresh agent session or isolated read-only context that did not implement the current patch. Provide only the family, current correction objective, required scenarios, current repository ref, and applicable operator evidence. Do not pass implementation reasoning or claims of correctness as review evidence.

The reviewer determines separately:

- whether the current correction objective is complete and mergeable;
- whether the family is `aligned`, `converging`, or `blocked` overall.

If the environment cannot create an independent review context, stop with `independent review handoff required`. Do not silently substitute same-context self-review.

## Review corrections

Route every finding to exactly one owner:

- canonical target, source conflict, classification, ownership, supported surface, public API, anatomy contract, state contract, decomposition, style ownership, proof map, compatibility, correction-unit, or foundation decision → `material-component-contract`;
- production owners, composition roots, DOM, token routing, rendered properties, motion, behavior, Storybook, or proof → `material-component-implementation`;
- consumers, parallel ownership, stale references, compatibility residue, or cleanup → `material-component-adoption`.

After corrections, run the complete independent review again. Do not patch findings inside the review skill.

If two correction rounds retain the same underlying defect, add workaround logic, or preserve ownership ambiguity, stop the current implementation context. Report `fresh agent session required`, record the family, responsible stage, exact unresolved defect, current alignment map, confirmed owners, and repository state needed to resume.

A fresh session reloads and continues the current repository state. It discards rejected assumptions, not valid implementation or completed correction units.

## Focus rules

- Work on exactly one family per task and PR.
- Do not create a second plan, workflow, durable checklist, audit, or stage tracker.
- Do not inspect legacy implementation first and derive the canonical target from it.
- Do not edit production before the current correction unit, foundation, and applicable proof gates pass.
- Do not migrate consumers onto a known misaligned contract.
- Do not run adoption when the objective does not change ownership or import paths.
- Do not report family completion while required `misaligned`, `unresolved`, or `obsolete` concerns remain.
- Do not require full-family completion when one bounded correction produces a complete valid PR and remaining gaps are honestly recorded.
- Do not leave a knowingly broken intermediate mechanism for a later PR.
- Do not pre-plan or start another family while the current family is active, converging, or blocked.
- If new evidence invalidates a decision, return to the responsible stage and preserve unaffected confirmed work.
- Persistent agent memory is never Material authority. Ignore entries that conflict with the current repository and do not delete unrelated memory automatically.

## Stop conditions

Stop only for an exact unresolved blocker in one of these categories:

- official source or required supported-surface decision;
- family ownership or dependency direction;
- required user or component scenario;
- public contract requiring product approval;
- unsafe cross-family foundation blast radius;
- missing independent review context;
- repeated correction failure requiring a fresh agent session;
- unresolved verification failure;
- rejected required visual evidence.

Record the exact blocker and current alignment state. Do not continue with assumptions or select another family.

## Final result

Report:

- family, mode, and current correction objective;
- canonical target and current implementation assessment result;
- alignment classifications changed by this work;
- correction units completed;
- preserved confirmed owners and locally replaced owners;
- foundation impact;
- proof and representative-consumer result;
- conditional adoption and obsolete ownership removed;
- independent review result for the objective;
- family alignment status: `aligned`, `converging`, or `blocked`;
- remaining known gaps and exact next correction unit;
- operator visual status;
- final verification;
- exact blocker, or `none`.
