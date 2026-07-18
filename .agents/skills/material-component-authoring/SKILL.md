---
name: material-component-authoring
description: 'Use for creating, migrating, aligning, or materially changing an official public Material component family. Owns source resolution, family documentation, production implementation, consumer migration, structural conformance, proportional proof, and local verification.'
paths:
  - 'src/shared/ui/material/components/**'
---

# Material component authoring

Use after the official family is resolved.

## Workspace boundary

Use only the current user task, current workspace files, official Material sources, and local project verification commands.

Do not run, inspect, or cite git, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history.

Authoring never edits `AUDIT.md`.

## Required inputs

Read:

- current user message and explicit operator feedback;
- current official sources through `material3-guidelines`;
- applicable repository and scoped `AGENTS.md` files;
- `src/shared/ui/material/components/AGENTS.md`;
- component architecture, token, testing, and authoring-checklist documents;
- family README and AUDIT when present;
- current implementation, exports, consumers, tests, stories, and applicable shared owners.

Treat prior audit findings as claims to investigate, not authority.

## Generalization boundary

Shared skills define cross-family invariants only.

Do not add family selectors, custom-property names, token values, DOM node names, bug symptoms, or proposed family structures to this skill. Persist them in the owning family README and AUDIT.

A defect found during one migration may change this skill only through an artifact-independent rule that applies to any family owning the same kind of risk.

## Operator feedback

The family README persists:

```text
## Operator feedback and visual status
Status: not reviewed | required | rejected | awaiting re-review | accepted
Latest operator feedback: none | <concise factual summary>
Implementation response: none | <what changed and what must be reviewed>
```

Rules:

- a current user report of a visible defect sets `rejected` before implementation;
- preserve previous rejected or awaiting feedback unless explicitly superseded;
- only a production behavior change can move `rejected` to `awaiting re-review`;
- only explicit user acceptance can set `accepted`;
- tests, screenshots, comments, renamed contracts, audits, or silence do not imply acceptance.

When feedback is broad, preserve the complete affected surface as unresolved and inspect anatomy, geometry, content composition, clipping, state endpoints, and motion before selecting a root cause.

## 1. Resolve family and source status

1. Resolve the official family and documentation path.
2. Use the official documentation slug as the canonical directory.
3. Select `new-component`, `end-to-end-migration`, or `alignment-only`.
4. Inspect all available family pages and required structured sources.
5. Record canonical source status: `current-complete`, `snapshot-complete-stale`, `partial`, `conflicting`, or `unavailable`.
6. Reconstruct the capability inventory supported by that evidence.
7. Define the minimum coherent implementation surface required by the explicit request and current consumers.
8. Inspect current audit findings and README operator status.

Classify every official item exactly once:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or invalid;
- unresolved;
- outside the family boundary.

Invalid combinations are not absent capability. Optional guidance is not automatically required capability.

Use current-complete evidence for a `complete` inventory claim. A stale complete snapshot may be snapshot-complete, never current-complete.

## 2. Update README before production

README records:

- official mapping, source status, inventory, and coverage;
- implemented, partial, absent, invalid, unresolved, and out-of-family capability;
- known issues and operator status;
- API, semantics, applicable geometry ownership, tokens, states, foundations, extensions, consumers, verification, and review status.

Set `Review status: review required after changes`.

A capability belongs under Implemented only when its final owned output works.

## 3. Resolve applicable ownership

For a visible interactive component, identify every applicable concrete owner:

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

Mark roles that do not apply. Do not invent elements or wrappers for symmetry.

Record the map in README when ownership is not obvious from one coherent element.

Rules:

- shared roles on one element are valid only when official anatomy and rendered output remain coherent;
- numeric source values do not prove correct ownership;
- differing interaction and visual bounds must remain contiguous, non-overlapping, and supported by reserved layout space where required;
- final visual properties belong to their official visible owner;
- representative browser proof covers interior, boundary, exterior, and adjacency behavior when geometry is custom;
- helpers must not create partial, disconnected, overlapping, or unreserved interaction regions.

Objective anatomy and geometry defects are authoring defects, not operator-review tasks.

## 4. Inventory CSS custom properties

Classify every custom property added or materially touched as:

- exact official token: `--md-ref-*`, `--md-sys-*`, or `--md-comp-*`;
- justified private route: `--md-private-<owner>-<semantic-role>`;
- genuine application token: `--app-*`;
- invalid or unnecessary alias.

Do not create an ad-hoc public-looking name shaped like `--md-<artifact>-<raw-css-property>`.

Use exact official names without shortening or paraphrasing. Private names describe semantic ownership, not only the rendering mechanism.

Do not create a variable for a constant used once. Use a direct declaration when runtime indirection is unnecessary.

A visible route through an invalid namespace or wrong owner cannot be implemented and verified.

## 5. Implement the shortest correct route

- Keep props, emits, slots, native semantics, and controlled state explicit.
- Keep family behavior local unless a real shared owner exists.
- Use exact official token meanings.
- Configuration selects sources; state resolves output; rendering applies values to the correct final owner.
- A route exists only when changing its source can affect final output through a real dependency.
- Colocation, aliases, comments, class names, stories, tests, and equality assertions do not create a route.
- Add no speculative API, registry, resolver, CSS DSL, universal base, or unnecessary file.

Before changing a root/system token, universal selector, pseudo-element, or shared formula:

1. identify affected consumers;
2. prefer the narrowest valid owner;
3. prove the route through representative final outputs;
4. keep the issue open when blast radius is unproved.

## 6. Prove final rendered ownership

For every visible route, prove:

1. official meaning or explicit project-extension meaning;
2. valid source namespace;
3. correct concrete owner;
4. relevant owner bounds;
5. final computed and rendered output;
6. state precedence, clipping, and adjacent-layer interaction.

For shape, a scalar radius is insufficient when ownership, clipping, box geometry, corner model, or state composition can alter the visible result. Verify all applicable visible endpoints on the official shape owner.

## 7. Normalize consistently

For each materially different input class, align:

- actual returned, emitted, or rendered output;
- semantics and accessibility;
- warning or error text;
- README and API documentation;
- test assertions.

A clamped result, ignored input, rejected combination, and fallback mode are distinct contracts.

## 8. Prove motion and lifecycle proportionally

Verify shared motion deeply once. At component level prove only applicable:

- real input activates the intended rendered property on the correct owner;
- one meaningful intermediate state when needed;
- correct visible endpoints;
- safe interruption or cancellation;
- reduced motion when owned.

A named interruption test triggers the competing event before the first transition settles and proves the competing branch began.

Do not claim motion fixed when only timing changes while the final visible owner, endpoint, composition, or rendered property remains wrong.

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
- one stable canonical story using real production anatomy and representative real children when their geometry or behavior is claimed.

Add browser, pure, consumer, state-matrix, and visual-regression proof only for owned risks.

Browser geometry proof asserts relationships between actual owners, not merely one convenient point or one computed scalar.

A test cannot repair a missing dependency or wrong owner.

## 11. Finish

After implementation:

1. rebuild classification from available official sources;
2. update README honestly;
3. preserve permitted operator-status transitions;
4. verify applicable ownership and namespace inventories;
5. verify every named-risk test enters its claimed condition;
6. verify normalization, warnings, documentation, and tests agree;
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
Ownership:
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

Do not report implementation finished while applicable ownership is unresolved, a visible endpoint is wrong, invalid custom-property names remain, broad feedback was narrowed without full investigation, shared blast radius is unproved, or verification fails.
