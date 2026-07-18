---
name: material-component-review
description: 'Use when the user provides a Material component or family name and wants an independent two-stage review: implementation against project documentation, then project documentation against canonical Material 3 Expressive. Replace only the family AUDIT.md.'
---

# Material component review

Use this as the one-name, review-only entrypoint.

## Input

```text
material-component-review Button
material-component-review Switch
material-component-review Navigation rail
```

The component name is sufficient.

## Review boundary

Resolve the official family and canonical directory:

```text
src/shared/ui/material/components/<official-docs-slug>/
```

The only file changed by this workflow is the family `AUDIT.md`.

Do not modify production code, tests, stories, README, exports, consumers, roadmap, registries, or policy during review.

Use current workspace files, the current user task, official evidence, and local verification results. Do not run, inspect, or cite git, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history.

## Required instructions

Read:

- applicable repository and scoped `AGENTS.md` files;
- `src/shared/ui/material/components/AGENTS.md`;
- `docs/material-3/source-of-truth.md`;
- `docs/material-3/component-architecture.md`;
- `docs/material-3/component-tokens.md`;
- `docs/material-3/component-testing.md`;
- `docs/material-3/component-conversion-checklist.md`;
- current family README and previous AUDIT;
- current implementation, exports, consumers, tests, stories, and applicable shared owners.

Independently re-evaluate every prior conclusion. The previous audit is not authority.

## Evidence sets

Keep four evidence sets distinct:

1. **Implementation evidence** — production code, rendered behavior, exports, consumers, tests, stories, and foundations.
2. **Project documentation** — family README and applicable project rules.
3. **Canonical evidence** — official Material 3 Expressive documentation, exact token sources, and Design Kit only where published documentation cannot resolve an objective visual decision.
4. **Operator feedback** — explicit current-message feedback and the persistent README summary.

Tests and screenshots are evidence of current output, not proof of Material correctness.

## Operator feedback

An explicit user report of a visual defect overrides a weaker README status and must be reported as `rejected`.

When feedback says the component looks wrong, crooked, malformed, or visually incorrect:

- treat the complete affected visible surface as unresolved;
- inspect anatomy, geometry, content composition, clipping, state endpoints, and motion;
- do not narrow the finding to the first plausible variable;
- do not report `awaiting re-review` unless production behavior actually changed and all affected objective surfaces were rechecked;
- never infer acceptance from silence, tests, screenshots, technical routing, or prior audit wording.

Objective structural conformance is reviewer-owned. Do not delegate anatomy, geometry, bounds, clipping, ownership, endpoint, or CSS naming decisions to operator review.

## Canonical source and inventory status

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

Classify every official item as exactly one of:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or invalid;
- unresolved;
- outside the resolved family boundary.

Invalid combinations are constraints, not absent capability. Optional guidance is not automatically required capability.

## Required Stage 1 — implementation against project documentation

Check independently:

- API, defaults, semantics, accessibility, controlled state, invalid combinations, and extensions;
- physical owner, public export, consumers, and migration state;
- every documented token, state, motion, geometry, and final property route;
- current tests, stories, and verification claims;
- normalization/fallback outputs, warning text, documentation, and tests for each materially different branch;
- every known defect, missing proof, shared blast radius, source limitation, and operator rejection.

A declaration, alias, class name, story, test title, screenshot, or green check is not implementation proof by itself.

## Mandatory geometry ownership review

For every visible interactive component, independently identify the concrete DOM owner for:

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

Verify:

- shared roles on one element form a coherent official geometry;
- interaction bounds form one coherent rectangular region and reserve layout space where required;
- target regions do not overlap adjacent controls;
- representative center, edge, corner, and adjacency behavior is proved when target geometry is custom;
- visual container owns background, outline, elevation, shape, state layer, and clipped ripple as applicable;
- focus indication follows the intended visible target;
- content alignment and clipping are correct;
- state endpoints remain visibly correct for resting, hover, focus, press, selection, disabled, and simultaneous states.

Report a high-severity finding when an absolutely positioned descendant target extends beyond its semantic host and creates a cross-shaped, partial, overlapping, or non-layout interaction region.

A component cannot be `implemented and verified` while the geometry map is missing, contradictory, or inconsistent with rendered bounds.

## Final rendered-owner proof

For every visible route, prove:

1. official meaning or explicit project-extension meaning;
2. valid source and custom-property namespace;
3. correct concrete DOM owner;
4. actual owner bounds where relevant;
5. final computed/rendered result;
6. state precedence, clipping, and interaction with adjacent layers.

