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
| --- | --- | --- |
| `24` | `24px` | `19px` |
| `32` | `32px` | `25.333333…px` |
| `40` | `40px` | `31.666667…px` |
| `48` | `48px` | `38px` |

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

The last proven installed version for these defects is `2.6.2`:

- [`M3E-001`](../../docs/m3e-defects.md#m3e-001--loading-indicator-documented-size-input-is-not-implemented) — documented active-size input differs from the implemented input;
- [`M3E-002`](../../docs/m3e-defects.md#m3e-002--uncontained-host-size-is-coupled-to-active-indicator-size) — uncontained host size is coupled to active size.

Current decision: `temporary-renderer-workaround`.

Current mitigation:

- explicit host width/height from public overall size;
- private effective active-size input at `overallSize × 38 / 48`;
- no private DOM or method access;
- no renderer vocabulary in public API or parent adapters.

Both defects must be revalidated against installed m3e `2.6.3`. The workaround remains only if the newly consumed artifact and browser proof still require it.

## Material–m3e–Vue matrix

| Material contract | Required now | Public Vue/token API | Installed m3e mapping | Owner and decision | Verification |
| --- | --- | --- | --- | --- | --- |
| Component identity | yes | canonical exported `MDLoadingIndicator` | `m3e-loading-indicator` | `implement-now` | unit, story, visual proof |
| Uncontained presentation | yes | no variant prop | renderer default | `implement-now` | story/browser |
| Contained presentation | no | none | renderer supports it | `defer` | none |
| Indeterminate process | yes | mounted while parent loading is true | renderer indeterminate | `implement-now` | unit/browser |
| Accessible purpose and progressbar | yes | required `label` | wrapper supplies accessible name; renderer supplies role | `wrapper-correction` | real browser role/name |
| Inherited active color | yes | inherited `currentColor` | documented active color input | `implement-now` | visual proof |
| Overall and active geometry | yes | numeric overall `size` | `M3E-001`/`M3E-002` workaround pending 2.6.3 revalidation | `temporary-renderer-workaround` | unit, host-box, visual |
| Official component tokens | demand-driven | future supported `--md-comp-loading-indicator-*` entries in family `tokens.css` and `token-api.md` | family-local documented mappings | currently `defer`; props/inherited color satisfy demand | none until selected |
| Renderer motion | yes | no public motion controls selected | renderer-owned | assess installed 2.6.3 and operator review | pending |
| Forced colors | yes | none needed | renderer-owned | accept if verified | operator/browser as applicable |

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