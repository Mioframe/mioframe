---
name: material-component-review
description: 'Use when the user provides a Material component or family name and wants an independent two-stage review: implementation against project documentation, then project documentation against canonical Material 3 Expressive. Replace only the family AUDIT.md.'
---

# Material component review

Use this as the review-only entrypoint for an official component family.

## Input

```text
material-component-review <component-or-family>
```

The component name is sufficient.

## Review boundary

Resolve:

```text
src/shared/ui/material/components/<official-docs-slug>/
```

The only file changed by this workflow is the family `AUDIT.md`.

Do not modify production code, tests, stories, README, exports, consumers, roadmap, registries, or policy during review.

Use current workspace files, the current user task, official evidence, and local verification results. Do not use source-control history as evidence.

## Required instructions

Read applicable repository and scoped instructions, component architecture/token/testing policy, the authoring checklist, current family README and previous AUDIT, implementation, exports, consumers, tests, stories, and shared owners.

Independently re-evaluate every conclusion. The previous audit is not authority.

## Generalization boundary

This skill contains only cross-family review invariants.

Do not add family selectors, custom-property names, token values, DOM node names, bug symptoms, or expected family structures here. Record concrete findings only in the reviewed family AUDIT.

A defect discovered in one family may update this skill only through an artifact-independent rule applicable to any family owning the same risk.

## Evidence sets

Keep distinct:

1. implementation evidence;
2. project documentation;
3. canonical Material evidence;
4. explicit operator feedback.

Tests and screenshots are evidence of current output, not proof of Material correctness.

## Operator feedback

An explicit user report of a visible defect overrides a weaker README status and is reported as `rejected`.

For broad visible feedback:

- treat the complete affected surface as unresolved;
- inspect anatomy, geometry, content composition, clipping, state endpoints, and motion;
- do not narrow the finding to the first plausible variable;
- do not report `awaiting re-review` unless production behavior changed and all affected objective surfaces were rechecked;
- never infer acceptance from silence, tests, screenshots, technical routing, or prior audit wording.

Objective structural conformance is reviewer-owned. Do not delegate anatomy, geometry, bounds, clipping, ownership, endpoint, namespace, or test-sufficiency decisions to operator review.

## Source and inventory status

Record canonical source status as one of:

- `current-complete`;
- `snapshot-complete-stale`;
- `partial`;
- `conflicting`;
- `unavailable`.

Record inventory status as:

- `complete`;
- `snapshot-complete (<snapshot>; currentness unverified)`;
- `incomplete (<exact gap>)`;
- `blocked (<exact reason>)`.

A stale snapshot cannot certify current completeness. Partial, truncated, suspicious, missing, or spot-check-only evidence cannot certify a complete inventory.

Classify every official item exactly once:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or invalid;
- unresolved;
- outside the resolved family boundary.

Invalid combinations are constraints, not absent capability. Optional guidance is not automatically required capability.

## Stage 1 — implementation against project documentation

Check independently:

- API, defaults, semantics, accessibility, controlled state, invalid combinations, and extensions;
- physical owner, public export, consumers, and migration state;
- every documented token, state, motion, geometry, and final property route;
- tests, stories, and verification claims;
- normalization/fallback outputs, warnings, documentation, and tests for each material branch;
- every known defect, missing proof, shared blast radius, source limitation, and operator rejection.

A declaration, alias, class name, story, test title, screenshot, or green check is not implementation proof by itself.

## Applicable ownership review

For a visible interactive component, independently identify applicable owners:

```text
semantic host
layout footprint
interaction bounds
visual container
content bounds
state-layer bounds
ripple event host
ripple render and clip bounds
focus-indicator bounds
outline and elevation owner
shape and motion owner
```

Mark non-applicable roles explicitly. Do not require wrapper elements for symmetry.

Verify:

- combined roles on one element form coherent official anatomy;
- interaction geometry is contiguous, unambiguous, and supported by layout space where required;
- adjacent interactive regions do not conflict;
- representative interior, boundary, exterior, and adjacency behavior is proved when geometry is custom;
- visual, state, ripple, focus, outline, elevation, content, shape, and motion properties use their correct owners;
- all applicable visible state endpoints and simultaneous-state precedence are correct.

