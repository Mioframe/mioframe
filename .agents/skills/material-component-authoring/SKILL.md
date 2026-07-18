---
name: material-component-authoring
description: 'Use for creating, migrating, aligning, or materially changing an official public Material component family. Owns source resolution, family documentation, production implementation, consumer migration, proportional proof, and local verification.'
paths:
  - 'src/shared/ui/material/components/**'
---

# Material component authoring

Use after the official family is resolved.

## Boundary

- Use the current user task, current workspace, official Material sources, and local verification.
- Do not use source-control history or remote workflow state as evidence.
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
- `component-testing.md` for changed proof, browser behavior, motion, geometry, or visual evidence;
- `autonomous-review.md` for operator status, evidence severity, or review-state changes.

Use `component-conversion-checklist.md` once as the final completeness pass rather than loading and restating it throughout implementation.

## Workflow

### 1. Resolve the contract

- Resolve the official family, documentation path, and canonical directory slug.
- Select `new-component`, `end-to-end-migration`, or `alignment-only`.
- Record source and inventory status without overstating incomplete or stale evidence.
- Classify official capability using the categories defined by component architecture.
- Select the smallest coherent implementation surface required by the request and affected consumers.

### 2. Update README before production

Record current official mapping, source status, capability classification, API and semantics, known defects, consumers, verification state, and operator feedback.

Set review status to `review required after changes`.

A visible defect reported by the user remains `rejected` until production behavior changes; only explicit user acceptance sets `accepted`.

### 3. Resolve anatomy and ownership

Determine official anatomy and only the responsibilities that actually apply.

- Follow the repository-wide prohibition on unnecessary DOM nodes.
- Ownership analysis does not imply one element per role.
- Prefer existing semantic elements to own compatible layout, interaction, visual, state, ripple, focus, shape, and motion responsibilities.
- Add a distinct node only when semantics, accessibility, official anatomy, layout, interaction geometry, clipping/stacking, or a platform API requires it.
- Record a non-obvious ownership map in README.

### 4. Implement the shortest correct route

- Keep props, emits, slots, native semantics, and controlled state explicit.
- Use exact official token meanings and valid namespaces.
- Apply each visible property to its correct final owner.
- Keep family behavior local unless a real shared owner exists.
- Add no speculative API, wrapper, registry, resolver, CSS DSL, compatibility path, or file.
- Before changing a shared source, identify affected consumers and add representative final-output proof.

### 5. Migrate ownership and consumers

For end-to-end migration:

- create the canonical owner;
- update curated exports and affected consumers;
- preserve accepted behavior except documented corrections;
- remove obsolete owners, imports, exports, tests, and comments;
- record any incomplete migration honestly.

### 6. Build proportional proof

Use only testing layers justified by risks the component actually owns.

Every new or migrated visible component requires colocated component-contract tests and one stable canonical story. Add browser, pure, consumer, state-matrix, or visual-regression proof only when justified by the changed contract.

Tests must prove final behavior and real ownership, not declarations, aliases, screenshots, or convenient intermediate values.

### 7. Finish

- Rebuild README classification from current evidence.
- Confirm code, documentation, exports, consumers, tests, and stories agree.
- Preserve unresolved source limits, structural gaps, proof gaps, and operator rejection.
- Run the final component checklist once.
- Run focused verification as needed and final applicable local verification.
- Leave AUDIT unchanged.
- Recommend `material-component-review <family>`.

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
Ownership and DOM structure:
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

Do not report implementation finished while an objective defect, unnecessary DOM structure, invalid route, unresolved shared blast radius, documentation mismatch, or verification failure remains.