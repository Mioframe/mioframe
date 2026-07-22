---
name: material-component-implementation
description: 'Internal Material procedure used only by material-component after contract review and required prerequisites. Executes one approved canonical owner correction without bypassing recursive dependency closure.'
---

# Material component implementation

Run inside the `material-component` orchestrator context after target/audit evidence, recursive dependency closure, required prerequisites, and contract review are ready.

`not-required-for-bounded-unit` is allowed only for an explicit operator-requested focused correction that neither creates/preserves/adopts/removes canonical ownership nor touches an unresolved route. A family-only invocation or already canonicalized surface requires closed recursive dependency closure before lower-priority implementation.

## Responsibility

Execute exactly one approved correction for one canonical owner:

```text
prepare locked proof
→ confirm expected failure when applicable
→ smallest approved owner correction
→ focused verification
→ boundary, browser, direct-consumer, and visual validation
→ structured result to the orchestrator
```

A writable prerequisite context owns one canonical owner plus only the minimum forwarding, cleanup, and consumer edits required to adopt that owner. If another canonical owner is required, return it to the orchestrator as a nested prerequisite instead of implementing both in one context.

Do not select another gap or redesign the contract. New contradictory evidence returns to the orchestrator and reopens only the owning lane.

## Dependency and readiness gate

Before editing, confirm actual implementation, imports, style/token declarations and references, public exports, all direct consumers of changed public contracts or extensions, guards, and prerequisite owners still match the contract.

Return blocked when a required prerequisite is incomplete, only relocated, or unreviewed; a canonical route imports a temporary legacy owner; canonical tokens remain actively declared by a legacy owner; a Material guard fails; canonical consumption still uses a legacy path; replacement leaves parallel owners; a fallback masks a missing contract; a cycle/known defect exists; direct consumers are semantically incompatible; or premature canonicalization is not being closed or safely rolled back.

A dependency implemented by foundation or another family remains part of the caller's orchestration. Do not report it as outside scope or defer it to the operator.

Moving legacy files, adding forwarding exports/barrels, migrating imports, and passing boundary guards are migration mechanics, not canonical readiness. Revalidate and correct the moved artifact against its own Material contract before returning it as a completed prerequisite.

## Ownership and proof

- Keep public Vue artifacts thin.
- Keep component tokens family-local; reference/system/shared behavior belongs to canonical foundation owners.
- Depend on another family through its independently reviewed ready public contract.
- Keep state selection, layout, motion, private routes, and rendered properties out of token files.
- Do not add wrappers or DOM nodes merely for separation.

Semantics proof covers API/native/accessibility/state and all direct consumer behavior affected by the changed contract. Token proof covers canonical declaration ownership, namespaces, graph direction, cycles, dead tokens, fallback, grammar, and computed routing. Web proof covers DOM/style/layout/RTL/adaptation, stable motion endpoints, interruption/reversal/cancellation/cleanup/reduced motion, and public-input browser behavior. Declaration presence, path changes, or screenshots alone are insufficient.

Visible changes require prepared operator comparison. Consumer migration or legacy-owner removal is forbidden while recursive closure is blocked.

## Documentation and continuation

Update an owner README only for durable contract changes. Never write current stage, correction status, backlog, review history, shell output, or future passes there.

Return control to the orchestrator for adoption, review, refreshed preflight, and next-unit selection. Completing one owner correction does not complete a `full-family` invocation.

## Result

```text
MATERIAL STAGE RESULT
Family:
Invocation scope:
Stage: implementation
Correction unit:
Implementation owner:
Canonicalization trigger:
Status: complete | blocked
Actual dependency closure:
Prerequisite result:
Canonical contract result:
Token ownership result:
Semantics/lifecycle result:
Changed owners:
Boundary guard:
Proof result:
Browser evidence:
Direct consumer result:
Legacy owner result:
Visual/operator result:
Continuation required: yes | no
Remaining family concerns:
Blocker: none | <exact blocker>
```

## Forbidden

- direct invocation or edits before approval/prerequisites;
- implementing several canonical owners in one writable context;
- lower-priority work around open recursive dependency closure;
- changing locked decisions or repeating audits without contradiction;
- relocation-only completion or copying known legacy defects;
- canonical routes or tokens with required legacy owners;
- migration/removal with open closure;
- moving another component family into foundation;
- declaration-only motion proof, `transition: all`, stale resources, or broad permanent `will-change`;
- tests of framework/browser/third-party internals;
- persisted execution state, review history, backlog, or shell output in owner docs;
- roadmap advancement, independent review, Git operations, or speculative infrastructure.
