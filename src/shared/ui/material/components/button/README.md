# Button adapter contract

Family: Button

Migration target: `MDButton` (common label-bearing buttons only)

Renderer viability: `ready`

Implementation ownership: `migrating`

Current production owner: `src/shared/ui/material/components/button/MDButton.vue`

Canonical owner after migration: `src/shared/ui/material/components/button/MDButton.vue`

Public export: `@shared/ui/material` → `MDButton`

The legacy `src/shared/ui/Button/MDButton.vue` owner has been removed and consumers have moved, but the migration exit gate is not complete. Ownership remains `migrating` until the review findings below are corrected, all required proof passes, and operator visual acceptance is recorded.

## Required scenarios and boundary

The accepted contract requires:

- ordinary pointer, Enter, and Space activation;
- disabled activation blocking;
- native `button`, `submit`, and `reset` behavior with form association;
- a visible accessible label;
- optional leading icon and RTL ordering;
- loading as a Mioframe extension while retaining the accepted enabled activation contract;
- controlled toggle selection with programmatic prop updates and no false user-action emits;
- programmatic focus;
- five colors, five sizes, and two shapes;
- active public Button token overrides;
- supported themes;
- renderer-owned pressed-shape motion and reduced-motion behavior.

No current repository consumer uses `MDButton` as a link. Link props are not required by this pilot. `MDIconButton`, `MDFab`, `MDExtendedFab`, button groups, segmented buttons, split buttons, and other Material families remain excluded.

## Sources and renderer assessment

Official Material records were read from the verified project Material cache captured `2026-07-20T16:16:49.323Z`: `/components/buttons/overview`, `/components/buttons/specs`, `/components/buttons/guidelines`, and `/components/buttons/accessibility`.

The renderer dependency range is `@m3e/web@^2.6.2`; the inspected lockfile version is `2.6.2`; the required family entry point is `@m3e/web/button`; and the registered element is `m3e-button`.

The exact family entry point exports:

- `M3eButtonElement`;
- `ButtonShape`;
- `ButtonSize`;
- `ButtonVariant`;
- the package declaration for `HTMLElementTagNameMap['m3e-button']`.

The package declarations and Custom Elements Manifest document:

- variants `elevated`, `filled`, `tonal`, `outlined`, and `text`;
- sizes `extra-small`, `small`, `medium`, `large`, and `extra-large`;
- shapes `rounded` and `square`;
- reflected `toggle` and `selected` properties;
- default, `icon`, `selected`, `selected-icon`, and `trailing-icon` slots;
- disabled behavior, form-associated `button`/`submit`/`reset`, and link attributes;
- cancelable `beforeinput` before selected-state mutation, followed by `input` and `change` when not canceled;
- documented component and variant CSS custom properties for geometry, shape, color, elevation, outline, state layers, typography, and spacing;
- renderer-owned pressed-corner motion and reduced-motion behavior.

Those APIs cover the required adapter surface. Renderer viability remains `ready`.

## Renderer typing decision

The private renderer boundary derives from the exact package-exported types.
`src/shared/ui/material/m3eButton.d.ts` uses `Pick<M3eButtonElement, ...>` and retains only
Vue `GlobalComponents` and event-handler glue. `MDButton.vue` keeps its independently owned
public props while mapped variant, size, shape, and native type satisfy the package-exported
aliases and class property types. The handwritten renderer property and literal-union mirror is
removed.

The Mioframe Vue prop API remains Mioframe-owned and must not become a direct re-export of the complete m3e API.

## Legacy token classification

The legacy implementation declared these official per-size tokens:

- `--md-comp-button-<size>-pressed-container-corner-size-motion-spring-stiffness`;
- `--md-comp-button-<size>-pressed-container-corner-size-motion-spring-damping`.

They are not active public migration contracts:

