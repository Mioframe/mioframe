---
name: material
description: 'Use for any request to implement, migrate, align, or correct a Material 3 Expressive artifact. Resolve whether the target is a component, foundation, style, token system, interaction primitive, or cross-layer route, then execute the applicable specialized workflow without refusing solely because the request is not a component.'
paths:
  - 'src/shared/ui/material/**'
  - 'src/shared/lib/md/**'
  - 'src/shared/ui/State/**'
  - 'src/shared/ui/Icon/**'
  - 'src/shared/ui/Overlay/**'
  - 'docs/material-3/**'
---

# Universal Material request

Use this as the default implementation entrypoint for any named Material 3 Expressive artifact or bounded Material correction.

Examples:

```text
material Button
material State layer
material Ripple
material Focus indicator
material Color roles
material Elevation
material Motion
material Typography
material Fix the Button target geometry
```

The user does not need to know whether the requested artifact is classified as a component, foundation, or style.

## Non-refusal rule

A valid explicit request for an official Material artifact is sufficient to start the applicable workflow.

Do not refuse or stop merely because:

- the request is not a component;
- no component migration is currently active;
- the roadmap currently names another family;
- the canonical directory does not exist yet;
- the current implementation lives in a legacy directory;
- no current production consumer exists;
- only one current family consumes the behavior;
- the request was made through `material-component` by mistake.

When no current production consumer exists, implement the smallest coherent official contract requested by the user and prove it with foundation/style-owned tests and a bounded testing or Storybook fixture. Do not invent a fake product consumer.

A request may still be blocked only by one exact unresolved source, product, ownership, compatibility, safety, or verification decision that materially prevents a correct implementation.

## Workspace boundary

Use only:

- the current user task;
- current workspace files;
- official Material sources;
- local project verification commands.

Do not run, inspect, or cite `git`, `gh`, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history as implementation or Material evidence.

## Resolve the artifact kind

Classify the request by official ownership, not by its current legacy path or by a repository class name.

### Component

Examples: Button, Switch, Card, Dialog, Navigation rail.

Route to:

```text
material-component <official component or family>
```

Then execute `material-component-authoring`.

### Foundation

Examples: State layer, ripple, focus indication, interaction states, accessibility, adaptive/layout foundations.

Route to:

```text
material-foundation <official foundation artifact or bounded correction>
```

State layer, ripple, and focus indication are interaction-foundation work. Existing code under `src/shared/ui/State` is a legacy owner to inspect or migrate, not a reason to reject the request.

### Style

Examples: color, elevation, icons, motion, shape, typography.

Route to:

```text
material-foundation <official style artifact or bounded correction>
```

The `material-foundation` workflow owns both `foundations/` and `styles/`.

### Cross-layer request

When a request necessarily changes a shared foundation/style and one or more component consumers:

1. resolve one canonical shared owner;
2. implement or correct that owner through `material-foundation`;
3. update only affected component consumption and documentation;
4. add representative proof across the actual blast radius;
5. do not duplicate the shared behavior inside a component;
6. do not split the task merely to avoid completing the requested behavior.

## Scope rule

The explicit user request and official contract determine the required surface.

Implement the smallest coherent complete contract for that request, including every state, semantic, accessibility, lifecycle, rendering, and verification dependency needed for it to work honestly.

Do not broaden the request into a catalog, universal framework, speculative API, placeholder tree, or migration of unrelated domains.

Do not narrow the request to the first existing implementation fragment when the named official artifact owns a broader coherent contract.

## Source and ownership resolution

Before production changes:

1. resolve the official documentation domain and slug;
2. record canonical source status;
3. inspect the current owner, canonical owner, current consumers, tests, stories, and local documentation;
4. distinguish generic browser/platform utilities from Material semantics;
5. identify whether the work is new implementation, migration, correction, replacement, or source refresh;
6. update the canonical owner README before implementation;
7. preserve any explicit operator rejection or known defect.

## Execution

Continue through the selected specialized workflow. Do not stop after classification, research, or a plan.

The selected workflow must complete applicable:

- canonical documentation;
- production implementation;
- public/private contract;
- legacy-owner migration or cleanup;
- current consumer updates;
- proportional tests and bounded rendered evidence;
- blast-radius verification;
- local project verification;
- truthful remaining-gap reporting.

Authoring does not edit the independent `AUDIT.md`.

## Result

Finish with:

```text
MATERIAL RESULT
Requested artifact:
Resolved kind: component | foundation | style | cross-layer
Official documentation path:
Current owner:
Canonical owner:
Selected workflow:
Change mode:
Implemented:
Partial / defective / unverified:
Not implemented:
Officially unsupported / invalid:
Consumers affected:
Legacy ownership:
Verification:
Documentation:
Status: implementation finished | blocked (<exact reason>)
Recommended review:
```

`implementation finished` means the explicit request was implemented coherently and applicable local verification passed. It does not imply complete coverage of unrelated Material capability or operator visual acceptance.