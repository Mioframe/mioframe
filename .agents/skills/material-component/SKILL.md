---
name: material-component
description: 'Use when the user supplies an official Material component family for implementation, migration, alignment, or correction. If the request resolves to a foundation or style, route it to material-foundation and continue rather than refusing.'
---

# Material component entrypoint

Use this as the compatibility entrypoint for named Material work.

Preferred universal command:

```text
material <artifact-or-request>
```

Component syntax:

```text
material-component <official-component-family>
```

A non-component artifact may be routed here accidentally. Do not reject it because the selected skill name contains `component`.

## Generalization boundary

This entrypoint contains only cross-family routing rules.

Do not add concrete family selectors, DOM nodes, custom-property names, token values, state endpoints, bug symptoms, or proposed implementation structures.

Concrete family facts belong in the selected family README, AUDIT, implementation, tests, and task-specific PR description.

## Workspace boundary

Use only the current user task, current workspace files, official Material sources, and local project verification commands.

Do not use source-control history or remote workflow state as implementation or Material evidence.

## Resolve before acting

Resolve the artifact against official Material navigation rather than the current repository path or command name.

### Component family

For an official component family:

1. resolve its official documentation path and slug;
2. inspect current owner, consumers, README, AUDIT, tests, stories, and shared dependencies;
3. preserve explicit operator feedback;
4. execute `material-component-authoring` end to end.

The family name is sufficient. Do not ask the user to predefine variants, API, files, tests, consumers, geometry, or known defects.

### Foundation or style

For a foundation, style, token system, or interaction primitive, immediately route to:

```text
material-foundation <resolved-artifact>
```

Continue the same task. A legacy location is an owner to inspect or migrate, not a reason to refuse.

An explicit user request is sufficient to start the applicable foundation/style workflow. Do not require an active component migration, roadmap priority, multiple consumers, or an existing canonical directory.

### Cross-layer request

When the request spans a shared foundation/style and consumers:

1. resolve one canonical shared owner;
2. execute `material-foundation` for that owner;
3. update only affected component consumption and proof;
4. do not duplicate shared behavior inside a component.

## Component authoring requirements

For actual component work, read applicable scoped instructions, architecture, token, testing, checklist, README, and AUDIT documents.

Continue through:

- source and inventory resolution;
- README-first documentation;
- production implementation;
- applicable structural ownership;
- exact token/private/application namespaces;
- final rendered-owner proof;
- consumer migration and obsolete-owner cleanup;
- proportional tests and canonical rendered evidence;
- local verification.

Do not stop after research, classification, an audit summary, or a plan.

Authoring does not edit AUDIT. After implementation recommend:

```text
material-component-review <resolved-family>
```

## Result

For a component, use the result format owned by `material-component-authoring`.

For a rerouted request, use the result format owned by `material-foundation` and state:

```text
Requested through: material-component
Resolved kind: foundation | style | cross-layer
Selected workflow: material-foundation
```

Do not report a blocker whose only reason is that the requested artifact is not a component.
