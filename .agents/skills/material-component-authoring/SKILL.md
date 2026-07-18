---
name: material-component-authoring
description: 'Use for creating, migrating, aligning, or materially changing an official public Material component family. Owns source lookup, implementation documentation, production work, consumer migration, proportional proof, and local verification.'
paths:
  - 'src/shared/ui/material/components/**'
---

# Material component authoring

Use this workflow after the official family is resolved.

## Workspace boundary

Use only current workspace files, official Material sources, the current user task, and local project verification commands.

Do not run, inspect, or cite `git`, `gh`, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history. Historical provenance is not evidence for the current implementation contract.

The implementation workflow never edits `AUDIT.md`.

## Inputs

Read:

- the current user message and any explicit operator feedback it contains;
- current official Material sources through `material3-guidelines`;
- `docs/material-3/source-of-truth.md`;
- `docs/material-3/component-architecture.md`;
- `docs/material-3/component-testing.md`;
- the family `README.md` and `AUDIT.md` when present;
- current implementation, exports, consumers, tests, and stories;
- applicable foundation instructions.

Treat the previous audit as current-workspace findings to investigate. Do not use source-control history to validate or invalidate it.

Explicit user feedback about visible behavior is authoritative operator input for the current task. The user does not need to create or edit a report file.

## Operator feedback rule

The family README owns persistent visual status under:

```text
## Operator feedback and visual status
Status: not reviewed | required | rejected | awaiting re-review | accepted
Latest operator feedback: none | <concise factual summary>
Implementation response: none | <what changed and what must be reviewed>
```

Apply these rules:

- When the current user message reports a visual problem or rejects behavior, set `Status: rejected` and copy a concise factual summary into README before implementation.
- Preserve an existing `rejected` or `awaiting re-review` status when the current message does not explicitly supersede it.
- After changing production behavior for a rejected issue, the implementing agent may set `Status: awaiting re-review`; preserve the original feedback and describe the implementation response.
- Never set `accepted` unless the current user message explicitly accepts the reviewed behavior.
- Documentation, comments, tests, or a renamed contract cannot move `rejected` to `awaiting re-review`; a production behavior change is required.
- Do not invent operator feedback or infer acceptance from silence, passing tests, screenshots, or an audit.

## 1. Resolve family, source status, scope, and capability inventory

1. Resolve the official family and documentation path.
2. Use the official documentation slug as the canonical directory name.
3. Select `new-component`, `end-to-end-migration`, or `alignment-only`.
4. Inspect the available official family pages and structured sources.
5. Record canonical source status:
   - `current-complete`;
   - `snapshot-complete-stale`;
   - `partial`;
   - `conflicting`;
   - `unavailable`.
6. Reconstruct the contract-level capability inventory supported by that evidence.
7. Define the minimum coherent implementation surface required by current consumers.
8. Inspect every current audit finding.
9. Inspect and preserve current README operator feedback.

Use the official mapping, for example:

```text
m3.material.io/components/buttons
→ src/shared/ui/material/components/buttons
```

Implementation scope may be incremental. Inventory classification may not hide unused official capability.

Classify each item as exactly one of:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or an invalid combination;
- unresolved because canonical evidence is incomplete or conflicting;
- outside the resolved family boundary.

Do not treat optional wording such as a recommendation or “can” guidance as a missing capability unless the official contract makes it required for the implemented surface.

Use inventory status:

```text
complete
snapshot-complete (<snapshot>; currentness unverified)
incomplete (<exact gap>)
blocked (<exact reason>)
```

Use `complete` only when every current family page and required structured source is available and inspected without a partial, truncated, suspicious, or unresolved result. A stale snapshot may be snapshot-complete, but not current-complete. Spot checking values cannot certify the family inventory.

## 2. Update family documentation first

Create or update:

```text
src/shared/ui/material/components/<official-docs-slug>/README.md
```

Use these sections:

- Official documentation mapping;
- Implemented;
- Partial / defective / unverified;
- Not implemented;
- Officially unsupported and invalid combinations;
- Known issues and required follow-up;
- Operator feedback and visual status;
- Public API and semantics;
- Tokens, states, and property ownership;
- Foundations and styles used;
- Extensions and deviations;
- Consumers and migration state;
- Verification;
- Review status.

Set `Review status: review required after changes` before production edits.

Record:

```text
Canonical source status: current-complete | snapshot-complete-stale | partial | conflicting | unavailable
Official capability inventory: complete | snapshot-complete (...) | incomplete (...) | blocked (...)
Official coverage: full | partial | unresolved
```

A capability belongs under `Implemented` only when its final owned output works.

`Not implemented` contains only real published capability that exists but is absent. Officially unsupported or invalid combinations are constraints, not missing capability. Optional non-adoption belongs under known issues, extensions, or deviations unless it is normative for the implemented surface.

The README must never imply full implementation while coverage is partial or unresolved.

## 3. Resolve foundations and styles

Map shared dependencies to the official navigation:

