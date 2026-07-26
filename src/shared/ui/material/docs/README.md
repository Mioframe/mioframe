# Mioframe Material 3 Expressive

This directory is the canonical documentation owner for `src/shared/ui/material`.

## Canonical documents

- [Architecture](./architecture.md) — public Vue/private m3e ownership, supported-surface policy, divergence handling, typing, tokens, and verification boundaries.
- [Component adapter contract](./component-adapter.md) — minimum end-to-end workflow for one component.
- [Component tokens](./component-tokens.md) — active public token ownership and private m3e mapping rules.
- [Roadmap](./roadmap.md) — current milestone, blocker, and next action.
- [Library root](../README.md) — physical boundary, public API, and migration map.

## Operating model

```text
current Mioframe scenarios
+ canonical documented m3e component capabilities
  → relevant official Material guidance
  → recorded Material/m3e divergences
  → thin Mioframe Vue adapter
  → consumer migration
  → risk-based verification
  → operator visual and motion review
```

The public contract is Vue `MD*` components. `@m3e/web`, `m3e-*` elements, renderer types, private DOM, and `--m3e-*` variables remain implementation details.

The workflow is intentionally bounded:

- preserve current application scenarios;
- expose documented m3e capabilities that belong to the canonical Material component surface through direct typed mappings;
- record confirmed differences between m3e and official Material guidance;
- implement only Mioframe-required differences that are safely correctable in a thin wrapper;
- preserve only active public tokens;
- do not recreate complete Material documentation, token catalogues, renderer internals, or exhaustive third-party tests.

Renderer-owned animation is assessed through exact-version source inspection and operator manual testing. Automated tests cover only Mioframe-owned integration and publicly observable behavior.

## State axes

Each migration records:

- renderer viability: `unassessed`, `ready`, or `blocked-upstream`;
- implementation ownership: `legacy`, `migrating`, or `migrated`.

A blocked renderer leaves implementation ownership `legacy`.

## Workflow

Use `material-component-adapter` for one explicit component. Use architecture handoff only when cross-family ownership, renderer strategy, global theme ownership, or another unresolved architecture decision changes.

## Current next action

Follow [Roadmap](./roadmap.md). PR #162 owns the architecture reset and MDButton pilot.
