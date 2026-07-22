---
name: material-foundation
description: 'Use for one real cross-family Material contract or an exact delegated prerequisite. Runs as a fresh isolated writable owner context and returns implementation evidence for independent review.'
---

# Material foundation owner implementation

Use standalone for one exact cross-family correction or when `material-component` delegates the current deepest prerequisite. Follow `src/shared/ui/material/docs/foundation-development.md`, `architecture.md`, and `tokens.md`.

This skill is an owner implementation context, not the root family orchestrator and not a reviewer. It must run in a fresh isolated writable context and must return to the calling root after one owner correction.

## Scope

Receive the exact root-locked family-agnostic contract, current owner, affected scenarios/families, direct consumers, platforms, non-goals, completion condition, and selected evidence.

A delegated prerequisite remains inside the root family operation. Its size or consumer count does not make it an operator task.

Another official component family is not foundation. A component dependency requires that family's independently reviewed public contract or an explicit product decision to remove the dependency.

## Entry gate

Confirm:

- execution context is `fresh-isolated-writable`;
- this foundation owner is the current deepest unfinished owner;
- no required child owner remains unresolved;
- the correction contract and selected evidence were locked by the root orchestrator;
- current declarations, imports, consumers, legacy paths, and guards still match the contract.

If the current code invalidates the locked contract, return the discrepancy to the root before editing. Do not redesign the contract locally.

If a fresh writable context cannot be created, return `checkpoint-required` with `isolated-writable-context-unavailable`. Never fall back to root-context implementation.

## Execution

```text
current-state validation
→ root-locked foundation contract
→ one complete canonical owner correction
→ minimum affected-family and direct-consumer compatibility edits
→ focused proof
→ structured implementation result to root
```

One run owns one canonical foundation owner. If another canonical owner is required, return it as a nested prerequisite. Do not implement multiple owners in one context.

For tokens:

- reference/system and real `--mio-sys-*` extensions are foundation-owned;
- component tokens/private routes remain family-owned;
- declarations used by canonical Material must have an active owner under `src/shared/ui/material/foundation/`;
- move one coherent required group without duplicate active declarations;
- retained legacy CSS may import the canonical owner but must not redeclare it;
- prove graph direction, cycles, import order, exact names, and affected-family computed behavior.

For state, ripple, motion, focus, symbols, typography, or other shared behavior:

- define one narrow public contract;
- revalidate semantics and lifecycle against current Material and platform requirements;
- validate every direct consumer of the changed contract;
- retain legacy entry points only as forwarding compatibility;
- remove parallel implementations and prove affected-family behavior.

Relocation is not canonicalization.

## Review boundary

This context may report `implemented`, but it cannot report the foundation owner as ready or complete. The root must create a fresh isolated read-only `material-component-review` context with `Owner kind: foundation`.

Only `correction-final: complete` authorizes the root to pop this foundation owner and return to the parent family.

## Result

```text
MATERIAL FOUNDATION IMPLEMENTATION RESULT
Domain:
Mode:
Objective:
Execution context: fresh-isolated-writable
Status: implemented | blocked | checkpoint-required
Deepest owner confirmed: yes | no
Required contract:
Previous owner:
Canonical owner:
Nested prerequisite discovered: none | <exact owner>
Canonical contract:
Token ownership:
Semantics/lifecycle:
Direct consumer compatibility:
Legacy owner result:
Selected proof results:
Affected families:
Calling-family consumption: implemented | blocked | checkpoint-required
Readiness claim: forbidden
Review required: yes
Remaining required gaps:
Blocker: none | <exact blocker>
Checkpoint reason: none | isolated-writable-context-unavailable | context-exhausted | runtime-exhausted | user-interrupted | required-tool-unavailable | required-evidence-unavailable
Next action: return-to-root
```

## Forbidden

- implementation in the root orchestrator or reviewer context;
- self-review or readiness claims;
- implementing a parent or sibling while a deeper owner is unfinished;
- broad domain audit beyond the required contract;
- several canonical owners in one context;
- local redesign of the root-locked contract;
- relocation-only completion or copied legacy defects;
- asking the operator to invoke a foundation or nested component prerequisite;
- roadmap updates, workflow-policy edits, Git, PR, or merge operations.
