---
name: material-library-status
description: 'Use when the user wants a read-only status report for the Material 3 Expressive library program. Reconcile the roadmap, inventory, registries, migration map, family audits, visual acceptance, and verification state without changing repository files.'
---

# Material library status

Use this as the read-only entrypoint for understanding the current Material 3 Expressive library program.

Expected invocation:

```text
material-library-status
```

This skill reports owned facts. It must not implement components, change queue order, update audits, edit roadmap state, or repair inconsistencies during the status run.

## Read the program owners

Read:

1. `docs/material-3/library-roadmap.md` for milestone, status, blocker, and single next action;
2. `docs/material-3/ui-library-inventory.md` for classification, priority, queue state, dependencies, and terminal outcomes;
3. `docs/material-3/component-registry.md` for Material alignment and proof status;
4. `docs/material-3/foundation-registry.md` for foundation readiness and gaps;
5. `src/shared/ui/material/README.md` for physical current and canonical owners;
6. family `README.md` files only for active or immediately queued families;
7. `docs/material-3/audits/*.md` for the latest completed compliance evaluation per family;
8. current pull request or verification state when available.

Do not expand into a full repository audit. Inspect only records needed to report current work, executable candidates, blockers, stale evidence, and pending acceptance.

## Reconcile without mutating

For each reported family, distinguish:

- roadmap state;
- inventory queue state;
- physical migration state;
- registry alignment state;
- audit result and freshness;
- operator visual status.

An audit is stale when its recorded implementation commit does not match the implementation state being reported. A stale audit remains historical evidence, not the current compliance result.

Do not silently choose one value when owners conflict. Report:

```text
Inconsistency:
Owning sources:
Expected owner to update:
Impact:
```

Do not claim a family is ready merely because it has a high priority. For executable work require the selection conditions from `material-library-next`: active roadmap family, or after pilots an unblocked `queued` official-component row with satisfied dependencies.

## Required status sections

Report:

1. current milestone and status;
2. active family or prerequisite;
3. single next action;
4. current blocker;
5. latest completed family when recorded;
6. executable next families;
7. blocked families and exact blockers;
8. stale or missing audits for active and queued families;
9. pending operator visual acceptance;
10. foundation gaps affecting current or next work;
11. repository/PR verification status when available;
12. record inconsistencies;
13. recommended next command.

When the inventory is not fully populated, say so explicitly. Do not present undiscovered or unassessed components as an empty backlog.

## Recommended command

Use exactly one recommendation:

- `material-component <family>` when the user has already selected a family or the active milestone names it;
- `material-component-review <family>` when a current compliance audit is required;
- `material-library-next` when one executable family can be selected automatically;
- resolve `<exact blocker>` when no workflow can safely proceed;
- no action when the program is complete.

## Output

Finish with:

```text
MATERIAL LIBRARY STATUS
Current milestone:
Milestone status:
Active family or prerequisite:
Latest completed family:
Current blocker:
Next action:

Executable families:
- none | <family — priority — reason>

Blocked families:
- none | <family — blocker>

Audit state:
- <family — current | stale | missing | blocked — result if current>

Pending visual acceptance:
- none | <family — evidence location/status>

Foundation gaps:
- none | <domain — impact>

Verification:
- unavailable | pending | passed | failed (<exact check>)

Record inconsistencies:
- none | <owner conflict and required correction>

Inventory completeness:
- complete | partial | planned

Recommended next command:
<one command or exact blocker action>
```

Keep the report concise and evidence-backed. Do not modify the repository during this workflow.
