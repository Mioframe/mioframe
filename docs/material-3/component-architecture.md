# Material 3 component architecture

Official component families live under:

```text
src/shared/ui/material/components/<official-component-docs-slug>/
```

The directory slug follows the resolved official Material documentation path.

## Generalization boundary

This architecture defines rules common to official component families.

Do not add concrete family selectors, DOM node names, custom-property names, token values, state endpoints, defect symptoms, or proposed family structures.

Concrete facts belong in the owning family README and AUDIT. A pilot finding may change this architecture only through an artifact-independent ownership, evidence, naming, diagnosis, or workflow rule.

## Required family files

Every implemented or actively migrated family contains only justified files, commonly:

```text
README.md
AUDIT.md                    # created and replaced only by independent review
index.ts
<Component>.vue
<Component>.test.ts
<Component>.stories.ts
... additional files only when they reduce current complexity
```

AUDIT may be absent before the first independent review. Do not create empty report files.

Operator feedback is supplied in task messages and persisted in README. It does not require a separate report artifact.

## Evidence boundary

Authoring and review use:

- the current user task;
- current workspace files;
- current successful Material MCP reads and official sources;
- local project verification commands.

Source-control history is not implementation or Material authority. The current diff may be inspected for scope, unrelated changes, missing cleanup, ownership drift, and regression risk.

## Scope, inventory, and coverage

Keep separate:

- **implementation scope** — coherent capability implemented for the explicit request and current consumers;
- **official capability inventory** — official contract-level items identified from canonical evidence;
- **official coverage** — how much official capability is implemented and verified.

Implementation may be incremental. Classification may not hide unused official capability.

Classify each item exactly once:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or invalid;
- unresolved;
- outside the resolved family boundary.

`Not implemented` means real official capability exists but is absent. An invalid combination is a constraint, not missing capability. Optional guidance is not automatically required capability.

Use source status from `source-of-truth.md`. A healthy current-run MCP read is working current evidence; capture age alone does not downgrade it.

## Contract reconstruction

Before production changes, reconstruct and record a compact family contract:

```text
official family and boundary
supported, unsupported, and unresolved capability
public API and native semantics
official anatomy
applicable DOM and rendered-property ownership
token sources and final owners
states and precedence
motion properties, endpoints, and Web adaptation
shared foundation dependencies
current defects and operator feedback
required proof
```

Do not derive this contract from the current implementation alone. Do not design tests around an unverified existing structure.

## Problem diagnosis

Every reported or discovered material problem receives one primary classification:

- `canonical-behavior` — observed behavior matches the official contract;
- `implementation-defect` — implementation does not satisfy the reconstructed contract;
- `architecture-defect` — public contract, anatomy, DOM ownership, or dependency structure is wrong;
- `foundation-defect` — the actual owner is a shared foundation or style;
- `evidence-gap` — available evidence cannot establish correctness;
- `product-deviation` — an explicit product requirement intentionally differs from Material.

Diagnosis identifies the actual owner and evidence. Do not change production code merely because a symptom appears in one component.

## Implementation strategy

Choose one strategy before changing production:

- `repair` — public contract, anatomy, and ownership are sound; defects are local;
- `restructure` — supported capability remains, but anatomy, ownership, or dependencies must change;
- `replace` — the implementation is based on a materially wrong contract or continued patching would preserve conflicting models.

Restructure or replace when several of anatomy, token routing, state model, motion ownership, DOM structure, or proof architecture are wrong.

If two correction rounds leave the same objective defect, add workarounds, or introduce new ownership ambiguity, stop patching and reconsider the strategy from the reconstructed contract.

## README ownership

README is current authoring-owned implementation documentation. It contains:

```text
# <Official family name>

## Official documentation mapping
## Implemented
## Partial / defective / unverified
## Not implemented
## Officially unsupported and invalid combinations
## Known issues and required follow-up
## Operator feedback and visual status
## Public API and semantics
## Applicable ownership
## Tokens, states, and property ownership
## Foundations and styles used
## Extensions and deviations
## Consumers and migration state
## Verification
## Review status
```

List under Implemented only capability whose final owned output works. Record every incomplete route, defect, missing proof, source limitation, shared blast-radius gap, and required follow-up explicitly.

### Operator feedback

Use:

```text
Status: not reviewed | required | rejected | awaiting re-review | accepted
Latest operator feedback: none | <concise factual summary>
Implementation response: none | <what changed and what must be reviewed>
```

- Explicit current feedback is authoritative.
- A reported visible defect means `rejected`.
- Broad feedback reopens the complete affected visible surface.
- Authoring may use `awaiting re-review` only after production behavior changes and all affected objective surfaces are rechecked.
- Only explicit user acceptance sets `accepted`.
- Silence, tests, screenshots, routing, or an audit do not imply acceptance.

