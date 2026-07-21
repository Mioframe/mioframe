---
name: material-component-implementation
description: 'Internal Material procedure used only by material-component after contract review and required prerequisites. Executes exactly one approved correction without bypassing dependency closure for an existing or proposed canonical owner.'
---

# Material component implementation

Run inside the `material-component` orchestrator context. Planning, implementation, adoption, prerequisites, and continuation share family state.

Required entry state:

```text
Invocation scope: full-family | focused-correction | prerequisite-contract
Canonical target status: locked
Canonicalization trigger: yes | no
Selected concern results: complete
Dependency closure: closed | not-required-for-bounded-unit
Foundation prerequisite: none | complete
Official-family prerequisite: none | complete
Contract review status: passed
Current correction unit: <exact unit>
Locked proof lanes: <exact lanes>
```

`not-required-for-bounded-unit` is allowed only for an explicit operator-requested focused correction when all of these are true:

- the correction does not create, preserve, export, adopt, migrate, remove, forward, or claim readiness for a canonical owner;
- no consumer currently uses a prematurely canonicalized owner with open dependencies;
- the correction does not touch or depend on the unresolved route.

A family-only invocation, existing Material root export, migrated consumer, removed/forwarded legacy owner, or canonical/adoption claim requires closed dependency closure before lower-priority implementation.

## Responsibility

Execute exactly one approved correction:

```text
prepare locked proof
→ confirm expected failure when applicable
→ smallest approved owner correction
→ focused verification
→ boundary, browser, consumer, and visual validation
→ concise current-state update
```

Do not select another gap or broaden the contract. New contradictory evidence returns to the orchestrator and reopens only the owning lane.

## Dependency execution

Before editing, independently confirm actual imports, style/token dependencies, public exports, consumer state, and prerequisite owners still match the approved contract.

Return blocked when:

- a required foundation or official-family prerequisite is incomplete;
- the supported/canonical route imports a temporary legacy Material owner;
- the Material boundary guard fails;
- a ready canonical prerequisite exists but legacy consumption remains;
- replacement leaves parallel active owners;
- a hidden fallback masks a missing contract;
- a dependency cycle or known relevant dependency defect exists;
- a candidate owner is already exported/adopted with open closure and the correction does not close or safely roll back it.

A dependency implemented by foundation or another family remains part of the caller's orchestration. Do not report it as outside scope or defer it to a future operator run.

A retained legacy compatibility entry point may only forward to the canonical owner.

## Ownership

- Preserve confirmed owners only when current preflight still validates them.
- Correct incrementally when ownership is sound; replace the smallest wrong owner.
- Keep public Vue artifacts thin.
- Keep component tokens family-local and reference/system/shared behavior in canonical foundation owners.
- Depend on another component family through its ready public contract.
- Keep state selection, layout, transitions, animations, private routes, and rendered properties out of token files.
- Do not add wrappers or DOM nodes merely for separation.
- Do not introduce or retain required temporary legacy Material dependencies in a canonical route.

## Locked concern execution

Do not repeat target or specialist audits without concrete contradictory evidence.

- semantics lane: implement and prove API, native, accessibility, state, extension, or consumer contract;
- token lane: implement the bounded graph change and run token architecture proof;
- Web lane: implement DOM/style/layout/motion/lifecycle change and browser proof.

Token work requires valid namespaces, ownership, direction, no cycles/dead tokens/hidden fallback, correct value grammar, and computed proof when tokens drive transitions.

Web work requires correct DOM/style ownership, layout/RTL/adaptation, stable motion endpoints, property-compatible easing, interruption/reversal/cancellation/cleanup/reduced-motion behavior, and public-input browser proof. Declaration existence or screenshots alone are insufficient.

## Visible and consumer impact

Prepare operator comparison when visible output changes. Validate materially affected consumer categories. Do not patch consumers around a wrong library contract.

Consumer migration or legacy-owner removal is forbidden while dependency closure is blocked.

## Documentation and continuation

Update current preflight, dependency closure, prerequisite state, classifications, proof, and remaining gaps only. Remove stale scope, review history, shell transcripts, route inventories, and future-pass narratives.

Return control to the orchestrator for adoption, correction review, preflight refresh, and next-unit selection. Completing one unit does not complete a `full-family` invocation.

## Exit gate

Pass only when:

- the unit meets its completion condition;
- actual dependencies match the approved ready owners;
- canonicalization rules are satisfied;
- token and Material boundary guards pass;
- locked proof lanes and affected consumers pass;
- visible evidence is honest;
- remaining internal work is returned with `Continuation required: yes`.

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
Boundary guard: passed | failed | not-applicable
Proof result:
Browser evidence: sufficient | insufficient | not-applicable
Consumer result:
Visual/operator result:
Continuation required: yes | no
Remaining family concerns: none | <exact concerns>
Blocker: none | <exact blocker>
```

## Forbidden

- direct invocation or edits before contract approval/prerequisites;
- `not-required-for-bounded-unit` for a full-family or already canonicalized surface;
- changing locked decisions or implementing another gap;
- repeating audits without contradiction;
- state/layout/motion in token files;
- canonical routes with required legacy Material dependencies;
- migration or legacy removal with open closure;
- moving another component family into foundation;
- declaration-only motion proof, `transition: all`, stale resources, or broad permanent `will-change`;
- tests of framework/browser/third-party internals;
- roadmap advancement, independent review, Git operations, or speculative infrastructure.
