# Mioframe Material 3 Expressive

This directory is the canonical documentation owner for `src/shared/ui/material`.

## Canonical documents

- [Architecture](./architecture.md) — durable Material-first boundaries, family artifacts, ownership, gap routing, renderer isolation, and completion model.
- [Design document contract](./design-document.md) — required complete official Material snapshot in each family `DESIGN.md`.
- [Component adapter contract](./component-adapter.md) — demand-scoped family README matrix, exact-version workaround gate, proof contract, and completion criteria.
- [Token architecture](./component-tokens.md) — foundation, theme, component-family, application, and private token ownership.
- [Public token API](./token-api.md) — complete consumer-facing catalogue of supported runtime Material tokens.
- [Confirmed m3e defects](./m3e-defects.md) — stable `M3E-*` identities, lifecycle, evidence, mitigation, and removal triggers.
- [Roadmap](./roadmap.md) — the only owner of the current milestone, status, blockers, and next action.
- [Library root](../README.md) — public exports, boundary, and current family inventory.

## Operating model

```text
official Material pages
  → complete components/<family>/DESIGN.md
  → current Mioframe scenario
  → accepted demand-scoped Material–m3e–Vue family README matrix
  → public Vue MD* API and supported CSS token API
  → private m3e renderer plus correctly owned gap work
  → consumer migration and risk-based proof
```

`DESIGN.md` is not demand-scoped. It contains the complete official component contract, including unused variants, states, geometry, accessibility guidance, and full official component-token catalogue.

The family README is demand-scoped. It selects from `DESIGN.md`, records Vue and renderer mapping decisions, and owns component-specific proof facts.

The public runtime token contract contains only selected, declared, catalogued, and verified `--md-ref-*`, `--md-sys-*`, and `--md-comp-*` tokens. The complete official token catalogue remains in the relevant family `DESIGN.md`.

`@m3e/web`, `m3e-*`, renderer types/events, private DOM, `--m3e-*`, and `--md-private-*` remain implementation details. `--app-*` remains outside Material ownership.

Use `material-component-design` to create or refresh the first-stage design artifact. Use `material-component-adapter` only after the design artifact is current. Use architecture handoff only for unresolved non-Material functionality, cross-family ownership, renderer strategy, global theme ownership, or public token architecture not already resolved by canonical documents.

Do not place PR-specific completion history or next-action text in durable architecture documents. Update `roadmap.md` and the affected family README instead.
