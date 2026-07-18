---
name: material-component
description: 'Compatibility alias for a user-named official Material component family. Resolve the family and execute material-component-authoring; reroute foundations and styles instead of refusing.'
---

# Material component compatibility entrypoint

Preferred universal command:

```text
material <artifact-or-request>
```

Compatibility command:

```text
material-component <official-component-family>
```

## Routing

Resolve the request against official Material navigation.

- Official component family: execute `material-component-authoring <family>` directly.
- Foundation, style, token system, or interaction primitive: execute `material-foundation <artifact>` and continue the same task.
- Cross-layer request: resolve one canonical shared owner through `material-foundation`, then update only affected component consumers and proof.

The family or artifact name is sufficient. Do not ask the user to predefine variants, API, files, geometry, tests, or known defects.

## Boundary

This compatibility entrypoint owns no authoring policy of its own.

Do not duplicate source, scope, diagnosis, implementation, testing, completion, or result rules here. Use the selected specialized workflow as the sole process owner.

Do not refuse because the current implementation is legacy, the roadmap names another target, or the request is not a component.

## Result

Use the result format owned by `material-component-authoring` or `material-foundation`.
