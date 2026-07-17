---
name: material-library-status
description: 'Use when the user wants a read-only status report for the Material 3 Expressive library program. Reconcile roadmap, inventory, registries, and colocated family README/AUDIT files without changing the repository.'
---

# Material library status

Use this read-only entrypoint:

```text
material-library-status
```

## Read owners

Read:

1. `docs/material-3/library-roadmap.md` for the active milestone and next action;
2. `docs/material-3/ui-library-inventory.md` for queue and classification;
3. component and foundation registries for program summaries;
4. `src/shared/ui/material/README.md` for library navigation;
5. active and queued family `README.md` files for implementation state;
6. colocated `AUDIT.md` files for independent review results.

Do not inspect unrelated families or modify files.

## Reconcile state

For each reported family distinguish:

- implementation path;
- README implementation claims;
- `Not implemented` capability;
- known issues and follow-up;
- review status;
- latest AUDIT result;
- pending visual review;
- relevant foundation/style gaps.

An audit is stale when the family README says:

```text
Review status: review required after changes
```

Do not use commit metadata to determine freshness.

When records conflict, report:

```text
Inconsistency:
Owning sources:
Expected owner to update:
Impact:
```

## Required report

```text
MATERIAL LIBRARY STATUS
Current milestone:
Milestone status:
Active family:
Current blocker:
Next action:

Implementation state:
- <family — path — implemented / incomplete / blocked>

Not implemented:
- none | <family — capability>

Known issues / follow-up:
- none | <family — item>

Audit state:
- <family — current | review required | missing | blocked — result when current>

Pending visual review:
- none | <family — status>

Foundation/style gaps:
- none | <domain — impact>

Record inconsistencies:
- none | <conflict>

Inventory completeness:
- complete | partial | planned

Recommended next command:
<one command or exact blocker action>
```

Recommended commands:

- `material-component <family>` for implementation or correction;
- `material-component-review <family>` when review is required;
- `material-library-next` when one next family can be selected;
- resolve one exact blocker when no workflow can proceed.

Keep the report concise and evidence-backed.
