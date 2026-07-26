# Mioframe Material 3 Expressive

This directory is the canonical documentation owner for `src/shared/ui/material`.

## Canonical documents

- [Architecture](./architecture.md) — Material-first public API, private m3e renderer ownership, gap routing, typing, tokens, and verification.
- [Component adapter contract](./component-adapter.md) — required Material–m3e–Vue matrix and end-to-end workflow.
- [Component tokens](./component-tokens.md) — demand-driven official Material token selection and private m3e mapping.
- [Roadmap](./roadmap.md) — current milestone, blocker, and next action.
- [Library root](../README.md) — boundary, public API, and migration state.

## Operating model

```text
current Mioframe requirement
  → selected official Material component contract
  → source-backed Material–m3e–Vue matrix
  → public Vue MD* API
  → private m3e implementation plus correctly owned gap work
  → consumer migration and risk-based verification
  → operator visual and motion review
```

The public contract is a demand-driven subset of official Material expressed idiomatically in Vue. `@m3e/web`, `m3e-*` elements, renderer types, private DOM, and `--m3e-*` variables remain implementation details.

The workflow must:

- derive public naming and semantics from Material, not legacy Mioframe or m3e;
- select only the surface required now and mark the rest deferred;
- use m3e maximally for selected Material behavior;
- assign remaining gaps to the Vue wrapper or m3e according to ownership;
- resolve functionality absent from Material separately instead of silently adding it to `MD*`;
- avoid complete documentation copies, token catalogues, renderer duplication, and exhaustive third-party tests.

Renderer-owned animation is assessed through exact-version source inspection and operator manual testing. Automated tests cover the selected public Vue contract and Mioframe-owned integration only.

## Workflow

Use `material-component-adapter` for one explicit official Material component. Use architecture handoff for unresolved non-Material functionality, m3e changes, cross-family ownership, renderer strategy, or public architecture decisions.

## Current next action

Follow [Roadmap](./roadmap.md). PR #162 owns the architecture reset and the Material-first correction of the `MDButton` pilot.