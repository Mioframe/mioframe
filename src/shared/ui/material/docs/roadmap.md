# Mioframe Material migration roadmap

This file is the only owner of the current sequence, milestone state, blockers, and next action. Durable rules live in `architecture.md`, `component-adapter.md`, `component-tokens.md`, `token-api.md`, and `m3e-defects.md`.

## Current state

Last updated: 2026-07-28

Current milestone: `M0/M1 — m3e architecture reset, token ownership, and MDButton pilot`

Status: `verification`

Owner: PR #162 / `refactor/material-docs-ownership`

Implementation ownership: `migrating`

### Implemented

- `src/shared/ui/material` is the canonical owner of the project-facing Material Vue API, supported Material token API, renderer boundary, and Material-specific documentation.
- Official Material defines public contracts; current Mioframe consumers select the subset implemented now; installed `@m3e/web` remains a private renderer.
- The public entry point exports canonical `MDButton` and `MDLoadingIndicator` adapters.
- `MDButton` is narrowed to current action-button demand: filled/outlined/text colors, small/extra-small sizes, rounded shape, label, leading icon, disabled state, native button/submit behavior, normal click bubbling, and boolean loading.
- Toggle state, selected content, elevated/tonal colors, larger sizes, square shape, reset, link fields, trailing icon, and unused form identity fields are deferred.
- Button loading is visual composition: the Button host owns `aria-busy`; the nested Loading indicator is hidden from the accessibility tree; standalone `MDLoadingIndicator` remains a named progressbar.
- Both selected Button sizes hand off the supported Loading indicator minimum overall size of `24`.
- Button pressed geometry releases with the physical host `:active` state through documented m3e pressed-shape inputs, while renderer-owned ripple/state feedback may complete independently.
- `MDDialog` and `DialogForm` own busy action availability: busy forms expose `aria-busy`, disable apply/cancel actions, and do not inject a Loading indicator into the action button.
- Feature-owned long or determinate progress remains outside Button, including ZIP import/export body progress.
- Current direct Button consumers use the canonical `@shared/ui/material` export and the replaced legacy `MDButton` implementation is removed.
- `MDLoadingIndicator` owns its renderer integration, public geometry, standalone accessibility, tests, stories, and the controlled `M3E-001`/`M3E-002` workarounds revalidated against installed `@m3e/web` `2.6.3`.
- Shared state-opacity roles use `8%`/`10%`/`10%`/`16%`, compatible with the selected renderer grammars.
- Retained Material reference/system declarations live under canonical foundation/theme owners; `src/shared/lib/md/tokens.css` was removed without an alias.
- `token-api.md` is populated for the retained supported public surface.
- Direct `@m3e/web` imports and raw `m3e-*` Vue elements are lint-rejected outside `src/shared/ui/material`; Vue recognizes only the selected `m3e-button` and `m3e-loading-indicator` custom elements.
- Storybook behavior mappings no longer use spec paths as source prefixes and are protected by resolver tests.
- The intentional compatible dependency refresh, including `@m3e/web`, remains accepted PR scope.
- CI autofix uses the fixed-point `scripts/ciAutofix.mjs` implementation and has focused integration proof.

### Verification remainder

1. Complete operator visual review of Button pressed-shape release and Button/standalone Loading indicator presentation on the current preview.
2. Run the required single final completion gate on the resulting head: `pnpm verify:release`.
3. Re-review the complete resulting PR after documentation and any CI autofix commit, then make the merge-readiness decision.

No exact dependency pin, renderer-version registry, Lit application dependency, WebKit expansion, bundle-budget infrastructure, CSS regex scanner, or new reduced-motion contract is required by this milestone.

## Milestones

| ID  | Milestone                                          | Status         | Depends on | Exit gate                                                                                                                                        |
| --- | -------------------------------------------------- | -------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| M0  | m3e-backed architecture reset and token foundation | `verification` | none       | canonical token owners/catalogue; automated renderer boundary; selected custom-element allow-list; final completion gate                         |
| M1a | `MDLoadingIndicator` dependency adapter            | `verification` | M0         | accepted matrix; package-derived typing; standalone accessibility/geometry proof; controlled defect records; operator review; final verification |
| M1  | `MDButton` action adapter pilot                    | `verification` | M1a        | demand-scoped action API; migrated consumers; busy/loading ownership; visible interaction proof; operator review; final verification             |
| M2  | `MDSwitch` stateful adapter pilot                  | `planned`      | M1         | source-backed matrix; controlled state/event order; renderer-gap ownership; verification                                                         |
| M3  | sequential component migration                     | `planned`      | M2         | one official component at a time; dependencies first; demand-scoped API/tokens; explicit gap ownership                                           |

## Accepted foundation structure

```text
material/foundation/tokens.css
  → supported renderer-independent reference/system foundations

material/foundation/theme.css
  → default palette, light/dark system-color assignments, and catalogued theme overrides

material/components/<family>/tokens.css
  → selected supported official component tokens
  → private family-local renderer mappings

material/docs/token-api.md
  → complete supported consumer catalogue
```

One public token has one canonical base owner. A selected theme override must remain inside `theme.css`, be explicit in `token-api.md`, and be covered by the same runtime/visual contract.

## M1a — Loading indicator

Selected implementation:

- required `label` and optional numeric overall `size` API;
- independent root export and package-derived renderer source type;
- standalone browser role/name and host-geometry proof;
- independent size and inherited-color visual baselines;
- decorative Button composition through the public Vue boundary;
- owner-local `M3E-001`/`M3E-002` workarounds.

Contained presentation remains deferred.

## M1 — Button

Selected implementation:

- action Button only; stateful toggle behavior remains deferred;
- filled, outlined, and text colors;
- small and extra-small sizes with a fixed rounded shape;
- label and optional leading icon;
- native button/submit behavior and normal event bubbling;
- disabled and boolean loading states;
- decorative Loading indicator composition with `24/24` overall-size handoff;
- Button-owned `aria-busy` and icon restoration;
- immediate released-geometry mapping through documented renderer CSS inputs;
- renderer-owned state layer, ripple, focus, elevation, and motion;
- migrated consumers without numeric loading compatibility.

## Next component process

For each later component:

1. inspect official overview/specs/guidelines/accessibility and related components;
2. select current demand and complete official dependencies first;
3. create the accepted Material–m3e–Vue matrix;
4. implement the minimum canonical adapter and selected token surface;
5. keep m3e private and route gaps to the correct owner;
6. migrate consumers and remove replaced target ownership;
7. verify through the faithful proof owners and exact branch/task scope.

Consider shared adapter extraction only after M1 and M2 demonstrate repeated concrete code, not merely repeated documentation structure.
