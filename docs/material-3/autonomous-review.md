# Material implementation review

This document separates authoring documentation, independent technical/canonical review, and final operator visual comparison.

## Generalization boundary

Review policy contains only artifact-independent evidence, severity, and ownership rules.

Do not add concrete family selectors, DOM node names, custom-property names, token values, state endpoints, bug symptoms, or proposed family structures.

Concrete findings belong only in the reviewed owner README and AUDIT. A finding from one pilot may refine shared review policy only through a rule applicable to every artifact owning the same risk.

## Review ownership

Each active owner contains:

```text
README.md   # authoring-owned current implementation documentation
AUDIT.md    # independent reviewer-owned result
```

Authoring never edits AUDIT. Review changes only AUDIT.

The reviewer uses four separate evidence sets:

1. current implementation;
2. current project documentation;
3. official Material 3 Expressive evidence;
4. explicit operator feedback from the current task and README.

Do not use source-control history or remote state as implementation evidence.

## Canonical source and inventory status

Record canonical source status:

- `current-complete`;
- `snapshot-complete-stale`;
- `partial`;
- `conflicting`;
- `unavailable`.

Record inventory status:

- `complete`;
- `snapshot-complete (<snapshot>; currentness unverified)`;
- `incomplete (<exact gap>)`;
- `blocked (<exact reason>)`.

A stale, partial, truncated, suspicious, missing, or spot-check-only source cannot certify current completeness.

Classify every official item exactly once:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or invalid;
- unresolved;
- outside the resolved owner boundary.

Invalid combinations are constraints, not absent capability. Optional guidance is not automatically required capability.

## Stage 1 — implementation against project documentation

Independently review applicable:

- physical and semantic ownership;
- public API, exports, consumers, and migration state;
- native semantics and accessibility;
- configuration, controlled state, lifecycle, and normalization;
- anatomy, layout, interaction geometry, clipping, and content composition;
- token, state, motion, and final rendered-property routes;
- custom-property namespaces;
- tests, fixtures/stories, rendered evidence, and verification claims;
- known defects, source limitations, proof gaps, and operator rejection.

Report:

- documented behavior missing from implementation;
- undocumented implementation behavior;
- wrong owner or incomplete route;
- documentation claiming proof not established by evidence;
- absent capability hidden from classification;
- invalid capability misclassified as absent;
- optional guidance inflated into a requirement;
- partial capability called verified;
- shared routes without representative proof;
- weakened or omitted operator feedback.

A declaration, alias, placeholder, story, screenshot, test title, or green check is not proof by itself.

## Applicable ownership review

For a visible interactive component, identify each applicable owner and mark non-applicable roles:

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

- combined roles form coherent official anatomy;
- interaction geometry is contiguous, unambiguous, and backed by layout space where required;
- adjacent interactive regions do not conflict;
- custom geometry is proved at representative interior, boundary, exterior, and adjacency points;
- final visual properties use their correct owners;
- applicable visible endpoints and simultaneous-state precedence are correct.

Helper geometry that produces partial, disconnected, overlapping, or unreserved interaction regions is a high-severity defect.

## Final rendered-owner proof

For every visible route, prove:

1. official meaning or explicit extension meaning;
2. valid source and namespace;
3. correct concrete owner;
4. relevant owner bounds;
5. final computed and rendered result;
6. state precedence, clipping, and adjacent-layer interaction.

Numeric equality on the wrong element is not proof.

For shape, a scalar radius is insufficient when ownership, clipping, box geometry, corner model, or state composition can alter the visible result.

## CSS custom-property review

Classify every materially used custom property as:

- exact official `--md-ref-*`, `--md-sys-*`, or `--md-comp-*` token;
- justified semantic `--md-private-<owner>-<role>` route;
- genuine `--app-*` token;
- invalid or unnecessary alias.

Report a finding when an official path is invented, shortened, paraphrased, converted to a raw CSS-property alias, or replaced by an unnecessary private indirection.

