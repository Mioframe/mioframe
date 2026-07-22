---
name: material-foundation
description: 'Use for standalone convergence of one exact cross-family Material foundation domain. Coordinates isolated owner implementation and independent review without writing production code.'
---

# Material foundation orchestrator

This is the coordination-only root for one standalone, exact cross-family Material foundation domain. The root owns current-state reconstruction, bounded contract selection, owner-stack ordering, delegation, result validation, continuation, final verification, and compact roadmap state.

The root must not edit production code, tests, stories, tokens, exports, consumers, legacy owners, or owner README files. Its only repository write is the compact Material roadmap when root state changes.

When a foundation owner is required by an active `material-component` operation, do not start this standalone root. The component root pushes that foundation owner onto its own stack and delegates the same internal owner implementation procedure.

Follow `src/shared/ui/material/docs/foundation-development.md`, `architecture.md`, and `tokens.md`.

## Invocation

`material-foundation <domain>` means one logical convergence operation for the smallest coherent cross-family contract required now. It is not a broad foundation audit or speculative full migration.

The operator resumes the same root command after a physical checkpoint. Internal nested owners remain orchestration work and are never returned as separate operator commands.

## Mandatory execution model

1. **Foundation root orchestrator** — coordination and compact roadmap state only.
2. **Fresh isolated writable owner context** — `material-component-implementation` runs with `Owner kind: foundation` for exactly one deepest owner correction and cannot declare readiness.
3. **Fresh isolated read-only review context** — `material-component-review` independently accepts or rejects that owner.

Create implementation and review contexts through the environment's real Agent/subagent delegation primitive. Loading another skill or changing the stated role inside the same transcript does not create isolation.

One root owns the whole standalone foundation stack and is the sole roadmap writer. The implementation and review contexts must be newly created and different. No same-context fallback is permitted.

If a required isolated writable or review context cannot be created, checkpoint with the exact physical reason.

## Foundation gate

Confirm the requested domain is inherently cross-family, family-agnostic, currently required, and not already correctly owned by a family or generic non-Material mechanism.

Another official component family is not foundation. If the required behavior belongs to a component family, return an exact architecture blocker or route the operator to the correct root family rather than absorbing component ownership.

For tokens:

- reference/system and real `--mio-sys-*` extensions are foundation-owned;
- component tokens and private family routes remain family-owned;
- active declarations used by canonical Material must live under `src/shared/ui/material/foundation/`;
- move one smallest coherent group without duplicate active declarations;
- preserve valid graph direction, imports, references, fallbacks, and affected-family proof.

For shared behavior, lock one narrow contract and require complete semantics, lifecycle, accessibility, platform adaptation, all direct consumers, compatibility cleanup, and relevant browser/reduced-motion proof.

Relocation, forwarding, barrels, migrated imports, or green path guards do not establish readiness.

## Strict stack and correction cycle

The continuation stack is root-to-deepest unfinished foundation owner. Only the deepest owner may be contracted, implemented, or reviewed.

For that owner:

```text
root locks bounded contract and selected evidence
→ fresh isolated writable material-component-implementation context
→ focused affected-family and direct-consumer proof
→ fresh isolated read-only material-component-review correction-final
→ accept and pop, or retry once in a new writable context
→ refresh stack and continue
```

A stack entry may be removed only after `correction-final: complete`. Implementation output is not readiness. A parent cannot advance while a deeper owner remains unfinished.

If another canonical owner is discovered, return it to the root to push onto the same stack. Do not implement several owners in one writable context.

## Continuation checkpoint

Allowed reasons:

- `context-exhausted`;
- `runtime-exhausted`;
- `user-interrupted`;
- `isolated-writable-context-unavailable`;
- `isolated-review-context-unavailable`;
- `required-tool-unavailable`;
- `required-evidence-unavailable`.

A large owner, many consumers, a repairable red guard, or an internal nested owner is not a checkpoint reason.

## Completion

`aligned` requires an empty stack, one active canonical foundation owner per required contract, accepted independent owner reviews, compatible affected families and direct consumers, valid legacy disposition, required proof, and passing final `pnpm verify`.

`blocked` requires an exact external source, product, platform, safety, evidence, or verification condition that cannot be resolved inside the operation.

`checkpointed` is nonterminal and requires one allowed physical reason. `partial` is not a valid foundation result.

## Result

```text
MATERIAL FOUNDATION RESULT
Domain:
Invocation scope: standalone-foundation
Status: aligned | blocked | checkpointed
Execution model: isolated-owner-and-review
Canonical owner:
Continuation stack: none | <root > deepest unfinished owner>
Deepest unfinished owner: none | <exact owner>
Last implementation context: none | fresh-isolated-writable
Last correction review context: none | fresh-isolated-read-only
Last correction review verdict: none | complete | blocked | not-run
Affected families and consumers:
Verification:
Remaining required gaps: none | <exact gaps>
External blocker: none | <exact external blocker>
Checkpoint reason: none | context-exhausted | runtime-exhausted | user-interrupted | isolated-writable-context-unavailable | isolated-review-context-unavailable | required-tool-unavailable | required-evidence-unavailable
Next action: none | resume material-foundation <root domain> | <exact external unblock action>
```

## Forbidden

- production edits from the foundation root context;
- implementation and review by the same context;
- simulating isolation by changing roles or skills inside one transcript;
- readiness without fresh read-only correction review;
- another component family's ownership in foundation;
- changing a parent while a deeper owner remains unfinished;
- several canonical owners in one writable correction;
- relocation-only readiness;
- checkpointing without one allowed physical reason;
- asking the operator to invoke an internal nested owner;
- a separate progress ledger, backlog, history, registry, or scorecard;
- Git, branch, commit, pull-request, or merge operations.
