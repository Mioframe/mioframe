# Button adapter contract

Family: Button

Migration target: `MDButton` (label-bearing Button)

Renderer viability: `ready`

Implementation ownership: `migrating`

Current and canonical owner: `src/shared/ui/material/components/button/MDButton.vue`

Public export: `@shared/ui/material` → `MDButton`

The legacy owner is removed and all existing consumers use the canonical adapter. No confirmed upstream blocker exists. Repository-local adapter work is complete; operator visual and motion acceptance remains the M1 exit gate.

## M1 correction implementation preflight

- Authoring source: this ready family contract plus the deterministic `material-component-adapter` workflow.
- Goal: complete the thin documented m3e Button mapping, remove the unused public-token bridge, correct motion-proof wording, and close repository-local M1 work.
- Non-goals: renderer reconstruction, new public Button tokens, consumer redesign, direct Lit or private-shadow-DOM access, and migration of any other Button component.
- Current owner and public entry: `MDButton.vue`, exported as `MDButton` from `@shared/ui/material`; all production consumers already use it and require no migration.
- State and ownership: consumers own `selected`; the adapter cancels renderer mutation and emits selection intent; m3e owns native/link semantics and interaction rendering; Mioframe owns loading light DOM.
- Minimum design: add explicit package-derived mappings only for documented Button properties and slots, retain the single custom-element root, delete all unsupported token aliases, and keep only the private loading color route. Merely deleting CSS is simpler but does not complete the required canonical Button surface.
- Expected files: `MDButton.vue`, `MDButton.test.ts`, package-derived `m3eButton.d.ts` Vue glue, `MDButton.stories.ts`, the Button README, the Material library README/roadmap, and existing Button browser wording where it overclaims motion.
- Pass order: component-contract red check; typed adapter and token cleanup; focused unit/type proof; browser wording and existing focused behavior proof; existing visual proof; documentation/status closeout; final `pnpm verify`.
- Removal: all Button `--m3e-*` mappings backed by unaccepted `--md-comp-button-*` tokens; no compatibility aliases remain.

TEST IMPACT

- Canonical documented Button property and slot mapping:
  - Primary proof owner: colocated `MDButton.test.ts` component-contract test.
  - Additional proof: package-derived type-check.
  - Existing proof: defaults, native type, disabled, controlled toggle, loading, label, and leading icon mappings.
  - New/updated proof: disabled-interactive, link/form values, and selected/trailing slot routing.
  - Risk or platform matrix: Vue-to-custom-element property/slot wiring only; no browser matrix expansion.
  - Persistent impact metadata: existing unit import relation; no registry change.
- Preserved native, controlled-state, focus, loading, disabled, and expanded-target behavior:
  - Primary proof owner: existing Storybook behavior spec.
  - Additional proof: component contract for controlled intent and explicit properties.
  - Existing proof: `tests/e2e/storybook/md-button-family.spec.ts`.
  - New/updated proof: rename the overclaimed motion scenario and retain only public press acquisition/release assertions.
  - Risk or platform matrix: established Storybook browser profile; real pointer and keyboard input.
  - Persistent impact metadata: existing Button source/story mapping remains accurate; no new spec.
- Stable accepted Button appearance after token-bridge removal:
  - Primary proof owner: existing bounded MDButton visual specs and baselines.
  - Additional proof: operator visual and renderer-owned motion review.
  - Existing proof: `tests/e2e/visual/shared-ui/md-button.spec.ts` and canonical snapshots.
  - New/updated proof: none unless an inspected baseline changes.
  - Risk or platform matrix: canonical Linux visual profile; animation quality remains manual.
  - Persistent impact metadata: existing mapping remains accurate; no new spec.

## Accepted current Mioframe scenarios

The application requires:

- pointer, Enter, and Space activation;
- disabled activation blocking;
- native `button`, `submit`, and `reset` behavior;
- visible and accessible label;
- optional leading icon;
- loading that preserves geometry, accessible name, and enabled activation unless explicitly disabled;
- consumer-controlled toggle state without renderer drift;
- programmatic focus;
- five appearances, five sizes, and round/square shapes;
- an expanded pointer target that remains actionable;
- existing application theme roles.

The expanded-target requirement is actionability only. No accepted consumer, public documentation, or product decision requires the visible container to avoid pressed feedback when activation begins through that target.

No accepted scenario specifies immediate pressed-shape release or a different minimum visual duration from the renderer.

## Renderer contract

Dependency range: `@m3e/web@^2.6.2`

Inspected version: `2.6.2`

Entry point: `@m3e/web/button`

Element: `m3e-button`

Package-derived type sources:

- `M3eButtonElement`;
- `ButtonShape`;
- `ButtonSize`;
- `ButtonVariant`;
- `HTMLElementTagNameMap['m3e-button']`.

The documented renderer supports the required variants, sizes, shapes, toggle/selected state, disabled behavior, button/submit/reset/link behavior, content slots, Material CSS inputs, and renderer-owned state layer, ripple, focus, elevation, and pressed-shape motion.

## Public Vue mapping

