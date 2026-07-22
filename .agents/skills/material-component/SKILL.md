---
name: material-component
description: 'Use when creating, repairing, aligning, migrating, continuing, or completing one official Material component family. Coordinates recursive owner work through isolated implementation and review contexts until aligned, externally blocked, or physically checkpointed.'
---

# Material component orchestrator

This is the coordination-only root for one official Material component family. The operator supplies a family name or an explicit bounded objective. The root owns current-state reconstruction, the complete recursive owner stack, dependency ordering, delegation, result validation, continuation, final review, and roadmap state.

The root context must not edit production code, tests, stories, tokens, exports, consumers, legacy owners, or owner README files. Its only repository write is the compact `src/shared/ui/material/docs/roadmap.md` state when that state changes. Git and publication workflow are outside this skill.

Follow the applicable nested `AGENTS.md`, `src/shared/ui/material/docs/component-development.md`, `architecture.md`, and `tokens.md`.

## Invocation

- `material-component <family>` means one logical `full-family` convergence operation.
- `focused-correction` requires an explicit bounded operator objective.
- A delegated dependency remains part of the caller's root operation.
- The operator always resumes the same root command and never invokes an internal prerequisite separately.

A logical operation may span physical sessions, but one session must continue while safe execution capacity and required isolated contexts remain available. `converging` and `checkpointed` are nonterminal. Successful completion is `aligned`; `blocked` requires an exact external condition.

## Mandatory execution model

Every correction uses three distinct responsibilities:

1. **Root orchestrator context** — read-only coordination and roadmap state only.
2. **Fresh isolated writable owner context** — `material-component-implementation` implements exactly one component or foundation owner correction and returns an implementation result; it cannot declare readiness.
3. **Fresh isolated read-only review context** — `material-component-review` independently inspects current code and returns the only accepted readiness verdict.

Create implementation and review contexts through the environment's real Agent/subagent delegation primitive. Merely loading another skill, changing the stated role, clearing a local plan, or claiming a fresh perspective inside the same transcript does not create an isolated context.

The implementation and review contexts must be newly created for that correction and must not share the implementer's reasoning transcript. A context that edited the correction cannot review it. Sequential self-implementation or self-review in the root context is forbidden.

One outer root orchestrator owns the entire recursive operation and is the sole roadmap writer. Nested official families and foundation domains are stack owners, not additional root orchestrators.

If a required isolated writable or review context cannot be created, checkpoint with the corresponding physical reason. Do not replace the missing context with the root agent.

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

Inspect actual owners, implementations, imports, styles, token declarations/references, exports, all direct consumers of changed public contracts or extensions, legacy paths, guards, and proof. Existing tests and README facts are evidence, not authority.

Validate any persisted continuation stack against current code. Discard stale entries. Do not rebuild accepted work merely because a new physical session began.

## Strict continuation stack

The continuation stack is ordered root-to-deepest unfinished owner. Only the deepest unfinished owner may enter contract, implementation, or correction-final review.

A parent owner must not be implemented, migrated, exported, removed, or reported ready while a child entry remains unfinished. Pop the deepest entry only after:

- its implementation result is available from a fresh writable context;
- its focused proof passes;
- a fresh read-only `material-component-review` returns `complete` for that exact correction;
- direct-consumer compatibility and legacy-owner disposition are accepted.

After popping an owner, refresh the graph and continue with the new deepest owner. Never skip upward because the next owner is large.

## Recursive dependency closure

Classify every dependency required by the supported surface as `canonical-foundation`, `canonical-family`, `temporary-legacy-material`, `project-extension`, or `generic-foundation`.

If no ready canonical owner exists, push its exact owner onto the same root continuation stack:

- family-agnostic contract → one exact foundation owner;
- another official component family → one exact component-family owner;
- any child dependencies discovered for that owner are pushed after it and execute depth-first.

When the owner becomes deepest, delegate it to a fresh isolated writable `material-component-implementation` context with `Owner kind: foundation` or `Owner kind: component`. Do not create a second root orchestrator or a second roadmap writer for a nested owner. The outer root retains the complete stack and automatically returns to each parent after accepted child review.

A prerequisite is ready only when its canonical owner, own dependencies, tokens, semantics/lifecycle, public contract, all direct consumers, compatibility path, proof, and independent review are complete. Relocation, forwarding, barrels, migrated imports, or green path guards do not establish readiness.

## Correction cycle

For the deepest unfinished owner:

```text
bounded contract and selected evidence
→ fresh isolated writable material-component-implementation context
→ focused proof
→ fresh isolated read-only correction-final review
→ accept and pop, or return consolidated blockers to a new implementation context
→ refresh graph and continue
```

Use at most one substantive correction retry before reopening the architecture decision. The reviewer verdict, not the implementation result, controls readiness.

