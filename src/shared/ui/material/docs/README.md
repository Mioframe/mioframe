# Mioframe Material 3 Expressive

This directory is the canonical documentation owner for `src/shared/ui/material`.

## Canonical documents

- [Architecture](./architecture.md) — durable Material-first boundaries, staged family artifacts, ownership, renderer isolation, and completion model.
- [Staged workflow](./component-workflow.md) — one-stage-per-invocation state machine and artifact handoffs.
- [Design document contract](./design-document.md) — complete official Material snapshot in each family `DESIGN.md`.
- [Architecture and implementation contract](./component-adapter.md) — architecture matrix, renderer/workaround rules, implementation boundary, and proof contract.
- [Token architecture](./component-tokens.md) — complete design catalogue, architecture selection, runtime ownership, and verification.
- [Public token API](./token-api.md) — consumer-facing catalogue of supported runtime Material tokens.
- [Confirmed m3e defects](./m3e-defects.md) — stable `M3E-*` identities, lifecycle, evidence, mitigation, and removal triggers.
- [Roadmap](./roadmap.md) — the only owner of the current milestone, blockers, and next action.
- [Library root](../README.md) — public exports, renderer boundary, and family inventory.

## Operating model

```text
official Material pages
  → components/<family>/DESIGN.md
  → components/<family>/ARCHITECTURE.md
  → component implementation + IMPLEMENTATION.md
  → consumer migration + MIGRATION.md
  → independent REVIEW.md
```

`material-component <name>` runs exactly one next stage and stops. A later invocation consumes the completed artifact.

Artifact ownership:

- `DESIGN.md` — complete official contract, not demand-scoped;
- `ARCHITECTURE.md` — selected Mioframe contract, ownership, Vue API, m3e mapping, proof, and migration plan;
- `IMPLEMENTATION.md` — component-owned implementation/proof handoff;
- `MIGRATION.md` — consumer migration and legacy removal;
- `REVIEW.md` — independent final review;
- family `README.md` — short index only.

The runtime token API contains only selected, declared, catalogued, and verified `--md-ref-*`, `--md-sys-*`, and `--md-comp-*` tokens. The complete official component-token catalogue remains in `DESIGN.md`; selection belongs to `ARCHITECTURE.md`.

`@m3e/web`, raw `m3e-*`, renderer types/events, private DOM, `--m3e-*`, and `--md-private-*` remain implementation details. `--app-*` remains outside Material ownership.

Use architecture handoff only for unresolved decisions outside this deterministic workflow. Do not place PR-specific progress in durable architecture documents; use `roadmap.md` and stage artifacts.