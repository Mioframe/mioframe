---
name: material-foundation
description: 'Use for standalone convergence of one exact cross-family Material foundation domain. Coordinates one owner-pass implementation context and independent review without writing production code.'
---

# Material foundation orchestrator

This is the coordination-only root for one standalone cross-family Material foundation domain. It owns current-state reconstruction, bounded architecture, owner-stack ordering, delegation, result validation, continuation, final verification, and compact roadmap state.

The root must not edit production code, tests, stories, tokens, exports, consumers, legacy owners, or owner README files. Its only repository write is the compact Material roadmap when root state changes.

When a foundation owner is required by an active `material-component` operation, do not start this standalone root. The component root pushes that owner onto its own stack and uses the same owner-pass procedure.

Follow `src/shared/ui/material/docs/foundation-development.md`, `architecture.md`, `tokens.md`, and the `verification` skill.

## Execution model

1. **Foundation root** — coordination and roadmap state only.
2. **Fresh isolated writable owner context** — `material-component-implementation` converges one deepest foundation owner, including all known in-owner findings and one review correction pass.
3. **Fresh isolated read-only reviewer** — `material-component-review` independently reviews the owner and may be resumed once for correction re-review.

Create real Agent/subagent contexts. Changing roles in one transcript is not isolation. Implementation and review remain different contexts; no self-review is allowed.

One root owns the whole stack. Nested owners do not create another root or roadmap writer.

## Foundation gate

Confirm the requested domain is cross-family, family-agnostic, currently required, and not correctly owned by a component family or generic non-Material mechanism.

For tokens:

- reference/system and real `--mio-sys-*` extensions are foundation-owned;
- component tokens and private family routes remain family-owned;
- active canonical declarations belong under `src/shared/ui/material/foundation/`;
- move the smallest coherent group without duplicate active declarations;
- preserve graph direction, imports, references, fallbacks, and affected-family proof.

For shared behavior, lock one narrow complete contract covering semantics, lifecycle, accessibility, platform adaptation, all changed-owner consumers, cleanup, and relevant browser/reduced-motion proof.

Relocation, forwarding, barrels, migrated imports, or green path guards do not establish readiness.

## Preflight and refresh cadence

Perform full preflight at operation start/resume, after branch/base movement, or when ownership/closure is uncertain. After an accepted owner pass, refresh only changed contracts, consumers, dependencies, proof, and stack transition. Do not rebuild the entire foundation graph after ordinary in-owner corrections.

Reuse locked source decisions. Reopen sources only for a changed surface, missing evidence, contradiction, or invalidated decision.

## Strict stack and owner pass

Only the deepest unfinished owner may be implemented or reviewed. Consolidate all known findings for that owner before delegation.

```text
root locks one consolidated owner-pass contract
→ one fresh isolated writable implementation context
→ focused affected-family and consumer proof
→ one fresh isolated read-only correction-final review
→ if blocked, same implementation context performs one consolidated correction pass
→ same reviewer re-reviews once
→ accept and pop, or reopen architecture/context strategy
```

A stack entry may be removed only after `correction-final: complete`. A parent cannot advance while a deeper owner remains unfinished.

Create a new writable context only when architecture changed, a new prerequisite became deepest, the original context is unavailable/exhausted, or second review still exposes design/ownership failure.

If another canonical owner is discovered, return it to root and push it onto the same stack. Do not implement several canonical owners in one writable context.

## Verification cadence

Use verify-managed focused checks inside the owner pass. Do not run full `pnpm verify` after each owner or review correction. Follow `pnpm verify:status`/`pnpm verify:resume` and avoid duplicate active runs.

Run final read-only `pnpm verify` once after the stack is empty. During correction rerun only affected focused checks, then rerun the final gate after relevant fixes.

## Continuation checkpoint

Allowed reasons:

- `context-exhausted`;
- `runtime-exhausted`;
- `user-interrupted`;
- `isolated-writable-context-unavailable`;
- `isolated-review-context-unavailable`;
- `required-tool-unavailable`;
- `required-evidence-unavailable`.

A large owner, many consumers, a repairable red guard, or an internal owner is not a checkpoint reason.

## Completion

`aligned` requires an empty stack, one canonical foundation owner per required contract, accepted independent owner reviews, compatible affected families/consumers, valid legacy disposition, required proof, and passing final `pnpm verify`.

`blocked` requires an exact external condition that cannot be resolved inside the operation. `checkpointed` is nonterminal and requires one allowed physical reason. `partial` is invalid.

## Result

```text
MATERIAL FOUNDATION RESULT
Domain:
Invocation scope: standalone-foundation
Status: aligned | blocked | checkpointed
Execution model: owner-pass-and-independent-review
Canonical owner:
Continuation stack: none | <root > deepest unfinished owner>
Deepest unfinished owner: none | <exact owner>
Last implementation context: none | fresh-isolated-writable | resumed-isolated-writable
Last correction review context: none | fresh-isolated-read-only | resumed-isolated-read-only
Last correction review verdict: none | complete | blocked | not-run
Affected families and consumers:
Verification:
Remaining required gaps: none | <exact gaps>
External blocker: none | <exact external blocker>
Checkpoint reason: none | context-exhausted | runtime-exhausted | user-interrupted | isolated-writable-context-unavailable | isolated-review-context-unavailable | required-tool-unavailable | required-evidence-unavailable
Next action: none | resume material-foundation <root domain> | <exact external unblock action>
```

## Forbidden

- production edits from root;
- implementation and review by the same context;
- one new implementation context per small finding in the same owner;
- repeated full preflight after ordinary in-owner corrections;
- full `pnpm verify` after each owner/review pass;
- readiness without independent review;
- another component family's ownership in foundation;
- several canonical owners in one writable pass;
- relocation-only readiness;
- checkpointing without an allowed physical reason;
- asking operator to invoke an internal owner;
- progress ledgers, histories, registries, or scorecards;
- Git, PR, or merge operations.
