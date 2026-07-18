---
name: material-component
description: 'Use when the user supplies a Material component or family name for implementation, migration, alignment, or correction. If the supplied request resolves to a foundation or style instead, route it to material-foundation and continue rather than refusing.'
---

# Material component entrypoint

Use this as the compatibility entrypoint for named Material work.

Preferred universal command:

```text
material <artifact-or-request>
```

Component examples:

```text
material-component Button
material-component Switch
material-component Navigation rail
```

A request may also be routed here with a non-component name:

```text
material-component State layer
material-component Ripple
material-component Elevation
```

Do not reject such a request merely because the selected skill name contains `component`.

## Workspace boundary

Use only the current user task, current workspace files, official Material sources, and local project verification commands.

Do not run, inspect, or cite `git`, `gh`, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history as implementation or Material evidence.

## Resolve before acting

Resolve the named artifact against official Material navigation rather than its current repository path.

### Component family

For an official component or component family:

1. resolve its official documentation path and slug;
2. inspect current owner, consumers, README, AUDIT, tests, stories, and shared dependencies;
3. preserve explicit operator feedback;
4. execute `material-component-authoring` end to end.

The component name is sufficient. Do not ask the user to predefine variants, API, sources, files, tests, consumers, geometry, or known defects.

### Foundation or style

For a foundation, style, token system, or interaction primitive, immediately route to `material-foundation` and continue the same task.

Examples:

- State layer, ripple, focus indication, interaction states, accessibility, adaptive/layout → foundation;
- color, elevation, icons, motion, shape, typography → style.

Existing code under `src/shared/ui/State`, `src/shared/lib/md`, `src/shared/ui/Icon`, or another legacy directory is an implementation owner to inspect or migrate. It does not turn the artifact into a component and is not a reason to refuse it.

A valid explicit user request is sufficient to start the applicable foundation/style workflow. Do not require an active component migration, roadmap priority, multiple existing consumers, or an existing canonical directory.

### Broad or cross-layer request

When the request spans a shared foundation/style and affected components, resolve one canonical shared owner first, execute `material-foundation`, then update only the affected component consumption and proof. Do not duplicate the shared behavior inside a component.

## Component authoring requirements

For actual component work, read and obey:

- applicable repository and scoped `AGENTS.md` files;
- `src/shared/ui/material/components/AGENTS.md`;
- `docs/material-3/component-architecture.md`;
- `docs/material-3/component-tokens.md`;
- `docs/material-3/component-testing.md`;
- `docs/material-3/component-conversion-checklist.md`;
- the current family README and AUDIT.

Continue through production implementation, consumer migration, structural conformance, correct final rendered-property ownership, CSS custom-property namespace review, proportional proof, obsolete-owner removal, documentation update, and local verification.

Do not stop after research, classification, an audit summary, or a plan.

Authoring does not edit AUDIT. After component implementation, recommend:

```text
material-component-review <resolved-family>
```

## Result

For a component, finish with the result format owned by `material-component-authoring`.

For a rerouted foundation/style request, finish with the result format owned by `material-foundation` and state:

```text
Requested through: material-component
Resolved kind: foundation | style | cross-layer
Selected workflow: material-foundation
```

Do not report a blocker whose only reason is that the requested Material artifact is not a component.