| Mioframe contract                | m3e contract                                                            | Ownership                                    |
| -------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| appearance                       | typed `variant`                                                         | Mioframe vocabulary, m3e rendering           |
| size                             | typed `size`                                                            | direct mapping                               |
| round/square                     | typed `shape`                                                           | Mioframe normalization                       |
| controlled selection             | `toggle`, `selected`, cancelable `beforeinput`                          | consumer state, adapter intent normalization |
| native actions                   | documented form properties                                              | browser/m3e                                  |
| link and form values             | `href`, `target`, `rel`, `download`, `name`, `value`                    | browser/m3e                                  |
| disabled                         | documented disabled property                                            | m3e                                          |
| focusable disabled state         | documented `disabledInteractive` property                               | m3e                                          |
| labels and icons                 | default, `icon`, `selected`, `selected-icon`, and `trailing-icon` slots | adapter mapping                              |
| loading                          | Mioframe light-DOM extension                                            | Mioframe                                     |
| focus, ripple, elevation, motion | renderer implementation                                                 | m3e                                          |
| theme roles                      | documented Material system semantics                                    | existing Mioframe theme and m3e              |

The private renderer boundary derives from package exports. No handwritten renderer property or literal-union mirror remains.

## Active public tokens

No current consumer or accepted public Mioframe documentation requires a Button-specific `--md-comp-button-*` override contract.

Therefore the adapter:

- do not complete a public Button-token catalogue;
- has removed unused `--m3e-*` mappings backed by undefined `--md-comp-button-*` variables;
- let m3e consume documented Material system roles and renderer defaults;
- retain only Mioframe-private routing needed by the loading extension;
- keep obsolete legacy stiffness/damping declarations removed.

A public Button token may be added later only for a real consumer or intentional API requirement.

## Material and m3e assessment

Official Material records used:

- `/components/buttons/overview`;
- `/components/buttons/specs`;
- `/components/buttons/guidelines`;
- `/components/buttons/accessibility`;
- verified cache snapshot `2026-07-20T16:16:49.323Z`.

| Observation                                   | Exact m3e behavior in 2.6.2                                                 | Accepted Mioframe requirement                      | Repository evidence                                                                                                                       | Decision                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| minimum retained pressed state                | `PressedController` retains pressed state for at least 150 ms               | none requiring immediate geometry release          | legacy `MDButton` drove pressed shape from `durationPressedState`; `usePressed` retained that state until the transition duration elapsed | renderer-owned behavior; not a blocker; operator evaluates visual quality |
| expanded target participates in pressed state | activation through the expanded target drives the same Button pressed state | target must be actionable; no no-morph requirement | legacy expanded target was inside the same native button and drove the same host pressed state and `:active` shape route                  | accepted renderer behavior; not a blocker                                 |

These observations are not confirmed Material conformance defects requiring Mioframe corrections. They may be reported upstream only if comparison with official guidance or operator review identifies an actual visual defect.

## Motion assessment

Pressed-shape motion is renderer-owned.

Repository-local verification consists of:

1. recording the exact installed implementation paths for press acquisition, retained duration, release/interruption, and reduced motion;
2. confirming the adapter does not override, disable, or duplicate renderer motion;
3. retaining only truthful automated assertions for public input behavior.

For `@m3e/web@2.6.2`, the exact installed implementation is:

- `dist/button.js` constructs `PressedController` with Space-key acquisition, a 150 ms minimum retained duration, and a callback that updates the renderer's private pressed/resting custom states and group geometry;
- `dist/core.js` acquires pointer presses on `pointerdown`, acquires keyboard presses on Space `keydown`, releases through document `pointerup`, `touchend`/`touchcancel`, or Space `keyup`, and defers the release callback only for the remaining minimum duration;
- `dist/button.js` clears pressed/resting states when disabled and on disconnection, removes transient shape/group values on disconnection, and routes subsequent acquisition/release callbacks through the same state transition owner;
- the Button stylesheet in `dist/button.js` disables base, label, icon, pressed/resting, and group transitions under `@media (prefers-reduced-motion)`.

`MDButton.vue` does not override these transitions, inspect their private DOM, or install a second press/motion system.

Actual animation quality and timing require operator manual testing. `:active` proves only browser press acquisition/release; screenshots do not prove animation lifecycle; private shadow-DOM tests are forbidden.

The existing behavior-test title or claims must not present `:active` assertions as proof of motion lifecycle.

## Current implementation status

Completed:

- package-derived renderer typing;
- canonical m3e-backed owner and public export;
- all existing consumer migration and legacy removal;
- native, disabled, controlled-toggle, focus, loading, and expanded-target actionability scenarios;
- restored loading presentation.
- direct package-checked disabled-interactive, link/form-value, and selected/trailing slot mappings;
- removal of the unused incomplete Button-token bridge;
- public-press-only automated wording and exact-version renderer motion assessment;
- focused component, type, Storybook behavior, and visual verification.

The only remaining M1 work is operator visual and motion acceptance plus the final repository gate recorded by this run.

## Completion gate

M1 completes when:

- renderer viability remains `ready`;
- implementation ownership becomes `migrated`;
- one canonical Vue owner and public export remain;
- accepted current scenarios are preserved;
- canonical documented m3e Button capabilities are available through thin typed mappings where they belong to the public component;
- genuine Material/m3e divergences are recorded and only evidenced required corrections are implemented;
- no unused public token catalogue or renderer leak remains;
- risk-based verification passes;
- operator accepts the canonical visual and motion result.
