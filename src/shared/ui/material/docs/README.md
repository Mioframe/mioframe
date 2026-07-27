# Mioframe Material 3 Expressive

This directory is the canonical documentation owner for `src/shared/ui/material`.

## Canonical documents

- [Architecture](./architecture.md) — Material-first component and token boundaries, private m3e ownership, gap routing, typing, and verification.
- [Component adapter contract](./component-adapter.md) — required Material–m3e–Vue matrix and end-to-end workflow.
- [Token architecture](./component-tokens.md) — foundation, theme, component-family, application, and private token ownership.
- [Public token API](./token-api.md) — complete consumer-facing catalogue of supported Material tokens.
- [Confirmed m3e defects](./m3e-defects.md) — stable `M3E-*` identities, lifecycle statuses, installed-version evidence, mitigations, history, and removal triggers.
- [Roadmap](./roadmap.md) — current milestone, blocker, and next action.
- [Library root](../README.md) — boundary, public API, and migration state.

## Operating model

```text
current Mioframe requirement
  → selected official Material component and token contracts
  → source-backed Material–m3e–Vue matrix
  → public Vue MD* API and supported CSS token API
  → private m3e implementation plus correctly owned gap work
  → consumer migration and risk-based verification
  → operator visual and motion review
```

The public component contract is a demand-driven subset of official Material expressed idiomatically in Vue. The public token contract contains supported `--md-ref-*`, `--md-sys-*`, and selected `--md-comp-*` declarations owned inside the Material library.

`@m3e/web`, `m3e-*` elements, renderer types, private DOM, `--m3e-*`, and `--md-private-*` remain implementation details. `--app-*` remains outside Material ownership.

The workflow must:

- derive public naming and semantics from Material, not legacy Mioframe or m3e;
- select only the surface required now and mark the rest deferred;
- keep Material foundation/theme tokens under `material/foundation`;
- keep selected component tokens and private renderer mappings in the owning family;
- keep `token-api.md` synchronized with executable declarations;
- avoid copying the full Material component-token catalogue or m3e defaults;
- use m3e maximally for selected Material behavior;
- assign remaining gaps to the Vue wrapper, foundation, component family, or m3e according to ownership;
- distinguish absent m3e capability (`missing`) from confirmed incorrect behavior (`divergent` plus `M3E-*`);
- revalidate affected non-resolved defects on every m3e version update;
- resolve functionality absent from Material separately instead of silently adding it to `MD*`;
- avoid renderer duplication, generic defect infrastructure, token DSLs, and exhaustive third-party tests.

Installed lockfile-resolved artifacts and observable browser behavior define consumed m3e runtime behavior. Upstream source, demos, tags, and changelogs are supporting evidence only.

## Token ownership migration

The current mixed-owner file:

```text
src/shared/lib/md/tokens.css
```

is temporary. PR #162 must:

1. move retained Material reference/system declarations to `material/foundation`;
2. move selected component tokens to their families;
3. move `--app-*` outside Material;
4. co-locate private bridges with their actual owner;
5. update the global import;
6. populate `token-api.md`;
7. remove the legacy file without a compatibility alias or duplicate owner.

## Workflow

Use `material-component-adapter` for one explicit official Material component. Use architecture handoff for unresolved non-Material functionality, cross-family ownership, renderer strategy, or public token architecture not already resolved by these documents.

## Current next action

Follow [Roadmap](./roadmap.md). PR #162 owns token-ownership migration followed by the state-opacity and visible Button-feedback correction.
