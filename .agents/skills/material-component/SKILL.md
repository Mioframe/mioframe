---
name: material-component
description: 'Use when creating, repairing, aligning, migrating, continuing, or completing one official Material component family. Coordinates recursive owner convergence through isolated implementation and review contexts until aligned, externally blocked, or physically checkpointed.'
---

# Material component orchestrator

This is the coordination-only root for one official Material component family. The root owns current-state reconstruction, the complete recursive owner stack, architecture decisions, delegation, result validation, continuation, final review, and compact roadmap state.

The root must not edit production code, tests, stories, tokens, exports, consumers, legacy owners, or owner README files. Its only repository write is `src/shared/ui/material/docs/roadmap.md` when root state changes. Git and publication workflow are outside this skill.

Follow the applicable nested `AGENTS.md`, `src/shared/ui/material/docs/component-development.md`, `architecture.md`, `tokens.md`, and the `verification` skill.

## Invocation

- `material-component <family>` means one logical `full-family` convergence operation.
- `focused-correction` requires an explicit bounded operator objective.
- Required component and foundation dependencies remain inside the same root operation.
- The operator always resumes the same root command and never invokes an internal prerequisite separately.

A logical operation may span physical sessions. `converging` and `checkpointed` are nonterminal. Successful completion is `aligned`; `blocked` requires an exact external condition.

## Execution model

Use three distinct responsibilities:

1. **Root orchestrator** — read-only coordination and roadmap state.
2. **Fresh isolated writable owner context** — `material-component-implementation` converges exactly one deepest component or foundation owner, including all known in-owner defects and one review correction pass. It cannot declare readiness.
3. **Fresh isolated read-only reviewer** — `material-component-review` independently accepts or rejects that owner. The same reviewer context may re-review once after the implementation correction pass because it remains read-only and independent.

Create implementation and review contexts through the environment's real Agent/subagent delegation primitive. Loading another skill or changing the stated role in the same transcript does not create isolation. A context that edited an owner cannot review it.

One outer root owns the entire recursive operation and is the sole roadmap writer. Nested official families and foundation domains are stack owners, not additional roots.

If a required isolated context cannot be created or resumed, checkpoint with the exact physical reason. Do not replace it with root implementation or self-review.

## Preflight cadence

Perform a full code-first preflight:

- at the beginning of a root operation or physical-session resume;
- after the branch/base moved or external changes landed;
- when ownership, public contract, or dependency closure is uncertain.

Reconstruct actual owners, public exports, implementations, imports, styles, token declarations/references, direct consumers, legacy paths, guards, and proof. Existing README and tests are evidence, not authority. Validate and discard stale roadmap entries.

After an accepted owner pass, use an incremental refresh limited to:

- changed public contracts and exports;
- changed-owner consumers and compatibility paths;
- newly discovered dependencies;
- continuation-stack transition and relevant proof.

Do not repeat the full repository/family preflight after an ordinary in-owner correction. Escalate back to full preflight only when a new prerequisite appears, architecture changes, or the incremental refresh cannot prove closure.

Reuse locked source decisions and verified source evidence. Reopen Material sources only for a changed surface, missing evidence, a contradiction, or an invalidated decision.

## Strict continuation stack

The stack is ordered root-to-deepest unfinished owner. Only the deepest owner may be implemented or reviewed.

A parent must not be changed, migrated, exported, removed, or reported ready while a child remains unfinished. Pop the deepest entry only after:

- one isolated writable owner context returned a complete owner-pass result;
- focused proof passed;
- an isolated read-only reviewer returned `correction-final: complete`;
- changed-owner consumer compatibility and legacy disposition were accepted.

After popping an owner, refresh incrementally and continue with the new deepest owner.

## Recursive dependency closure

Classify every dependency required by the supported surface as `canonical-foundation`, `canonical-family`, `temporary-legacy-material`, `project-extension`, or `generic-foundation`.

If no ready canonical owner exists, push its exact owner onto the same stack:

- family-agnostic contract → one exact foundation owner;
- another official component family → one exact component-family owner;
- child dependencies execute depth-first.

When an owner becomes deepest, delegate it to one fresh writable `material-component-implementation` context. Do not create another root or roadmap writer.

Readiness requires canonical ownership, complete child dependencies, correct tokens, API/semantics/lifecycle/accessibility/platform behavior, all changed-owner consumers, compatibility cleanup, focused proof, and independent review. Relocation, forwarding, barrels, migrated imports, and green path guards are not readiness.

## Owner convergence pass

Before delegation, consolidate all currently known findings for the deepest owner into one locked owner-pass contract. Do not split one owner into a sequence of tiny agent assignments merely because findings affect different files, states, or consumers.