| Material meaning                | Mioframe token                                                                  | Renderer owner                   | Legacy evidence                                                            | Consumer evidence                                   | Decision                                |
| ------------------------------- | ------------------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------- |
| pressed-corner spring stiffness | `--md-comp-button-<size>-pressed-container-corner-size-motion-spring-stiffness` | m3e renderer-owned Button motion | declared; value-only visual test; not used by the actual legacy transition | no repository override or documented consumer found | remove as obsolete target-owned surface |
| pressed-corner spring damping   | `--md-comp-button-<size>-pressed-container-corner-size-motion-spring-damping`   | m3e renderer-owned Button motion | declared; value-only visual test; not used by the actual legacy transition | no repository override or documented consumer found | remove as obsolete target-owned surface |

The legacy `border-radius` transition used duration/easing variables rather than these stiffness/damping declarations. Their absence from m3e's public Button CSS inputs is not an upstream blocker.

## Vue-to-m3e mapping

| Mioframe Vue contract                     | m3e public contract                                     | Direction | Owner             | Notes                                                                         |
| ----------------------------------------- | ------------------------------------------------------- | --------- | ----------------- | ----------------------------------------------------------------------------- |
| `color`                                   | typed `variant` property                                | Vue → m3e | Mioframe          | Exact five-value mapping; output satisfies exported `ButtonVariant`.          |
| `shape` (`round` or `square`)             | typed `shape` (`rounded` or `square`)                   | Vue → m3e | Mioframe          | Private vocabulary normalization; output satisfies exported `ButtonShape`.    |
| `size`                                    | typed `size` property                                   | Vue → m3e | Mioframe          | Output satisfies exported `ButtonSize`.                                       |
| toggle `selected`                         | `toggle`, `selected`, cancelable `beforeinput`          | both      | Consumer/Mioframe | Cancel renderer mutation, emit controlled intent, prop remains authoritative. |
| `disabled` / loading                      | `disabled` plus host `aria-busy`                        | Vue → m3e | Mioframe          | Loading alone remains actionable; explicit `disabled` blocks activation.      |
| `nativeType`                              | form-associated `type`                                  | Vue → m3e | Browser/m3e       | `button`, `submit`, or `reset`.                                               |
| label and icon                            | default and `icon` slots                                | Vue → m3e | Mioframe          | Leading icon only.                                                            |
| public Button color/shape/geometry tokens | documented semantically equivalent Button CSS variables | Vue → m3e | Mioframe          | Private component-local bridge plus canonical Mioframe declarations.          |
| shared system roles                       | documented Material system-token semantics              | Vue → m3e | theme/m3e         | Prefer direct `--md-sys-*` semantics where supported.                         |
| pressed-corner motion                     | renderer-owned public behavior                          | m3e       | m3e               | No retained Mioframe stiffness/damping tuning contract.                       |

## Current review findings

### 1. Incomplete active token ownership and mapping

The current adapter maps only part of the active state/variant color surface. It does not yet transfer and map the complete retained active Button contract, including applicable:

- canonical default declarations after legacy-owner removal;
- per-size container height, outline thickness, typography, icon size, shapes, selected shapes, pressed morph, and spacing;
- resting, disabled, selected/unselected, outline, container, elevation, label, icon, and state-layer routes required by the accepted surface.

Mapping a renderer variable to an undefined `--md-comp-*` source is incomplete. The correction must establish one canonical declaration owner and semantic m3e mapping for every retained active token, while leaving obsolete stiffness/damping declarations removed.

### 2. Motion proof overclaims the result

The current browser test checks only `:active` before and after release, including under reduced motion. That proves press acquisition/release but does not prove pressed-shape morphing, selected-shape restoration, interruption safety, or reduced-motion behavior.

Use public observables where available. Where the rendered shape is not host-inspectable without private DOM, pair real input lifecycle proof with bounded deterministic visual evidence and report the limitation accurately.

### 3. Required scenario proof is incomplete

Add or link exact proof for materially distinct required paths, including:

