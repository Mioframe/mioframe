---
name: material-library-next
description: 'Use when the user wants Material library work to continue without naming a component. Select exactly one family from the active roadmap or queued inventory, then run material-component.'
---

# Material library next

Use:

```text
material-library-next
```

## Evidence boundary

Read the current user task and current workspace records only.

Do not run, inspect, or cite `git`, `gh`, GitHub, commits, branches, pull requests, diffs, blame, logs, tags, merge state, or repository history.

## Read current state

Read:

1. `docs/material-3/library-roadmap.md`;
2. `docs/material-3/ui-library-inventory.md`;
3. relevant registry records;
4. `src/shared/ui/material/README.md`;
5. candidate family README and AUDIT when present.

## Select exactly one family

1. Continue the active component-family milestone first.
2. Do not leave an active family while any of these remains:
   - README says `review required after changes`;
   - AUDIT has a critical/high finding or material blocker;
   - canonical source status is partial, conflicting, or unavailable for a required decision;
   - a shared route lacks representative proof;
   - README visual status is `rejected`, `blocked`, or `awaiting re-review`;
   - required operator visual review is still `required` or `not reviewed`;
   - required consumer migration, obsolete-owner removal, or local verification is incomplete.
3. After pilots, select one queued, unblocked official family with satisfied dependencies, preferring accepted `P0` over `P1` evidence.
4. Do not select migrated, retained, removed, blocked, or unclassified rows.
5. Route a required shared foundation/style change through the selected family workflow.
6. Do not start a second family in the same task.

Use the official Material documentation slug for the canonical path.

Do not treat `Official coverage: partial` alone as a blocker when the implemented subset is compliant, absent capability is classified honestly, and roadmap policy accepts incremental coverage. Treat `Official coverage: unresolved` as a blocker until the exact source limitation is resolved or explicitly accepted by roadmap policy.

Officially unsupported combinations do not count as absent capability. Optional or non-normative guidance does not block selection unless required for the implemented surface.

Explicit current user feedback overrides a weaker README visual status. Never infer acceptance from AUDIT, stories, screenshots, or tests.

## Validate selection

```text
Selected family:
Official documentation path:
Canonical implementation path:
Selection source: active roadmap | queued inventory
Priority: pilot | P0 | P1
Canonical source status:
Official capability inventory:
Official coverage:
Audit: missing | current | review required | blocked
Latest operator feedback: none | <summary>
Visual status: not reviewed | required | rejected | awaiting re-review | blocked | accepted
Shared route blockers: none | <exact blocker>
Dependencies:
Blocker: none | <exact blocker>
Next action:
```

## Execute

Run:

```text
material-component <resolved-family>
```

The component workflow owns source resolution, implementation documentation, required shared work, implementation, migration, proof, and local verification. It never edits AUDIT.

## Result

```text
MATERIAL LIBRARY NEXT RESULT
Selection source:
Selected family:
Official documentation path:
Reason:
Priority:
Canonical source status:
Official capability inventory:
Official coverage:
Dependencies:
Implementation result: implementation finished | blocked
Family documentation:
Review required: yes | no
Latest operator feedback:
Visual status:
Next candidate: none | <family>
```

Naming the next candidate is informational only. Do not begin it in the same run.
