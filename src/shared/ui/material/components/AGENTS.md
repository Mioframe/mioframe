# Material component-family instructions

Inherits `src/shared/ui/material/AGENTS.md`.

## Purpose

This file contains only component-family workflow boundaries. Detailed architecture, token, testing, checklist, and review rules live in:

- `docs/material-3/component-architecture.md`;
- `docs/material-3/component-tokens.md`;
- `docs/material-3/component-testing.md`;
- `docs/material-3/component-conversion-checklist.md`;
- `docs/material-3/autonomous-review.md`.

Do not duplicate those documents here.

## Generalization boundary

Shared component instructions contain only cross-family invariants. Keep concrete family selectors, DOM nodes, custom-property names, token values, state endpoints, defects, and proposed structures in the owning family README, AUDIT, implementation, tests, and stories.

## Ownership and DOM structure

For each family, identify only responsibilities that actually apply, such as semantic host, layout, interaction, visual container, content, state layer, ripple, focus, outline/elevation, shape, and motion.

This is ownership analysis, not an element checklist.

- Do not create one DOM node per responsibility.
- Prefer one existing semantic element to own compatible responsibilities.
- Add a wrapper or helper only when official anatomy, semantics, accessibility, layout, interaction geometry, clipping/stacking, transition ownership, or a platform API requires a distinct owner.
- Styling convenience, selector convenience, test hooks, or future flexibility do not justify a node.
- Record a non-obvious ownership map in the family README.

## Authoring boundary

`material-component-authoring`:

- reconstructs the official contract before production changes;
- diagnoses each material problem and actual owner;
- chooses repair, restructure, or replace;
- updates README, implementation, exports, consumers, tests, and stories as required;
- removes superseded ownership rather than preserving parallel models;
- distinguishes forced-state appearance from real-input lifecycle proof;
- preserves explicit operator rejection;
- never edits AUDIT;
- runs an evidence-backed objective gate and local verification before recommending review.

## Review boundary

`material-component-review`:

- reconstructs evidence independently rather than accepting README conclusions;
- actively searches for contradictions across production, README, stories, tests, verification, and operator feedback;
- compares implementation with project documentation and project documentation with canonical Material evidence;
- reviews diagnosis and repair/restructure/replace strategy;
- changes only the family AUDIT;
- does not modify implementation, README, tests, stories, exports, consumers, roadmap, or policy;
- treats unresolved high-severity structural, lifecycle-proof, contradiction, or operator-rejected defects as non-compliant.

## Completion

A component authoring pass is not implementation-finished while the objective gate fails, applicable ownership is unresolved, a visible endpoint or transition composition is wrong, documentation contradicts production, verification fails, or known objective work is delegated to the operator.

Family compliance additionally requires current independent review. Required perceived visual acceptance remains a separate final gate.
