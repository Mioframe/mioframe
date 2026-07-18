---
name: material-component
description: 'Use when the user provides a Material component or family name and wants it created, implemented, migrated, aligned, or corrected. Resolve the official documentation family and run material-component-authoring.'
---

# Material component

Use this as the one-name entrypoint for Material 3 Expressive component work.

## Input

```text
material-component Button
material-component Switch
material-component Navigation rail
```

The same message may include concrete visual problems or explicit acceptance:

```text
material-component Button

Operator feedback:
- the target geometry is larger than and inconsistent with the visible container;
- corners become visually straight during press.
```

The component name is sufficient. Do not ask the user to predefine variants, API, sources, files, tests, consumers, or expected omissions.

## Workspace boundary

Work from the current user task and current workspace only.

Do not run, inspect, or cite `git`, `gh`, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history. Source-control provenance is not implementation, project-contract, or Material evidence.

Local verification means project commands such as formatting, linting, type checking, tests, Storybook, and build commands.

## Required instructions

Before resolving or changing a family, read:

- applicable repository and scoped `AGENTS.md` files;
- `src/shared/ui/material/components/AGENTS.md`;
- `docs/material-3/component-architecture.md`;
- `docs/material-3/component-tokens.md`;
- `docs/material-3/component-testing.md`;
- `docs/material-3/component-conversion-checklist.md`;
- the family README and AUDIT when present.

The scoped component instructions are mandatory for both authoring and later independent review.

## Resolve the target

1. Resolve the current official Material family and documentation path.
2. Use the official documentation slug as the canonical directory name.
3. Inspect current implementation, public exports, consumers, README, AUDIT, tests, stories, and applicable shared owners.
4. Extract explicit operator feedback from the current message and existing README.
5. Reconstruct the official contract-level capability inventory from available official Material 3 Expressive sources.
6. Record canonical source status: `current-complete`, `snapshot-complete-stale`, `partial`, `conflicting`, or `unavailable`.
7. Select `new-component`, `end-to-end-migration`, or `alignment-only`.
8. Resolve the minimum coherent implementation surface required by current consumers.

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

An officially unsupported or invalid combination is not missing capability and does not reduce coverage. Optional guidance is not automatically required capability.

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

`complete` requires every current family page and required structured source. Spot checks cannot certify a complete family inventory.

## Documentation-first rule

Before implementation, create or update the family README. It must state:

- official pages and source status;
- inventory status and official coverage;
- implemented, partial, absent, invalid, unresolved, and out-of-family capability;
- known issues and required follow-up;
- operator feedback and visual status;
- API and semantics;
- geometry and final rendered-property ownership;
- token namespaces and routes;
- dependencies, extensions, consumers, verification, and review status.

Do not hide incomplete work to make the result appear successful.

## Broad visible feedback rule

When the user says that a component looks wrong, crooked, malformed, or visually incorrect:

- set README visual status to `rejected`;
- preserve the complete affected visible surface as unresolved;
- investigate official anatomy, geometry ownership, content layout, clipping, state endpoints, and motion before selecting a root cause;
- do not narrow the task to the first plausible variable or to the previously discussed issue;
- do not move to `awaiting re-review` until production behavior changes and the complete affected surface is rechecked.

Objective structural defects are agent-owned. The operator is not responsible for discovering:

- wrong DOM anatomy;
- incoherent layout or hit geometry;
- incorrect visual-container ownership;
- wrong state-layer, ripple, focus, outline, elevation, shape, or content bounds;
- invalid CSS custom-property naming;
- visibly wrong state endpoints.

## Mandatory geometry ownership map

For every visible interactive component, identify concrete DOM owners for:

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

A component cannot be classified as implemented and verified while this map is missing, contradictory, or inconsistent with rendered bounds.

Numeric token values do not prove that the correct element owns them.

Do not accept an absolutely positioned descendant target that extends outside its semantic host and creates a cross-shaped, partial, overlapping, or non-layout interaction region.

## CSS custom-property namespaces

Every touched custom property must be classified as:

- exact official token: `--md-ref-*`, `--md-sys-*`, or `--md-comp-*`;
- justified private implementation route: `--md-private-<owner>-<semantic-role>`;
- genuine application token: `--app-*`;
- invalid or unnecessary alias.

Do not create ad-hoc public-looking `--md-<component>-*` namespaces.

Invalid examples:

```text
--md-button-border-radius
--md-button-height
--md-button-padding-left
--md-button-icon-gap
```

Use an exact official token, a justified semantic `--md-private-*` route, or a direct declaration when indirection is unnecessary.

## Run the authoring workflow

Load `material-component-authoring` and continue through implementation, consumer migration, structural conformance, token-namespace review, proportional proof, obsolete-owner removal, documentation update, and local verification.

The implementing workflow does not edit AUDIT. After implementation, recommend:

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
Geometry ownership:
CSS custom-property namespace review:
Known issues / follow-up:
Consumers migrated:
Foundation/style changes:
Local verification:
Family documentation:
Latest operator feedback: none | <summary>
Visual status: not reviewed | required | rejected | awaiting re-review | accepted
Review required: yes | no
Status: implementation finished | blocked (<exact reason>)
```

`implementation finished` does not mean full official coverage, successful independent audit, or operator acceptance.

Do not report implementation finished while structural geometry is unresolved, a visible state endpoint is wrong, invalid CSS custom properties remain, broad operator feedback was narrowed without full investigation, or required local verification fails.