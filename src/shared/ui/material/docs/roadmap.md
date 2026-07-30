# Mioframe Material migration roadmap

This file is the only owner of the current sequence, milestone state, blockers, and next action. Durable rules live in `design-document.md`, `architecture.md`, `component-adapter.md`, `component-tokens.md`, `token-api.md`, and `m3e-defects.md`.

## Current state

Last updated: 2026-07-30

Current milestone: `M0/M1 — design-first m3e architecture, token ownership, and MDButton pilot`

Status: `correction`

Owner: PR #162 / `refactor/material-docs-ownership`

Implementation ownership: `migrating`

## Accepted architecture

```text
official Material documentation
  → complete components/<family>/DESIGN.md
  → current Mioframe demand
  → demand-scoped family README matrix
  → public Vue MD* API and selected runtime tokens
  → private @m3e/web renderer
```

`DESIGN.md` is the full official component description. It is not demand-scoped and contains the complete official variants, configurations, states, guidance, accessibility, geometry, related components, and component-token catalogue.

The family README is the Mioframe implementation contract. It selects from `DESIGN.md`, records Vue and renderer mappings, ownership, defects, proof, and deferred runtime surface.

A missing, stale, blocked, or incomplete family `DESIGN.md` blocks implementation completion and `migrated` status.

## Implemented

- `src/shared/ui/material` is the canonical project-facing Material Vue and token boundary.
- Official Material remains the public contract authority; installed `@m3e/web` remains private.
- Canonical `MDButton` and `MDLoadingIndicator` adapters and exports exist.
- Current direct Button consumers use `@shared/ui/material`; the legacy Button implementation was removed.
- Button loading composition, accessibility ownership, independent disabled state, and Loading Indicator handoff are implemented.
- Loading Indicator owns standalone geometry, accessibility, selected active-color token, and controlled `M3E-001`/`M3E-002` workarounds.
- The Loading Indicator family path is `components/loadingIndicator`.
- Foundation/theme token ownership, dark inverse/outline mappings, renderer boundaries, custom-element allow-list, and token catalogue enforcement are implemented.
- Global `.md *` color/motion ownership was removed; Snackbar, Rich Tooltip, Dialog, and Empty State color ownership was migrated locally.
- Storybook impact mappings, screenshot tags, and CI-autofix complete-tree detection were corrected.
- The intentional compatible dependency refresh, including `@m3e/web`, remains accepted PR scope.

## Primary correction blocker: missing complete design artifacts

The current Button and Loading Indicator families do not yet contain:

```text
src/shared/ui/material/components/button/DESIGN.md
src/shared/ui/material/components/loadingIndicator/DESIGN.md
```

Their existing READMEs are demand-scoped adapter records, not complete official Material descriptions.

Before either family can be approved:

1. run the design stage for Button and Loading Indicator;
2. capture every applicable official overview, specs, guidelines, accessibility, related-component, and token source;
3. include the complete official surface and complete component-token catalogue, including unused capability;
4. record source snapshot metadata and conflicts;
5. rebuild the family README matrices with exact `DESIGN.md` references;
6. re-review all selected/deferred decisions and current implementation against the complete design artifacts.

Do not create abbreviated placeholders. A design artifact is accepted only when its status is `current` under `docs/design-document.md`.

## Secondary correction blocker: Button contextual token contract

The first Button component-token runtime pass is not accepted:

- public `hover`/`focus` names were derived from m3e vocabulary instead of official Material `hovered`/`focused` paths;
- the current five-token subset omits state-specific hovered/focused/pressed label tokens, so Snackbar action text can fall back from inverse-primary to primary;
- the published text-Button icon token has no current contextual consumer;
- browser proof does not prove the rendered label color in each interaction state;
- existing Snackbar state baselines cannot be treated as Material-correct acceptance evidence.

The provisional accepted target is seven text-Button tokens:

