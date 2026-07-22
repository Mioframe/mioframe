---
name: material-component
description: 'Use when creating, repairing, aligning, migrating, continuing, or completing one official Material component family. A family-only invocation recursively canonicalizes required Material dependencies and resumes from one validated continuation checkpoint until aligned or exactly blocked.'
---

# Material component orchestrator

This is the sole writer and orchestrator for one official Material component family. The operator supplies a family name or an explicit bounded objective. The agent owns technical discovery, architecture, recursive prerequisites, implementation, proof, documentation, continuation, and safe resumption. Git and publication workflow are outside this skill.

Follow the applicable nested `AGENTS.md`, `src/shared/ui/material/docs/component-development.md`, `architecture.md`, and `tokens.md`.

## Invocation

- `material-component <family>` means one logical `full-family` convergence operation.
- `focused-correction` requires an explicit bounded operator objective.
- A delegated dependency call is `prerequisite-contract`; it remains part of the caller's full-family operation.

A logical full-family operation may span more than one physical agent session when context, runtime, user interruption, or an unavailable required tool forces a boundary. The operator always resumes with the same root command, for example `material-component Button`; the operator never invokes an internal foundation or component prerequisite separately.

One correction unit is not the end of a session or invocation. Continue through as many reviewed owner units as the current session can safely complete. `converging` and `checkpointed` are nonterminal states. Successful completion is `aligned`; `blocked` requires an exact external condition.

README or roadmap text cannot narrow the invocation, exclude a used dependency, or turn an internal prerequisite into future operator work.

## Current-state preflight

Reconstruct current truth from code before selecting work:

```text
CANONICALIZATION PREFLIGHT
Family:
Invocation scope:
Candidate canonical owner:
Public export present:
Migrated consumers:
Legacy owner state:
Direct imports and injected dependencies:
Required CSS/token dependencies:
Legacy Material dependencies:
Dependency closure: closed | blocked
Continuation stack: none | <root > nested owner > deepest unfinished owner>
Documentation contract: valid | stale | contains-forbidden-execution-state
```

Inspect actual owners, implementations, imports, styles, token declarations/references, exports, all direct consumers of changed public contracts or extensions, legacy paths, guards, and proof. Existing tests and README contract facts are evidence, not architecture authority.

The roadmap continuation stack is a resumption hint only. Validate every stack entry against current code, discard stale entries, and derive completed work from implementation, imports, tests, and guards. Do not rebuild accepted evidence or restart the root family merely because a new session began.

If an owner README contains workflow state, backlog, correction/review history, shell output, commit narratives, or future passes, remove that execution material before using the README as evidence. Preserve only durable supported surface, API, semantics, ownership, token/style/motion contracts, extensions, unsupported behavior, and proof obligations.

Build one bounded orientation and reuse accepted evidence until contradicted. After preflight, begin the highest-priority implementation or prerequisite. Do not spend a component run rewriting workflow skills or global process documentation unless the operator explicitly requested a workflow change.

## Recursive dependency closure

Classify every dependency required by the supported surface as `canonical-foundation`, `canonical-family`, `temporary-legacy-material`, `project-extension`, or `generic-foundation`.

A used Material dependency remains inside this orchestration even when another owner implements it. If no ready canonical owner exists, recursively invoke its owning Material workflow and bring the exact required contract to the same readiness standard as a directly requested Material artifact.

- family-agnostic contract → `material-foundation` prerequisite;
- another official component family → `material-component` prerequisite;
- nested prerequisites execute depth-first and return automatically to the caller.

A prerequisite is `complete` only when its canonical owner, own dependencies, tokens, semantics/lifecycle, public contract, all direct consumers of the changed contract, compatibility path, proof, and independent review are ready. Moving legacy files, adding a canonical directory/barrel, forwarding exports, migrating imports, or passing boundary guards does not establish readiness.

When closure is blocked:

1. do not select lower-priority local work for the same surface;
2. execute the smallest complete owning prerequisite;
3. return to the calling family automatically;
4. refresh the dependency graph and consumer compatibility;
5. continue until aligned, externally blocked, or a real physical session boundary is reached.

When supported, run each prerequisite in a fresh focused writable context. One prerequisite implementation unit owns one canonical owner plus only the minimum compatibility and adoption edits required for that owner. Split multi-owner prerequisite work and retain the stack in the caller.

If isolated writable contexts are unavailable, execute the same owner units sequentially in the current runtime, emit one structured result per owner, reset the implementation scope, and continue. Lack of subagents is not a blocker and does not permit combining owners into one broad correction.

An internal prerequisite is work, not a terminal blocker or an operator decision. Its size, number of consumers, or ownership outside the root family does not justify returning it as a separate command.

## Canonicalization gate

A candidate canonical owner, Material root export, migrated consumer, removed/forwarding legacy owner, or canonical/adoption/alignment claim requires complete recursive dependency closure for the supported surface.

