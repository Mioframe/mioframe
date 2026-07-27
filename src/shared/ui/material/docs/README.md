# Mioframe Material 3 Expressive

This directory is the canonical documentation owner for `src/shared/ui/material`.

## Canonical documents

- [Architecture](./architecture.md) — Material-first public API, private m3e renderer ownership, gap routing, typing, tokens, and verification.
- [Component adapter contract](./component-adapter.md) — required Material–m3e–Vue matrix and end-to-end workflow.
- [Component tokens](./component-tokens.md) — demand-driven official Material token selection and private m3e mapping.
- [Confirmed m3e defects](./m3e-defects.md) — stable `M3E-*` identities, upstream and Mioframe lifecycle statuses, exact-version evidence, mitigations, revalidation history, and removal triggers for incorrect m3e implementations.
- [Roadmap](./roadmap.md) — current milestone, blocker, and next action.
- [Library root](../README.md) — boundary, public API, and migration state.

## Operating model

```text
current Mioframe requirement
  → selected official Material component contract
  → source-backed Material–m3e–Vue matrix
  → public Vue MD* API
  → private m3e implementation plus correctly owned gap work
  → confirmed upstream defects linked to stable M3E-* records
  → consumer migration and risk-based verification
  → operator visual and motion review
```

The public contract is a demand-driven subset of official Material expressed idiomatically in Vue. `@m3e/web`, `m3e-*` elements, renderer types, private DOM, and `--m3e-*` variables remain implementation details.

The workflow must:

- derive public naming and semantics from Material, not legacy Mioframe or m3e;
- select only the surface required now and mark the rest deferred;
- use m3e maximally for selected Material behavior;
- assign remaining gaps to the Vue wrapper or m3e according to ownership;
- distinguish absent m3e capability (`missing` in the family matrix) from confirmed incorrect m3e behavior (`divergent` plus a stable `M3E-*` record);
- revalidate affected non-resolved defect records on every m3e version update;
- resolve functionality absent from Material separately instead of silently adding it to `MD*`;
- avoid complete documentation copies, token catalogues, renderer duplication, generic defect infrastructure, and exhaustive third-party tests.

Renderer-owned animation and private geometry are assessed through exact-version source inspection and operator manual testing. Automated tests cover the selected public Vue contract, public host geometry, and Mioframe-owned integration only.

## Workflow

Use `material-component-adapter` for one explicit official Material component. Use architecture handoff for unresolved non-Material functionality, cross-family ownership, renderer strategy, public architecture decisions, or an m3e change that cannot be delivered through the accepted exact-version workaround gate.

## Current next action

Follow [Roadmap](./roadmap.md). PR #162 owns the architecture reset and the Material-first correction of the `MDButton` pilot.
