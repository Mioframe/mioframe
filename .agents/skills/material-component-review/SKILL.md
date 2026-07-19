---
name: material-component-review
description: 'Use for a complete independent, contradiction-seeking review of an official Material component family. Reconstruct the rendered implementation, native semantics, architecture, lifecycle, foundations, tests, and documentation before reviewing token names. Replace only the family AUDIT.md.'
---

# Material component review

```text
material-component-review <component-or-family>
```

The component name is sufficient.

## Boundary

- Resolve `src/shared/ui/material/components/<official-docs-slug>/`.
- Change only the family `AUDIT.md`.
- Do not modify production code, tests, stories, README, exports, consumers, roadmap, registries, or policy.
- Use the current workspace, current task, current successful Material MCP reads, official sources, and local verification results.
- Source-control history is not Material evidence. The current diff may be inspected for scope, missing cleanup, compatibility paths, and regression risk.
- Keep concrete findings in the reviewed AUDIT; do not add them to shared skills.

This is a complete implementation review. It is not a token-name audit, documentation confirmation pass, or rerun of the previous AUDIT.

## Policy loading

Always read:

- applicable repository and scoped `AGENTS.md` files;
- `docs/material-3/source-of-truth.md`;
- `docs/material-3/component-architecture.md`;
- `docs/material-3/autonomous-review.md`;
- current family README and previous AUDIT;
- implementation, exports, consumers, tests, stories, and directly affected shared owners.

Read only when applicable:

- `component-tokens.md` for token, namespace, cascade, override, or rendered-property findings;
- `component-testing.md` for browser behavior, motion, geometry, visual evidence, or test-sufficiency findings.

Use `component-conversion-checklist.md` once as the final review pass. Independently re-evaluate every prior claim.

## Mandatory coverage ledger

Before writing AUDIT, record direct evidence and `pass | fail | unresolved` for every applicable domain:

```text
API and native semantics
rendered DOM and browser-default reset
anatomy, ownership, layout, hit and visual bounds
painted layers, clipping, stacking, focus, and accessibility
state acquisition, precedence, release, cancellation, and cleanup
state layer, ripple, focus indicator, and other shared foundations
motion owner, endpoints, trajectory, interruption, and cleanup
normalization, fallback, warning, error, and extension behavior
token sources, cascade, override contract, namespace, and final owner
exports, consumers, migration, and obsolete paths
tests, stories, helpers, screenshots, and verification blind spots
README, shared-owner documentation, and operator feedback
architecture, duplication, complexity, and repair/restructure/replace strategy
```

A review is incomplete when an applicable domain has no direct evidence. Reconfirming previous findings does not satisfy this ledger.

Do not begin the custom-property naming pass until rendered structure, native semantics, ownership, lifecycle, foundations, and test blind spots have been reviewed.

## Workflow

### 1. Reconstruct the implementation from runtime outward

Do not start from the README or previous AUDIT conclusion.

Trace:

1. public entrypoint, native element, props, emits, slots, exports, and consumers;
2. actual rendered DOM, pseudo-elements, dynamically inserted nodes, UA styles, global CSS, and inheritance;
3. layout footprint, hit bounds, visible bounds, painted layers, clipping, and stacking;
4. each real input through event handlers, reactive state, classes/attributes, shared foundations, rendered properties, release, cancellation, and cleanup;
5. tests and helpers, including elements, states, frames, branches, and environments they never inspect.

Keep implementation evidence, documentation claims, canonical Material evidence, operator feedback, and current-diff scope evidence separate.

Tests and screenshots prove only the exact path they causally exercise.

### 2. Inspect the complete rendered tree adversarially

Do not inspect only the element that documentation or test helpers call the visual owner.

Verify applicable:

- native appearance, background, border, padding, font, outline, and default behavior are intentionally controlled;
- a semantic host cannot paint an unintended surface around a nested visual container;
- state layer, ripple, focus, outline, elevation, content, loading, and auxiliary layers use coherent bounds and clipping;
- stacking cannot expose a rectangular, stale, or incorrectly clipped layer;
- different hit and visible bounds form one contiguous, layout-reserved interaction region;
- every DOM node has a necessary responsibility.

For a reported visual defect, enumerate every element and pseudo-element capable of painting it. A scalar value on one expected owner cannot disprove a composition defect.

### 3. Review native semantics and lifecycle

Verify applicable click propagation/default action, form behavior, keyboard activation, pointer/touch/leave/cancel/release behavior, disabled/loading behavior, focus-visible, accessibility state, listener cleanup, and multi-instance isolation.

Build one causal map:

```text
real event
→ state owner
→ class/attribute/property
→ shared foundation
→ rendered layer/property
→ release/cancel/cleanup
```