```text
material/foundations/<official-slug>
material/styles/<official-slug>
```

Keep family-specific behavior local unless a real cross-family contract exists. Use `material-foundation` only when a shared contract changes.

A route exists only when changing its source input can affect the final output through a real dependency. Colocation, aliases, equality assertions, comments, and tests do not create a route.

When numeric spring parameters cannot be consumed directly, preserve them as canonical source evidence and use an honestly documented Web runtime adaptation. Do not imply that the adaptation consumes the original spring model.

Before changing root/system tokens, universal selectors, pseudo-elements, or shared formulas:

1. identify all current affected families from current workspace code;
2. prefer the narrowest valid owner;
3. prove the shared route with representative tests that actually exercise it, not merely unchanged green tests;
4. keep the issue open when representative impact is not proved.

## 4. Implement

- Keep props, emits, slots, native semantics, and DOM ownership explicit.
- Keep controlled semantic state consumer-owned.
- Define component-owned lifecycle behavior only when applicable.
- Use exact official token meanings and the shortest route to the final property owner.
- Create additional files only when they reduce current complexity.
- Add no speculative API, runtime registry, generic resolver, CSS DSL, or universal base.

For every materially different normalization or fallback input class, align:

- actual returned, emitted, or rendered output;
- native semantics and accessibility output;
- warning or error text;
- README and public API documentation;
- test assertions.

Do not use one generic warning or assertion when branches produce different outcomes. A clamped result, ignored input, rejected combination, and fallback mode are distinct contracts.

## 5. Motion and lifecycle proof

Verify a shared motion foundation deeply once.

At component level, use real input only to prove:

- the intended rendered property consumes the selected motion contract;
- a meaningful intermediate state exists when source inspection alone cannot prove the route;
- the correct endpoint is reached;
- interruption or cancellation does not leave stale state;
- reduced-motion behavior is correct when the component overrides or owns it.

A test proves a named interruption, cancellation, replacement, or recovery risk only when its setup actually enters that state. Trigger the competing event before the first lifecycle or transition settles, prove the competing branch begins, then prove the final public outcome and absence of stale state.

A test name, comment, timeout, waiting until the first endpoint, or endpoint-only assertion is not evidence of interruption or cancellation.

Do not require frame-by-frame component analysis. Do not retest equivalent pointer, touch, and keyboard paths when they share the same implementation. Forced state is visual-state evidence, not motion evidence.

A rejected perceived-motion result remains an open implementation defect even when the route is technically honest. Change production behavior, prepare new evidence, and set README visual status to `awaiting re-review` without claiming acceptance.

## 6. Migrate consumers and ownership

For an end-to-end migration:

1. create the canonical official-docs-slug directory;
2. update the curated Material export;
3. migrate every affected consumer;
4. preserve accepted behavior except for documented changes;
5. remove obsolete files and exports;
6. record the current migration state in the family README.

Do not claim migration complete while an obsolete owner or direct legacy consumer remains.

## 7. Build proportional proof

Every new or migrated component requires:

- a colocated component-contract test;
- one stable canonical visual story when visible.

Add browser, pure, consumer, `StateMatrix`, and visual-regression proof only when the family owns the corresponding risk.

A test cannot repair a missing implementation dependency. Reject tests that merely restate declarations or aliases, claim a risk that their setup never creates, or assert only a final endpoint while claiming interruption/cancellation.

Tests cover implemented capability. Unsupported combinations, unimplemented capability, and optional guidance are documented and tested only when the component owns explicit rejection, normalization, or fallback behavior.

## 8. Finish documentation and verification

After implementation:

1. rebuild the inventory from the available official sources;
2. update every classification and source-status field honestly;
3. preserve operator feedback and use only permitted visual-status transitions;
4. name applicable tests and stories;
5. verify normalization/fallback behavior, warnings, documentation, and tests agree for each material branch;
6. verify every named-risk test actually enters its claimed condition;
7. keep `Review status: review required after changes`;
8. run focused checks and final applicable local verification.

Code, README, exports, consumers, tests, and stories must agree. The previous `AUDIT.md` remains unchanged until independent review replaces it.

## Result

Finish with:

```text
MATERIAL COMPONENT AUTHORING RESULT
Official family:
Official documentation path:
Canonical implementation path:
Change mode:
Canonical source status:
Official capability inventory:
Official coverage:
Implemented:
Partial / defective / unverified:
Not implemented:
Officially unsupported / invalid combinations:
Unresolved / out-of-family:
Known issues / follow-up:
Consumers migrated:
Foundation/style changes:
Local verification:
Family documentation:
Latest operator feedback: none | <summary>
Visual status: not reviewed | required | rejected | awaiting re-review | accepted
Status: implementation finished | blocked (<exact reason>)
Recommended next command: material-component-review <family>
```

Do not report success while documentation hides unfinished work, a rejected issue is unchanged, a named-risk test never enters the claimed risk, fallback behavior and warning text disagree, shared blast radius is unproved, or required local verification fails.
