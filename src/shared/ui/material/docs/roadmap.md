# Mioframe Material migration roadmap

This file is the only owner of the current sequence, milestone state, blockers, and next action. Durable rules live in `architecture.md`, `component-adapter.md`, `component-tokens.md`, `token-api.md`, and `m3e-defects.md`.

## Current state

Last updated: 2026-07-29

Current milestone: `M0/M1 — m3e architecture reset, token ownership, and MDButton pilot`

Status: `correction`

Owner: PR #162 / `refactor/material-docs-ownership`

Implementation ownership: `migrating`

### Implemented

- `src/shared/ui/material` is the canonical owner of the project-facing Material Vue API, supported Material token API, renderer boundary, and Material-specific documentation.
- Official Material defines public contracts; current Mioframe consumers select the subset implemented now; installed `@m3e/web` remains a private renderer.
- The public entry point exports canonical `MDButton` and `MDLoadingIndicator` adapters.
- `MDButton` is narrowed to current action-button demand: filled/outlined/text colors, small/extra-small sizes, rounded shape, label, leading icon, disabled state, native button/submit behavior, normal click bubbling, and boolean loading presentation.
- Toggle state, selected content, elevated/tonal colors, larger sizes, square shape, reset, link fields, trailing icon, unused form identity fields, and the unselected Button token surface are deferred.
- Button loading is visual composition only: the Button host owns `aria-busy`; the nested Loading Indicator is hidden from the accessibility tree; loading does not imply disabled state or activation suppression.
- `MDButton.loading` and standalone `MDLoadingIndicator` are an explicit operator-approved M1 library requirement and dependency closure for short indeterminate operations; no current production recovery operation is misrepresented as that consumer.
- Consumers retain ownership of explicit `disabled` bindings, operation-specific guards, status, errors, and completion facts.
- Both selected Button sizes hand off the supported Loading Indicator minimum overall size of `24`.
- m3e exclusively owns Button pressed geometry, release timing, state layer, ripple, focus, elevation, expanded target, and motion; the wrapper contains no pseudo-class timing correction or parallel interaction state.
- `MDDialog` and `DialogForm` own busy action availability: busy forms expose `aria-busy`, disable apply/cancel actions, and do not inject a Loading Indicator into the action button.
- Feature-owned long or determinate progress remains outside Button, including ZIP import/export body progress.
- Current direct Button consumers use the canonical `@shared/ui/material` export and the replaced legacy `MDButton` implementation is removed.
- `MDLoadingIndicator` owns renderer integration, public geometry, standalone accessibility, the primary-default public color token, tests, stories, and the controlled `M3E-001`/`M3E-002` workarounds revalidated against installed `@m3e/web` `2.6.3`.
- The Loading Indicator source family uses the canonical lower-camel-case path `components/loadingIndicator`.
- Button composition overrides only the Loading Indicator-owned public color token to `currentColor`; standalone defaults and renderer inputs remain dependency-owned.
- Browser-permission and provider-authorization actions are classified as externally suspended, unbounded operations. `loading` is not their state model: they use feature-owned pending state and textual status while explicit disabled/re-entry guards remain.
- Shared state-opacity roles use `8%`/`10%`/`10%`/`16%`, compatible with the selected renderer grammars.
- Retained Material reference/system declarations live under canonical foundation/theme owners; `src/shared/lib/md/tokens.css` was removed without an alias.
- `token-api.md` is populated for the retained supported public surface.
- Button owns the five official text-Button foreground/state-layer tokens required by the current Snackbar inverse-primary action context and privately maps them to documented m3e host inputs.
- The legacy `.md *` descendant color/motion propagation is removed. A bounded production audit restored explicit ownership for Snackbar, Rich Tooltip, Dialog headline, and Empty State headline without renderer exclusions, marker attributes, or `!important`.
- Snackbar now owns inverse-surface/inverse-on-surface context and supplies inverse-primary through the selected Button tokens; Rich Tooltip subhead/supporting text explicitly own on-surface-variant.
- Real browser and bounded visual proof cover Snackbar resting/hover/focus/pressed color ownership and Rich Tooltip anatomy/action ownership.
- Direct `@m3e/web` imports and raw `m3e-*` Vue elements are lint-rejected outside `src/shared/ui/material`.
- Runtime `--m3e-*` references outside the Material boundary are rejected automatically.
- `config/vueCustomElements.ts` is the exact compiler allow-list for `m3e-button` and `m3e-loading-indicator`; `vue/no-undef-components` remains globally enabled, with narrow described exceptions only on those two actual raw tags.
- Storybook behavior mappings no longer use spec paths as source prefixes, include the renamed Loading Indicator family and color-ownership scenarios, and are protected by resolver tests.
- Screenshot-owned stories touched by the milestone carry the `visual` tag.
- CI autofix stages the complete working tree before cached-diff commit detection and has focused integration proof for tracked, untracked, symlink, and deleted output.
- The intentional compatible dependency refresh, including `@m3e/web`, remains accepted PR scope.

