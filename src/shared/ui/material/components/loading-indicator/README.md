# Loading indicator adapter contract

Material component: Loading indicator

Migration target: `MDLoadingIndicator`

Implementation ownership: `migrating`

Canonical implementation: `src/shared/ui/material/components/loading-indicator/MDLoadingIndicator.vue`

## Why this adapter exists

Loading indicator is a separate official Material 3 Expressive component with its own overview, specs, guidelines, accessibility, tokens, geometry, and motion contract.

`MDButton` previously rendered `m3e-loading-indicator` directly. That bypassed the canonical Material Vue boundary and incorrectly made Button own Loading indicator renderer typing, accessibility, sizing, private CSS inputs, divergences, and motion.

Required ownership, now implemented:

```text
MDButton.loading
  → MDLoadingIndicator
      → @m3e/web/loading-indicator
```

`MDButton` owns the documented loading composition state and placement. `MDLoadingIndicator` owns the Loading indicator component contract and private renderer integration.

## Official sources

- `/components/loading-indicator/overview`;
- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`;
- `/components/loading-indicator/accessibility`.

Related composition source:

- Button placement guidance in `/components/loading-indicator/guidelines` ("Loading indicators can be placed within other components, such as buttons");
- Loading indicator contrast-in-composition guidance from `/components/loading-indicator/accessibility` ("When integrated into another component, such as a button, make sure that the active indicator provides a visual contrast of at least 3:1 against the other component").

Button icon-size tokens (`/components/buttons/specs`, `md.comp.button.<size>.icon.size`) are a Button-owned contract, not a Loading indicator size authority. The Button composition mapping in this document is a Mioframe-defined mapping, not a restatement of those tokens.

Renderer package:

- `@m3e/web@^2.6.2`, resolved `2.6.2`;
- entry point `@m3e/web/loading-indicator`;
- `M3eLoadingIndicatorElement` is the package-derived renderer type source, used directly as the base of the Vue custom-element glue in `src/shared/ui/material/m3eLoadingIndicator.d.ts` (no demand-scoped public prop currently maps to a typed element property, so no property is `Pick`ed from it — see "Renderer typing" below).

## Confirmed official Material facts

- Loading indicator represents an ongoing process and is never decorative.
- It is intended for short indeterminate loading, generally 200ms–5s ("Loading indicator Guidelines").
- It must not be used for a process that transitions from indeterminate to determinate.
- It has default/uncontained and contained configurations; uncontained is the renderer default.
- It "can scale in size", with a documented flexible range of 24dp–240dp and a default of 38dp active-indicator size / 48dp container size (`loading-indicator/specs` token table and "Responsive layout" guidance).
- The active indicator needs at least 3:1 contrast against its background or containing component (`loading-indicator/accessibility`).
- It uses the `progressbar` ARIA role and needs an accessible label describing what is loading, e.g. "loading news article" or "refreshing page" (`loading-indicator/accessibility`, "Labeling elements").
- It may be placed inside a Button (`loading-indicator/guidelines`, "Placement").

## Current demand

Current direct product demand is only the Button composition:

- indeterminate boolean loading state;
- uncontained presentation in the Button leading-icon position;
- accessible purpose supplied by the parent action (Button hands off its own `label`);
- size normalized through an explicit Button-to-Loading-indicator composition mapping (not the Button icon-size tokens);
- active indicator color inherited from the rendered Button label/icon color;
- loading presentation compatible with disabled and selected Button states, including selected plus a `selected-icon` slot.

No standalone product consumer currently requires contained presentation. Contained configuration remains deferred.

## Public size API

`MDLoadingIndicator` exposes:

```ts
size?: number;
```

Contract:

- the number represents Material dp mapped 1:1 to CSS px;
- default is `48`;
- the accepted range is `24` through `240`, inclusive (Loading indicator overview/specs: "can scale in size" 24dp-240dp);
- a value outside `24..240` is clamped to the nearest bound, with a development-mode warning naming the received value and the clamped result;
- a non-finite value (`NaN`, `Infinity`, `-Infinity`) is never forwarded to the renderer: it normalizes to the default `48` and emits a separate development-mode warning naming the received value, distinct from the finite-range clamp warning;
- both warning paths are deterministic (one `watchEffect` per reactive change), not a silent forward;
- arbitrary CSS strings, percentages, `calc()`, and m3e variable names are not public API.

Normalization, clamping, and non-finite fallback are implemented and tested locally in `MDLoadingIndicator.vue` / `MDLoadingIndicator.test.ts` (`NaN`, `Infinity`, and `-Infinity` each normalize to `48`, emit the finite-number warning, and never reach the private CSS variable as an invalid value).

## Button composition mapping

`MDButton` maps its own `size` to a Loading indicator composition size as follows:

```text
Button extra-small → Loading indicator 24
Button small       → Loading indicator 24
Button medium      → Loading indicator 24
Button large       → Loading indicator 32
Button extra-large → Loading indicator 40
```

This is a Mioframe Button-to-Loading-indicator composition mapping, not a restatement of the official Button icon-size tokens and not the complete official Loading indicator size API (which accepts the full `24..240` range).

## Exact-version m3e workaround

For `@m3e/web` 2.6.2, the documented Loading indicator size variable and the effective implementation input diverge:

```text
renderer status: divergent
current decision: temporary-renderer-workaround
long-term owner: m3e-fix
exact version: @m3e/web 2.6.2
removal trigger: the documented --m3e-loading-indicator-active-indicator-size
  correctly controls the installed renderer
