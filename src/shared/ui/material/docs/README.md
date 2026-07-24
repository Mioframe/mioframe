# Mioframe Material 3 Expressive

This directory is the canonical documentation owner for the Material library under `src/shared/ui/material`.

## Canonical documents

- [Architecture](./architecture.md) — authority, ownership, public/private boundary, renderer assessment, dependency and custom-element integration policy, theme, and migration completion.
- [Component adapter contract](./component-adapter.md) — migration target, required family README, Vue-to-m3e mapping, implementation sequence, proof, and exit gate.
- [Component tokens](./component-tokens.md) — public Mioframe token ownership and private mapping to documented m3e variables.
- [Roadmap](./roadmap.md) — current milestone, blocker, next action, and pilot sequence.
- [Library root](../README.md) — physical boundary, public API, state model, and migration map.

## Operating model

```text
current user scenarios and consumers
  → official Material 3 Expressive requirements
  → exact m3e public component contract
  → accepted Mioframe family README
  → explicit Mioframe Vue adapter
  → complete target consumer migration
  → boundary-focused verification
  → obsolete target-owner removal
```

The public contract is `MD*` Vue components. `@m3e/web`, `m3e-*` elements, renderer element types, private DOM, and `--m3e-*` variables remain implementation details under `src/shared/ui/material`.

Legacy component directories remain current implementation owners until their focused migration. Their implementation notes may remain beside the code; the canonical cross-component architecture and migration workflow live here.

## Independent state axes

Each migration records:

- renderer viability: `unassessed`, `ready`, or `blocked-upstream`;
- implementation ownership: `legacy`, `migrating`, or `migrated`.

A blocked renderer leaves implementation ownership `legacy`. Retaining legacy is a decision, not a renderer status.

## Workflow

Use `material-component-adapter` for one explicit official component target or a proven inseparable family. The workflow must inspect the current implementation and consumers, official Material guidance, and an exact stable m3e version before production edits.

Use the generic architecture handoff when a task changes cross-family ownership, global theme ownership, renderer strategy, public token architecture, or another decision not resolved by the canonical adapter contract.

## Current next action

Follow [Roadmap](./roadmap.md). PR #162 completes the architecture reset only. The next production milestone is the `MDButton`-only m3e adapter pilot.