While closure is blocked, do not retain a ready root export, migrate more consumers, remove the only complete legacy owner, declare adoption complete, or treat a real dependency as outside scope.

If premature canonicalization already exists, dependency closure or safe rollback is the highest-priority correction.

Forwarding-only compatibility and other incomplete states may exist on the working branch while `converging`; they are checkpoints, not readiness, and cannot support an `aligned` or merge-ready claim.

## Convergence

```text
current-state preflight and checkpoint validation
→ bounded orientation and concern plan
→ missing/invalidated target and audit evidence only
→ highest-priority complete correction contract
→ independent contract review
→ recursive exact prerequisites when required
→ one bounded implementation owner
→ conditional adoption and cleanup
→ focused proof
→ independent correction-final review
→ refresh affected facts and consumers
→ next owner without restarting accepted work
→ independent material-family-review
→ final pnpm verify
```

Wrong ownership/dependencies outrank semantics, API, state, DOM, token cleanup, layout, motion, extensions, adoption, and cleanup for the same surface.

After each accepted unit, refresh affected facts, rerun preflight when ownership/exports/imports/consumers/prerequisites changed, and immediately continue to the next required owner while the session can safely proceed. Do not intentionally stop after discovering or completing one prerequisite.

Each correction gate permits one initial review and at most one substantive re-review. Repeated ownership failure reopens architecture rather than adding workarounds.

## Continuation checkpoint

Use a checkpoint only when the current physical session cannot safely continue because of actual context/runtime exhaustion, user interruption, an unavailable required tool/evidence source, or another external execution boundary. A large next owner, a red repairable guard, or discovery of an internal prerequisite is not by itself a checkpoint reason.

Before checkpointing:

1. finish the active owner unit and its focused review when possible;
2. leave code in the safest coherent branch state available;
3. record only the root-to-deepest unfinished owner stack in `roadmap.md`;
4. keep `Family alignment status: converging` and `External blocker: none` unless a real external blocker exists;
5. set the single next action to resume the same root command and validate the stack from code.

The checkpoint must not contain completed-unit history, defect lists, review transcripts, shell output, verification narratives, estimates, or a backlog. Code remains the source of truth for what is complete.

## Documentation

Repository documentation is not a general execution log:

- owner README: durable contract only;
- roadmap: active root family, alignment status, one validated continuation stack, exact external blocker, and one next action only;
- detailed correction, findings, review results, and completed work remain derivable from code and transient structured results.

Never write workflow-state blocks, backlogs, correction/review history, shell transcripts, commit narratives, route inventories, scorecards, or future-pass plans into owner documentation.

## Completion

`aligned` requires compliant or validly unsupported concerns, complete recursive dependencies/prerequisites, ready canonical owners, one canonical family owner/public contract, adoption/cleanup and required proof, accepted operator comparison when required, `material-family-review: complete`, and passing final `pnpm verify`.

Return `blocked` only for an exact unresolved source conflict, product decision, platform applicability question, unsafe cycle, unavailable required evidence, repeated independent review failure, operator rejection, or verification failure that cannot be corrected inside the family or recursive prerequisites.

Return `checkpointed` only for a real physical session boundary after persisting the minimal continuation stack. It is not completion and the only normal next command is the same root `material-component <family>` invocation.

A known next correction, internal prerequisite, relocation-only prerequisite, ownership outside the family, stale documentation, or repairable red check means continue internally while the session can proceed.

## Result

```text
MATERIAL COMPONENT RESULT
Family:
Invocation scope:
Mode:
Status: aligned | blocked | checkpointed
Canonical owner:
Supported surface:
Dependency closure:
Continuation stack: none | <root > nested owner > deepest unfinished owner>
Prerequisite readiness: complete | blocked | checkpointed
Family review:
Operator visual status:
Verification:
Remaining required gaps: none | <exact gaps inferred from current code>
Blocker: none | <exact external blocker or physical session boundary>
Next action: none | resume material-component <root family> | <exact external unblock action>
```

## Forbidden

- `partial` as a Material full-family result;
- persisted execution logs, completed-unit lists, backlogs, or review history in owner README or roadmap;
- trusting a continuation stack without validating current code;
- lower-priority work around open ownership/dependency closure;
- treating a used dependency or prerequisite as out of scope;
- treating relocation, forwarding, migrated imports, barrels, or green guards as canonical readiness;
- canonical export/adoption/removal with open recursive closure;
- asking the operator to choose technical Material ownership or invoke an internal prerequisite;
- a roadmap next action that invokes `material-foundation` or a nested `material-component` family;
- stopping only because the next prerequisite is large or has many consumers;
- implementing several canonical prerequisite owners in one correction unit;
- editing Material workflow skills during a component run without an explicit workflow task;
- duplicate registries, audits, histories, checklists, scorecards, ledgers, or workflow policy;
- Git, branch, commit, pull-request, or merge operations.
