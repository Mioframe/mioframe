---
name: material-component
description: 'Use when the user provides a Material component or family name and wants it created, implemented, migrated, or aligned. Resolve the official documentation family and run material-component-authoring.'
---

# Material component

Use this as the one-name entrypoint for Material 3 Expressive component work.

## Input

```text
material-component Button
material-component Switch
material-component Navigation rail
```

The component name is sufficient. Do not ask the user to predefine variants, API, sources, files, tests, consumers, or expected omissions.

## Workspace boundary

Work from the current workspace only.

Do not run, inspect, or cite `git`, `gh`, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history. Source-control provenance is not implementation, project-contract, or Material evidence.

Local verification means project commands such as formatting, linting, type checking, tests, Storybook, and build commands.

## Resolve the target

1. Resolve the current official Material family and documentation path.
2. Use the official documentation slug as the canonical directory name.
3. Inspect current implementations, public exports, consumers, family `README.md`, colocated `AUDIT.md`, tests, stories, and applicable shared owners.
4. Reconstruct the official contract-level capability inventory from the available official Material 3 Expressive sources.
5. Record canonical source status:
   - `current-complete`;
   - `snapshot-complete-stale`;
   - `partial`;
   - `conflicting`;
   - `unavailable`.
6. Select:
   - `new-component` when no implementation exists;
   - `end-to-end-migration` when a legacy owner exists;
   - `alignment-only` when the canonical owner exists but is incomplete or incorrect.
7. Resolve the minimum coherent implementation surface required by current consumers.

Example:

```text
m3.material.io/components/buttons
→ src/shared/ui/material/components/buttons
```

Do not infer canonical ownership from a legacy folder name.

Current consumer need determines implementation priority. It does not determine inventory coverage.

## Capability classification

Classify each relevant official item as exactly one of:

- implemented and verified;
- partial, defective, provisional, or unverified;
- not implemented;
- officially unsupported or an invalid combination;
- unresolved because canonical evidence is incomplete or conflicting;
- outside the resolved family boundary, with the separate official owner named.

An officially unsupported or invalid combination is not a missing capability and does not reduce official coverage.

Optional guidance or a non-normative recommendation is not automatically a capability. Record a relevant choice under known issues, extensions, or deviations. It reduces coverage only when the official contract makes it required for the implemented surface.

Use:

```text
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

`complete` requires every current family page and required structured source to be available and inspected without a partial, truncated, or suspicious source result. Spot checks may verify implementation details, but cannot certify a complete family inventory.

## Documentation-first rule

Before implementation, create or update the family `README.md` using `docs/material-3/component-architecture.md`.

The README must state explicitly:

- official pages and source status;
- inventory status and official coverage;
- implemented capability;
- partial, defective, provisional, or unverified capability;
- every actual official capability not implemented;
- officially unsupported or invalid combinations;
- unresolved evidence and family-boundary items;
- known issues and required follow-up;
- API, semantics, states, tokens, dependencies, extensions, consumers, and verification;
- `Review status: review required after changes`.

Do not hide incomplete work to make the result appear successful.

A known operator-rejected visual behavior remains open until production behavior changes, new evidence is prepared, and the operator accepts the corrected result. Renaming a contract, changing documentation, or replacing a test cannot close a rejected visual defect.

## Run the authoring workflow

Load `material-component-authoring` and continue through implementation, consumer migration, proportional proof, obsolete-owner removal, documentation update, and local verification.

The implementing workflow does not edit `AUDIT.md`. After implementation, recommend:

```text
material-component-review <resolved-family>
```

## Result

Finish with:

```text
MATERIAL COMPONENT RESULT
Requested name:
Resolved official family:
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
Known issues / follow-up:
Consumers migrated:
Foundation/style changes:
Local verification:
Family documentation:
Visual status: not required | required | rejected | blocked | accepted
Review required: yes | no
Status: implementation finished | blocked (<exact reason>)
```

`implementation finished` means the current implementation task, family README, and applicable local verification agree. It does not mean full official coverage, current-source certification, successful independent audit, or operator visual acceptance.