An ad-hoc name shaped like `--md-<artifact>-<raw-css-property>` is invalid unless it is an exact official canonical token.

## Stage 2 — project documentation against Material

Independently review applicable:

- official family/domain mapping and boundary;
- source and inventory claims;
- variants, configurations, states, semantics, accessibility, and invalid combinations;
- official anatomy and geometry relationships;
- color, elevation, icon, motion, shape, typography, interaction, ripple, and focus meanings;
- exact token names, values, routes, namespaces, and final owners;
- implementation/partial/absent/invalid/unresolved/out-of-boundary classification;
- extensions and deviations;
- whether cited evidence supports every claim.

Use official visual evidence or the Design Kit when text/token tables cannot resolve an objective anatomy, geometry, alignment, or state-composition decision.

## Motion and lifecycle evidence

Require proportional proof for applicable:

- real input activates the intended property on the correct owner;
- an intermediate state is sampled only when needed;
- correct visible endpoints are reached;
- interruption or cancellation leaves no stale state;
- reduced motion is correct when owned.

A named interruption test must trigger the competing event before settlement and prove the competing branch begins.

Do not claim motion fixed when only timing changes but the final owner, endpoint, composition, or rendered result remains wrong.

Forced state proves appearance only. A screenshot baseline proves regression stability only.

## Shared route evidence

A shared route is resolved only when:

- affected consumers are identified;
- ownership is appropriately narrow;
- representative tests exercise the source through final output;
- documentation describes current ownership and blast radius.

Unchanged tests that never exercise the route do not close the gap.

## Operator feedback boundary

The operator reports visible problems or acceptance directly in a user message. No separate report file is required.

Authoring persists:

```text
Status: not reviewed | required | rejected | awaiting re-review | accepted
Latest operator feedback: none | <summary>
Implementation response: none | <summary>
```

The agent and reviewer own objective correctness, including:

- anatomy and ownership;
- layout and interaction geometry;
- clipping and alignment;
- visible state endpoints;
- token interpretation and CSS naming;
- accessibility and behavior;
- test sufficiency.

The operator owns final perceived fidelity after those gates are closed, including naturalness, polish, and perceived motion quality.

Rules:

- explicit visible rejection means `rejected`;
- broad rejection reopens the complete affected visible surface;
- authoring may set `awaiting re-review` only after production behavior changes and all affected objective surfaces are rechecked;
- only explicit user acceptance sets `accepted`;
- tests, screenshots, technical routing, review text, or silence do not imply acceptance.

## Severity and result

Use:

- `critical` — unsafe semantics, accessibility, or severe interaction corruption;
- `high` — required API/state/token/motion/ownership, major anatomy or geometry, interaction region, visible endpoint, invalid public-looking namespace, or unchanged operator-rejected behavior is wrong;
- `medium` — bounded mismatch, incomplete proof, misleading documentation, fallback inconsistency, or non-critical canonical divergence;
- `low` — minor documentation or cleanup defect.

Overall result:

- `compliant` — no finding remains and current canonical evidence is sufficient;
- `partially-compliant` — only non-critical gaps remain;
- `non-compliant` — any critical or high finding exists;
- `blocked` — required authoritative evidence is unavailable or conflicting.

A stale snapshot alone prevents fully current compliant status.

## Correction loop

```text
AUDIT findings or operator feedback
→ applicable authoring workflow
→ README/code/tests update
→ independent review
→ explicit acceptance or further feedback
```

Authoring never edits AUDIT. Review never edits README.

## Completion gate

An owner leaves active work only when:

- implementation and README agree;
- documentation accurately represents Material and source limitations;
- classification is complete for available evidence;
- every partial, unsupported, unresolved, extended, deviated, and remaining item is explicit;
- applicable ownership and namespaces are correct;
- shared routes have representative proof;
- consumers and obsolete ownership are handled;
- local verification passes;
- required visual review is explicitly accepted.

Full implementation additionally requires current-complete evidence and full official coverage for the resolved owner.
