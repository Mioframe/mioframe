---
name: material-component-authoring
description: 'Use for creating, migrating, aligning, or materially changing an official public Material component family. Owns source lookup, implementation documentation, production work, consumer migration, structural conformance, proportional proof, and local verification.'
paths:
  - 'src/shared/ui/material/components/**'
---

# Material component authoring

Use this workflow after the official family is resolved.

## Workspace boundary

Use only current workspace files, official Material sources, the current user task, and local project verification commands.

Do not run, inspect, or cite git, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history.

Authoring never edits `AUDIT.md`.

## Required inputs

Read:

- the current user message and explicit operator feedback;
- current official sources through `material3-guidelines`;
- applicable repository and scoped `AGENTS.md` files;
- `src/shared/ui/material/components/AGENTS.md`;
- `docs/material-3/source-of-truth.md`;
- `docs/material-3/component-architecture.md`;
- `docs/material-3/component-tokens.md`;
- `docs/material-3/component-testing.md`;
- `docs/material-3/component-conversion-checklist.md`;
- family README and AUDIT when present;
- current implementation, exports, consumers, tests, stories, and applicable foundations.

Treat prior audit findings as current-workspace claims to investigate, not authority.

## Operator feedback

The family README persists:

```text
## Operator feedback and visual status
Status: not reviewed | required | rejected | awaiting re-review | accepted
Latest operator feedback: none | <concise factual summary>
Implementation response: none | <what changed and what must be reviewed>
```

Rules:

- A current user report of a visual defect sets `rejected` before implementation.
- Preserve previous rejected or awaiting feedback unless explicitly superseded.
- Only a production behavior change can move `rejected` to `awaiting re-review`.
- Only explicit user acceptance can set `accepted`.
- Tests, screenshots, comments, renamed contracts, audits, or silence do not imply acceptance.

When feedback is broad, such as “looks wrong”, “crooked”, or “malformed”:

- preserve the complete affected visible surface as unresolved;
- investigate anatomy, geometry, content composition, clipping, state endpoints, and motion;
- do not narrow the task to the first plausible variable;
- do not report awaiting re-review until the complete affected objective surface has been rechecked.

## 1. Resolve family and source status

1. Resolve the official family and documentation path.
2. Use the official documentation slug as the canonical directory.
3. Select `new-component`, `end-to-end-migration`, or `alignment-only`.
4. Inspect all available family pages and required structured sources.
5. Record canonical source status: `current-complete`, `snapshot-complete-stale`, `partial`, `conflicting`, or `unavailable`.
6. Reconstruct the capability inventory supported by that evidence.
7. Define the minimum coherent implementation surface required by current consumers.
8. Inspect every current audit finding and README operator record.

Classify every official item exactly once:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or invalid;
- unresolved;
- outside the family boundary.

Optional guidance is not automatically missing capability. Invalid combinations are not absent capability.

Use `complete` inventory only with current-complete evidence. A stale complete snapshot may be snapshot-complete, never current-complete. Spot checks cannot certify inventory completeness.

## 2. Update README before production

README must record:

- official mapping, source status, inventory, and coverage;
- implemented, partial, absent, invalid, unresolved, and out-of-family capability;
- known issues and operator status;
- API, semantics, geometry ownership, tokens, states, foundations, extensions, consumers, verification, and review status.

Set `Review status: review required after changes`.

A capability belongs under Implemented only when its final owned output works.

## 3. Mandatory geometry ownership map

Before changing or approving a visible interactive component, identify the concrete DOM owner for every applicable role:

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

Record the map in README when roles are not all owned by one obvious coherent element.

Rules:

- Shared roles on one element are valid only when the resulting geometry matches official anatomy.
- Numeric token values do not prove that the correct element owns them.
- A minimum interactive target larger than the visual container must form one coherent rectangular layout and hit region.
- Layout must reserve target space needed to avoid overlap with adjacent controls.
- The visual container remains the owner of background, outline, elevation, shape, state layer, and clipped ripple.
- Focus indication follows the intended visible target.
- Test representative center, edges, corners, and adjacency when custom hit geometry exists.
- Do not use an absolutely positioned descendant target extending outside its semantic host when it creates a cross-shaped, partial, overlapping, or non-layout hit region.

Objective anatomy and geometry defects are authoring defects, not operator-review tasks.

## 4. CSS custom-property namespace inventory

