---
name: material-component-implementation
description: 'Internal Material procedure used only by material-component after contract review and required prerequisites. Executes one approved correction without bypassing dependency closure.'
---

# Material component implementation

Run inside the `material-component` orchestrator context after target/audit evidence, dependency closure, required prerequisites, and contract review are ready.

`not-required-for-bounded-unit` is allowed only for an explicit operator-requested focused correction that neither creates/preserves/adopts/removes canonical ownership nor touches an unresolved route. A family-only invocation or already canonicalized surface requires closed dependency closure before lower-priority implementation.

## Responsibility

Execute exactly one approved correction:

```text
prepare locked proof
→ confirm expected failure when applicable
→ smallest approved owner correction
→ focused verification
→ boundary, browser, consumer, and visual validation
→ structured result to the orchestrator
```

Do not select another gap or redesign the contract. New contradictory evidence returns to the orchestrator and reopens only the owning lane.

## Dependency gate

Before editing, confirm actual imports, style/token dependencies, public exports, consumer state, guards, and prerequisite owners still match the contract.

Return blocked when a required prerequisite is incomplete, a canonical route imports a temporary legacy owner, a Material guard fails, canonical consumption still uses a legacy path, replacement leaves parallel owners, a fallback masks a missing contract, a cycle/defect exists, or premature canonicalization is not being closed or safely rolled back.

A dependency implemented by foundation or another family remains part of the caller's orchestration. Do not report it as outside scope or defer it to the operator.

## Ownership and proof

- Keep public Vue artifacts thin.
- Keep component tokens family-local; reference/system/shared behavior belongs to canonical foundation owners.
- Depend on another family through its ready public contract.
- Keep state selection, layout, motion, private routes, and rendered properties out of token files.
- Do not add wrappers or DOM nodes merely for separation.

Semantics proof covers API/native/accessibility/state/consumer behavior. Token proof covers namespaces, ownership, graph direction, cycles, dead tokens, fallback, grammar, and computed routing. Web proof covers DOM/style/layout/RTL/adaptation, stable motion endpoints, interruption/reversal/cancellation/cleanup/reduced motion, and public-input browser behavior. Declaration presence or screenshots alone are insufficient.

Visible changes require prepared operator comparison. Consumer migration or legacy-owner removal is forbidden while closure is blocked.

## Documentation and continuation

Update an owner README only for durable contract changes. Never write current stage, correction status, backlog, review history, shell output, or future passes there.

Return control to the orchestrator for adoption, review, refreshed preflight, and next-unit selection. Completing one unit does not complete a `full-family` invocation.

## Result

```text
MATERIAL STAGE RESULT
Family:
Invocation scope:
Stage: implementation
Correction unit:
Canonicalization trigger:
Status: complete | blocked
Actual dependency closure:
Prerequisite result:
Changed owners:
Boundary guard:
Proof result:
Browser evidence:
Consumer result:
Visual/operator result:
Continuation required: yes | no
Remaining family concerns:
Blocker: none | <exact blocker>
```

## Forbidden

- direct invocation or edits before approval/prerequisites;
- lower-priority work around open dependency closure;
- changing locked decisions or repeating audits without contradiction;
- canonical routes with required legacy dependencies;
- migration/removal with open closure;
- moving another component family into foundation;
- declaration-only motion proof, `transition: all`, stale resources, or broad permanent `will-change`;
- tests of framework/browser/third-party internals;
- persisted execution state, review history, backlog, or shell output in owner docs;
- roadmap advancement, independent review, Git operations, or speculative infrastructure.