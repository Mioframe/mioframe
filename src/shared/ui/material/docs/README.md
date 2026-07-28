# Mioframe Material 3 Expressive

This directory is the canonical documentation owner for `src/shared/ui/material`.

## Canonical documents

- [Architecture](./architecture.md) — durable Material-first boundaries, ownership, gap routing, renderer isolation, and completion model.
- [Component adapter contract](./component-adapter.md) — required family matrix, exact-version workaround gate, proof contract, and completion criteria.
- [Token architecture](./component-tokens.md) — foundation, theme, component-family, application, and private token ownership.
- [Public token API](./token-api.md) — complete consumer-facing catalogue of supported Material tokens.
- [Confirmed m3e defects](./m3e-defects.md) — stable `M3E-*` identities, lifecycle, evidence, mitigation, and removal triggers.
- [Roadmap](./roadmap.md) — the only owner of the current milestone, status, blockers, and next action.
- [Library root](../README.md) — public exports, boundary, and current family inventory.

## Operating model

```text
current Mioframe scenario
  → selected official Material and related-component contracts
  → accepted Material–m3e–Vue family matrix
  → public Vue MD* API and supported CSS token API
  → private m3e renderer plus correctly owned gap work
  → consumer migration and risk-based proof
```

The public component contract is a demand-scoped subset of official Material expressed idiomatically in Vue. The public token contract contains only selected, declared, catalogued, and verified `--md-ref-*`, `--md-sys-*`, and `--md-comp-*` tokens.

`@m3e/web`, `m3e-*`, renderer types/events, private DOM, `--m3e-*`, and `--md-private-*` remain implementation details. `--app-*` remains outside Material ownership.

Use `material-component-adapter` for one explicit official Material component. Use architecture handoff only for unresolved non-Material functionality, cross-family ownership, renderer strategy, global theme ownership, or public token architecture not already resolved by the canonical documents.

Do not place PR-specific completion history or next-action text in durable architecture documents. Update `roadmap.md` and the affected family README instead.
