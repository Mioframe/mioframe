# Loading indicator adapter contract

Material component: Loading indicator

Migration target: `MDLoadingIndicator`

Implementation ownership: `migrating`

Canonical implementation: `src/shared/ui/material/components/loading-indicator/MDLoadingIndicator.vue`

## Ownership

Loading indicator is a separate official Material component with its own API, accessibility, tokens, geometry, motion, tests, stories, and renderer integration.

```text
MDButton.loading
  → MDLoadingIndicator
      → @m3e/web/loading-indicator
```

`MDButton` owns composition state and placement. `MDLoadingIndicator` owns the dependency contract and private renderer integration.

## Official sources

- `/components/loading-indicator/overview`;
- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`;
- `/components/loading-indicator/accessibility`.

Related Button placement and contrast guidance is also selected for the current composition.

Renderer package:

- `@m3e/web@^2.6.3`, resolved `2.6.3`;
- entry point `@m3e/web/loading-indicator`;
- installed package artifacts and observable browser behavior are runtime evidence;
- `M3eLoadingIndicatorElement` is the package-derived type source.

## Selected Material contract

Current demand is the Button composition:

- indeterminate short loading;
- uncontained presentation;
- required accessible purpose;
- numeric scalable overall size;
- inherited active-indicator color;
- compatibility with disabled and selected Button states.

Contained presentation remains deferred.

## Public Vue API

```ts
size?: number;
label: string;
```

`size` contract:

- represents overall component size in Material dp mapped to CSS px;
- default `48`;
- accepted range `24..240`, clamped with a development warning;
- non-finite values normalize to `48` with a distinct warning;
- arbitrary CSS strings and renderer token names are not public API.

## Geometry contract

Material distinguishes overall/container size from active-indicator size. The selected default is 48dp overall and 38dp active indicator.

```text
public overall size            = normalized size
private active-size mapping    = normalized size × 38 / 48
m3e internal shape scale       = unchanged and renderer-owned
```

The adapter sets host width/height from public overall size and maps the effective private active-size input separately. It never compensates m3e internal animated-shape scaling.

Examples:

| Public size | Host size | Active-size input |
| ----------- | --------- | ----------------- |
| `24`        | `24px`    | `19px`            |
| `32`        | `32px`    | `25.333333…px`    |
| `40`        | `40px`    | `31.666667…px`    |
| `48`        | `48px`    | `38px`            |

## Button composition mapping

```text
Button extra-small → Loading indicator 24
Button small       → Loading indicator 24
Button medium      → Loading indicator 24
Button large       → Loading indicator 32
Button extra-large → Loading indicator 40
```

This is a Mioframe composition mapping, not a restatement of Button icon tokens and not the complete Loading indicator size API.

## Confirmed renderer defects

For `@m3e/web` 2.6.2 through the currently consumed 2.6.3, the documented Loading indicator size variable and the effective implementation input diverge, and the effective input is also incorrectly used by m3e as the uncontained host's own width. Both defects were revalidated against the installed `2.6.3` artifact and remain unchanged (`../../docs/m3e-defects.md`):

```text
renderer status: divergent
confirmed defects: M3E-001, M3E-002
current decision: temporary-renderer-workaround
long-term owner: m3e-fix
exact version: @m3e/web 2.6.3 (first confirmed on 2.6.2, unchanged)
Mioframe status: workaround-active
upstream status: unreported
```

Current decision: `temporary-renderer-workaround`.

Current mitigation:

- explicit host width/height from public overall size;
- private effective active-size input at `overallSize × 38 / 48`;
- no private DOM or method access;
- no renderer vocabulary in public API or parent adapters.

Both defects must be revalidated against installed m3e `2.6.3`. The workaround remains only if the newly consumed artifact and browser proof still require it.

## Material–m3e–Vue matrix

| Material contract and exact source                                                                | Required now and evidence                                      | Public Vue representation                                                                                                            | m3e support (2.6.2, revalidated 2.6.3)                                                                                                                                                       | Owner                | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Verification                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading indicator component identity (`loading-indicator/overview`)                               | yes — required by Button composition                           | `MDLoadingIndicator` canonical component, root-exported from `src/shared/ui/material/index.ts`                                       | `m3e-loading-indicator`, `direct`                                                                                                                                                            | `MDLoadingIndicator` | `implement-now`                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `MDLoadingIndicator.test.ts`; `MDLoadingIndicator.stories.ts` (Storybook presentation, not executable visual proof by itself); `tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts` (executable `toHaveScreenshot` proof)                                                                                                                                                                                                                                                                                                                                                        |
| Default/uncontained configuration (`loading-indicator/specs`)                                     | yes — Button composition                                       | no `variant` prop; renderer default (`uncontained`) used as-is                                                                       | renderer default `"uncontained"`, `direct`                                                                                                                                                   | `MDLoadingIndicator` | `implement-now`                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `MDLoadingIndicator.stories.ts` (`Default`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Contained configuration (`loading-indicator/specs`)                                               | no current consumer                                            | none                                                                                                                                 | renderer `"contained"` variant, `direct` (unused)                                                                                                                                            | `MDLoadingIndicator` | `defer`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | none                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Ongoing short indeterminate process (`loading-indicator/overview`)                                | yes                                                            | component exists only while `MDButton.loading` is true; no determinate API                                                           | renderer is indeterminate (no `aria-valuenow` set), `direct`                                                                                                                                 | `MDLoadingIndicator` | `implement-now`                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `MDLoadingIndicator.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Accessible purpose label and progressbar semantics (`loading-indicator/accessibility`)            | yes                                                            | required `label: string` prop mapped to the native `aria-label` attribute                                                            | renderer sets `role="progressbar"` and `ariaValueMin`/`ariaValueMax` defaults via the platform ARIAMixin; supplies no accessible name, `partial`                                             | `MDLoadingIndicator` | `wrapper-correction` — `label` is required so every usage supplies a purpose string. When composed inside `MDButton`, the Button label names the action and the Loading indicator represents the ongoing execution of that same action, so `MDButton` hands its own `label` to `MDLoadingIndicator` as the progress-purpose accessible name for this selected composition (a demand-scoped composition decision, not a universal rule for all future parents; see `../button/README.md`) | `MDLoadingIndicator.test.ts` (`aria-label`); `tests/e2e/storybook/md-loading-indicator.spec.ts` (real browser `progressbar` role + name)                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Active-indicator contrast in another component (`loading-indicator/accessibility`)                | yes — Button composition                                       | no public prop; `MDLoadingIndicator` inherits `currentColor` in scoped style                                                         | `--m3e-loading-indicator-active-indicator-color` documented and implemented identically, `direct`                                                                                            | `MDLoadingIndicator` | `implement-now` via inherited-color mapping; parent never sets this variable                                                                                                                                                                                                                                                                                                                                                                                                             | `MDLoadingIndicator.stories.ts` (`InheritedColorOnColoredSurfaces`, presentation only); `tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts` (`md-loading-indicator-inherited-color.png` baseline, inspected: correct purple-on-transparent and white-on-purple rendering); operator visual review pending                                                                                                                                                                                                                                                                       |
| Scalable overall/active-indicator size (`loading-indicator/overview`, specs, "Responsive layout") | yes — required as public numeric `size` API and Button mapping | `size?: number`, dp mapped to px, default `48`, clamped to `24..240`, non-finite normalized to `48`, sets host width/height directly | `divergent`: documented size input is not implemented (`M3E-001`); uncontained host width is coupled to active size (`M3E-002`)                                                              | `MDLoadingIndicator` | `temporary-renderer-workaround` — set explicit host width/height from the public overall size and map the private active-size input to `overallSize × 38/48`, preserving the official ratio; m3e's internal `0.842` shape scale is untouched; lifecycle and removal triggers are owned by `../../docs/m3e-defects.md`                                                                                                                                                                    | `MDLoadingIndicator.test.ts` (default, explicit, lower-bound clamp, upper-bound clamp, `NaN`/`Infinity`/`-Infinity` fallback, host geometry, exact private active-size mapping); `tests/e2e/storybook/md-loading-indicator.spec.ts` (real browser host bounding box for `24`/`32`/`40`/default `48`); `tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts` (`md-loading-indicator-sizes.png` baseline covering `24`/`32`/`40`/default `48`, inspected: distinct, correctly ordered, unclipped, centered, active shapes proportionally smaller within the same overall footprint) |
| Official component tokens (`loading-indicator/specs`)                                             | selected subset required for Button color/size handoff         | no public `--md-comp-*` alias yet; parent hands off state through the `size`/`label` props and inherited color instead               | renderer has `--m3e-loading-indicator-*` inputs, `direct`/`divergent` (see size row and `M3E-001`)                                                                                           | `MDLoadingIndicator` | `defer` — current demand is satisfied by props/inherited color; introduce a public `--md-comp-loading-indicator-*` token only if a future consumer needs CSS-level customization                                                                                                                                                                                                                                                                                                         | none                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Renderer motion and reduced-motion behavior                                                       | yes — visible ongoing animation while mounted                  | no public animation controls (none required by Material sources found)                                                               | 2.6.2–2.6.3 use an infinite shape-morph/rotation animation (4666ms cycle, confirmed unchanged in the installed 2.6.3 artifact); source inspection found no `prefers-reduced-motion` handling | m3e (renderer-owned) | no confirmed defect entry: no official Material source was found requiring reduced-motion suppression for this component; retain as an assessed evidence gap for operator review and possible future `m3e-fix`, not as `divergent`                                                                                                                                                                                                                                                       | exact-version source inspection above; operator motion review pending                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Forced colors                                                                                     | yes — renderer already handles it                              | none needed                                                                                                                          | `@media (forced-colors: active) { .active-indicator { background-color: CanvasText !important; } }`, `direct`                                                                                | m3e (renderer-owned) | `implement-now` (no wrapper action needed)                                                                                                                                                                                                                                                                                                                                                                                                                                               | operator visual review pending                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

