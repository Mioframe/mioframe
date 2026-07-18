---
name: material-component-review
description: 'Use for an independent contradiction-seeking review of an official Material component family. Compare implementation with project documentation, then documentation with canonical Material 3 Expressive, and replace only the family AUDIT.md.'
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
- Source-control history is not Material evidence. The current diff may be inspected for scope, unrelated changes, missing cleanup, and regression risk.
- Keep concrete findings in the reviewed AUDIT; do not add them to shared skills.

## Policy loading

Always read:

- applicable repository and scoped `AGENTS.md` files;
- `docs/material-3/source-of-truth.md`;
- `docs/material-3/component-architecture.md`;
- `docs/material-3/autonomous-review.md`;
- current family README and previous AUDIT;
- implementation, exports, consumers, tests, stories, and directly affected shared owners.

Read only when applicable:

- `component-tokens.md` for token, namespace, or rendered-property findings;
- `component-testing.md` for browser behavior, motion, geometry, visual evidence, or test-sufficiency findings.

Use `component-conversion-checklist.md` once as the final review pass. Independently re-evaluate every prior claim.

## Workflow

### 1. Reconstruct evidence independently

Keep separate:

1. current implementation evidence;
2. project documentation claims;
3. canonical Material evidence from the current run;
4. explicit operator feedback;
5. current-diff scope evidence when available.

Do not start from the README conclusion. Reconstruct the official contract, actual owners, final rendered routes, and current behavior from evidence.

Tests and screenshots prove current behavior or regression stability, not Material correctness by themselves.

### 2. Search for contradictions before checking completeness

Compare every materially repeated claim across:

```text
production
README
stories and Storybook descriptions
component tests
browser and visual tests
shared-owner documentation
verification claims
operator feedback
```

Report mismatches such as:

- documentation names a different owner than production;
- a story describes superseded anatomy or behavior;
- a test title claims a branch its setup never enters;
- a warning describes a different fallback than the rendered result;
- a forced state is presented as real lifecycle proof;
- a public token is asserted on an intermediate alias rather than the final owner;
- README closes or weakens an operator-rejected surface without explicit acceptance.

If the same contract fact appears in multiple places, reviewer must compare them explicitly. Agreement is not assumed.

### 3. Review implementation against project documentation

Check applicable API, semantics, accessibility, controlled state, normalization, anatomy, ownership, geometry, tokens, states, motion, exports, consumers, migration, tests, stories, verification claims, known defects, and source limits.

For DOM structure:

- enforce the repository-wide prohibition on unnecessary nodes;
- treat ownership roles as responsibilities, not an element checklist;
- reject wrappers or helpers added only for styling, selectors, test hooks, or future flexibility;
- require a distinct node only when official anatomy, semantics, accessibility, layout, interaction geometry, clipping/stacking, or a platform API needs it.

A declaration, alias, class name, story, screenshot, test title, or green check is not implementation proof.

### 4. Review project documentation against Material

Check official family mapping, current-run source claims, capability classification, variants, states, semantics, accessibility, anatomy, geometry, token meanings and names, final rendered owners, motion, extensions, deviations, and evidence citations.

Use current successful MCP reads as working official evidence when complete and healthy. Capture age alone is not a finding.

Use official visual evidence or the Design Kit when text and token tables do not resolve an objective structural decision.

### 5. Review diagnosis and implementation strategy

Verify that authoring correctly classified material problems as canonical behavior, implementation defect, architecture defect, foundation defect, evidence gap, or product deviation.

Verify the chosen strategy:

- `repair` did not preserve a wrong ownership model;
- `restructure` removed superseded structure;
- `replace` did not retain hidden compatibility paths without necessity.

Repeated patches, parallel models, or unresolved ownership after two correction rounds are findings even when isolated tests pass.

### 6. Review motion and lifecycle causally

For applicable motion, distinguish:

- forced-state endpoint evidence;
- real input acquisition and release;
- intermediate trajectory evidence when composition can fail between endpoints;
- interruption/cancellation and cleanup;
- operator-perceived quality.

Reject endpoint-only or forced-state proof when the claim concerns acquisition, transition composition, interruption, release, or cleanup.

### 7. Apply operator feedback correctly

- Explicit visible rejection overrides weaker README wording.
- Broad rejection reopens the complete affected visible surface.
- Do not infer acceptance from silence, tests, screenshots, routing, or prior audit text.
- Objective anatomy, geometry, ownership, clipping, endpoints, naming, accessibility, contradictions, and test sufficiency remain reviewer-owned.

### 8. Write a concise AUDIT

Run the final component checklist once, then replace the family AUDIT.

Do not duplicate the complete family README. Record only enough verified context to make findings reproducible.

```text
# <Family> implementation audit

Reviewed: <date>
Result: compliant | partially-compliant | non-compliant | blocked
Canonical source status: ...
Official coverage: ...
Visual review: not reviewed | required | rejected | awaiting re-review | accepted

## Evidence inspected
## Contradictions
## Objective findings
## Evidence gaps
## Operator status
## Required next work
```

Use explicit `none` for empty categories. Verify absent capability independently rather than copying README.

## Output

Finish with:

```text
MATERIAL COMPONENT REVIEW
Official family:
Official documentation path:
Implementation path:
Audit file:
Canonical source status:
Official coverage:
Contradictions:
Stage 1 result:
Stage 2 result:
Diagnosis/strategy result:
Overall result:
Ownership and DOM structure:
Latest operator feedback:
Visual review:
Findings:
Evidence gaps:
Required next work:
```

A review is complete only after AUDIT is replaced. Any high-severity structural defect, unnecessary DOM structure, invalid route, unresolved contradiction, non-causal proof, or unchanged operator-rejected behavior requires `non-compliant`.