Numeric equality on the wrong element is not proof.

For shape tokens, checking only a `border-radius` number is insufficient. Verify the actual visible container and the complete visible endpoint. A pressed button that visibly becomes rectangular or malformed is a confirmed implementation defect even when the radius variable matches a documented token.

## CSS custom-property namespace review

Inventory every custom-property declaration added or materially used by the family and classify it as:

- exact official `--md-ref-*`, `--md-sys-*`, or `--md-comp-*` token;
- justified `--md-private-<owner>-<semantic-role>` implementation route;
- genuine `--app-*` application token;
- invalid or unnecessary alias.

Report a finding when:

- an invented `--md-*` name looks public or canonical;
- an official path is shortened or converted to a raw CSS-property name;
- a private route omits `private`;
- a private route describes mechanism rather than semantic ownership;
- a one-use constant is routed through an unnecessary variable;
- a variable cannot affect the correct final owner.

Names such as these are invalid:

```text
--md-button-border-radius
--md-button-height
--md-button-padding-left
--md-button-icon-gap
```

A visible capability routed through an invalid namespace cannot be classified as fully implemented.

## Motion and state endpoint review

Verify the shared motion foundation deeply once. At component level require proportional proof that:

- real input activates the intended property on the correct visual owner;
- an intermediate state is sampled only when needed to prove the route;
- the correct visible endpoint is reached;
- interruption/cancellation leaves no stale state;
- reduced-motion behavior is correct when owned.

A named interruption test must trigger the competing event before the first transition settles and prove the competing branch began.

Do not claim motion fixed when only event timing changed but the visible endpoint, owning geometry, or rendered shape remains wrong.

Forced state proves appearance only. A screenshot baseline proves regression stability only.

## Required Stage 2 — project documentation against Material 3 Expressive

Check:

- official family mapping and boundary;
- source status and inventory claims;
- variants, sizes, shapes, modes, defaults, states, semantics, accessibility, and invalid combinations;
- official anatomy and geometry relationships;
- color, elevation, icon, motion, shape, typography, state-layer, ripple, and focus meanings;
- exact token names, values, routes, namespaces, and final owners;
- classification of implemented, partial, absent, invalid, unresolved, and out-of-family capability;
- explicit extensions and deviations;
- whether cited sources actually support each claim.

Use the Design Kit when published documentation cannot resolve an objective anatomy, geometry, alignment, or state-composition decision. Do not use operator review as a substitute for available official visual evidence.

## Severity and result

Use:

- `critical` — unsafe semantics, accessibility, or severe interaction corruption;
- `high` — required API/state/token/motion/ownership, major anatomy or geometry, target region, visible state endpoint, invalid public-looking token namespace, or unchanged operator-rejected behavior is wrong;
- `medium` — bounded mismatch, incomplete proof, misleading documentation, fallback inconsistency, or non-critical canonical divergence;
- `low` — minor documentation or cleanup defect.

Overall result:

- `compliant` — no finding remains and current canonical evidence is sufficient;
- `partially-compliant` — only non-critical gaps remain;
- `non-compliant` — any critical or high finding exists;
- `blocked` — required authoritative evidence is unavailable or conflicting.

A high-severity anatomy, geometry, target, shape, final-owner, invalid-namespace, or unchanged visual-rejection finding requires `non-compliant`.

A stale snapshot alone prevents fully current `compliant` status.

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
### Project documentation reviewed
### Material 3 Expressive evidence
### Operator feedback considered

## Geometry ownership map
## CSS custom-property namespace review

## Official capability coverage
### Implemented and verified
### Partial / defective / unverified
### Not implemented
### Officially unsupported / invalid combinations
### Unresolved evidence
### Outside this family boundary

## Stage 1 — implementation vs project documentation
### Findings
### Verified agreement

## Stage 2 — project documentation vs Material 3 Expressive
### Findings
### Verified agreement

## Evidence gaps
## Required next work
```

Use explicit `none` for empty categories. The Not implemented list is independently verified, not copied from README.

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
Geometry ownership:
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

A review is complete only after AUDIT is replaced and the reviewer has independently checked geometry ownership, final rendered owners, CSS namespaces, operator feedback, named-risk proof, normalization consistency, compliance, and coverage.

Do not report `partially-compliant` when a high-severity structural or unchanged visible defect remains.
