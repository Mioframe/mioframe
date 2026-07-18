---
name: material-component-review
description: 'Use for an independent two-stage review of an official Material component family. Compare implementation with project documentation, then project documentation with canonical Material 3 Expressive. Replace only the family AUDIT.md.'
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
- Use the current workspace, current task, official sources, and local verification results.
- Do not use source-control history as evidence.
- Keep concrete findings in the reviewed AUDIT; do not add them to shared skills.

## Required policy

Read and follow:

- applicable repository and scoped `AGENTS.md` files;
- `docs/material-3/source-of-truth.md`;
- `docs/material-3/component-architecture.md`;
- `docs/material-3/component-tokens.md`;
- `docs/material-3/component-testing.md`;
- `docs/material-3/component-conversion-checklist.md`;
- `docs/material-3/autonomous-review.md`;
- current family README and previous AUDIT;
- implementation, exports, consumers, tests, stories, and directly affected shared owners.

Those documents own detailed evidence, classification, severity, and completion rules. Independently re-evaluate every prior claim.

## Workflow

### 1. Reconstruct the evidence

Keep separate:

1. implementation evidence;
2. project documentation;
3. canonical Material evidence;
4. explicit operator feedback.

Record source and inventory status honestly. Tests and screenshots prove current behavior or regression stability, not Material correctness by themselves.

### 2. Review implementation against project documentation

Check applicable API, semantics, accessibility, controlled state, normalization, anatomy, ownership, geometry, tokens, states, motion, exports, consumers, migration, tests, stories, verification claims, known defects, source limits, and operator rejection.

For DOM structure:

- enforce the repository-wide prohibition on unnecessary nodes;
- treat ownership roles as responsibilities, not an element checklist;
- reject wrappers or helper elements added only for styling, selectors, test hooks, or future flexibility;
- require a distinct node only when official anatomy, semantics, accessibility, layout, interaction geometry, clipping/stacking, or a platform API needs a separate owner.

A declaration, alias, class name, story, screenshot, test title, or green check is not implementation proof.

### 3. Review project documentation against Material

Check official family mapping, source claims, capability classification, variants, states, semantics, accessibility, anatomy, geometry, token meanings and names, final rendered owners, motion, extensions, deviations, and evidence citations.

Use official visual evidence or the Design Kit when text and token tables do not resolve an objective structural decision.

### 4. Apply operator feedback correctly

- Explicit visible rejection overrides weaker README wording.
- Broad rejection reopens the complete affected visible surface.
- Do not infer acceptance from silence, tests, screenshots, routing, or prior audit text.
- Objective anatomy, DOM structure, geometry, ownership, clipping, endpoints, naming, accessibility, and test sufficiency remain reviewer-owned.

### 5. Write AUDIT

Replace the family AUDIT using the structure below. Apply severity and overall result definitions from `autonomous-review.md`.

```text
# <Family> implementation audit

Reviewed: <date>
Result: compliant | partially-compliant | non-compliant | blocked
Canonical source status: ...
Official capability inventory: ...
Official coverage: full | partial | unresolved
Project implementation documentation: README.md
Visual review: not reviewed | required | rejected | awaiting re-review | accepted

## Evidence
## Applicable ownership and DOM structure
## CSS custom-property namespace review
## Official capability coverage
## Stage 1 — implementation vs project documentation
## Stage 2 — project documentation vs Material 3 Expressive
## Evidence gaps
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
Official capability inventory:
Official coverage:
Stage 1 result:
Stage 2 result:
Overall result:
Ownership and DOM structure:
Latest operator feedback: none | <summary>
Visual review: not reviewed | required | rejected | awaiting re-review | accepted
Implemented and verified:
Partial / defective / unverified:
Not implemented:
Officially unsupported / invalid combinations:
Unresolved / out-of-family:
Findings:
Evidence gaps:
Required next work:
```

A review is complete only after AUDIT is replaced. Any high-severity structural defect, unnecessary DOM structure, invalid route, or unchanged operator-rejected behavior requires `non-compliant`.