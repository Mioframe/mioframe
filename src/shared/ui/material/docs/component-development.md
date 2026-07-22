# Material component development

This document defines the durable convergence model for one official Material component family. The executable procedure is owned by `.agents/skills/material-component/SKILL.md`; stage and review skills own only their local contracts.

## Invocation

- `material-component <family>` means one logical full-family convergence operation.
- A focused correction requires an explicit bounded operator objective.
- Required Material dependencies are recursively canonicalized inside the same root operation, then control returns automatically to the calling family.
- A physical agent session may checkpoint and resume the same root operation when an actual context/runtime boundary prevents safe continuation.

A correction unit is an implementation and review boundary, not the end of a session or invocation. Continue through multiple reviewed owner units while the session can safely proceed. `converging` and `checkpointed` are nonterminal.

## Sequence

```text
current-state preflight and checkpoint validation
→ bounded orientation and concern selection
→ missing target/audit evidence only
→ highest-priority complete correction contract
→ independent contract review
→ recursive exact prerequisites when required
→ one bounded canonical owner implementation and proof
→ conditional adoption and cleanup
→ independent correction review
→ next owner without restarting accepted work
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

Owner README files contain durable contracts only. They are evidence, not execution state or architecture authority.

`roadmap.md` may contain one minimal continuation stack from the root family to the deepest unfinished owner. It is a resumption hint, not a completion ledger. Validate it against code, discard stale entries, and derive completed work from implementation and proof.

After preflight, start the highest-priority implementation or prerequisite. A component run does not rewrite workflow skills or global process documentation unless the operator explicitly requested workflow work.

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

When supported, run each prerequisite in a fresh focused writable context. One implementation unit owns one canonical prerequisite owner plus only the minimum compatibility and adoption edits required for it. Split nested owners through the orchestrator rather than combining them into one broad implementation pass.

When isolated contexts are unavailable, execute the same owner units sequentially in the current runtime and return one structured result per owner. Lack of subagents is not a blocker and does not permit combining several owners into one correction.

The size of a dependency or its consumer count does not make it external. Internal prerequisites remain owned by the root invocation.

Wrong ownership, temporary legacy Material, legacy-owned canonical token declarations, missing tokens, defective contracts, incompatible consumers, private cross-family imports, hidden fallbacks, cycles, and parallel owners block lower-priority work on the same surface.

Creating or preserving a canonical owner, root export, migrated consumer, forwarding legacy owner, or alignment claim requires complete recursive dependency closure.

Forwarding-only compatibility may exist as a temporary working-branch checkpoint while `converging`; it is never readiness or merge approval.

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

## Continuation checkpoint

A checkpoint is allowed only when context/runtime exhaustion, user interruption, unavailable required tools/evidence, or another external execution boundary prevents safe continuation.

When possible, finish and review the active owner unit first. Record only:

- active root family;
- alignment status;
- root-to-deepest unfinished continuation stack;
- exact external blocker or `none`;
- one next action that resumes the same root `material-component <family>` command.

Do not store completed units, findings, tests run, shell output, estimates, or a dependency backlog. Code remains the source of truth.

Discovery of a large prerequisite, a repairable red guard, or another official family is not enough to checkpoint while the session can continue.

## Documentation

- Owner README: durable supported surface, public API, semantics, ownership, token/style/motion contracts, extensions, unsupported behavior, and durable proof obligations only.
- Roadmap: active root family, alignment status, one validated continuation stack, exact external blocker, and one next action only.
- Detailed correction and review state remains transient and reconstructable from code.

Do not persist workflow-state blocks, backlogs, completed-unit history, shell output, commit narratives, stage diaries, scorecards, or future-pass plans.

## Results

`aligned` requires closed recursive dependencies, canonical prerequisite owners, valid semantic/token/DOM/style/motion contracts, direct-consumer compatibility, adoption and cleanup, sufficient proof, required operator acceptance, `material-family-review: complete`, and passing `pnpm verify`.

`blocked` requires an exact external condition that cannot be resolved inside the family or recursive prerequisites.

`checkpointed` is a nonterminal physical-session result. Resume with the same root `material-component <family>` command. Never ask the operator to invoke a nested family or foundation skill.

`partial` is not a valid Material full-family result. A known next correction, internal prerequisite, relocation-only dependency, ownership outside the family, stale documentation, or repairable verification failure means continue while the session can proceed.