- RTL icon placement;
- supported theme output;
- active public token overrides through rendered effects;
- actual motion/final-state claims.

Avoid duplicating equivalent paths or creating Cartesian-product visual matrices. Every required scenario must appear in the proof ledger.

## Consumers and migration state

All production, shared-UI, playground, and story consumers currently use `@shared/ui/material`, including form submission in `DatabaseViewAddForm.vue` and `DialogForm.vue`, loading in `DialogForm.vue`, leading-icon compositions, and overlay/menu anchor refs.

The obsolete legacy `MDButton` implementation, test, story, fixture, and Button-barrel export are removed. Unrelated Button-family owners remain intact.

This physical migration is retained, but implementation ownership remains `migrating` until the correction gates pass.

## Correction implementation preflight

Authoring source: this Button contract under the deterministic `material-component-adapter` workflow. Renderer viability and architecture remain resolved; this is a correction pass, not a new architecture decision.

Goal: finish the existing m3e-backed `MDButton` migration without restoring legacy rendering or adding adapter infrastructure.

Minimum design:

1. replace the handwritten renderer type mirror with package-derived Vue typing glue;
2. complete canonical active token declarations and semantic m3e mappings;
3. preserve legacy loading presentation in adapter-owned light DOM;
4. complete scenario-linked component, browser, visual, consumer, build, and type-check proof;
5. keep renderer-owned internals private and keep unrelated Button-family components unchanged.

Simpler alternatives rejected:

- accepting the current implementation leaves real contract gaps;
- restoring the legacy component recreates parallel ownership;
- exposing m3e directly breaks the stable Vue and renderer-isolation boundary;
- adding a generic adapter framework is unnecessary.

## Scenario-to-proof status

| Scenario or contract                  | Accepted result                                      | Current proof                                   | Status     |
| ------------------------------------- | ---------------------------------------------------- | ----------------------------------------------- | ---------- |
| public Vue defaults and basic mapping | stable typed adapter mapping                         | colocated component test                        | partial    |
| renderer type compatibility           | package-derived, compile-time checked                | package-derived ambient glue and type-check     | complete   |
| pointer/Enter/Space activation/submit | one activation and native submit                     | Storybook browser spec                          | complete   |
| reset                                 | native form reset preserved                          | Storybook browser spec                          | complete   |
| disabled activation                   | no action delivered                                  | unit plus real pointer attempt                  | complete   |
| controlled toggle                     | intent emit, prop authority, no drift                | unit plus keyboard/pointer/programmatic browser | complete   |
| loading behavior                      | actionable, accessible, stable legacy presentation   | unit, browser, inspected visual baseline        | complete   |
| public active tokens                  | canonical defaults and observable overrides          | partial CSS bridge; no complete rendered proof  | incomplete |
| shape motion and reduced motion       | correct press/release/final result                   | `:active` acquisition/release only              | incomplete |
| themes and RTL                        | accepted theme roles and leading-icon directionality | no explicit canonical proof identified          | missing    |
| migrated consumers                    | all consumers use canonical public owner             | import migration and selected consumer tests    | partial    |
| visual compatibility                  | all distinct stable scenarios reviewed               | four refreshed baselines; required gaps remain  | incomplete |

## Exit gate

M1 is complete only when:

- the renderer remains `ready`;
- implementation ownership can truthfully become `migrated`;
- package-exported renderer types own the private integration boundary;
- all retained active public tokens have canonical declarations and complete semantic mappings;
- loading and every other accepted observable scenario are preserved or explicitly approved as changed;
- the scenario-to-proof ledger is complete;
- focused and final repository verification pass;
- operator visual acceptance covers the complete corrected visual set.

Unresolved: incomplete active token ownership/mapping, incomplete motion/token/theme/RTL proof,
and operator visual acceptance. Package-derived typing, loading presentation, and the missing
native and controlled-state paths listed above are corrected with passing focused proof.
