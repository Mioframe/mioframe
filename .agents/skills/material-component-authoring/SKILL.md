---
name: material-component-authoring
description: 'Use for creating, migrating, repairing, restructuring, replacing, or materially aligning an official public Material component family. Owns contract reconstruction, defect diagnosis, implementation strategy, production work, proportional proof, and the objective authoring gate.'
paths:
  - 'src/shared/ui/material/components/**'
---

# Material component authoring

Use after the official component family is resolved.

## Boundary

- Use the current user task, current workspace, current successful Material MCP reads, official Material sources, and local verification.
- Source-control history is not Material evidence. The current diff may be inspected for scope, unrelated changes, ownership drift, and regression risk.
- Update the family README and implementation artifacts as required.
- Never edit the family AUDIT.
- Keep concrete family facts in the family README, implementation, tests, and stories; do not add them to shared skills.

## Policy loading

Always read:

- applicable repository and scoped `AGENTS.md` files;
- `docs/material-3/source-of-truth.md`;
- `docs/material-3/component-architecture.md`;
- current family README and AUDIT when present;
- current implementation, exports, consumers, tests, stories, and directly affected shared owners.

Read only when applicable:

- `component-tokens.md` for token, CSS custom-property, or rendered-property routing work;
- `component-testing.md` for proof, browser behavior, motion, geometry, or visual evidence;
- `autonomous-review.md` for operator status, evidence severity, or review-state changes.

Use `component-conversion-checklist.md` once as the final evidence-backed gate. Do not restate it throughout implementation.

## Workflow

### 1. Resolve sources and scope

- Resolve the official family, documentation path, and canonical directory slug.
- Read every required family page and structured token route through the current Material MCP run.
- Record source provenance and status without treating capture age alone as a defect.
- Classify official capability using component architecture.
- Select the smallest coherent complete surface required by the explicit task and affected consumers.
- Inspect the current diff when available to detect unrelated changes and accidental scope growth.

### 2. Reconstruct the contract before production changes

Record a compact, concrete contract in the family README:

```text
official family and boundary
supported and unsupported capability
public API and native semantics
official anatomy
applicable DOM and rendered-property ownership
token sources and final owners
states and precedence
motion properties, endpoints, and Web adaptation
foundation dependencies
current defects and operator feedback
required proof
```

Do not design tests or preserve implementation structure before this contract is reconstructed.

### 3. Diagnose each reported or discovered problem

Classify it as exactly one primary category:

- `canonical-behavior` — the observed behavior matches the official contract;
- `implementation-defect` — code does not implement the reconstructed contract;
- `architecture-defect` — anatomy, DOM ownership, dependency direction, or public contract is wrong;
- `foundation-defect` — the failure belongs to a shared Material foundation or style owner;
- `evidence-gap` — correctness cannot yet be established;
- `product-deviation` — an explicit product requirement intentionally differs from Material.

Record supporting evidence. Do not change production code until the category and actual owner are known.

### 4. Choose the implementation strategy

Select one:

- `repair` — anatomy, ownership, and public contract are sound; defects are local;
- `restructure` — public capability remains usable, but anatomy, DOM/property ownership, or dependency structure must change;
- `replace` — the existing implementation is built on a materially incorrect contract or continued patching would preserve multiple conflicting models.

Use `replace` or `restructure` rather than indefinite patching when several of anatomy, ownership, token routing, state model, motion ownership, or proof architecture are wrong.

If two correction rounds leave the same objective defect, add workarounds, or create new ownership ambiguity, stop patching and reconsider the strategy from the reconstructed contract.

### 5. Update README before implementation

Record source status, capability classification, reconstructed contract, diagnosis, selected strategy, known defects, consumers, verification state, and operator feedback.

Set review status to `review required after changes`.

A visible defect reported by the user remains `rejected` until production behavior changes; only explicit user acceptance sets `accepted`.

### 6. Implement through ordered gates

Work in this order when applicable:

1. native semantics, API, and official anatomy;
2. layout, interaction bounds, and DOM/property ownership;
3. static geometry and visual endpoints;
4. exact token and state routing to final owners;
5. shared foundation integration through the narrowest owner;
6. real interaction lifecycle and motion;
7. exports, consumers, and obsolete-owner cleanup.

After each gate, remove superseded structure rather than preserving parallel models.

Rules:

- follow the repository-wide prohibition on unnecessary DOM nodes;
- ownership analysis does not imply one element per role;
- use exact official token meanings and valid namespaces;
- private names describe semantic ownership, not raw CSS mechanisms;
- add no speculative API, wrapper, registry, resolver, CSS DSL, compatibility path, or file;
- before changing a shared source, identify affected consumers and add representative final-output proof.

### 7. Build proportional proof

Every new or migrated visible component requires colocated component-contract tests and one stable canonical story.

Add browser, pure, consumer, state-matrix, motion, or visual-regression proof only when justified by the changed contract.

Tests must prove final behavior and real ownership, not declarations, aliases, forced classes, screenshots, or convenient intermediate variables.

For motion, forced states prove stable appearance only. Real input must prove acquisition, trajectory when relevant, release, interruption/cancellation, and cleanup.

### 8. Run the objective authoring gate

For every applicable final checklist item, establish:

```text
rule: <check>
applicable: yes | no
evidence: <file/test/rendered result>
result: pass | fail
```

The working ledger may remain in the agent report; do not create a permanent file unless the repository already owns one.

Authoring fails when any applicable objective issue remains, including:

- incorrect anatomy or owner;
- unnecessary DOM structure;
- invalid or mechanism-named route;
- unnecessary private alias;
- misleading normalization or warning branch;
- forced-state proof substituted for real behavior;
- implementation, README, stories, or tests contradict each other;
- shared blast radius is unproved;
- a known objective defect is delegated to operator review;
- required local verification fails or is not run.

### 9. Finish

- Rebuild README classification from current evidence.
- Confirm code, README, exports, consumers, tests, and stories agree.
- Preserve unresolved source limits, proof gaps, and operator rejection honestly.
- Run focused verification as needed and final applicable local verification.
- Leave AUDIT unchanged.
- Recommend `material-component-review <family>` only after the objective authoring gate passes or report the exact failed gates.

## Result

Finish with:

```text
MATERIAL COMPONENT AUTHORING RESULT
Official family:
Official documentation path:
Canonical implementation path:
Canonical source status:
Official capability inventory:
Diagnosis:
Strategy: repair | restructure | replace
Implemented:
Partial / defective / unverified:
Not implemented:
Officially unsupported / invalid combinations:
Ownership and DOM structure:
Consumers migrated:
Foundation/style changes:
Proof added:
Authoring gate: passed | failed
Failed gates:
Local verification:
Family documentation:
Latest operator feedback:
Visual status: not reviewed | required | rejected | awaiting re-review | accepted
Status: implementation finished | partial | blocked (<exact reason>)
Recommended next command:
```

Do not report `implementation finished` while any objective defect, unnecessary structure, invalid route, contradiction, unresolved shared blast radius, or verification failure remains.
