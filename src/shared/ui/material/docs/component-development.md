# Material component development

This document defines the durable convergence model for one official Material component family. The executable procedure is owned by `.agents/skills/material-component/SKILL.md`.

## Invocation

- `material-component <family>` means one logical full-family convergence operation.
- Required Material dependencies are recursively canonicalized inside the same root operation.
- The operator always resumes the same root command and never invokes an internal prerequisite separately.
- A physical session may checkpoint only for a real execution boundary.

## Responsibility separation

Every correction uses three different contexts:

1. the root orchestrator reconstructs state, orders the stack, delegates work, validates results, and updates the compact roadmap;
2. a fresh isolated writable owner context implements exactly one deepest-owner correction;
3. a different fresh isolated read-only reviewer accepts or rejects readiness.

The root orchestrator does not edit production code, tests, stories, tokens, exports, consumers, legacy owners, or owner README files. The implementation context cannot review itself or declare readiness. The reviewer cannot edit.

If a required isolated context is unavailable, the operation checkpoints with an exact physical reason. It must not fall back to implementation or review in the root context.

## Sequence

```text
current-state preflight and checkpoint validation
→ construct root-to-deepest unfinished stack
→ select only the deepest owner
→ lock one bounded correction contract
→ fresh writable owner implementation
→ focused proof
→ fresh read-only correction-final review
→ pop accepted owner or retry once in a new writable context
→ refresh stack and continue
→ fresh read-only final family review
→ pnpm verify
```

## Current-state preflight

Reconstruct from code:

- candidate and legacy owners and actual implementations;
- public exports and migrated consumers;
- imports, injected dependencies, styles, token declarations and references;
- recursive dependency ownership and readiness;
- all direct consumers of changed public contracts or extensions;
- boundary/token/documentation guards and relevant proof.

Owner README files contain durable contracts only. The roadmap stack is a resumption hint, not authority. Validate it against current code and discard stale entries.

## Strict continuation stack

The stack is ordered root-to-deepest unfinished owner. Only the deepest owner may be contracted, implemented, or reviewed.

A parent owner must not be changed, migrated, exported, removed, or reported ready while a child entry remains unfinished.

Remove an entry only when:

- one fresh writable context returned an implementation result;
- focused proof passed;
- a different fresh read-only reviewer returned `correction-final: complete`;
- direct-consumer compatibility and legacy disposition were accepted.

After removal, refresh the graph and continue from the new deepest owner.

## Recursive dependency closure

Every used Material dependency resolves to a ready canonical foundation, official family public contract, generic non-Material foundation, or explicit Mioframe extension owner.

If a ready owner does not exist:

- family-agnostic contract → exact `material-foundation` owner correction;
- official component family → nested `material-component` operation;
- nested prerequisites execute depth-first and return automatically.

Readiness requires canonical ownership, complete child dependencies, correct tokens, valid API/semantics/lifecycle/accessibility/platform behavior, all direct consumers, compatibility cleanup, focused proof, and independent review.

Relocation, forwarding, barrels, migrated imports, and green path guards are not readiness.

## Review

The correction reviewer receives structured contract, implementation result, selected evidence, proof, and consumer inventory. It independently inspects current code and does not receive the implementer's reasoning transcript.

The reviewer verdict is the only authority that permits a stack pop. Missing, same-context, or `not-run` review leaves the owner unfinished.

A final family review runs in another fresh read-only context only after the stack is empty and every owner review is accepted.

## Continuation checkpoint

Allowed reasons:

- `context-exhausted`;
- `runtime-exhausted`;
- `user-interrupted`;
- `isolated-writable-context-unavailable`;
- `isolated-review-context-unavailable`;
- `required-tool-unavailable`;
- `required-evidence-unavailable`.

A large owner, many consumers, an internal prerequisite, or a repairable red check is not a checkpoint reason.

Record only active root family, alignment status, continuation stack, checkpoint reason, exact external blocker, and one next action that resumes the root command.

## Completion

`aligned` requires an empty stack, accepted owner reviews, closed recursive dependencies, valid contracts and consumers, adoption/cleanup, required proof/operator comparison, fresh final family review, and passing `pnpm verify`.

`blocked` requires an exact external condition that cannot be resolved inside the recursive operation.

`checkpointed` is nonterminal and requires one exact allowed physical reason. `partial` is not a valid Material full-family result.
