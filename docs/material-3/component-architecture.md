# Material 3 component architecture

Official component families live under:

```text
src/shared/ui/material/components/<official-component-docs-slug>/
```

The directory slug follows the official Material documentation path. Example:

```text
m3.material.io/components/buttons
→ src/shared/ui/material/components/buttons
```

## Required family files

Every implemented or actively migrated family contains:

```text
README.md
AUDIT.md                    # created and replaced only by material-component-review
index.ts
<Component>.vue
<Component>.test.ts
<Component>.stories.ts
... only justified implementation files
```

`AUDIT.md` may be absent before the first independent review. Do not create empty report files.

Operator feedback is supplied in task messages and persisted in the family README. It does not require a separate report artifact.

## Workspace evidence boundary

Material authoring and review use:

- the current user task;
- current workspace files;
- current or traceable official Material sources;
- local project verification commands.

They do not use source-control or remote state as implementation evidence. Do not run, inspect, or cite `git`, `gh`, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history inside these workflows.

## Implementation scope and official inventory

Keep three concepts separate:

- **implementation scope** — coherent capability currently implemented for product scenarios;
- **official capability inventory** — official contract-level items identified from available canonical evidence;
- **official coverage** — how much actual official capability is implemented and verified.

Implementation may be incremental. Classification may not hide unused official capability.

Classify each item as exactly one of:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or an invalid combination;
- unresolved because canonical evidence is incomplete or conflicting;
- outside the resolved family boundary, with the separate official owner named.

`Not implemented` means a real published capability exists but Mioframe does not implement it.

An officially unsupported or invalid combination is a documented constraint, not a missing capability. It does not reduce coverage when Mioframe rejects or normalizes it coherently.

Optional or non-normative guidance is not automatically a capability. Record a relevant non-adoption under known issues, extensions, or deviations. It reduces coverage only when the canonical contract makes it required for the implemented surface.

## Canonical source status

Record:

```text
Canonical source status:
  current-complete
  snapshot-complete-stale
  partial
  conflicting
  unavailable

Official capability inventory:
  complete
  snapshot-complete (<snapshot>; currentness unverified)
  incomplete (<exact gap>)
  blocked (<exact reason>)

Official coverage:
  full
  partial
  unresolved
```

Use `complete` only when every current family page and required structured source is available and inspected without partial, truncated, suspicious, or unresolved coverage.

A stale snapshot may be snapshot-complete, but not current-complete. A partial cache, missing page, truncated graph, or spot-check-only review cannot certify a complete current inventory.

## README ownership

The family `README.md` is current project implementation documentation. Authoring updates it whenever implementation state changes.

It contains:

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

### Implemented

List only capability whose final owned output works. A declaration, alias, placeholder, story, or test is not implementation by itself.

### Partial / defective / unverified

Record implemented capability that is incomplete, defective, provisional, ambiguous, or not independently verified.

### Not implemented

List every real official capability that exists but is absent, independently of current consumer demand.

### Officially unsupported and invalid combinations

Record combinations or routes the official contract itself disallows, together with Mioframe rejection or normalization behavior.

### Known issues and required follow-up

Record every known defect, incomplete route, missing representative proof, unresolved source limitation, shared-foundation blast-radius gap, and required follow-up.

### Operator feedback and visual status

Use:

```text
Status: not reviewed | required | rejected | awaiting re-review | accepted
Latest operator feedback: none | <concise factual summary>
Implementation response: none | <what changed and what must be reviewed>
```

Rules:

- Explicit visual feedback from the current user message is authoritative.
- A reported defect or rejection is persisted as `rejected` in README.
- After a production behavior change, authoring may move `rejected` to `awaiting re-review` while preserving the feedback.
- Only an explicit user acceptance message may set `accepted`.
- Silence, tests, screenshots, technical routing, or an audit do not imply acceptance.

### Review status

Use one:

- `not reviewed`;
- `review required after changes`;
- `reviewed — see AUDIT.md`;
- `blocked — <reason>`.

Any production change affecting the documented contract sets `review required after changes`. Authoring never edits `AUDIT.md`.

## AUDIT ownership

`AUDIT.md` is the latest independent compliance and coverage review. `material-component-review` creates or replaces only this file.

The reviewer independently compares:

1. implementation against project documentation;
2. project documentation against canonical Material 3 Expressive.

The reviewer also verifies that README accurately preserves explicit operator feedback. It never invents acceptance.

## Compliance and coverage

Compliance describes agreement among implementation, truthful project documentation, and canonical evidence.

Coverage uses:

- `full` — every actual official capability is implemented and verified;
- `partial` — at least one actual official capability is absent, partial, defective, provisional, or unverified;
- `unresolved` — the inventory is not current-complete.

Officially unsupported combinations do not reduce coverage. Optional guidance does not reduce coverage unless required for the implemented surface.

## Public contract and ownership

Keep explicit:

- typed props, emits, and slots;
- native elements and DOM-critical attributes;
- controlled semantic state;
- anatomy and final rendered-property owners;
- invalid combinations and normalization;
- public exports and affected consumers.

Each semantic, interactive, accessibility, and rendered property has one owner.

## Tokens and routes

Use exact official meanings and the shortest route to the final property owner.

A route exists only when changing its source input can affect the final output through a real dependency. Colocation, aliases, equality assertions, comments, stories, and tests do not create a route.

When numeric spring parameters cannot drive CSS directly, record them as canonical evidence and use one honestly documented Web runtime adaptation. Do not describe the adaptation as the original spring model.

## Shared foundations and styles

Use a shared owner only for a real cross-family contract. Keep family-local behavior local.

Before changing root/system tokens, universal selectors, pseudo-elements, or shared formulas:

- identify current affected families from current code;
- prefer the narrowest valid owner;
- add representative proof that actually exercises the shared route;
- keep the issue open when blast radius remains unproved.

## Motion proof

Verify a shared motion foundation deeply once.

At component level, prove only:

- real input activates the intended rendered property;
- one meaningful intermediate state when needed;
- the correct endpoint;
- safe interruption or cancellation;
- consumption of the documented shared contract.

Do not require frame-by-frame component analysis. Do not duplicate equivalent input paths. Forced state proves appearance, not motion.

Perceived motion quality remains an operator decision communicated through user messages and persisted in README. A rejection remains open until behavior changes and the user explicitly accepts the new result.

## Migration

An end-to-end migration:

- creates the canonical official-docs-slug owner;
- migrates exports and consumers;
- removes obsolete implementation and exports;
- preserves accepted behavior except for documented changes;
- updates the family README truthfully;
- leaves no hidden or unclassified item.

## Completion

Implementation work is finished only when:

- code matches the implemented surface documented in README;
- source and inventory status are honest;
- every item is classified correctly;
- known visual rejection and shared proof gaps remain explicit;
- consumers and exports are migrated;
- obsolete ownership is removed;
- applicable local verification passes;
- README says `review required after changes`.

A family is compliant only after an independent audit. A family is fully implemented only when the audit reports current-complete evidence, `Official coverage: full`, and README records explicit operator acceptance when visual review is required.