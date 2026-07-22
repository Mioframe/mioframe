---
name: material-component-implementation
description: 'Internal Material owner implementation procedure. Runs only in a fresh isolated writable context for one approved deepest-owner correction and cannot declare readiness.'
---

# Material owner implementation

Run only when delegated by `material-component` or `material-foundation` after a locked correction contract is ready.

This skill must execute in a fresh isolated writable context. It must not run in the root orchestrator context or in any context that will perform correction review.

## Responsibility

Implement exactly one approved correction for the current deepest unfinished canonical owner:

```text
receive locked owner contract
→ validate current code and prerequisites
→ prepare focused proof
→ confirm expected failure when applicable
→ implement the smallest complete owner correction
→ run focused verification
→ return an implementation result to the root orchestrator
```

The implementation context owns one canonical owner plus only the minimum forwarding, cleanup, and direct-consumer edits required for that owner. If another canonical owner is required, do not implement it in this context. Return the exact nested prerequisite so the root can push it onto the stack.

The implementation context may update the owner's durable README only when the public, semantic, token, style, motion, compatibility, unsupported-surface, or proof contract changed. It must not update `roadmap.md`.

## Entry gate

Before editing, confirm:

- this context is `fresh-isolated-writable`;
- the delegated owner is the current deepest unfinished owner;
- the correction contract and selected evidence are locked;
- required child owners are already independently ready;
- actual implementation, imports, token declarations/references, exports, direct consumers, guards, and legacy paths still match the contract.

Return `checkpoint-required` with `isolated-writable-context-unavailable` if a fresh writable context was not created. Never fall back to implementation in the root context.

Return `blocked` when the contract is invalidated, a nested prerequisite is incomplete, canonical tokens remain legacy-owned, a required dependency is defective or unreviewed, direct consumers are incompatible, a cycle exists, or safe implementation requires another owner.

## Proof and ownership

- Keep public Vue artifacts thin and avoid unnecessary DOM nodes.
- Keep component tokens family-local; reference/system/shared behavior belongs to foundation.
- Use another family only through its independently reviewed public contract.
- Test observable owner behavior and direct-consumer compatibility, not framework/browser internals.
- Browser proof must cover lifecycle behavior when semantics depend on motion, interruption, reversal, cancellation, cleanup, or reduced motion.
- Relocation, forwarding, migrated imports, declarations, and green path guards are migration evidence, not readiness.

## Review boundary

This context may report that the correction is implemented, but it must not report the owner as ready, complete, canonicalized, aligned, or accepted.

After implementation, return control to the root. The root must create a new isolated read-only `material-component-review` context. Only that reviewer may accept readiness and allow the stack entry to be popped.

If review rejects the correction, a new fresh writable context receives the consolidated findings. Do not continue patching in the original implementation context.

## Result

```text
MATERIAL OWNER IMPLEMENTATION RESULT
Owner kind: component | foundation
Family/domain:
Invocation scope:
Correction unit:
Execution context: fresh-isolated-writable
Status: implemented | blocked | checkpoint-required
Deepest owner confirmed: yes | no
Locked contract preserved: yes | no
Nested prerequisite discovered: none | <exact owner>
Canonical contract result:
Token ownership result:
Semantics/lifecycle result:
Changed owners:
Focused proof result:
Browser evidence:
Direct consumer result:
Legacy owner result:
Owner README result:
Readiness claim: forbidden
Review required: yes
Remaining owner gaps: none | <exact gaps>
Blocker: none | <exact blocker>
Checkpoint reason: none | isolated-writable-context-unavailable | context-exhausted | runtime-exhausted | user-interrupted | required-tool-unavailable | required-evidence-unavailable
```

## Forbidden

- running in the root orchestrator or reviewer context;
- implementing a parent while a deeper owner is unfinished;
- implementing multiple canonical owners;
- self-review or readiness claims;
- production edits before locked contract approval;
- changing architecture decisions without returning to the root;
- relocation-only completion or copying known legacy defects;
- migration/removal with open child closure;
- roadmap updates, independent review, Git operations, or workflow-policy edits.