Report a high-severity finding when helper geometry creates partial, disconnected, overlapping, or unreserved interaction regions.

A component cannot be implemented and verified while applicable ownership is missing, contradictory, or inconsistent with rendered output.

## Final rendered-owner proof

For every visible route, prove:

1. official meaning or explicit project-extension meaning;
2. valid source and namespace;
3. correct concrete owner;
4. relevant owner bounds;
5. final computed and rendered result;
6. state precedence, clipping, and adjacent-layer interaction.

Numeric equality on the wrong element is not proof.

For shape, a scalar radius alone is insufficient when ownership, clipping, box geometry, corner model, or state composition can alter the visible result. Verify the complete applicable endpoints on the official shape owner.

## CSS custom-property namespace review

Inventory every custom property materially used by the family and classify it as:

- exact official `--md-ref-*`, `--md-sys-*`, or `--md-comp-*` token;
- justified `--md-private-<owner>-<semantic-role>` route;
- genuine `--app-*` application token;
- invalid or unnecessary alias.

Report a finding when:

- an invented `--md-*` name looks public or canonical;
- an official path is shortened or expressed as a raw CSS-property alias;
- a private route omits `private`;
- a private route describes mechanism rather than semantic ownership;
- a one-use constant is routed through an unnecessary variable;
- a variable cannot affect the correct final owner.

An ad-hoc name shaped like `--md-<artifact>-<raw-css-property>` is invalid unless it is an exact official token, which must use the canonical namespace and path.

A visible capability routed through an invalid namespace cannot be fully implemented.

## Motion and lifecycle review

Require proportional proof for applicable:

- real input activates the intended property on the correct owner;
- an intermediate state is sampled only when needed to prove the route;
- correct visible endpoints are reached;
- interruption/cancellation leaves no stale state;
- reduced-motion behavior is correct when owned.

A named interruption test triggers the competing event before the first transition settles and proves the competing branch began.

Do not claim motion fixed when only timing changes while the final visible owner, endpoint, composition, or rendered property remains wrong.

Forced state proves appearance only. A screenshot baseline proves regression stability only.

## Stage 2 — project documentation against Material

Check:

- official family mapping and boundary;
- source status and inventory claims;
- variants, sizes, shapes, modes, defaults, states, semantics, accessibility, and invalid combinations;
- official anatomy and geometry relationships;
- color, elevation, icon, motion, shape, typography, state-layer, ripple, and focus meanings;
- exact token names, values, routes, namespaces, and final owners;
- classification of implemented, partial, absent, invalid, unresolved, and out-of-family capability;
- explicit extensions and deviations;
- whether cited sources support each claim.

Use the Design Kit when published documentation cannot resolve an objective anatomy, geometry, alignment, or state-composition decision. Do not use operator review as a substitute for available official evidence.

## Severity and result

Use:

- `critical` — unsafe semantics, accessibility, or severe interaction corruption;
- `high` — required API/state/token/motion/ownership, major anatomy or geometry, interaction region, visible endpoint, invalid public-looking namespace, or unchanged operator-rejected behavior is wrong;
- `medium` — bounded mismatch, incomplete proof, misleading documentation, fallback inconsistency, or non-critical canonical divergence;
- `low` — minor documentation or cleanup defect.

Overall result:

- `compliant` — no finding remains and canonical evidence is sufficient;
- `partially-compliant` — only non-critical gaps remain;
- `non-compliant` — any critical or high finding exists;
- `blocked` — required authoritative evidence is unavailable or conflicting.

A stale snapshot alone prevents fully current compliant status.

## AUDIT structure

Replace the family AUDIT with:

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
## Applicable ownership map
## CSS custom-property namespace review
## Official capability coverage
## Stage 1 — implementation vs project documentation
## Stage 2 — project documentation vs Material 3 Expressive
## Evidence gaps
## Required next work
```

Use explicit `none` for empty categories. Verify `Not implemented` independently rather than copying README.

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
Ownership:
CSS custom-property namespace review:
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

A review is complete only after AUDIT is replaced and applicable ownership, final rendered owners, CSS namespaces, operator feedback, causal named-risk proof, normalization consistency, compliance, and coverage are checked.

Do not report `partially-compliant` while a high-severity structural or unchanged visible defect remains.