## Token ownership

Loading Indicator owns only selected supported official `--md-comp-loading-indicator-*` tokens in:

```text
src/shared/ui/material/components/loading-indicator/tokens.css
```

Shared reference/system roles belong to Material foundation. A parent must use dependency props, inherited color, or supported public component tokens and must not set private renderer variables.

Every supported component token must be listed in `../../docs/token-api.md`. Official but unsupported tokens remain `deferred` in the matrix. Do not mirror all `--m3e-loading-indicator-*` variables.

## Public boundary

`MDLoadingIndicator`:

- exposes only required `label` and optional numeric `size`;
- keeps renderer type, tag vocabulary, and private inputs internal;
- owns geometry normalization and current controlled workarounds;
- owns its tests, stories, visual proof, and motion assessment.

`MDButton`:

- renders `MDLoadingIndicator`, not raw m3e;
- hands off accessible purpose and numeric overall size;
- relies on inherited color;
- gives loading precedence over normal and selected icon routes;
- does not own dependency defects or private mappings.

## Verification

Completed on the previously consumed renderer version:

- package-derived type-check;
- component-contract tests for label, normalization, host geometry, and active-size mapping;
- standalone stories for size and inherited color;
- browser host bounding-box proof without shadow-DOM inspection;
- standalone visual-regression baselines;
- browser accessibility role/name proof;
- Button composition and state-combination proof.

Pending:

- revalidate `M3E-001` and `M3E-002` against installed m3e `2.6.3`;
- update or remove workarounds only from installed-artifact and browser evidence;
- reassess renderer motion and reduced-motion behavior on `2.6.3`;
- run affected focused proof and final `pnpm verify`;
- obtain operator visual/motion acceptance.

## Completion gate

`MDLoadingIndicator` remains `migrating` and `correction` until:

- token ownership migration establishes canonical foundation/family owners and catalogue entries for any supported tokens;
- both confirmed defects are revalidated against the consumed version;
- focused tests and affected baselines remain correct;
- final verification passes;
- operator visual and motion acceptance is given.
