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

## Resolve the target

1. Resolve the current official Material family and documentation path.
2. Use the official documentation slug as the canonical directory name.
3. Inspect current implementations, public exports, consumers, family `README.md`, colocated `AUDIT.md`, tests, and stories.
4. Reconstruct the complete official capability inventory for the resolved family from current Material 3 Expressive documentation.
5. Select:
   - `new-component` when no implementation exists;
   - `end-to-end-migration` when a legacy owner exists;
   - `alignment-only` when the canonical owner exists but is incomplete or incorrect.
6. Resolve the minimum complete implementation surface required by current consumers.

Current consumer need determines implementation priority and scope. It does not determine documentation coverage. Every official family capability must be classified even when the project does not need it now.

Example:

```text
m3.material.io/components/buttons
→ src/shared/ui/material/components/buttons
```

Do not infer canonical ownership from a legacy folder name.

## Documentation-first rule

Before implementation, create or update the family `README.md` using `docs/material-3/component-architecture.md`.

The README must state explicitly:

- official pages used;
- whether the official capability inventory is complete;
- implemented surface;
- every official capability not implemented, regardless of current consumer demand;
- partially implemented, unverified, ambiguous, or defective capability;
- known issues and required follow-up;
- API, semantics, states, tokens, and dependencies;
- extensions and deviations;
- consumers and migration state;
- verification;
- `Review status: review required after changes`.

Do not hide an incomplete item to make the result appear successful. Do not describe the family as fully implemented while any official capability remains unimplemented, partial, unverified, or unresolved.

The inventory should be complete at the contract level without becoming a token-by-token dump. Group coherent variants, states, behaviors, and subcomponents when that preserves full traceability.

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
Official capability inventory: complete | incomplete (<exact gap>)
Official coverage: full | partial | unresolved
Implemented:
Not implemented:
Partial / unverified:
Known issues / follow-up:
Consumers migrated:
Foundation/style changes:
Local verification:
Family documentation:
Review required: yes | no
Status: implementation finished | blocked (<exact reason>)
```

`implementation finished` means the current implementation task, family README, and applicable local verification agree. It does not mean full official capability coverage or a successful independent audit.