Inventory every custom-property declaration added or materially touched.

Classify each as:

- exact official token: `--md-ref-*`, `--md-sys-*`, or `--md-comp-*`;
- justified private route: `--md-private-<owner>-<semantic-role>`;
- genuine application token: `--app-*`;
- invalid or unnecessary alias.

Do not create an ad-hoc public-looking `--md-<component>-*` namespace.

Invalid examples:

```text
--md-button-border-radius
--md-button-height
--md-button-padding-left
--md-button-icon-gap
```

Use exact official names without shortening or paraphrasing. Private names describe semantic Material ownership, not only raw CSS properties.

Do not create a variable for a constant used once. Use a direct declaration when runtime indirection is unnecessary.

A visible route through an invalid namespace or wrong owner cannot be classified as implemented and verified.

## 5. Implement the shortest correct route

- Keep props, emits, slots, native semantics, and controlled state explicit.
- Keep family-specific behavior local unless a real cross-family owner exists.
- Use exact official token meanings.
- Configuration selects sources; state resolves output; rendering applies values to the correct final owner.
- A route exists only when changing the source can affect final output through a real dependency.
- Colocation, aliases, comments, class names, stories, tests, and equality assertions do not create a route.
- Add no speculative API, registry, resolver, CSS DSL, universal base, or unnecessary file.

Before changing a root/system token, universal selector, pseudo-element, or shared formula:

1. identify current affected families;
2. prefer the narrowest valid owner;
3. prove the route through representative final outputs;
4. keep the issue open when blast radius is unproved.

## 6. Final rendered-owner proof

For every visible property route, prove:

1. official meaning or explicit project-extension meaning;
2. valid source namespace;
3. correct concrete DOM owner;
4. actual owner bounds when geometry matters;
5. final computed/rendered output;
6. state precedence, clipping, and adjacent-layer interaction.

For shape tokens, checking only a border-radius number is insufficient. Verify the actual visual container and complete visible endpoints for resting, pressed, selected, disabled, and simultaneous states.

A visibly rectangular or malformed pressed endpoint is a confirmed defect even if a scalar token lookup is numerically correct.

## 7. Normalization and fallback consistency

For each materially different input class, align:

- actual returned, emitted, or rendered output;
- semantics and accessibility;
- warning or error text;
- README and API documentation;
- test assertions.

A clamped result, ignored input, rejected combination, and fallback mode are distinct contracts.

## 8. Motion and lifecycle proof

Verify shared motion deeply once. At component level prove only:

- real input activates the intended rendered property on the correct owner;
- one meaningful intermediate state when needed;
- the correct visible endpoint;
- safe interruption or cancellation;
- reduced motion when owned.

A named interruption test must trigger the competing event before the first transition settles and prove the competing branch began.

Do not claim motion fixed when only lifecycle timing changed but the visible endpoint, geometry owner, or shape remains wrong.

Forced state proves appearance only. Screenshot baselines prove regression stability only.

## 9. Migrate consumers and ownership

For end-to-end migration:

1. create the canonical directory;
2. update the curated Material export;
3. migrate every affected consumer;
4. preserve accepted behavior except documented corrections;
5. remove obsolete files and exports;
6. record migration state honestly.

## 10. Build proportional proof

Every new or migrated visible component requires:

- colocated component-contract tests;
- one stable canonical visual story using real production anatomy and representative real child components.

Add browser, pure, consumer, StateMatrix, and visual-regression proof only for owned risk.

Browser geometry proof must assert relations between semantic host, interaction target, visual container, content, and adjacent controls—not merely one convenient point or one computed scalar.

A test cannot repair a missing implementation dependency or wrong owner.

## 11. Finish

After implementation:

1. rebuild classification from available official sources;
2. update README honestly;
3. preserve permitted operator-status transitions;
4. verify geometry ownership and CSS namespace inventories are complete;
5. verify every named-risk test enters its claimed condition;
6. verify normalization and warnings agree;
7. run focused and final applicable local verification;
8. leave AUDIT unchanged;
9. recommend `material-component-review <family>`.

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
Geometry ownership:
CSS custom-property namespace review:
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

Do not report implementation finished while geometry ownership is unresolved, a visible endpoint is wrong, invalid custom-property names remain, broad feedback was narrowed without full investigation, shared blast radius is unproved, or verification fails.