```text
consolidated owner-pass contract and selected source evidence
→ one fresh isolated writable implementation context
→ complete in-owner implementation and focused verify-managed proof
→ one fresh isolated read-only correction-final review
→ if blocked, same implementation context performs one consolidated correction pass
→ same read-only reviewer re-reviews once
→ accept and pop, or reopen architecture/context strategy
```

The implementation context remains responsible for the owner through the single correction pass. Create a new writable context only when:

- the architecture/owner contract changed;
- a newly discovered prerequisite becomes deepest;
- the original context is unavailable or exhausted;
- the second review still finds ownership or design failure.

The reviewer verdict controls readiness. Missing, same-context, or `not-run` review keeps the owner on the stack.

Root retains only this transient gate state:

```text
OWNER CONVERGENCE GATE
Owner:
Implementation context: fresh-isolated-writable | resumed-isolated-writable
Implementation pass: initial | correction
Review context: fresh-isolated-read-only | resumed-isolated-read-only
Review verdict: complete | blocked | not-run
Stack transition: retained | popped
```

## Verification cadence

Inside an owner pass, use verify-managed focused checks for changed owner files, relevant consumers, and exact browser/visual targets. Do not run full `pnpm verify` for every owner or every review correction.

Follow `pnpm verify:status` and `pnpm verify:resume` when verification is active. Do not start duplicate expensive runs or manually rerun already-passed unchanged lanes.

Run final read-only `pnpm verify` once after the continuation stack is empty and before terminal family review. Rerun only the failed focused proof during correction; rerun the final gate after relevant fixes.

## Verification failure attribution

A failed final verification is internal until proven otherwise. Before external `blocked`:

- run the exact failing command/lane on current head;
- reproduce it on the root base commit with the same environment;
- inspect whether failing code consumes any owner created, moved, forwarded, or behaviorally changed by this operation.

If it does not reproduce on base, or it consumes a changed owner, restore the nearest changed owner to the same stack and continue. The correction includes minimum compatible consumer fixes even across official family labels.

Only a base-reproduced failure independent of all active-operation changes is external.

## Continuation checkpoint

Checkpoint only for:

- `context-exhausted`;
- `runtime-exhausted`;
- `user-interrupted`;
- `isolated-writable-context-unavailable`;
- `isolated-review-context-unavailable`;
- `required-tool-unavailable`;
- `required-evidence-unavailable`.

A large owner, many consumers, a repairable red check, or an internal prerequisite is not a checkpoint reason.

## Completion

When the stack is empty and final `pnpm verify` has run, a fresh `material-family-review` is mandatory before either terminal result. An internal finding restores the exact owner to the stack.

`aligned` requires complete closure, accepted owner reviews, one canonical family public contract, adoption/cleanup and proof, operator comparison when required, passing final `pnpm verify`, and `material-family-review: complete`.

Return `blocked` only after family review confirms an exact external source, product, platform, evidence, safety, or base-reproduced verification condition.

## Result

```text
MATERIAL COMPONENT RESULT
Family:
Invocation scope:
Mode:
Status: aligned | blocked | checkpointed
Execution model: owner-pass-and-independent-review
Canonical owner:
Supported surface:
Dependency closure:
Continuation stack: none | <root > nested owner > deepest unfinished owner>
Deepest unfinished owner: none | <exact owner>
Last implementation context: none | fresh-isolated-writable | resumed-isolated-writable
Last correction review context: none | fresh-isolated-read-only | resumed-isolated-read-only
Last correction review verdict: none | complete | blocked | not-run
Family review: complete | blocked | not-run
Operator visual status:
Verification:
Verification attribution: internal-owner-restored | external-base-reproduced | not-applicable
Remaining required gaps: none | <exact gaps>
External blocker: none | <exact external blocker>
Checkpoint reason: none | context-exhausted | runtime-exhausted | user-interrupted | isolated-writable-context-unavailable | isolated-review-context-unavailable | required-tool-unavailable | required-evidence-unavailable
Next action: none | resume material-component <root family> | <exact external unblock action>
```

## Forbidden

- production edits from the root;
- implementation and review by the same context;
- one new implementation context per small finding inside the same owner;
- repeated full preflight after ordinary in-owner corrections;
- full `pnpm verify` after every owner or review pass;
- multiple roots or roadmap writers in one operation;
- readiness without independent review;
- terminal result without family review;
- changing a parent while a deeper owner remains unfinished;
- `partial` as a full-family result;
- treating changed-owner consumers as out of scope;
- external failure attribution without same-command base reproduction;
- asking the operator to invoke an internal prerequisite;
- checkpointing without an allowed physical reason;
- persisted execution logs, backlogs, or review history;
- Git, PR, or merge operations.
