---
name: material-component
description: 'Use when the user names a Material component or family and wants it created, migrated, aligned, or reviewed.'
---

# Material component

This is the one-name entry point for Material family work.

## Required input

A component or family name is sufficient. Do not ask the user to predefine variants, API, foundations, files, tests, consumers, or expected defects when official sources and repository evidence can resolve them.

## Workflow

1. Read `src/shared/ui/material/AGENTS.md`.
2. Read `docs/architecture.md`, `docs/sources.md`, and `docs/component-development.md` under that root.
3. Inspect the named family, current owner, public exports, direct consumers, tests, stories, and known defects.
4. Resolve the current official family and minimum complete supported surface.
5. Choose `new-component`, `end-to-end-migration`, `library-relocation-only`, or `alignment-only`.
6. Load `material-component-authoring` and execute the complete applicable workflow.

For a review-only request, inspect the same contract and report confirmed findings in chat or a PR review. Do not create a permanent audit file or second family state record.

Use `material-foundation` only when a real cross-family foundation contract changes.

## Result

Report the resolved family, change mode, supported and unsupported surface, current and canonical owners, foundation impact, proof performed, consumer migration, removed obsolete ownership, operator visual status, verification, and exact blockers.
