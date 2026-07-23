# Material component development

This document defines the durable convergence model for one official Material component family. The executable procedure is owned by `.agents/skills/material-component/SKILL.md`.

## Invocation

- `material-component <family>` means one logical full-family convergence operation.
- Required Material dependencies are recursively canonicalized inside the same outer root operation.
- The operator always resumes the same root command and never invokes an internal prerequisite separately.
- A physical session may checkpoint only for a real execution boundary.

## Responsibility separation

Each deepest owner uses three responsibilities:

1. the sole outer root orchestrator reconstructs state, owns the recursive stack, locks architecture, delegates work, validates results, and updates the compact roadmap;
2. one fresh isolated writable owner context converges the complete deepest owner and may perform one correction pass after review;
3. a different fresh isolated read-only reviewer accepts or rejects readiness and may re-review that correction pass.

Nested official families are owners on the same root stack, not additional roots or roadmap writers.

The root does not edit production files. The implementation context cannot review itself or declare readiness. The reviewer cannot edit.

## Sequence

```text
full current-state preflight at start/resume
→ construct root-to-deepest unfinished stack
→ consolidate all known findings for the deepest owner
→ one fresh writable owner convergence pass
→ focused verify-managed proof
→ one fresh read-only correction-final review
→ if blocked, same writable context applies one consolidated correction pass
→ same reviewer re-reviews once
→ pop accepted owner or reopen architecture/context strategy
→ incremental graph refresh and continue
→ final pnpm verify when stack is empty
→ fresh final family review
```

## Preflight cadence

Perform full preflight at operation start/resume, after branch/base movement, or when ownership/closure is uncertain. Reconstruct actual owners, exports, implementations, imports, styles, token declarations/references, dependencies, consumers, legacy paths, guards, and proof.

After an accepted owner pass, refresh only:

- changed public contracts and exports;
- changed-owner consumers and compatibility paths;
- newly discovered dependencies;
- relevant proof and stack transition.

Do not repeat full family reconstruction after an ordinary in-owner correction. Escalate to full preflight only when a new prerequisite, architecture change, or unresolved ownership question appears.

Owner README files contain durable contracts only. Roadmap state is a resumption hint, not authority.

## Owner convergence pass

The unit of implementation is one canonical deepest owner, not one finding.

Before delegation, root consolidates all known in-owner defects across files, variants, states, tests, and consumers. One writable context owns that complete pass plus one reviewer correction pass.

Create a new writable context only when:

- architecture or owner contract changed;
- a new prerequisite became deepest;
- the original context is unavailable/exhausted;
- second review still exposes ownership/design failure.

The independent reviewer returns all actionable in-owner findings together. During correction re-review it reinspects prior blockers, new changes, and affected proof without repeating unchanged full owner research.

## Strict continuation stack

The stack is root-to-deepest unfinished owner. A parent cannot advance while a child remains unfinished.

Remove an entry only when:

- the isolated writable context returned a complete owner-pass result;
- focused proof passed;
- the independent reviewer returned `correction-final: complete`;
- changed-owner consumer compatibility and legacy disposition were accepted.

After removal, refresh incrementally and continue from the new deepest owner.

## Recursive dependency closure

Every used Material dependency resolves to a ready canonical foundation, official family public contract, generic non-Material foundation, or explicit Mioframe extension owner.

If no ready owner exists, push its exact owner onto the same stack. Child prerequisites execute depth-first. The outer root remains the sole coordinator and automatically returns to each parent after accepted child review.

Readiness requires canonical ownership, complete dependencies, correct tokens, API/semantics/lifecycle/accessibility/platform behavior, all changed-owner consumers, compatibility cleanup, focused proof, and independent review.

Relocation, forwarding, barrels, migrated imports, and green path guards are not readiness.

## Source evidence

Reuse durable source decisions and selected verified evidence. Reopen Material sources only when the supported surface changes, evidence is missing or contradictory, or a previous decision is invalidated.

## Verification cadence

Use verify-managed focused checks during owner implementation and correction. Do not run full `pnpm verify` after every owner or review pass.

When verification is active, use `pnpm verify:status` and follow `pnpm verify:resume`; do not start duplicate expensive runs. Preserve passed unchanged focused evidence and rerun only checks affected by correction.

Run final read-only `pnpm verify` once after the stack is empty and before final family review. After a relevant fix, rerun the failed focused proof and then the final gate.

## Verification attribution

A branch verification failure is internal until the same command reproduces on the root base commit and is independent of all owners changed by the operation.

Consumers in another official family remain in compatibility scope when they consume an owner created, moved, forwarded, or behaviorally changed by the operation. Their failure restores the nearest changed owner to the same root stack.

Prior logs, Git history, or an import-only diff do not prove external attribution.

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

## Completion

`aligned` requires an empty stack, accepted owner reviews, closed dependencies, valid contracts and consumers, adoption/cleanup, required proof/operator comparison, passing final `pnpm verify`, and fresh family review.

`blocked` requires fresh family review and an exact external condition. `checkpointed` is nonterminal and requires one allowed physical reason. `partial` is invalid for full-family work.
