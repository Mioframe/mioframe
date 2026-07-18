# Material implementation review

This document separates authoring documentation, independent technical/canonical review, and final operator visual comparison.

## Generalization boundary

Review policy contains only artifact-independent evidence, severity, contradiction, and ownership rules.

Do not add concrete family selectors, DOM node names, custom-property names, token values, state endpoints, bug symptoms, or proposed family structures.

Concrete findings belong in the reviewed owner README and AUDIT. A pilot finding may refine shared review policy only through a rule applicable to every artifact owning the same risk.

## Review ownership

Each active owner contains:

```text
README.md   # authoring-owned current implementation documentation
AUDIT.md    # independent reviewer-owned result
```

Authoring never edits AUDIT. Review changes only AUDIT.

The reviewer keeps separate:

1. current implementation evidence;
2. current project documentation claims;
3. official Material 3 Expressive evidence from the current run;
4. explicit operator feedback;
5. current-diff scope evidence when available.

Source-control history is not Material authority. The current diff may be inspected for unrelated changes, missing cleanup, accidental compatibility paths, ownership drift, and regression risk.

## Canonical source and inventory status

Use `source-of-truth.md`.

A current successful Material MCP read is working current evidence when all required routes were read and none is reported partial, failed, suspicious, truncated, or conflicting. Capture age alone is not a review finding.

Classify every official item exactly once:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or invalid;
- unresolved;
- outside the resolved owner boundary.

Invalid combinations are constraints, not absent capability. Optional guidance is not automatically required capability.

## Review posture

Review is contradiction-seeking, not documentation-confirming.

The reviewer must attempt to disprove material claims before accepting them. A claim repeated in several artifacts becomes higher-risk, not automatically stronger.

For each materially repeated claim, compare applicable:

```text
production implementation
README
Storybook story and description
component contract tests
browser and visual tests
shared-owner documentation
verification report
operator feedback
```

Report contradictions such as:

- different owners named for the same rendered property;
- superseded anatomy retained in stories or documentation;
- a test title claiming a condition its setup never enters;
- warning text describing a different normalization branch;
- forced state presented as acquisition or transition proof;
- an intermediate alias presented as final rendered proof;
- operator rejection weakened without explicit acceptance;
- implementation strategy claiming repair while retaining conflicting structural models.

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
- known defects, source limitations, proof gaps, and operator rejection;
- authoring diagnosis and repair/restructure/replace strategy.

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
- weakened or omitted operator feedback;
- parallel or superseded models retained after restructuring;
- contradictions among implementation, README, stories, tests, and verification.

A declaration, alias, placeholder, story, screenshot, test title, or green check is not proof by itself.

## Diagnosis and strategy review

Verify every material problem was classified correctly:

- `canonical-behavior`;
- `implementation-defect`;
- `architecture-defect`;
- `foundation-defect`;
- `evidence-gap`;
- `product-deviation`.

Verify the chosen implementation strategy:

- `repair` preserves only a sound contract and ownership model;
- `restructure` removes superseded anatomy, ownership, and proof paths;
- `replace` removes obsolete implementations and hidden compatibility routes unless explicitly required.

If two correction rounds retain the same objective defect, add workarounds, or create new ownership ambiguity, report that the strategy must be reconsidered.

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
- applicable visible endpoints and simultaneous-state precedence are correct;
- every DOM node has a necessary responsibility.

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

Report a finding when an official path is invented, shortened, paraphrased, converted to a raw CSS-property alias, named after a rendering mechanism instead of a semantic role, or replaced by unnecessary private indirection.

An ad-hoc name shaped like `--md-<artifact>-<raw-css-property>` is invalid unless it is an exact official canonical token.

## Stage 2 — project documentation against Material

Independently review applicable:

- official family/domain mapping and boundary;
- current-run source and inventory claims;
- variants, configurations, states, semantics, accessibility, and invalid combinations;
- official anatomy and geometry relationships;
- color, elevation, icon, motion, shape, typography, interaction, ripple, and focus meanings;
- exact token names, values, routes, namespaces, and final owners;
- implementation/partial/absent/invalid/unresolved/out-of-boundary classification;
- extensions and deviations;
- whether cited evidence supports every claim.

Use official visual evidence or the Design Kit when text/token tables cannot resolve an objective anatomy, geometry, alignment, or state-composition decision.

## Motion and lifecycle evidence

Distinguish:

- forced-state endpoint evidence;
- real-input acquisition and release;
- intermediate trajectory evidence when endpoints cannot reveal composition defects;
- interruption/cancellation and cleanup;
- operator-perceived quality.

Require proportional proof for applicable:

- real input activates the intended property on the correct owner;
- bounds and layer composition remain valid during the transition when at risk;
- correct visible endpoints are reached;
- interruption or cancellation leaves no stale state;
- reduced motion is correct when owned.

A named interruption test must trigger the competing event before settlement and prove the competing branch begins.

Do not claim motion fixed when only timing changes but the final owner, endpoint, trajectory composition, or rendered result remains wrong.

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

The agent and reviewer own objective correctness, including anatomy, ownership, geometry, clipping, visible endpoints, token interpretation, CSS naming, accessibility, behavior, lifecycle proof, documentation consistency, and test sufficiency.

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
- `high` — required API/state/token/motion/ownership, major anatomy or geometry, interaction region, visible endpoint, invalid public-looking namespace, unresolved contradiction, non-causal lifecycle proof, or unchanged operator-rejected behavior is wrong;
- `medium` — bounded mismatch, incomplete proof, misleading documentation, fallback inconsistency, mechanism-named private route, or non-critical canonical divergence;
- `low` — minor documentation or cleanup defect.

Overall result:

- `compliant` — no finding remains and canonical evidence is sufficient;
- `partially-compliant` — only non-critical gaps remain;
- `non-compliant` — any critical or high finding exists;
- `blocked` — required authoritative evidence is unavailable or conflicting.

## Calibration and correction loop

```text
objective finding or operator feedback
→ classify the defect and actual owner
→ decide whether the workflow missed the class or execution ignored an existing rule
→ refine universal policy only for a real cross-artifact gap
→ run authoring from contract reconstruction
→ run independent contradiction-seeking review
→ operator review only after objective gates close
```

Do not add a new universal rule when the existing rule already prohibited the defect. In that case, strengthen checklist execution or report agent non-compliance.

Authoring never edits AUDIT. Review never edits README.

## Concise AUDIT

AUDIT records:

```text
result and source status
evidence inspected
contradictions
objective findings by severity
evidence gaps
operator status
required next work
```

Do not duplicate the complete family contract or every verified token/value from README.

## Completion gate

An owner leaves active work only when:

- implementation and README agree;
- repeated claims across stories, tests, and verification contain no unresolved contradiction;
- documentation accurately represents Material and source limitations;
- classification is complete for available evidence;
- every partial, unsupported, unresolved, extended, deviated, and remaining item is explicit;
- diagnosis and implementation strategy are sound;
- applicable ownership and namespaces are correct;
- shared routes have representative proof;
- consumers and obsolete ownership are handled;
- local verification passes;
- required visual review is explicitly accepted.
