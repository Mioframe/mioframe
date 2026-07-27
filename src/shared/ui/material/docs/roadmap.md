# Mioframe Material migration roadmap

This file owns only the current sequence, milestone state, blockers, and next action. Durable rules live in `architecture.md`, `component-adapter.md`, `component-tokens.md`, `token-api.md`, and `m3e-defects.md`.

## Current state

Last updated: 2026-07-27

Current milestone: `M0/M1 — token ownership and MDButton pilot correction`

Status: `correction`

Owner: current architecture-reset branch

Implementation ownership: `migrating`

### Completed correction work

- `MDButton` and `MDLoadingIndicator` implement the selected demand-scoped Material contracts through private installed `@m3e/web` `2.6.3` renderers.
- Button composes the canonical Loading indicator adapter and does not own dependency renderer details.
- The four shared state-opacity roles use `8%`/`10%`/`10%`/`16%`, preserving their Material opacity magnitude while remaining valid for every selected current CSS consumer grammar.
- Real-browser visual proof covers pointer hover, keyboard focus, pointer-press ripple, and Space-key ripple without private renderer DOM access.
- The provisional `M3E-003` record was removed as a pre-merge misclassification and its ID retired.
- `M3E-001` and `M3E-002` were revalidated against the installed `2.6.3` artifact and remain active dependency-owned workarounds.

### Current blocker

The physical token-ownership migration is not implemented.

Material reference, system, theme, private, application, and component declarations remain mixed in:

```text
src/shared/lib/md/tokens.css
```

This file is a migration source only and contradicts the accepted final ownership model. `src/shared/ui/material/docs/token-api.md` remains `migration-required` and is not yet populated from the retained supported runtime surface.

### Next action

Complete M0 without intentionally changing presentation:

1. inventory every declaration and import in `src/shared/lib/md/tokens.css`;
2. create canonical Material foundation and theme owners;
3. move selected component tokens and private renderer mappings to their owning families;
4. move `--app-*` outside Material;
5. preserve the validated state-opacity values `8%`/`10%`/`10%`/`16%`;
6. update the single global import;
7. populate `token-api.md` with every retained supported public token;
8. remove the legacy file without a compatibility alias or duplicate owner;
9. run focused verification and final `pnpm verify` on the resulting head;
10. obtain operator visual/motion acceptance and perform the final full-PR architecture review.

## Milestones

| ID | Milestone | Status | Depends on | Exit gate |
| --- | --- | --- | --- | --- |
| M0 | m3e-backed architecture reset and token foundation | `correction` | none | canonical foundation/theme and family token owners; complete public token catalogue; legacy mixed-owner token file removed; final verification |
| M1a | `MDLoadingIndicator` dependency adapter | `verification` | M0 | accepted matrix and public API; package-derived typing; accessibility and geometry proof; `M3E-001`/`M3E-002` current for consumed m3e; operator review |
| M1 | `MDButton` adapter pilot | `verification` | M1a | accepted matrix and API; canonical Loading indicator composition; visible interaction proof; migrated consumers; final verification and operator acceptance |
| M2 | `MDSwitch` stateful adapter pilot | `planned` | M1 | source-backed matrix; controlled state and event order; renderer-gap ownership; verification and operator acceptance |
| M3 | sequential component migration | `planned` | M2 | one official Material component at a time; dependencies first; demand-driven API and tokens; explicit renderer mapping and gap ownership |

The overall roadmap remains `correction` while M0 is open, even though M1a and M1 implementation evidence is ready for verification. A dependent milestone cannot complete before its architectural dependency.

## M0 — token foundation correction

Accepted architecture:

```text
material/foundation/tokens.css
  → supported renderer-independent reference/system foundations

material/foundation/theme.css
  → default palette and light/dark system color roles

material/components/<family>/tokens.css
  → selected supported official component tokens
  → private family-local m3e mappings

material/docs/token-api.md
  → complete supported consumer catalogue
```

Required correction:

- classify every retained legacy declaration by semantic owner;
- move only intentionally supported public declarations;
- remove invalid, obsolete, duplicate, unused, or incorrectly owned declarations;
- keep `--app-*` outside Material;
- co-locate retained `--md-private-*` bridges with their actual owner;
- preserve behavior during the ownership pass;
- leave one runtime declaration owner for each token;
- do not copy the complete Material component-token catalogue or m3e defaults.

## M1a — MDLoadingIndicator prerequisite

Completed implementation and proof:

- canonical root-exported component;
- selected `label` and numeric overall `size` API;
- Button composition through the public Vue boundary;
- package-derived renderer typing;
- real-browser accessibility and host-geometry proof;
- independent visual baselines;
- accepted overall/active-size mapping;
- owner-local controlled workarounds for `M3E-001` and `M3E-002`;
- revalidation of both defects against installed m3e `2.6.3`;
- installed-renderer motion reassessment.

Remaining:

- M0 completion;
- verification on the resulting head;
- operator visual/motion acceptance.

Contained presentation remains deferred.

## M1 — MDButton pilot

Accepted implementation:

1. `MDButton` imports and renders `MDLoadingIndicator`, not raw Loading indicator m3e.
2. Loading takes precedence over normal and selected-icon routes and restores the correct route.
3. Native click bubbling is preserved.
4. Text toggle is supported.
5. Button hands off accessible purpose and selected overall Loading indicator size.
6. Button uses the accepted overall-size mapping `24/24/24/32/40`.
7. Button references dependency defects only through the Loading indicator contract.
8. Shared Material foundation owns state-opacity representation; Button owns neither a local conversion nor a ripple.

Completed correction evidence:

- state-opacity values normalized to the compatible percentage grammar;
- selected current consumers audited;
- pointer hover, keyboard focus, pointer ripple, and Space ripple proven through public-surface screenshots;
- no private renderer DOM inspection;
- current consumers migrated;
- focused Button and dependency evidence updated.

Remaining:

- M0 completion;
- verification on the resulting head;
- operator visual/motion acceptance.

## Later milestones

For each later component:

1. inspect official overview, specs, guidelines, accessibility, and token sources;
2. identify and complete official dependency adapters first;
3. select only current component and token demand;
4. create the Material–m3e–Vue matrix;
5. add supported family tokens to their canonical owner and `token-api.md`;
6. keep unsupported official tokens `deferred`;
7. classify renderer absence as `missing` and confirmed incorrect behavior as `divergent` with a stable `M3E-*` record;
8. keep m3e private to the canonical adapter;
9. migrate consumers and verify.

Only after M1 and M2 may repeated concrete adapter code be considered for extraction.
