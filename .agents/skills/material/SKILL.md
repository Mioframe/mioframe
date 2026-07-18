---
name: material
description: 'Use for any request to implement, migrate, align, or correct a Material 3 Expressive artifact. Resolve whether the target is a component, foundation, style, token system, interaction primitive, or cross-layer route, then execute the applicable specialized workflow.'
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

Syntax examples use placeholders only and do not prescribe implementation structure:

```text
material <component-family>
material <foundation-artifact>
material <style-domain>
material <bounded Material correction>
```

The user does not need to classify the request.

## Generalization boundary

This router contains only artifact-independent routing and completion rules.

Do not add:

- a concrete family selector, DOM node, custom-property name, token value, state endpoint, bug symptom, or proposed component structure;
- a family-specific exception;
- an example that is later treated as a required implementation shape.

Concrete facts belong in the selected owner README, AUDIT, implementation, tests, and task-specific PR description.

A defect discovered in one artifact may refine this skill only through a rule that applies to any artifact owning the same category of risk.

## Non-refusal rule

A valid explicit request for an official Material artifact is sufficient to start the applicable workflow.

Do not refuse or stop merely because:

- the request is not a component;
- no component migration is active;
- the roadmap currently names another target;
- the canonical directory does not exist yet;
- the current implementation lives in a legacy directory;
- no current production consumer exists;
- only one current consumer uses the behavior;
- the request entered through a more specific Material entrypoint by mistake.

When no production consumer exists, implement the smallest coherent official contract requested and prove it with owner-local tests and a bounded testing or Storybook fixture. Do not invent a fake product consumer.

A request may be blocked only by one exact unresolved source, product, ownership, compatibility, safety, or verification decision that materially prevents a correct implementation.

## Workspace boundary

Use only:

- the current user task;
- current workspace files;
- official Material sources;
- local project verification commands.

Do not use source-control history or remote workflow state as implementation or Material evidence.

## Resolve the artifact kind

Classify by official Material ownership, not by the current legacy path, repository class name, or command used.

### Component

Route an official component family to:

```text
material-component <official component family>
```

Then execute `material-component-authoring`.

### Foundation

Route an official foundation or interaction primitive to:

```text
material-foundation <official foundation artifact or bounded correction>
```

A legacy owner outside `material/foundations` is an owner to inspect or migrate, not a reason to reject the request.

### Style

Route an official visual system or token domain to:

```text
material-foundation <official style artifact or bounded correction>
```

The foundation workflow owns both `foundations/` and `styles/` routing.

### Cross-layer request

When a request necessarily changes a shared foundation/style and consumers:

1. resolve one canonical shared owner;
2. implement or correct that owner through `material-foundation`;
3. update only affected consumer routes and documentation;
4. add representative proof across the actual blast radius;
5. do not duplicate shared behavior in a consumer;
6. do not split the task merely to avoid completing the requested behavior.

## Scope rule

The explicit request and official contract determine the surface.

Implement the smallest coherent complete contract, including every applicable state, semantic, accessibility, lifecycle, rendering, ownership, and verification dependency required for honest operation.

Do not broaden the request into a catalog, universal framework, speculative API, placeholder tree, or unrelated migration.

Do not narrow the request to the first existing implementation fragment when the named official artifact owns a broader coherent contract.

## Source and ownership resolution

Before production changes:

1. resolve the official documentation domain and slug;
2. record canonical source status;
3. inspect current owner, canonical owner, consumers, tests, fixtures/stories, and local documentation;
4. distinguish generic browser/platform utilities from Material semantics;
5. select new implementation, migration, correction, replacement, or source refresh;
6. update the canonical owner README before implementation;
7. preserve explicit operator rejection and known defects.

## Execution

Continue through the selected specialized workflow. Do not stop after classification, research, or a plan.

Complete applicable:

- canonical documentation;
- production implementation;
- public/private contract;
- legacy-owner migration or cleanup;
- consumer updates;
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

`implementation finished` means the explicit request was implemented coherently and applicable local verification passed. It does not imply coverage of unrelated Material capability or operator acceptance.
