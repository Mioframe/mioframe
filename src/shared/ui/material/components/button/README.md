# Button adapter contract

Family: Button

Migration target: `MDButton` (label-bearing Button)

Renderer viability: `ready`

Implementation ownership: `migrating`

Current and canonical owner: `src/shared/ui/material/components/button/MDButton.vue`

Public export: `@shared/ui/material` → `MDButton`

The legacy owner is removed and all existing consumers use the canonical adapter. No confirmed upstream blocker exists. Remaining work is bounded to final API alignment, removal of unnecessary token routing, truthful renderer assessment, verification, and operator acceptance.

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

| Mioframe contract | m3e contract | Ownership |
| --- | --- | --- |
| appearance | typed `variant` | Mioframe vocabulary, m3e rendering |
| size | typed `size` | direct mapping |
| round/square | typed `shape` | Mioframe normalization |
| controlled selection | `toggle`, `selected`, cancelable `beforeinput` | consumer state, adapter intent normalization |
| native actions | documented form properties | browser/m3e |
| disabled | documented disabled property | m3e |
| label and leading icon | documented slots | adapter mapping |
| loading | Mioframe light-DOM extension | Mioframe |
| focus, ripple, elevation, motion | renderer implementation | m3e |
| theme roles | documented Material system semantics | existing Mioframe theme and m3e |

The private renderer boundary derives from package exports. No handwritten renderer property or literal-union mirror remains.

## Active public tokens

No current consumer or accepted public Mioframe documentation requires a Button-specific `--md-comp-button-*` override contract.

Therefore:

- do not complete a public Button-token catalogue;
- remove unused `--m3e-*` mappings backed by undefined `--md-comp-button-*` variables;
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

| Observation | Exact m3e behavior in 2.6.2 | Accepted Mioframe requirement | Repository evidence | Decision |
| --- | --- | --- | --- | --- |
| minimum retained pressed state | `PressedController` retains pressed state for at least 150 ms | none requiring immediate geometry release | legacy `MDButton` drove pressed shape from `durationPressedState`; `usePressed` retained that state until the transition duration elapsed | renderer-owned behavior; not a blocker; operator evaluates visual quality |
| expanded target participates in pressed state | activation through the expanded target drives the same Button pressed state | target must be actionable; no no-morph requirement | legacy expanded target was inside the same native button and drove the same host pressed state and `:active` shape route | accepted renderer behavior; not a blocker |

These observations are not confirmed Material conformance defects requiring Mioframe corrections. They may be reported upstream only if comparison with official guidance or operator review identifies an actual visual defect.

## Motion assessment

Pressed-shape motion is renderer-owned.

Repository-local verification consists of:

1. recording the exact installed implementation paths for press acquisition, retained duration, release/interruption, and reduced motion;
2. confirming the adapter does not override, disable, or duplicate renderer motion;
3. retaining only truthful automated assertions for public input behavior.

Actual animation quality and timing require operator manual testing. `:active` proves only browser press acquisition/release; screenshots do not prove animation lifecycle; private shadow-DOM tests are forbidden.

The existing behavior-test title or claims must not present `:active` assertions as proof of motion lifecycle.

## Current implementation status

Completed:

- package-derived renderer typing;
- canonical m3e-backed owner and public export;
- all existing consumer migration and legacy removal;
- native, disabled, controlled-toggle, focus, loading, and expanded-target actionability scenarios;
- restored loading presentation.

Remaining repository-local work:

1. remove unused incomplete Button-token mappings;
2. finish thin typed exposure of canonical documented m3e Button capabilities that belong to the public Vue component;
3. update automated test wording/assertions so they claim only observable public behavior;
4. record the exact-version animation implementation paths without treating accepted renderer mechanics as blockers;
5. run focused checks and final `pnpm verify`;
6. update this contract and roadmap to final state.

After repository-local completion, the only expected remainder is operator visual and motion acceptance.

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
