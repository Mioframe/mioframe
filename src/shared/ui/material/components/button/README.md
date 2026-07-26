# Button adapter contract

Family: Button

Migration target: `MDButton` (label-bearing Button)

Renderer viability: `ready`

Implementation ownership: `migrating`

Current and canonical owner: `src/shared/ui/material/components/button/MDButton.vue`

Public export: `@shared/ui/material` → `MDButton`

The legacy MDButton owner is removed and all existing consumers use the canonical adapter. The remaining repository work is to align the adapter with the revised minimal contract, document m3e/Material differences, and remove unnecessary token routing. Operator visual and motion review follows after repository-local completion.

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
- current application theme roles.

These scenarios are implemented and have focused component/browser/visual coverage where Mioframe owns the behavior.

## Documented m3e Button surface

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

The public Mioframe API should cover documented m3e capabilities that correspond to canonical Material Button semantics through direct typed forwarding. It must not expose raw renderer element instances, renderer event objects, or renderer-specific vocabulary unnecessarily.

## Renderer typing

The private renderer boundary uses package-exported types.

- `MDButton.vue` maps variant, size, shape, and native type through exported m3e types.
- Vue custom-element typing derives from `Pick<M3eButtonElement, ...>` and contains framework glue only.
- The public Mioframe prop types remain independently owned.

No handwritten renderer property or literal-union mirror remains.

## Vue-to-m3e mapping

| Mioframe contract | m3e contract | Ownership |
| ----------------- | ------------ | --------- |
| appearance | typed `variant` property | Mioframe vocabulary, m3e rendering |
| size | typed `size` property | direct mapping |
| round/square | typed rounded/square `shape` property | Mioframe normalization |
| controlled selection | `toggle`, `selected`, cancelable `beforeinput` | consumer state, adapter intent normalization |
| native button type | form-associated `type` | browser/m3e |
| disabled | documented `disabled` behavior | m3e |
| label and icons | documented slots | adapter slot mapping |
| loading | Mioframe light-DOM extension | Mioframe |
| focus, ripple, elevation, motion | renderer implementation | m3e |
| theme roles | documented Material system semantics | existing Mioframe theme and m3e |

## Active public tokens

No current repository consumer or accepted Mioframe documentation requires a Button-specific `--md-comp-button-*` override contract.

Therefore:

- the adapter must not complete a full public Button-token catalogue;
- unused `--m3e-*` mappings backed by undefined `--md-comp-button-*` variables should be removed;
- m3e should use its documented Material system-role behavior and defaults;
- the loading indicator may use Mioframe-private routing from existing system roles;
- obsolete legacy stiffness/damping declarations remain removed.

A public component token may be added later only when a real consumer or intentional public API requirement exists.

## Material versus m3e

Official Material records used for this assessment:

- `/components/buttons/overview`;
- `/components/buttons/specs`;
- `/components/buttons/guidelines`;
- `/components/buttons/accessibility`;
- verified cache snapshot `2026-07-20T16:16:49.323Z`.

Before M1 completion, record confirmed differences for the supported surface:

| Material expectation | m3e behavior in 2.6.2 | Required by Mioframe | Decision |
| -------------------- | --------------------- | -------------------- | -------- |
| pending bounded comparison | pending | pending | accept, wrapper correction, upstream follow-up, or blocker |

Rules:

- differences not required by Mioframe are recorded for possible m3e improvement without adapter code;
- Mioframe-required differences may receive only a minimal public-boundary wrapper correction;
- differences requiring private DOM or duplicated renderer internals are upstream blockers;
- equivalent observable behavior implemented differently is not a divergence.

## Motion assessment

Pressed-shape motion is renderer-owned.

Repository-local verification consists of:

1. inspecting the exact installed m3e Button implementation and recording the pressed-state, release/interruption, and reduced-motion code paths;
2. confirming the adapter does not override or duplicate renderer motion;
3. retaining only truthful browser assertions for public press input when useful to Mioframe scenarios.

Actual animation quality and timing require operator manual testing. `:active` does not prove the internal shape animation, and no private shadow-DOM test is permitted.

## Current implementation status

Completed:

- package-derived renderer typing;
- canonical m3e-backed owner;
- existing consumer migration and legacy removal;
- current native, disabled, controlled-toggle, loading, and basic visual behavior;
- restored loading presentation.

Remaining repository-local work:

1. remove unused incomplete public Button-token mappings;
2. ensure the public API covers the canonical documented m3e Button surface selected above through direct typed forwarding, without generic infrastructure;
3. complete the bounded Material-versus-m3e divergence table;
4. record exact-version animation source inspection and remove any automated overclaim;
5. run focused checks and final `pnpm verify`;
6. update this README and roadmap to the final state.

After repository-local completion, the only expected remainder is operator visual and motion acceptance.

## Completion gate

M1 is complete when:

- renderer viability remains `ready`;
- implementation ownership becomes `migrated`;
- one canonical Vue owner and public export remain;
- current Mioframe scenarios are preserved;
- canonical documented m3e Button capabilities are exposed through thin typed mappings where they belong to the public Material component;
- confirmed Material/m3e divergences are recorded and only Mioframe-required thin corrections are implemented;
- no unused public token catalogue or private renderer leak remains;
- risk-based automated verification passes;
- operator accepts the canonical visual result and motion behavior.