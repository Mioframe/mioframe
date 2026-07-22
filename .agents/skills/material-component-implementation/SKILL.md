---
name: material-component-implementation
description: 'Internal Material owner convergence procedure. Runs in one isolated writable context for one deepest owner, fixes all consolidated in-owner findings, and may perform one review correction pass without declaring readiness.'
---

# Material owner implementation

Run only when delegated by `material-component` or `material-foundation` after the root locks one consolidated owner-pass contract.

The initial pass must begin in a fresh isolated writable context. The same context may be resumed once for consolidated correction findings from the independent reviewer. It must never perform review or declare readiness.

## Responsibility

Converge exactly one deepest canonical owner, not one tiny finding:

```text
receive consolidated owner-pass contract
→ validate current owner, ready prerequisites, and selected evidence
→ reproduce relevant failures when applicable
→ implement all known in-owner defects and required consumer compatibility
→ run focused verify-managed proof
→ return owner-pass result
→ when review blocks, apply one consolidated correction pass in this same context
→ rerun only affected focused proof
```

The context owns one canonical component or foundation owner plus the minimum forwarding, cleanup, tests, documentation, and direct/changed-owner consumer edits required for that owner. Findings across several files, states, variants, or consumers remain one owner pass.

If another canonical owner is required, do not implement it here. Return the exact nested prerequisite so the root can push it onto the stack.

Update the owner's durable README only when its public, semantic, token, style, motion, compatibility, unsupported-surface, source-decision, or proof contract changed. Never update `roadmap.md`.

## Entry gate

Before initial editing, confirm:

- execution context is `fresh-isolated-writable`;
- delegated owner is the current deepest unfinished owner;
- the root supplied all known findings as one locked owner-pass contract;
- required child owners are independently ready;
- current implementation, imports, token declarations/references, exports, consumers, guards, and legacy paths still match the contract.

For a review correction pass, confirm:

- this is the same isolated writable owner context;
- review findings are consolidated and remain inside the same owner contract;
- no new prerequisite or architecture change invalidated the pass.

Return to root instead of patching when the contract is invalidated, a new prerequisite appears, ownership changes, or the second review would require another design direction.

## Efficiency rules

- Reuse the locked source decisions and selected official evidence. Reopen sources only for a changed surface, missing evidence, contradiction, or invalidated decision.
- Inspect the complete owner and affected consumers once, then work from the consolidated inventory.
- Do not create separate implementation subagents for individual states, test failures, token routes, or consumers of the same owner.
- Use verify-managed focused checks from the `verification` skill. Do not run full `pnpm verify` inside an owner pass.
- After review correction, rerun only checks affected by the correction; preserve valid earlier focused evidence.
- When verification is already active, inspect `pnpm verify:status` and follow `pnpm verify:resume`; do not start a duplicate run.

## Proof and ownership

- Keep public Vue artifacts thin and avoid unnecessary DOM nodes.
- Keep component tokens family-local; reference/system/shared behavior belongs to foundation.
- Use another family only through its independently reviewed public contract.
- Test observable owner behavior and changed-owner consumer compatibility, not framework/browser internals.
- Browser proof must cover lifecycle when semantics depend on motion, interruption, reversal, cancellation, cleanup, or reduced motion.
- Relocation, forwarding, migrated imports, declarations, and green path guards are migration evidence, not readiness.

## Review boundary

This context may report `implemented`, but never `ready`, `complete`, `canonicalized`, `aligned`, or `accepted`.

After the initial implementation result, root delegates an isolated read-only `material-component-review`. If it blocks with in-owner findings, root resumes this same writable context for one consolidated correction pass. The same read-only reviewer may then re-review.

Create a new writable context only when the original is unavailable/exhausted, architecture changed, a new prerequisite became deepest, or the second review still exposes ownership/design failure.

## Result

```text
MATERIAL OWNER IMPLEMENTATION RESULT
Owner kind: component | foundation
Family/domain:
Invocation scope:
Owner pass: initial | review-correction
Execution context: fresh-isolated-writable | resumed-isolated-writable
Status: implemented | blocked | checkpoint-required
Deepest owner confirmed: yes | no
Locked contract preserved: yes | no
Nested prerequisite discovered: none | <exact owner>
Consolidated findings addressed:
Canonical contract result:
Token ownership result:
Semantics/lifecycle result:
Changed owners:
Focused proof result:
Browser evidence:
Changed-owner consumer result:
Legacy owner result:
Owner README result:
Readiness claim: forbidden
Review required: yes
Remaining owner gaps: none | <exact gaps>
Blocker: none | <exact blocker>
Checkpoint reason: none | isolated-writable-context-unavailable | context-exhausted | runtime-exhausted | user-interrupted | required-tool-unavailable | required-evidence-unavailable
```

## Forbidden

- running in root or reviewer context;
- implementing a parent while a deeper owner is unfinished;
- implementing multiple canonical owners;
- splitting one owner's known findings across new implementation contexts without a real boundary;
- self-review or readiness claims;
- changing architecture decisions without returning to root;
- full `pnpm verify` inside the owner pass;
- reopening already-resolved source research without a contract reason;
- relocation-only completion or copying known legacy defects;
- roadmap updates, Git operations, or workflow-policy edits.
