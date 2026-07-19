# Material library roadmap

This file records only the active family, current blocker, and one next action. It is not a registry, inventory, queue, audit, checklist, or stage tracker.

## Current state

Last updated: 2026-07-19

Active family: `Button`

Intended change mode: `end-to-end-migration`

Status: `blocked`

Blocker: PR #155 must pass final verification and merge before the Button implementation branch is created.

## Next action

After PR #155 merges, create a fresh branch from the updated `develop` and start a fresh agent session before running:

```text
material-component Button
```

The fresh session must load the merged repository rules and skills. Do not continue a session that loaded the pre-PR #155 Material workflow, and remove any stale project auto-memory that treats PR #150, old audits, registries, or removed `docs/material-3` files as current evidence.

Treat Button as the first calibration run. If the agent skips the contract gate, expands before representative-consumer validation, starts another family, or continues through an exact blocker, stop and correct the workflow before continuing implementation.

The orchestrator starts with `material-component-contract`, invokes required foundation work only when the resolved contract proves it, then continues through implementation, adoption, complete review, and final verification.

Do not reuse implementation, workflow, review, or audit conclusions from PR #150. Resolve the current Button family from the merged repository and current official Material 3 Expressive sources.

Do not select or pre-plan a second family until Button reaches a terminal result.

## Update rule

Update this file only when the active family, status, blocker, or one next action changes.
