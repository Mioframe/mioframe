---
name: material-component-authoring
description: 'Execute the canonical end-to-end workflow for an already resolved official Material component family.'
paths:
  - 'src/shared/ui/material/components/**'
---

# Material component authoring

This skill is an execution router. Canonical policy lives in:

- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/sources.md`;
- `src/shared/ui/material/docs/component-development.md`;
- the owning family `README.md`.

Do not duplicate those documents here.

## Execution order

1. Confirm the resolved family, change mode, current owner, canonical owner, consumers, supported surface, and unresolved decisions.
2. Create or update the compact family contract before production edits.
3. Resolve only required foundation dependencies; use `material-foundation` when their shared contract changes.
4. Prepare the owner-local Storybook laboratory.
5. Implement one complete primary vertical slice before expanding optional family routes.
6. Add proportional proof at the lowest faithful layers.
7. Complete the supported family surface.
8. Migrate affected consumers through the curated public API and verify only integration risks.
9. Remove obsolete implementation, exports, tests, stories, snapshots, and compatibility paths.
10. Perform source-backed non-visual review and prepare operator visual evidence when required.
11. Run focused checks and final repository verification.
12. Update `docs/roadmap.md` only when the active family, status, blocker, or next action changes.

## Stop conditions

Stop only for an exact unresolved official-source decision, incompatible public contract requiring product approval, unsafe cross-family blast radius, unresolved verification failure, or rejected required visual evidence.

Do not stop after research, a plan, a contract, or Storybook preparation when implementation is requested.
