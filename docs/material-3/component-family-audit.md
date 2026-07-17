# Historical component-family audit

This file no longer owns current component implementation status or compliance findings.

The previous detailed audit was a pre-library snapshot. It remains available in repository history but became stale as soon as families began moving into the canonical Material library.

## Current ownership

For an implemented or actively migrated family, read its colocated documentation:

```text
src/shared/ui/material/components/<official-docs-slug>/README.md
src/shared/ui/material/components/<official-docs-slug>/AUDIT.md
```

Current Button state:

- [Buttons implementation documentation](../../src/shared/ui/material/components/buttons/README.md)
- [Buttons independent audit](../../src/shared/ui/material/components/buttons/AUDIT.md)

The compact [component registry](./component-registry.md) owns only program mapping and navigation. It is not a detailed audit.

## Legacy families

Families not yet migrated retain their current implementation and high-level registry state. When migration starts, the authoring workflow creates the local README and the independent reviewer creates the local AUDIT.

Do not add new findings to this historical file.