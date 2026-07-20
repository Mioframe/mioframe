# Material library roadmap

This file records only the active family, current blocker, and one next action. It is not a registry, inventory, queue, audit, checklist, or stage tracker.

## Current state

Last updated: 2026-07-20

Active family: `Button`

Intended change mode: `end-to-end-migration`

Status: `blocked`

Blocker: PR #155 must pass final verification and merge before the Button implementation branch is created.

## Next action

After PR #155 merges, create a fresh branch from the updated `develop` and start a fresh agent session before running:

```text
material-component Button
```

Before the run, confirm that the fresh session loaded the merged root and nested `AGENTS.md` files and current Material skills. Do not continue a session that loaded the pre-PR #155 workflow.

Persistent agent memory is not Material authority. Ignore any entry that conflicts with the current repository, including claims based on PR #150, removed audits or registries, or removed `docs/material-3` files. Do not delete unrelated memory automatically.

Treat Button as the first calibration run. Stop and correct the workflow before continuing implementation if the agent:

- skips the family README contract;
- begins production edits before implementation decomposition, style ownership, proof map, implementation order, required foundation work, and applicable initial failing proof are ready;
- writes the family as one undifferentiated Vue, TypeScript, or style artifact despite independent responsibilities;
- fragments the implementation without clearer ownership or proof;
- expands before representative-consumer validation;
- performs final review in the same implementation context;
- starts another family;
- continues through an exact blocker.

The orchestrator starts with `material-component-contract`, invokes required foundation work only when the resolved contract proves it, continues through proof-first implementation and adoption, then requires independent review and final verification.

Do not reuse implementation, workflow, review, or audit conclusions from PR #150. Resolve the current Button family from the merged repository and current official Material 3 Expressive sources.

Do not select or pre-plan a second family until Button reaches a terminal result.

## Update rule

Update this file only when the active family, status, blocker, or one next action changes.
