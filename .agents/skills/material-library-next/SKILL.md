---
name: material-library-next
description: 'Use when the user wants Material library work to continue without naming a component. Select exactly one family from the active roadmap or queued inventory, then run material-component.'
---

# Material library next

Use:

```text
material-library-next
```

## Read current state

Read:

1. `docs/material-3/library-roadmap.md`;
2. `docs/material-3/ui-library-inventory.md`;
3. relevant registry records;
4. `src/shared/ui/material/README.md`;
5. candidate family `README.md` and colocated `AUDIT.md` when present.

## Select exactly one family

1. Follow the active component-family milestone first.
2. After pilots, select one `queued`, unblocked official component family with satisfied dependencies, preferring accepted `P0` over `P1` evidence.
3. Do not select migrated, retained, removed, blocked, or unclassified rows.
4. Route a required shared foundation/style change through the selected component workflow.
5. Do not start a second family in the same task.

Use the official Material documentation slug to resolve the canonical family path.

## Validate selection

```text
Selected family:
Official documentation path:
Canonical implementation path:
Selection source: active roadmap | queued inventory
Priority: pilot | P0 | P1
Dependencies:
Blocker: none | <exact blocker>
Implementation documentation: missing | <path>/README.md
Audit: missing | current | review required | blocked
Next action:
```

## Execute

Run:

```text
material-component <resolved-family>
```

The component workflow owns source resolution, implementation documentation, required shared work, implementation, migration, proof, and local verification.

## Result

```text
MATERIAL LIBRARY NEXT RESULT
Selection source:
Selected family:
Official documentation path:
Reason:
Priority:
Dependencies:
Implementation result: implementation finished | blocked
Family documentation:
Review required: yes | no
Next candidate: none | <family>
```

Naming the next candidate is informational only.
