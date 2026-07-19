---
name: material-component
description: 'Use to create, migrate, align, or repair one official Material component family through the canonical staged workflow.'
---

# Material component

This is the only implementation entry point for an official Material component family.

A component or family name is sufficient input. Resolve variants, API, foundations, files, consumers, tests, and expected defects from official sources and repository evidence. Do not ask the user to design the component when those facts are available.

Do not use this skill for review-only work. Use `material-component-review` instead.

## Required sources

Read:

1. root and applicable nested `AGENTS.md` files;
2. `src/shared/ui/material/docs/architecture.md`;
3. `src/shared/ui/material/docs/sources.md`;
4. `src/shared/ui/material/docs/component-development.md`;
5. `src/shared/ui/material/docs/roadmap.md` when this task advances library work;
6. the owning family README when it exists.

## Execution

Execute the stages in `component-development.md` in order:

```text
0 task lock
→ 1 resolved family contract
→ 2 primary vertical slice
→ 3 complete supported family
→ 4 consumer migration and old-owner removal
→ 5 full-result review and visual handoff
→ 6 final verification
```

Do not create a second plan or authoring workflow. Do not switch skills between stages except for the focused supporting skills below.

Supporting skills are loaded only at the stage that needs them:

- `material3-guidelines`: Stage 1 official-source resolution;
- `material-foundation`: Stage 1 or 2 only when a real cross-family foundation contract changes;
- Vue and testing skills: Stages 2–5 for the exact proof layer being implemented;
- `verification`: focused feedback during implementation and final Stage 6 verification.

## Focus rules

- Complete exactly one family per task or PR.
- Keep the Stage 0 objective and non-goals fixed unless new evidence invalidates them.
- Do not edit production code before the Stage 1 exit gate.
- Do not expand the family before the Stage 2 primary slice passes its exit gate.
- Do not migrate consumers before Stage 3 is complete.
- Do not stop after research, contract writing, Storybook preparation, or focused checks when implementation was requested.
- Do not leave an obsolete owner or compatibility path for later cleanup.
- If new evidence invalidates the contract, return explicitly to Stage 1 instead of adding workaround logic.

## Stop conditions

Stop only for an exact unresolved blocker in one of these categories:

- official source or supported-surface decision;
- family ownership or dependency direction;
- required user or component scenario;
- public contract requiring product approval;
- unsafe cross-family foundation blast radius;
- unresolved verification failure;
- rejected required visual evidence.

Report the exact blocker. Do not select another family or continue with assumptions.

## Result

Report:

- family and change mode;
- objective, supported surface, and unsupported surface;
- current and canonical owners;
- foundation impact;
- proof performed;
- migrated consumers;
- removed obsolete ownership;
- full-result review outcome;
- operator visual status;
- final verification;
- exact remaining blocker, or `none`.