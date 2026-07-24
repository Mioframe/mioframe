# Mioframe Material 3 Expressive

Mioframe exposes a canonical Vue Material library and delegates component implementation to m3e where its public Web Component contract is sufficient.

## Canonical documents

- [Architecture](./architecture.md) — authority, ownership, public/private boundary, theme and token policy, renderer viability, dependency rules, and migration completion.
- [Component adapter contract](./component-adapter.md) — required family README, Vue-to-m3e mapping, implementation sequence, verification, and exit gate.
- [Component tokens](./component-tokens.md) — public Mioframe token ownership and private mapping to documented m3e variables.
- [Roadmap](./roadmap.md) — current milestone, blocker, next action, and pilot sequence.
- [`src/shared/ui/material`](../../src/shared/ui/material/README.md) — physical library boundary and current migration map.

## Operating model

```text
current user scenarios and consumers
  → official Material 3 Expressive requirements
  → inspected public m3e component contract
  → explicit Mioframe Vue adapter
  → complete consumer migration
  → boundary-focused verification
  → obsolete-owner removal
```

The public contract is `MD*` Vue components. `@m3e/web`, `m3e-*` elements, renderer element types, private DOM, and `--m3e-*` variables remain implementation details under `src/shared/ui/material`.

## Workflow

Use `material-component-adapter` for one official family implementation, migration, or material adapter change. The workflow must inspect the current component and consumers, official Material guidance, and the exact pinned m3e public API before production edits.

Use the generic architecture handoff when a task changes cross-family ownership, global theme ownership, renderer strategy, public token architecture, or another decision not already resolved by the canonical adapter contract.

## Current next action

Follow [Roadmap](./roadmap.md). The architecture reset in PR #162 is the active milestone. The next production milestone is the `MDButton` m3e adapter pilot.
