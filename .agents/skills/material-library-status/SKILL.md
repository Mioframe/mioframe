---
name: material-library-status
description: 'Use when the user wants a read-only status report for the Material 3 Expressive library program. Reconcile roadmap, inventory, registries, and colocated family README/AUDIT files without changing the repository.'
---

# Material library status

Use this read-only entrypoint:

```text
material-library-status
```

## Evidence boundary

Read current workspace records only.

Do not run, inspect, or cite `git`, `gh`, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history.

Do not modify files.

## Read owners

Read:

1. `docs/material-3/library-roadmap.md` for the active milestone and next action;
2. `docs/material-3/ui-library-inventory.md` for queue and classification;
3. component and foundation registries for program summaries;
4. `src/shared/ui/material/README.md` for library navigation;
5. active and queued family README files for implementation state;
6. colocated AUDIT files for independent review results.

Do not inspect unrelated families.

## Reconcile state

For each reported family distinguish:

- implementation path;
- canonical source status;
- official inventory status;
- official coverage;
- implemented capability;
- partial, defective, provisional, or unverified capability;
- actual capability not implemented;
- officially unsupported or invalid combinations;
- unresolved and out-of-family items;
- known issues and follow-up;
- review status and latest audit result;
- visual status;
- foundation/style gaps.

Do not merge invalid combinations into `Not implemented`.

Do not report optional or non-normative guidance as missing capability unless current family documentation classifies it as required for the implemented surface.

Do not repeat a family README's `complete` inventory claim when its source status is partial, stale-only, truncated, suspicious, or otherwise insufficient. Report the inconsistency.

An audit is stale when README says:

```text
Review status: review required after changes
```

Do not use commit metadata to determine freshness.

A visual status of `rejected` remains open until current documentation records accepted replacement evidence after a production behavior change.

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

Canonical source status:
- <family — current-complete | snapshot-complete-stale | partial | conflicting | unavailable>

Official inventory and coverage:
- <family — complete | snapshot-complete | incomplete | blocked — full | partial | unresolved>

Partial / defective / unverified:
- none | <family — item>

Not implemented:
- none | <family — actual official capability>

Officially unsupported / invalid combinations:
- none | <family — item>

Unresolved / out-of-family:
- none | <family — item or separate owner>

Known issues / follow-up:
- none | <family — item>

Audit state:
- <family — current | review required | missing | blocked — result when current>

Visual status:
- none | <family — not required | required | rejected | blocked | accepted>

Foundation/style gaps:
- none | <domain — impact>

Record inconsistencies:
- none | <conflict>

Recommended next command:
<one command or exact blocker action>
```

Recommended commands:

- `material-component <family>` for implementation or correction;
- `material-component-review <family>` when review is required;
- `material-library-next` when one next family can be selected;
- resolve one exact blocker when no workflow can proceed.

Keep the report concise and evidence-backed.