```text
--md-comp-button-text-label-text-color
--md-comp-button-text-hovered-label-text-color
--md-comp-button-text-focused-label-text-color
--md-comp-button-text-pressed-label-text-color
--md-comp-button-text-hovered-state-layer-color
--md-comp-button-text-focused-state-layer-color
--md-comp-button-text-pressed-state-layer-color
```

This target must be confirmed against the complete Button `DESIGN.md` before code correction. No compatibility aliases are required because the incorrect names have not shipped.

## Correction remainder

1. Create complete current `DESIGN.md` artifacts for Button and Loading Indicator.
2. Rebuild both family README matrices with exact design references and re-evaluate all selected/deferred/default/dependency decisions.
3. Confirm or correct the provisional seven-token Button target from the complete design token catalogue.
4. Replace Button runtime declarations, renderer mappings, Snackbar overrides, catalogue entries, tests, and affected baselines atomically.
5. Prove Snackbar action-label computed color in resting, hovered, focused, and pressed states.
6. Remove the unconsumed text-Button icon token and ineffective `MDAppBar.__trailing-elements` content-color declaration unless a real supported contract is established.
7. Keep behavioral focus assertions in browser behavior tests; visual specs only prepare deterministic states and capture screenshots.
8. Return `token-api.md` to normal supported-catalogue status only after executable Button declarations and catalogue match.
9. Pass the exact final current-head `pnpm verify:release` gate.
10. Complete operator visual and motion review of Button, standalone/composed Loading Indicator, corrected Snackbar states, and Rich Tooltip.
11. Re-review the complete resulting head, synchronize PR metadata, and make the merge-readiness decision.

No exact dependency pin, renderer-version registry, Lit application dependency, WebKit expansion, bundle-budget infrastructure, broad CSS selector scanner, or new reduced-motion contract is required by this milestone.

## Milestones

| ID  | Milestone                                          | Status       | Depends on | Exit gate                                                                                                                                                                                 |
| --- | -------------------------------------------------- | ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | design-first m3e architecture and token foundation | `correction` | none       | design-document contract; canonical token owners/catalogue; renderer boundary; final verification                                                                                         |
| M1a | `MDLoadingIndicator` design and dependency adapter | `correction` | M0         | complete current `DESIGN.md`; accepted README mapping; standalone/composed ownership; independent proof; operator review; final verification                                              |
| M1  | `MDButton` design and action adapter pilot         | `correction` | M1a        | complete current `DESIGN.md`; demand-scoped API; migrated consumers; state-complete contextual tokens; dependency handoff; visible interaction proof; operator review; final verification |
| M2  | `MDSwitch` design and stateful adapter pilot       | `planned`    | M1         | complete design artifact; source-backed matrix; controlled state/event order; renderer-gap ownership; verification                                                                        |
| M3  | sequential component migration                     | `planned`    | M2         | one official component at a time; design first; dependencies first; demand-scoped runtime API/tokens; explicit gap ownership                                                              |

## Accepted family structure

```text
material/components/<family>/DESIGN.md
  → complete official Material component contract

material/components/<family>/README.md
  → demand-scoped Material–Vue–m3e mapping

material/components/<family>/tokens.css
  → selected supported official component tokens
  → private family-local renderer mappings

material/docs/token-api.md
  → complete supported runtime consumer catalogue
```

## Next component process

For every component:

1. create or refresh the complete official `DESIGN.md`;
2. stop if source coverage is blocked or stale;
3. select current demand from the complete design artifact;
4. complete official dependency designs and adapters first;
5. distinguish standalone defaults from parent-composed overrides;
6. create the demand-scoped Material–m3e–Vue README matrix with exact design references;
7. trace contextual tokens through official path, public token, renderer input/fallback, and consumer result;
8. implement the minimum canonical adapter and selected runtime token surface;
9. migrate consumers and remove replaced ownership;
10. verify computed rendered results and run the exact completion gate.

Consider shared adapter extraction only after M1 and M2 demonstrate repeated concrete code, not merely repeated documentation structure.