### Correction remainder

1. Pass the exact final current-head `pnpm verify:release` completion gate after all code and documentation commits. The latest local attempts were red only on the existing `appSmoke.spec.ts` startup flake, so the gate remains unresolved rather than waived.
2. Complete operator visual and motion review of Button, standalone/composed Loading Indicator, Snackbar contextual action states, and Rich Tooltip color ownership.
3. Re-review the complete current head, synchronize PR metadata, and make the merge-readiness decision.

No exact dependency pin, renderer-version registry, Lit application dependency, WebKit expansion, bundle-budget infrastructure, broad CSS selector scanner, or new reduced-motion contract is required by this milestone.

## Milestones

| ID  | Milestone                                          | Status       | Depends on | Exit gate                                                                                                                                                                                                  |
| --- | -------------------------------------------------- | ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0  | m3e-backed architecture reset and token foundation | `correction` | none       | canonical token owners/catalogue; automated renderer boundary; exact selected custom-element allow-list; final completion gate                                                                             |
| M1a | `MDLoadingIndicator` dependency adapter            | `correction` | M0         | operator-approved dependency contract; standalone/composed color ownership; lifecycle applicability; package-derived typing; independent proof; operator review; final verification                        |
| M1  | `MDButton` action adapter pilot                    | `correction` | M1a        | demand-scoped action API; migrated consumers; contextual token ownership; explicit busy/loading ownership; valid Loading Indicator handoff; visible interaction proof; operator review; final verification |
| M2  | `MDSwitch` stateful adapter pilot                  | `planned`    | M1         | source-backed matrix; controlled state/event order; renderer-gap ownership; verification                                                                                                                   |
| M3  | sequential component migration                     | `planned`    | M2         | one official component at a time; dependencies first; demand-scoped API/tokens; explicit gap ownership                                                                                                     |

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

Existing implementation surface:

- required `label` and optional numeric overall `size` API;
- independent root export and package-derived renderer source type;
- standalone browser role/name and host-geometry proof;
- independent size and primary-default/public-override color visual baselines;
- decorative Button composition through the public Vue boundary;
- owner-local `M3E-001`/`M3E-002` workarounds.

Completed correction:

- fixed the family path to `components/loadingIndicator`;
- recorded the operator-approved M1 dependency-closure demand without inventing a production consumer;
- independently reconstructed the standalone default and parent-composed color contracts;
- selected and owned the official active-indicator component token because standalone and Button values differ;
- replaced the inherited-color baseline with standalone primary-default/public-override proof;
- classified every current loading consumer and replaced Loading Indicator presentation on externally suspended, unbounded operations with feature-owned textual pending status and disabled actions.

Contained presentation remains deferred unless a current consumer is confirmed.

## M1 — Button

Selected implementation:

- action Button only; stateful toggle behavior remains deferred;
- filled, outlined, and text colors;
- small and extra-small sizes with a fixed rounded shape;
- label and optional leading icon;
- native button/submit behavior and normal event bubbling;
- explicit disabled state and independent boolean loading presentation;
- decorative Loading Indicator composition with `24/24` overall-size handoff;
- Button-owned `aria-busy` and icon restoration;
- consumer-owned action availability and operation guards;
- five selected official text-Button tokens with primary defaults and Snackbar-owned inverse-primary contextual overrides;
- renderer-owned pressed geometry, release timing, state layer, ripple, focus, elevation, expanded target, and motion;
- migrated consumers without numeric loading compatibility;
- completed shared-UI blast-radius migration after removing `.md *`.

Button completion now depends only on exact final current-head verification, operator visual/motion acceptance, and final resulting-PR review.

## Next component process

For each later component:

1. inspect official overview/specs/guidelines/accessibility and related components before accepting existing family artifacts;
2. select current demand from production scenarios and complete official dependencies first;
3. distinguish standalone defaults from parent-composed overrides;
4. create the accepted Material–m3e–Vue matrix;
5. implement the minimum canonical adapter and selected token surface;
6. keep m3e private and route gaps to the correct owner;
7. migrate consumers and remove replaced target ownership;
8. verify through the faithful proof owners and exact branch/task scope.

Consider shared adapter extraction only after M1 and M2 demonstrate repeated concrete code, not merely repeated documentation structure.
