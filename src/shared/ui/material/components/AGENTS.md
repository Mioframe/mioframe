# Material component-family instructions

Inherits `src/shared/ui/material/AGENTS.md`.

## Purpose

This file contains only component-family workflow boundaries. Detailed architecture, token, testing, and review rules live in:

- `docs/material-3/component-architecture.md`;
- `docs/material-3/component-tokens.md`;
- `docs/material-3/component-testing.md`;
- `docs/material-3/component-conversion-checklist.md`;
- `docs/material-3/autonomous-review.md`.

Do not duplicate those documents here.

## Generalization boundary

Shared component instructions contain only cross-family invariants. Keep concrete family selectors, DOM nodes, custom-property names, token values, state endpoints, defects, and proposed structures in the owning family README, AUDIT, implementation, tests, and stories.

## Ownership and DOM structure

For each family, identify only the responsibilities that actually apply, such as semantic host, layout, interaction, visual container, content, state layer, ripple, focus, outline/elevation, shape, and motion.

This is an ownership analysis, not an element checklist.

- Do not create one DOM node per responsibility.
- Prefer one existing semantic element to own compatible responsibilities.
- Add a wrapper or helper node only when official anatomy, semantics, accessibility, layout, interaction geometry, clipping/stacking, or a platform API requires a distinct owner.
- Styling convenience, selector convenience, test hooks, or future flexibility do not justify a node.
- Record a non-obvious ownership map in the family README.

## Authoring boundary

`material-component-authoring`:

- updates README, implementation, exports, consumers, tests, and stories as required;
- preserves explicit operator rejection;
- never edits AUDIT;
- finishes with local verification and recommends independent review.

## Review boundary

`material-component-review`:

- independently compares implementation with project documentation and project documentation with canonical Material evidence;
- changes only the family AUDIT;
- does not modify implementation, README, tests, stories, exports, consumers, roadmap, or policy;
- treats unresolved high-severity structural or operator-rejected defects as non-compliant.

## Completion

A component family is not complete while applicable ownership is unresolved, a visible endpoint is wrong, documentation overstates evidence, verification fails, independent review is stale, or required operator acceptance is missing.