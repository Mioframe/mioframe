# Button adapter contract

Family: Button

Migration target: `MDButton` (label-bearing Button)

Renderer viability: `ready`

Implementation ownership: `migrating`

Current and canonical owner: `src/shared/ui/material/components/button/MDButton.vue`

Public export: `@shared/ui/material` → `MDButton`

The legacy MDButton owner is removed and all existing consumers use the canonical adapter. Remaining repository work is bounded to final API alignment, removal of unnecessary token routing, recording Material/m3e differences, and exact-version animation source assessment. Operator visual and motion review follows after repository-local completion.

## Current Mioframe scenarios

The application currently requires:

- pointer, Enter, and Space activation;
- disabled activation blocking;
- native `button`, `submit`, and `reset` behavior;
- visible and accessible label;
- optional leading icon;
- loading that preserves geometry, accessible name, and enabled activation unless explicitly disabled;
- consumer-controlled toggle state without renderer drift;
- programmatic focus;
- five appearances, five sizes, and round/square shapes;
- existing application theme roles.

These scenarios are implemented and have focused component/browser/visual coverage where Mioframe owns the behavior.

## Canonical documented m3e Button surface

The dependency range is `@m3e/web@^2.6.2`; the inspected lockfile version is `2.6.2`; the family entry point is `@m3e/web/button`; the element is `m3e-button`.

The package exports:

- `M3eButtonElement`;
- `ButtonShape`;
- `ButtonSize`;
- `ButtonVariant`;
- `HTMLElementTagNameMap['m3e-button']`.

The documented renderer supports:

- `elevated`, `filled`, `tonal`, `outlined`, and `text` variants;
- `extra-small`, `small`, `medium`, `large`, and `extra-large` sizes;
- rounded and square shapes;
- default, leading-icon, selected-label, selected-icon, and trailing-icon slots;
- toggle and selected state;
- disabled and disabled-interactive behavior;
- button, submit, reset, and link behavior;
- documented Material system/component CSS inputs;
- renderer-owned state layer, ripple, focus, elevation, and pressed-shape motion.

The public Mioframe component should expose m3e capabilities that correspond to canonical Material Button concepts through direct typed forwarding. Raw renderer-only vocabulary or implementation objects remain private. This is API coverage, not a requirement for one dedicated test per capability.

## Renderer typing

The private renderer boundary uses package-exported types.

- `MDButton.vue` maps renderer values through exported m3e types.
- Vue custom-element typing derives from `Pick<M3eButtonElement, ...>` and contains framework glue only.
- Public Mioframe prop types remain independently owned.

No handwritten renderer property or literal-union mirror remains.

## Vue-to-m3e mapping

| Mioframe contract                | m3e contract                                   | Ownership                                    |
| -------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| appearance                       | typed `variant` property                       | Mioframe vocabulary, m3e rendering           |
| size                             | typed `size` property                          | direct mapping                               |
| round/square                     | typed rounded/square `shape` property          | Mioframe normalization                       |
| controlled selection             | `toggle`, `selected`, cancelable `beforeinput` | consumer state, adapter intent normalization |
| native action/link semantics     | documented form and link properties            | browser/m3e, thin forwarding                 |
| disabled states                  | documented disabled properties                 | m3e, thin forwarding                         |
| label and icon content           | documented slots                               | adapter slot mapping                         |
| loading                          | Mioframe light-DOM extension                   | Mioframe                                     |
| focus, ripple, elevation, motion | renderer implementation                        | m3e                                          |
| theme roles                      | documented Material system semantics           | existing Mioframe theme and m3e              |

## Active public tokens

No current repository consumer or accepted Mioframe documentation requires a Button-specific `--md-comp-button-*` override contract.

Therefore:

- do not complete a full public Button-token catalogue;
- remove unused `--m3e-*` mappings backed by undefined `--md-comp-button-*` variables;
- let m3e use its documented Material system roles and defaults;
- keep only Mioframe-private routing needed by the loading extension;
- keep obsolete legacy stiffness/damping declarations removed.

A public component token may be added later only when a real consumer or intentional public API requirement exists.

## Material versus m3e

Official Material records used for assessment:

- `/components/buttons/overview`;
- `/components/buttons/specs`;
- `/components/buttons/guidelines`;
- `/components/buttons/accessibility`;
- verified cache snapshot `2026-07-20T16:16:49.323Z`.

Before M1 completion, record confirmed differences for the supported surface:

| Material expectation       | m3e behavior in 2.6.2 | Required by Mioframe | Decision                                                   |
| -------------------------- | --------------------- | -------------------- | ---------------------------------------------------------- |
| pending bounded comparison | pending               | pending              | accept, wrapper correction, upstream follow-up, or blocker |

Rules:

- differences not required by Mioframe are recorded for possible m3e improvement without adapter code;
- Mioframe-required differences receive only minimal public-boundary corrections;
- differences requiring private DOM or duplicated renderer internals are upstream blockers;
- equivalent observable behavior implemented differently is not a divergence.

## Motion assessment

Pressed-shape motion is renderer-owned.

Repository-local verification consists of:

1. inspecting the exact installed m3e Button source and recording pressed-state, release/interruption, and reduced-motion code paths;
2. confirming the adapter does not override or duplicate renderer motion;
3. retaining only truthful automated assertions for public input behavior that Mioframe actually uses.

Actual animation quality and timing require operator manual testing. `:active` does not prove internal shape animation, screenshots do not prove its lifecycle, and private shadow-DOM tests are forbidden.

## Current implementation status

Completed:

- package-derived renderer typing;
- canonical m3e-backed owner;
- existing consumer migration and legacy removal;
- current native, disabled, controlled-toggle, loading, and basic visual behavior;
- restored loading presentation.

Remaining repository-local work:

1. remove unused incomplete public Button-token mappings;
2. complete thin typed exposure of canonical documented m3e Button capabilities not yet represented by the public wrapper;
3. complete the bounded Material-versus-m3e divergence table;
4. record exact-version animation source inspection and remove automated overclaims;
5. run focused checks and final `pnpm verify`;
6. update this README and roadmap to the final state.

After repository-local completion, the only expected remainder is operator visual and motion acceptance.

## Completion gate

M1 is complete when:

- renderer viability remains `ready`;
- implementation ownership becomes `migrated`;
- one canonical Vue owner and public export remain;
- current Mioframe scenarios are preserved;
- canonical documented m3e Button capabilities are available through thin typed mappings where they belong to the public Material component;
- confirmed Material/m3e divergences are recorded and only Mioframe-required thin corrections are implemented;
- no unused public token catalogue or private renderer leak remains;
- risk-based automated verification passes;
- operator accepts the canonical visual result and motion behavior.
