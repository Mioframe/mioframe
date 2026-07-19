# Material library roadmap

This file records only the active family, current blocker, and one next action. It is not a registry, inventory, queue, audit, checklist, or stage tracker.

## Current state

Last updated: 2026-07-19

Active family: `Button`

Intended change mode: `end-to-end-migration`

Status: `blocked`

Blocker: PR #155 must pass final verification and merge before the Button implementation branch is created.

## Next action

After PR #155 merges, create a fresh branch from the updated `develop` and run `material-component Button` through the complete staged workflow:

```text
0 task lock
→ 1 resolved family contract
→ 2 primary vertical slice
→ 3 complete supported family
→ 4 consumer migration and old-owner removal
→ 5 full-result review and visual handoff
→ 6 final verification
```

Do not reuse implementation, workflow, review, or audit conclusions from PR #150. Resolve the current Button family from the merged repository and current official Material 3 Expressive sources.

Do not select or pre-plan a second family until Button reaches a terminal result.

## Update rule

Update this file only when the active family, status, blocker, or one next action changes.