The root must retain and validate these transient results for the active correction:

```text
OWNER CORRECTION GATE
Owner:
Implementation context: fresh-isolated-writable
Implementation result: implemented | blocked | checkpoint-required
Review context: fresh-isolated-read-only
Review verdict: complete | blocked | not-run
Stack transition: retained | popped
```

Missing, same-context, or `not-run` review keeps the owner on the stack.

## Verification failure attribution

A failed final verification is internal to the active root operation until proven otherwise.

Before reporting `blocked`:

- run the exact failing command or lane on the current head; prior logs, history, or an import-only diff are not sufficient;
- reproduce the same failure on the root operation's base commit using the same command and relevant environment;
- inspect whether the failing code directly or transitively consumes any owner created, moved, forwarded, or behaviorally changed by the active operation.

If the failure does not reproduce on the base commit, or the failing code consumes a changed owner, restore the nearest changed canonical owner to the continuation stack and continue. Its correction scope includes the minimum direct-consumer fixes required for compatibility, even when those consumers belong to separate official Material families.

A repository-internal component or foundation is not an external blocker merely because its own canonical family is outside the root family's public surface. Do not ask the operator to launch separate Material roots to repair a verification failure introduced or exposed by the active operation.

Only a failure reproduced on the base commit and shown independent of every active-operation change may be classified as an external verification blocker.

## Continuation checkpoint

Checkpoint only when the current physical session cannot safely continue for one of these reasons:

- `context-exhausted`;
- `runtime-exhausted`;
- `user-interrupted`;
- `isolated-writable-context-unavailable`;
- `isolated-review-context-unavailable`;
- `required-tool-unavailable`;
- `required-evidence-unavailable`.

A large owner, many consumers, a repairable red guard, or an internal prerequisite is not a checkpoint reason.

Before checkpointing, leave the safest coherent branch state, retain the deepest unfinished owner, write the minimal roadmap stack, and record the exact checkpoint reason. `checkpointed` with `Checkpoint reason: none` or an unlisted narrative reason is invalid.

## Completion

When the continuation stack is empty, a fresh `material-family-review` is mandatory before either terminal result, including when the root believes no implementation is needed or final verification is red. The reviewer must independently validate closure and verification attribution. An internal finding restores the exact owner to the stack and the root continues.

`aligned` requires an empty continuation stack, complete recursive dependency closure, accepted owner reviews, one canonical family owner/public contract, adoption/cleanup and required proof, accepted operator comparison when required, `material-family-review: complete` from a fresh read-only context, and passing final `pnpm verify`.

Return `blocked` only after `material-family-review: blocked` confirms an exact external source, product, platform, evidence, safety, or base-reproduced verification condition that cannot be resolved inside the recursive operation.

## Result

```text
MATERIAL COMPONENT RESULT
Family:
Invocation scope:
Mode:
Status: aligned | blocked | checkpointed
Execution model: isolated-owner-and-review
Canonical owner:
Supported surface:
Dependency closure:
Continuation stack: none | <root > nested owner > deepest unfinished owner>
Deepest unfinished owner: none | <exact owner>
Last implementation context: none | fresh-isolated-writable
Last correction review context: none | fresh-isolated-read-only
Last correction review verdict: none | complete | blocked | not-run
Family review: complete | blocked | not-run
Operator visual status:
Verification:
Verification attribution: internal-owner-restored | external-base-reproduced | not-applicable
Remaining required gaps: none | <exact gaps inferred from current code>
External blocker: none | <exact external blocker>
Checkpoint reason: none | context-exhausted | runtime-exhausted | user-interrupted | isolated-writable-context-unavailable | isolated-review-context-unavailable | required-tool-unavailable | required-evidence-unavailable
Next action: none | resume material-component <root family> | <exact external unblock action>
```

## Forbidden

- production edits from the root orchestrator context;
- implementation and review by the same context;
- simulating isolation by changing roles or skills inside one transcript;
- multiple root orchestrators or roadmap writers in one recursive operation;
- readiness without a fresh read-only correction review;
- terminal `aligned` or `blocked` without a fresh family review;
- changing a parent while a deeper unfinished owner remains;
- `partial` as a Material full-family result;
- trusting a continuation stack without validating code;
- treating a used dependency or changed-owner consumer as out of scope;
- classifying a repository-internal failure as external without same-command base reproduction;
- relocation-only readiness;
- asking the operator to invoke an internal prerequisite or a separate Material root to repair active-operation compatibility;
- checkpointing without one allowed physical reason;
- persisted execution logs, completed-unit lists, backlogs, or review history;
- editing Material workflow skills during a component run without an explicit workflow task;
- Git, branch, commit, pull-request, or merge operations.
