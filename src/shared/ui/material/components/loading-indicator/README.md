# Loading indicator adapter contract

Material component: Loading indicator

Migration target: `MDLoadingIndicator`

Implementation ownership: `migrating`

Canonical implementation: `src/shared/ui/material/components/loading-indicator/MDLoadingIndicator.vue`

## Ownership

Loading indicator is a separate official Material component with its own API, accessibility, geometry, tokens, motion, tests, stories, renderer integration, and defect ownership.

```text
MDButton.loading
  → MDLoadingIndicator
      → @m3e/web/loading-indicator
```

`MDButton` owns composition state, placement, accessible-purpose handoff, and overall-size selection. `MDLoadingIndicator` owns the dependency contract and private renderer integration.

## Official sources

- `/components/loading-indicator/overview`;
- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`;
- `/components/loading-indicator/accessibility`.

Related Button placement and contrast guidance is also selected for the current composition.

Renderer package:

- declared `@m3e/web@^2.6.3`, resolved `2.6.3`;
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

`size`:

- represents overall component size in Material dp mapped to CSS px;
- defaults to `48`;
- is clamped to `24..240`, with a development warning;
- normalizes non-finite values to `48`, with a distinct warning;
- does not expose arbitrary CSS strings or renderer token names.

## Geometry contract

Material distinguishes overall/container size from active-indicator size. The selected default is 48dp overall and 38dp active indicator.

```text
public overall size         = normalized size
private active-size input   = normalized size × 38 / 48
m3e internal shape scale    = unchanged and renderer-owned
```

The adapter sets host width and height from the public overall size and maps the effective private active-size input separately. It does not compensate m3e internal animated-shape scaling.

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

`M3E-001` and `M3E-002` were revalidated against the exact installed `@m3e/web` `2.6.3` artifact and remain unchanged from `2.6.2`:

- [`M3E-001`](../../docs/m3e-defects.md#m3e-001--loading-indicator-documented-size-input-is-not-implemented): the documented active-indicator size input is not the effective implementation input;
- [`M3E-002`](../../docs/m3e-defects.md#m3e-002--uncontained-host-size-is-coupled-to-active-indicator-size): the effective active-size input also controls the uncontained host width.

```text
renderer status: divergent
confirmed defects: M3E-001, M3E-002
current decision: temporary-renderer-workaround
long-term owner: m3e-fix
last revalidated version: @m3e/web 2.6.3
Mioframe status: workaround-active
upstream status: unreported
```

Current mitigation:

- explicit host width and height from public overall size;
- private effective active-size input at `overallSize × 38 / 48`;
- no private DOM or method access;
- no renderer vocabulary in public API or parent adapters.

The workaround remains controlled by `../../docs/m3e-defects.md` and must be revalidated again on the next consumed m3e version. No additional 2.6.3 revalidation task remains open.

## Material–m3e–Vue matrix

| Material contract                            | Required now              | Public Vue representation                             | m3e support                                                                                                       | Owner and decision                                        | Verification                                                  |
| -------------------------------------------- | ------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| Component identity                           | yes                       | canonical root-exported `MDLoadingIndicator`          | direct `m3e-loading-indicator` mapping                                                                            | dependency adapter — `implement-now`                      | unit, browser, and visual proof                               |
| Default uncontained configuration            | yes                       | no public variant prop                                | direct renderer default                                                                                           | `implement-now`                                           | default story and visual proof                                |
| Contained configuration                      | no                        | none                                                  | renderer supports it                                                                                              | `defer`                                                   | none                                                          |
| Short indeterminate process                  | yes                       | component exists while parent loading state is true   | direct indeterminate renderer behavior                                                                            | `implement-now`                                           | contract tests                                                |
| Accessible purpose and progressbar semantics | yes                       | required `label` mapped to `aria-label`               | renderer supplies progressbar role but not purpose                                                                | wrapper correction owned by dependency                    | unit and real-browser role/name proof                         |
| Active-indicator contrast inside Button      | yes                       | inherited `currentColor`                              | documented renderer color input                                                                                   | dependency — `implement-now`                              | independent inherited-color visual proof                      |
| Overall and active-indicator size            | yes                       | numeric overall `size`, default `48`, range `24..240` | divergent: `M3E-001`, `M3E-002`                                                                                   | dependency — controlled workaround                        | normalization, geometry, browser bounds, and visual proof     |
| Official component tokens                    | no CSS-level consumer now | none                                                  | renderer has private inputs                                                                                       | `defer`; props and inherited color satisfy current demand | none                                                          |
| Motion and reduced-motion assessment         | yes                       | no public control selected                            | installed 2.6.3 retains the renderer-owned 4666ms infinite morph/rotation and no discovered reduced-motion branch | no confirmed defect without positive official requirement | installed-artifact inspection; operator motion review pending |
| Forced colors                                | yes                       | none                                                  | renderer uses `CanvasText`                                                                                        | direct renderer ownership                                 | operator review pending                                       |

## Token ownership

Loading indicator may own only intentionally supported official `--md-comp-loading-indicator-*` tokens and their private family-local renderer mappings in:

```text
src/shared/ui/material/components/loading-indicator/tokens.css
```

Shared reference and system roles belong to Material foundation. Parents must use dependency props, inherited color, or supported public component tokens and must not set dependency-private renderer variables.

Every supported component token must be listed in `../../docs/token-api.md`. No public Loading indicator component token is currently required, so no placeholder declarations are added. Official but unsupported tokens remain `deferred` in the matrix.

## Public boundary

`MDLoadingIndicator`:

- exposes only required `label` and optional numeric `size`;
- keeps renderer type, tag vocabulary, and private inputs internal;
- owns geometry normalization and the two controlled workarounds;
- owns independent accessibility, browser, visual, and motion evidence.

`MDButton`:

- renders `MDLoadingIndicator`, not raw m3e;
- hands off accessible purpose and numeric overall size;
- relies on inherited color;
- gives loading precedence over normal and selected icon routes;
- does not own dependency defects or private mappings.

## Verification

Completed against the installed `@m3e/web` `2.6.3` artifact before the remaining M0 ownership migration:

- package-derived type-check;
- component-contract tests for label, normalization, host geometry, and active-size mapping;
- standalone stories for size and inherited color;
- browser host bounding-box proof without shadow-DOM inspection;
- standalone visual-regression baselines;
- browser accessibility role/name proof;
- Button composition and state-combination proof;
- revalidation of `M3E-001` and `M3E-002`, retained unchanged;
- reassessment of installed renderer motion, retained as an operator-review item rather than an unproven defect.

Pending:

- M0 physical token-ownership migration and public catalogue population;
- focused verification and final `pnpm verify` on the head produced by that migration;
- operator Loading indicator visual and motion acceptance.

## Completion gate

`MDLoadingIndicator` remains `migrating` and cannot be accepted until:

- M0 establishes canonical foundation/theme and family token owners, removes the legacy mixed-owner file, and populates the public token catalogue;
- `M3E-001` and `M3E-002` remain accurately recorded for the consumed version and their workarounds remain owner-local;
- focused tests and affected baselines stay correct after M0;
- final verification passes on the resulting head;
- operator visual and motion acceptance is recorded.
