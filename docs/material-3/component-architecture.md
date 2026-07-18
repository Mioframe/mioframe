# Material 3 component architecture

Official component families live under:

```text
src/shared/ui/material/components/<official-component-docs-slug>/
```

The directory slug follows the official Material documentation path. For example:

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

`AUDIT.md` may be absent before the first review. Do not create an empty placeholder.

## Workspace evidence boundary

Material authoring and review use:

- current workspace files;
- current or traceable official Material sources;
- local project verification commands.

They do not use source-control or remote state as implementation evidence. Do not run, inspect, or cite `git`, `gh`, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history inside these workflows.

Historical provenance is not needed to judge the current owner, current contract, current consumers, or current behavior.

## Implementation scope and official inventory

Keep three concepts separate:

- **implementation scope** — coherent capability currently implemented for product scenarios;
- **official capability inventory** — the official contract-level items identified from available canonical evidence;
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

Do not expand the inventory into one row per token when coherent grouping preserves full traceability.

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

A stale snapshot may be snapshot-complete, but not current-complete. A partial cache, missing page, truncated graph, or spot-check-only review cannot certify a complete inventory.

Spot checks may verify specific implementation facts. They do not certify family completeness.

## `README.md` ownership

The family `README.md` is current project implementation documentation. The authoring workflow updates it whenever implementation state changes.

It contains:

```text
# <Official family name>

## Official documentation mapping
## Implemented
## Partial / defective / unverified
## Not implemented
## Officially unsupported and invalid combinations
## Known issues and required follow-up
## Public API and semantics
## Tokens, states, and property ownership
## Foundations and styles used
## Extensions and deviations
## Consumers and migration state
## Verification
## Review status
```

### Official documentation mapping

Record:

- official family and path;
- pages and structured sources inspected;
- snapshot or direct-verification metadata;
- Design Kit evidence only when used;
- canonical source status;
- inventory status;
- official coverage.

### Implemented

List only capability whose final owned output works.

A declaration, alias, placeholder, story, or test is not implementation by itself.

### Partial / defective / unverified

Record implemented capability that is incomplete, defective, provisional, ambiguous, or not independently verified.

Do not classify it as fully implemented or fully absent.

### Not implemented

List every real official capability that exists but is absent, independently of current consumer demand.

No-current-consumer may explain deferral. It does not permit omission.

### Officially unsupported and invalid combinations

Record combinations or routes the official contract itself disallows, together with Mioframe rejection or normalization behavior.

These entries do not reduce official coverage.

### Known issues and required follow-up

Record every:

- known defect;
- incomplete final route;
- missing representative proof;
- unresolved source limitation;
- shared-foundation blast-radius gap;
- awaiting or rejected visual comparison;
- required follow-up for the implemented surface.

Never use `none` while a relevant audit finding, failing check, unresolved source question, shared proof gap, or observed visual mismatch exists.

A known operator-rejected visual behavior stays open until production behavior changes, new evidence is prepared, and the operator accepts it. Documentation or test changes alone cannot close it.

### Review status

Use one:

- `not reviewed`;
- `review required after changes`;
- `reviewed — see AUDIT.md`;
- `blocked — <reason>`.

Any production change affecting the documented contract sets `review required after changes`. Authoring never edits `AUDIT.md`.

## `AUDIT.md` ownership

`AUDIT.md` is the latest independent compliance and coverage review. `material-component-review` creates or replaces only this file.

The reviewer independently compares:

1. implementation against project documentation;
2. project documentation against canonical Material 3 Expressive.

The audit uses only current workspace and official evidence. It contains no source-control or remote metadata.

The audit records:

```text
# <Family> implementation audit

Reviewed:
Result: compliant | partially-compliant | non-compliant | blocked
Canonical source status: current-complete | snapshot-complete-stale | partial | conflicting | unavailable
Official capability inventory: complete | snapshot-complete (...) | incomplete (...) | blocked (...)
Official coverage: full | partial | unresolved
Project implementation documentation: README.md
Visual review: not required | required | rejected | blocked | accepted

## Evidence
### Project documentation reviewed
### Material 3 Expressive evidence

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

The reviewer independently verifies the classifications rather than approving the README list.

## Compliance and coverage

Compliance describes agreement among implementation, truthful project documentation, and canonical evidence.

Coverage uses:

- `full` — every actual official capability is implemented and verified;
- `partial` — at least one actual official capability is absent, partial, defective, provisional, or unverified;
- `unresolved` — the inventory is not current-complete.

Officially unsupported combinations do not reduce coverage. Optional guidance does not reduce coverage unless required for the implemented surface.

A family may have a compliant implemented subset and partial coverage. It must not be called fully implemented.

## Family boundary

Multiple components share one directory only when official Material documentation treats them as one family or they share a real current contract.

Similar appearance or legacy adjacency is insufficient. Official capability outside the family is recorded with its separate owner, not as a missing current-family capability.

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

Unchanged tests that never exercise the route are not representative proof.

## Motion proof

Verify a shared motion foundation deeply once.

At component level, prove only:

- real input activates the intended rendered property;
- one meaningful intermediate state when needed to establish the route;
- the correct endpoint;
- safe interruption or cancellation;
- consumption of the documented shared contract.

Do not require frame-by-frame component analysis. Do not duplicate equivalent input paths. Forced state proves appearance, not motion.

Perceived motion quality remains an operator visual decision. A previous rejection is a confirmed open defect until accepted after a behavior change.

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

A family is compliant only after an independent audit. A family is fully implemented only when the audit reports current-complete evidence, `Official coverage: full`, and required visual acceptance.