```

`MDLoadingIndicator` privately sets `--m3e-loading-indicator-size` (the confirmed effective host-level CSS input) rather than the documented `--m3e-loading-indicator-active-indicator-size`. The workaround is a host-level CSS custom property only, does not access private DOM or methods, and remains private to this adapter — it is not exposed on the public Vue API, in `MDButton`, or in any consumer. `MDLoadingIndicator.test.ts` proves the exact mapping; it must be revalidated or removed on every `@m3e/web` version update.

## Material–m3e–Vue matrix

| Material contract and exact source                                                     | Required now and evidence                                      | Public Vue representation                                                                                              | m3e 2.6.2 support                                                                                                                                | Owner                | Decision                                                                                                                                                                                     | Verification                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Loading indicator component identity (`loading-indicator/overview`)                    | yes — required by Button composition                           | `MDLoadingIndicator` canonical component, root-exported from `src/shared/ui/material/index.ts`                         | `m3e-loading-indicator`, `direct`                                                                                                                | `MDLoadingIndicator` | `implement-now`                                                                                                                                                                              | `MDLoadingIndicator.test.ts`; `MDLoadingIndicator.stories.ts` (Storybook presentation, not executable visual proof by itself); `tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts` (executable `toHaveScreenshot` proof)                                                                                                                                     |
| Default/uncontained configuration (`loading-indicator/specs`)                          | yes — Button composition                                       | no `variant` prop; renderer default (`uncontained`) used as-is                                                         | renderer default `"uncontained"`, `direct`                                                                                                       | `MDLoadingIndicator` | `implement-now`                                                                                                                                                                              | `MDLoadingIndicator.stories.ts` (`Default`)                                                                                                                                                                                                                                                                                                                        |
| Contained configuration (`loading-indicator/specs`)                                    | no current consumer                                            | none                                                                                                                   | renderer `"contained"` variant, `direct` (unused)                                                                                                | `MDLoadingIndicator` | `defer`                                                                                                                                                                                      | none                                                                                                                                                                                                                                                                                                                                                               |
| Ongoing short indeterminate process (`loading-indicator/overview`)                     | yes                                                            | component exists only while `MDButton.loading` is true; no determinate API                                             | renderer is indeterminate (no `aria-valuenow` set), `direct`                                                                                     | `MDLoadingIndicator` | `implement-now`                                                                                                                                                                              | `MDLoadingIndicator.test.ts`                                                                                                                                                                                                                                                                                                                                       |
| Accessible purpose label and progressbar semantics (`loading-indicator/accessibility`) | yes                                                            | required `label: string` prop mapped to the native `aria-label` attribute                                              | renderer sets `role="progressbar"` and `ariaValueMin`/`ariaValueMax` defaults via the platform ARIAMixin; supplies no accessible name, `partial` | `MDLoadingIndicator` | `wrapper-correction` — `label` is required so every usage supplies a purpose string                                                                                                          | `MDLoadingIndicator.test.ts` (`aria-label`); `tests/e2e/storybook/md-loading-indicator.spec.ts` (real browser `progressbar` role + name)                                                                                                                                                                                                                           |
| Active-indicator contrast in another component (`loading-indicator/accessibility`)     | yes — Button composition                                       | no public prop; `MDLoadingIndicator` inherits `currentColor` in scoped style                                           | `--m3e-loading-indicator-active-indicator-color` documented and implemented identically, `direct`                                                | `MDLoadingIndicator` | `implement-now` via inherited-color mapping; parent never sets this variable                                                                                                                 | `MDLoadingIndicator.stories.ts` (`InheritedColorOnColoredSurfaces`, presentation only); `tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts` (`md-loading-indicator-inherited-color.png` baseline, inspected: correct purple-on-transparent and white-on-purple rendering); operator visual review pending                                                    |
| Scalable size (`loading-indicator/overview`, specs, "Responsive layout")               | yes — required as public numeric `size` API and Button mapping | `size?: number`, dp mapped to px, default `48`, clamped to `24..240`, non-finite normalized to `48`                    | `--m3e-loading-indicator-active-indicator-size` documented; 2.6.2 implementation reads `--m3e-loading-indicator-size`, `divergent`               | `MDLoadingIndicator` | `temporary-renderer-workaround` — map `size` to the confirmed effective variable name, not the documented one; recorded above with removal trigger                                           | `MDLoadingIndicator.test.ts` (default, explicit, lower-bound clamp, upper-bound clamp, `NaN`/`Infinity`/`-Infinity` fallback, exact CSS-variable mapping); `tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts` (`md-loading-indicator-sizes.png` baseline covering `24`/`32`/`40`/default `48`, inspected: distinct, correctly ordered, unclipped, centered) |
| Official component tokens (`loading-indicator/specs`)                                  | selected subset required for Button color/size handoff         | no public `--md-comp-*` alias yet; parent hands off state through the `size`/`label` props and inherited color instead | renderer has `--m3e-loading-indicator-*` inputs, `direct`/`divergent` (see size row)                                                             | `MDLoadingIndicator` | `defer` — current demand is satisfied by props/inherited color; introduce a public `--md-comp-loading-indicator-*` token only if a future consumer needs CSS-level customization             | none                                                                                                                                                                                                                                                                                                                                                               |
| Renderer motion and reduced-motion behavior                                            | yes — visible ongoing animation while mounted                  | no public animation controls (none required by Material sources found)                                                 | 2.6.2 uses an infinite shape-morph/rotation animation (4666ms cycle); source inspection found no `prefers-reduced-motion` handling               | m3e (renderer-owned) | recorded divergence; no official Material source found requiring reduced-motion suppression for this component, so not a blocker — flagged for operator review and possible future `m3e-fix` | exact-version source inspection above; operator motion review pending                                                                                                                                                                                                                                                                                              |
| Forced colors                                                                          | yes — renderer already handles it                              | none needed                                                                                                            | `@media (forced-colors: active) { .active-indicator { background-color: CanvasText !important; } }`, `direct`                                    | m3e (renderer-owned) | `implement-now` (no wrapper action needed)                                                                                                                                                   | operator visual review pending                                                                                                                                                                                                                                                                                                                                     |

## Public boundary

`MDLoadingIndicator`:

- is a canonical exported Vue component under `src/shared/ui/material/components/loading-indicator`, re-exported from its local `index.ts` and from the root `src/shared/ui/material/index.ts`;
- exposes only `label` (required) and `size` (optional number, `24..240`, default `48`);
- keeps `M3eLoadingIndicatorElement`, raw `m3e-loading-indicator` vocabulary, and the private `--m3e-loading-indicator-*` inputs internal;
- owns geometry normalization (numeric `size` → clamped px → private size variable) and the confirmed size-variable-naming divergence;
- owns its stories, tests, and motion assessment.

## Renderer typing

`src/shared/ui/material/m3eLoadingIndicator.d.ts` declares the Vue custom-element glue for `<m3e-loading-indicator>` directly against the package-exported `M3eLoadingIndicatorElement` (`@m3e/web/loading-indicator`) instead of a generic `HTMLElement`. No demand-scoped public prop currently maps to a typed element property (`variant` remains deferred; `label` maps to the native `aria-label` attribute and `size` maps to a private CSS custom property), so no property is `Pick`ed onto the template `$props` surface, but the underlying host type is the real package class, matching the `m3eButton.d.ts` pattern. If a future prop maps to `variant` or another typed element property, extend the `$props` surface with a `Pick<M3eLoadingIndicatorElement, ...>` at that time.

## MDButton composition contract

`MDButton` (see `../button/README.md`):

- renders `MDLoadingIndicator`, not raw m3e;
- hands off its own `label` as the dependency's accessible loading purpose;
- hands off size through the Button composition mapping above via the numeric `size` prop;
- relies on inherited color (no explicit color prop needed) for the rendered label/icon color handoff;
- gives loading precedence over **both** the normal icon route and the selected-icon route: while loading, the `selected-icon` slot is not rendered into the light DOM at all (not merely hidden), so m3e's `with-selected-icon` state is unset and the default icon slot position (containing `MDLoadingIndicator`) is used regardless of `selected`; the appropriate icon (normal or selected) is restored once loading ends;
- preserves Button label and normal native event behavior;
- covers disabled plus loading and the full toggle/selected/selected-icon/loading combination via `MDButton.test.ts` and `tests/e2e/storybook/md-button-family.spec.ts`.

## Verification

Completed:

- package-derived type-check (`pnpm type-check`), with `m3eLoadingIndicator.d.ts` typed against `M3eLoadingIndicatorElement`;
- colocated component-contract tests (`MDLoadingIndicator.test.ts`) for the accessible label, default size, explicit valid size, lower-bound clamp, upper-bound clamp, non-finite (`NaN`/`Infinity`/`-Infinity`) fallback to `48` with a development warning, and the exact private CSS-variable mapping;
- colocated stories (`MDLoadingIndicator.stories.ts`) for default presentation, an independent size matrix (`24`/`32`/`40`/default `48`), and inherited color on colored surfaces — these are Storybook presentation fixtures, not executable visual-regression proof by themselves;
- executable standalone visual-regression proof (`tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts`, Playwright `toHaveScreenshot`) with committed baselines `md-loading-indicator-sizes.png` and `md-loading-indicator-inherited-color.png`, captured from the dependency's own stories (not a substitute `MDButton` screenshot). Both baselines were visually inspected, not accepted mechanically: the size matrix shows four visibly distinct, correctly ordered, centered, unclipped shapes with the default rendering as the largest (`48`); the inherited-color baseline shows the first indicator rendering solid in the applied `currentColor` on the transparent checkerboard and the second rendering white against a solid colored background box, confirming correct color inheritance in both directions;
- real-browser accessibility proof (`tests/e2e/storybook/md-loading-indicator.spec.ts`): the standalone indicator resolves as `progressbar` with its supplied accessible name via actual accessibility-tree role/name resolution, not attribute presence alone;
- `MDButton` behavior-contract story and `tests/e2e/storybook/md-button-family.spec.ts` prove: the parent renders `MDLoadingIndicator`'s `m3e-loading-indicator` output; the accessible label handoff; a nested browser-resolved `progressbar` with the Button's label as its accessible name; `aria-busy` on the Button owner while loading; disabled plus loading; and that loading replaces the selected-icon route even when toggle, selected, and a `selected-icon` slot are all active together.

Pending:

- operator visual and motion review (renderer-owned shape-morph animation; no reduced-motion path found in m3e 2.6.2, recorded above) — required, not yet accepted;
- final `pnpm verify`.

## Completion gate

`MDLoadingIndicator` remains `migrating` until:

- the source-backed matrix above is accepted;
- operator visual and motion acceptance is given (renderer-owned shape-morph animation with no reduced-motion path found).

No further implementation-code corrections are currently known; the remaining gates are verification and operator review below.

Already satisfied:

- the demand-scoped Material Vue API (`label`, numeric `size`) is implemented and validated, including deterministic non-finite fallback with a development warning;
- accessibility labeling and progress semantics are correct and browser-proven;
- size/color handoff for the Button integration is correct, source-backed, and covers the full selected/loading combination;
- the m3e 2.6.2 size-variable-naming divergence is recorded with a removal trigger;
- package-derived typing is used for the Vue custom-element declaration (no generic `HTMLElement` glue);
- component-contract tests, presentation stories, executable visual-regression proof with inspected committed baselines, and focused type-check pass.

Remaining before full sign-off: final `pnpm verify` and operator motion/visual acceptance (tracked in `../../docs/roadmap.md`).