### Review status

Use:

- `not reviewed`;
- `review required after changes`;
- `reviewed — see AUDIT.md`;
- `blocked — <exact reason>`.

Any production change affecting the documented contract sets review required. Authoring never edits AUDIT.

## AUDIT ownership

AUDIT is the latest independent compliance review. Review creates or replaces only this file.

The reviewer independently compares:

1. implementation against project documentation;
2. project documentation against canonical Material evidence;
3. repeated claims across production, README, stories, tests, verification, and operator feedback.

The reviewer checks objective anatomy, ownership, geometry, accessibility, state endpoints, token routes, CSS namespaces, causal evidence, strategy correctness, and accurate operator status.

AUDIT records findings and evidence gaps concisely; it does not duplicate the complete README contract.

## Public contract and ownership

Keep explicit applicable:

- typed props, emits, and slots;
- native elements and DOM-critical attributes;
- controlled semantic state;
- invalid combinations and normalization;
- public exports and affected consumers;
- semantic, interaction, accessibility, and final rendered-property owners.

For a visible interactive component, resolve applicable:

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

Mark non-applicable roles. Do not introduce elements for symmetry.

Each applicable concern has one unambiguous owner. Combined ownership is valid when official anatomy and rendered output remain coherent.

Every DOM node must own a necessary semantic, accessibility, layout, interaction, rendering, clipping/stacking, transition, or platform responsibility. A role map is not a required element count.

## Tokens and routes

Use exact official meanings and the shortest route to the correct final owner.

A route exists only when changing its source can affect final output through a real dependency. Colocation, aliases, equality assertions, comments, stories, screenshots, and tests do not create a route.

Every custom property is one of:

- an exact official token;
- a justified private semantic route;
- a genuine application token;
- an invalid or unnecessary alias.

Private names describe the semantic role they route, not the raw CSS mechanism used to render it.

Do not create ad-hoc public-looking names shaped like:

```text
--md-<artifact>-<raw-css-property>
```

Numeric equality on the wrong owner is not proof.

## Shared foundations and styles

Use a shared owner for an official shared contract or explicit shared-artifact request. Keep family-specific behavior local.

Before changing root/system tokens, universal selectors, pseudo-elements, shared formulas, or foundation lifecycle:

- identify affected consumers;
- prefer the narrowest valid owner;
- add representative proof through final output;
- keep remaining blast-radius uncertainty open.

A component must not patch a shared-foundation defect locally to avoid correcting the real owner.

## Ordered implementation gates

Implement applicable concerns in this order:

1. native semantics, API, and official anatomy;
2. layout, interaction geometry, and DOM/property ownership;
3. static geometry and visible endpoints;
4. exact token and state routing;
5. shared foundation integration;
6. real interaction lifecycle and motion;
7. exports, consumers, and obsolete-owner cleanup.

Do not preserve superseded models after a later gate replaces them.

## Motion and visible states

Verify shared motion deeply once.

At component level prove applicable:

- real input activates the intended rendered property on the correct owner;
- meaningful intermediate composition when endpoints alone cannot reveal a defect;
- correct visible endpoints;
- safe interruption or cancellation;
- consumption of the documented shared contract.

Forced state proves stable appearance only. It does not prove acquisition, trajectory, release, interruption, cancellation, or cleanup.

Do not claim motion fixed when timing changes but the final owner, endpoint, composition, or rendered property remains wrong.

Perceived polish remains an operator decision after objective gates close.

## Migration

An end-to-end migration:

- creates the canonical owner;
- migrates exports and consumers;
- removes obsolete Material ownership;
- preserves accepted behavior except documented corrections;
- updates README truthfully;
- leaves no hidden or unclassified item.

## Objective authoring gate

Before independent review, every applicable checklist item must have direct evidence and pass.

Authoring is not complete while any of these remains:

- incorrect or ambiguous anatomy/ownership;
- unnecessary DOM structure;
- invalid, mechanism-named, or unnecessary token route;
- misleading normalization, warning, or fallback documentation;
- forced-state evidence substituted for real behavior;
- contradiction among implementation, README, stories, tests, or verification claims;
- unproved shared blast radius;
- known objective defect delegated to operator review;
- failed or missing required verification.

## Completion

Implementation work is finished only when:

- the reconstructed contract and selected strategy are explicit;
- code and README agree;
- every item is classified correctly;
- applicable ownership and namespaces are correct;
- known rejection and evidence gaps remain explicit;
- consumers and exports are handled;
- obsolete ownership is removed;
- the objective authoring gate passes;
- applicable local verification passes;
- README says review required after changes.

A family is compliant only after independent review. Required perceived visual acceptance remains an additional operator gate.
