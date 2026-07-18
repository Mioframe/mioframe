# Material 3 component architecture

Official component families live under:

```text
src/shared/ui/material/components/<official-component-docs-slug>/
```

The directory slug follows the resolved official Material documentation path.

## Generalization boundary

This architecture defines rules common to official component families.

Do not add concrete family selectors, DOM node names, custom-property names, token values, state endpoints, defect symptoms, or proposed family structures.

Concrete facts belong in the owning family README and AUDIT. Syntax placeholders and navigation examples never establish implementation behavior.

A pilot finding may change this architecture only through an artifact-independent ownership, evidence, naming, or workflow rule.

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
- current or traceable official Material sources;
- local project verification commands.

Do not use source-control history or remote workflow state as implementation evidence.

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

`Not implemented` means real official capability exists but is absent.

An invalid combination is a constraint, not missing capability. Optional guidance is not automatically required capability.

Record canonical source status:

- `current-complete`;
- `snapshot-complete-stale`;
- `partial`;
- `conflicting`;
- `unavailable`.

Record inventory status and coverage separately. A stale, partial, truncated, suspicious, missing, or spot-check-only source cannot certify current completeness.

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
## Tokens, states, and property ownership
## Foundations and styles used
## Extensions and deviations
## Consumers and migration state
## Verification
## Review status
```

List under Implemented only capability whose final owned output works.

Record every incomplete route, defect, missing proof, source limitation, shared blast-radius gap, and required follow-up explicitly.

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

AUDIT is the latest independent compliance and coverage review. Review creates or replaces only this file.

The reviewer independently compares:

1. implementation against project documentation;
2. project documentation against canonical Material evidence.

The reviewer also checks objective anatomy, ownership, geometry, accessibility, state endpoints, token routes, CSS namespaces, evidence sufficiency, and accurate preservation of operator feedback.

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

Each applicable concern has one unambiguous owner. Combined ownership is valid only when official anatomy and rendered output remain coherent.

## Tokens and routes

Use exact official meanings and the shortest route to the correct final owner.

A route exists only when changing its source can affect final output through a real dependency. Colocation, aliases, equality assertions, comments, stories, screenshots, and tests do not create a route.

Every custom property is an exact official token, justified private semantic route, genuine application token, or invalid/unnecessary alias.

Do not create ad-hoc public-looking names shaped like:

```text
--md-<artifact>-<raw-css-property>
```

Numeric equality on the wrong owner is not proof.

## Shared foundations and styles

Use a shared owner for an official shared contract or explicit shared-artifact request. Keep family-specific behavior local.

Before changing root/system tokens, universal selectors, pseudo-elements, or shared formulas:

- identify affected consumers;
- prefer the narrowest valid owner;
- add representative proof through final output;
- keep remaining blast-radius uncertainty open.

## Motion and visible states

Verify shared motion deeply once.

At component level prove applicable:

- real input activates the intended rendered property on the correct owner;
- one meaningful intermediate state when needed;
- correct visible endpoints;
- safe interruption or cancellation;
- consumption of the documented shared contract.

Do not claim motion fixed when timing changes but the final owner, endpoint, composition, or rendered property remains wrong.

Perceived polish remains an operator decision after objective technical gates are closed.

## Migration

An end-to-end migration:

- creates the canonical owner;
- migrates exports and consumers;
- removes obsolete Material ownership;
- preserves accepted behavior except documented corrections;
- updates README truthfully;
- leaves no hidden or unclassified item.

## Completion

Implementation work is finished only when:

- code and README agree;
- source and inventory status are honest;
- every item is classified correctly;
- applicable ownership and namespaces are correct;
- known rejection and proof gaps remain explicit;
- consumers and exports are handled;
- obsolete ownership is removed;
- applicable local verification passes;
- README says review required after changes.

A family is compliant only after independent review. Full implementation additionally requires current-complete evidence, full official coverage, and explicit operator acceptance when visible review is required.
