---
name: material
description: 'Use for any request to implement, migrate, align, audit, or correct a Material 3 Expressive artifact. Resolve the official owner and execute the applicable component, foundation/style, or review workflow.'
paths:
  - 'src/shared/ui/material/**'
  - 'src/shared/lib/md/**'
  - 'src/shared/ui/State/**'
  - 'src/shared/ui/Icon/**'
  - 'src/shared/ui/Overlay/**'
  - 'docs/material-3/**'
---

# Universal Material request

Use this as the default entrypoint for any explicit Material artifact or bounded correction.

```text
material <artifact-or-request>
```

The user does not need to classify the request.

## Generalization boundary

This router contains only artifact-independent routing and completion rules.

Do not add concrete selectors, DOM nodes, custom-property names, token values, state endpoints, bug symptoms, family exceptions, or proposed structures.

Concrete facts belong in the selected owner README, AUDIT, implementation, tests, stories, and task context.

A pilot finding may refine shared policy only as a rule applicable to every artifact owning the same risk.

## Non-refusal rule

A valid explicit request for an official Material artifact is sufficient to start the applicable workflow.

Do not refuse because the request:

- is not a component;
- is outside the automatic roadmap order;
- has no current production consumer;
- currently lives in a legacy directory;
- entered through a compatibility command.

A task may be blocked only by one exact unresolved source, product, ownership, compatibility, safety, or verification decision that prevents correct implementation.

## Evidence boundary

Use the current task, current workspace, current successful Material MCP reads, official sources, and local project verification.

Source-control history is not Material evidence. The current diff may be inspected for scope, unrelated changes, ownership drift, and regression risk.

## Resolve the artifact kind

Classify by official Material ownership, not by the current repository path or class name.

### Component family

Execute directly:

```text
material-component-authoring <official component family>
```

`material-component` remains only a compatibility alias for this route.

### Independent component review

Execute:

```text
material-component-review <official component family>
```

Review never replaces authoring and changes only the family AUDIT.

### Foundation, style, token system, or interaction primitive

Execute:

```text
material-foundation <official artifact or bounded correction>
```

A legacy location is an owner to inspect or migrate, not a reason to reject the request.

### Cross-layer request

When a request necessarily changes a shared foundation/style and consumers:

1. resolve one canonical shared owner;
2. execute `material-foundation` for that owner;
3. update only affected component consumption, documentation, and proof;
4. do not duplicate shared behavior in a component;
5. do not split the task merely to avoid completing requested behavior.

## Scope rule

The explicit request and official contract determine the surface.

Implement the smallest coherent complete contract, including applicable semantics, accessibility, lifecycle, rendering, ownership, and verification dependencies.

Do not broaden the request into a catalog, universal framework, speculative API, placeholder tree, or unrelated migration.

Do not narrow the request to the first existing implementation fragment when the official artifact owns a broader coherent contract.

## Execution

Continue through the selected specialized workflow. Do not stop after classification, research, or a plan.

Complete applicable:

- current-run source resolution;
- contract reconstruction;
- diagnosis and implementation strategy;
- production implementation;
- migration or shared-owner correction;
- proportional proof;
- objective authoring or review gate;
- local verification;
- truthful remaining-gap reporting.

## Result

Use the result format owned by the selected specialized workflow.

The universal router does not declare implementation complete by itself.