Report parallel event families, timers, CSS pseudo-states, or state models that can disagree.

Inspect the implementation of shared foundations, not only their call sites. Timing and geometry must come from the property actually being animated; asynchronous work must not outlive or reorder the interaction incorrectly.

### 4. Review architecture and strategy

Review the implementation as a system, not a collection of declarations.

Report:

- duplicated variant/state/size matrices that can diverge;
- several owners for one semantic or rendered concern;
- component-local patches around a foundation defect;
- obsolete or parallel anatomy, state, and compatibility models;
- tests coupled to or hiding a wrong structure;
- complexity that prevents one contract fact from having one obvious owner.

File length alone is not a finding. Repetition and conflicting ownership are. Verify whether `repair`, `restructure`, or `replace` is the honest next strategy.

### 5. Search for contradictions

Compare every materially repeated claim across:

```text
production
README
stories and Storybook descriptions
component tests
browser and visual tests
test helpers and fixtures
shared-owner documentation
verification claims
operator feedback
```

Report mismatches such as:

- different owners or anatomy;
- warning text that describes another fallback;
- forced state presented as lifecycle proof;
- a helper that reads only the expected owner and hides other painted layers;
- a test title whose setup never enters the named branch;
- one override class demonstrated but all token classes claimed;
- operator rejection weakened without explicit acceptance.

Agreement is not assumed.

### 6. Review implementation and documentation

Check API, semantics, accessibility, controlled state, normalization, anatomy, ownership, geometry, painted layers, foundations, tokens, states, motion, exports, consumers, migration, tests, stories, verification claims, known defects, and source limits.

For DOM structure:

- enforce minimal DOM;
- treat ownership roles as responsibilities, not an element checklist;
- reject nodes added only for styling, selectors, test hooks, or future flexibility;
- require a distinct node only for official anatomy, semantics, accessibility, layout, interaction geometry, clipping/stacking, transition ownership, or a platform API.

Then review project documentation against current Material evidence: family boundary, capability classification, semantics, anatomy, geometry, token meanings, final owners, motion, extensions, deviations, and source claims.

Capture age alone is not a finding. Use official visual evidence or the Design Kit when published evidence does not resolve an objective structural decision.

### 7. Review token cascade and naming last

For every materially used custom property verify:

1. exact official or justified private meaning;
2. where its default is declared;
3. whether inheritance and ordinary consumer override work as documented;
4. whether a local declaration blocks ancestor override;
5. correct final owner and rendered effect;
6. semantic naming and necessity.

Only then report invalid namespace, mechanism naming, or unnecessary aliases. Correct names do not compensate for wrong rendering, semantics, lifecycle, cascade, or architecture.

### 8. Review motion and operator feedback

Distinguish forced-state endpoint evidence, real input acquisition/release, meaningful intermediate trajectory evidence, interruption/cancellation/cleanup, and operator-perceived quality.

Reject endpoint-only proof when composition can fail between endpoints.

Explicit rejection reopens the complete affected visible surface. Do not infer acceptance from silence, tests, screenshots, routing, or prior audit text. Objective rendering, anatomy, native reset, geometry, ownership, clipping, lifecycle, foundation behavior, accessibility, contradictions, and test sufficiency remain reviewer-owned.

### 9. Write AUDIT

Run the final checklist once, then replace the family AUDIT. Keep it concise, but expose incomplete coverage.

```text
# <Family> implementation audit

Reviewed: <date>
Result: compliant | partially-compliant | non-compliant | blocked
Canonical source status: ...
Official coverage: ...
Visual review: not reviewed | required | rejected | awaiting re-review | accepted
Implementation coverage: complete | incomplete (<domains>)

## Evidence inspected
## Implementation coverage
## Contradictions
## Objective findings
## Test and evidence blind spots
## Evidence gaps
## Operator status
## Required next work
```

Use explicit `none` for empty categories.

## Output

Finish with:

```text
MATERIAL COMPONENT REVIEW
Official family:
Implementation path:
Audit file:
Canonical source status:
Official coverage:
Implementation coverage:
Contradictions:
Rendered-tree result:
Native-semantics result:
Lifecycle/foundation result:
Architecture/strategy result:
Token/cascade result:
Stage 1 result:
Stage 2 result:
Overall result:
Latest operator feedback:
Visual review:
Findings:
Test and evidence blind spots:
Evidence gaps:
Required next work:
```

A review is complete only after AUDIT is replaced and every applicable ledger domain has direct evidence. Any high-severity structural defect, uncontrolled native rendering, incorrect native semantics, parallel lifecycle model, unnecessary DOM, invalid route, unresolved contradiction, test blind spot masking a named risk, non-causal proof, or unchanged operator-rejected behavior requires `non-compliant`.
