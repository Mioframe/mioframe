# Loading indicator adapter contract

Material component: Loading indicator

Migration target: `MDLoadingIndicator`

Implementation ownership: `migrating`

Canonical implementation: `src/shared/ui/material/components/loading-indicator/MDLoadingIndicator.vue`

The current milestone status, remaining blockers, and next action are owned only by [`docs/roadmap.md`](../../docs/roadmap.md).

## Ownership

Loading Indicator is an independently owned official Material component:

```text
standalone MDLoadingIndicator
  → @m3e/web/loading-indicator

MDButton.loading
  → decorative MDLoadingIndicator
      → @m3e/web/loading-indicator
```

Loading Indicator owns its public API, renderer integration, standalone accessibility, geometry, private mappings, defects, tests, stories, and visual proof.

Button owns loading presentation, placement, `aria-busy`, decorative accessibility suppression, inherited color context, and selected overall size. Loading does not imply disabled state or activation suppression; consumers own action availability and operation-specific guards. Button does not own Loading Indicator renderer inputs, geometry, defects, or motion.

## Official sources

- `/components/loading-indicator/overview`;
- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`;
- `/components/loading-indicator/accessibility`.

Related Button placement and contrast guidance is selected for the current composition.

Renderer:

- declared `@m3e/web@^2.6.3`, resolved `2.6.3`;
- entry point `@m3e/web/loading-indicator`;
- installed artifacts and browser behavior are runtime evidence;
- `M3eLoadingIndicatorElement` is the package-derived type source.

## Selected public API

```ts
label: string;
size?: number;
```

`label` describes the purpose of the ongoing process and is required for standalone progressbar accessibility.

`size`:

- represents overall component size in Material dp mapped to CSS px;
- defaults to `48`;
- accepts finite values clamped to `24..240`;
- normalizes non-finite values to `48`;
- does not expose arbitrary CSS strings or renderer vocabulary.

Standard Vue/native attributes may be applied explicitly by a correct parent composition. `MDButton` uses `aria-hidden="true"` to make its nested indicator decorative; this does not change the standalone default contract.

Contained presentation remains deferred.

## Geometry contract

Material distinguishes overall/container size from active-indicator size. The selected default is 48dp overall and 38dp active indicator.

```text
public overall size       = normalized size
private active-size input = normalized size × 38 / 48
renderer shape scale      = unchanged and renderer-owned
```

The adapter sets host width/height from public overall size and maps the active-size renderer input separately. It does not inspect or compensate internal animated-shape geometry.

| Public size | Host size | Active-size input |
| --- | --- | --- |
| `24` | `24px` | `19px` |
| `32` | `32px` | `25.333333…px` |
| `40` | `40px` | `31.666667…px` |
| `48` | `48px` | `38px` |

## Button composition mapping

```text
Button extra-small → Loading Indicator 24
Button small       → Loading Indicator 24
```

This is a Mioframe parent/dependency composition mapping, not the complete Loading Indicator API and not a copy of Button icon tokens.

Inside Button:

- the indicator replaces the leading icon while loading;
- the indicator inherits the Button content color;
- the indicator is hidden from the accessibility tree;
- the Button remains the semantic owner and exposes `aria-busy`;
- loading does not set `disabled` or suppress activation;
- the leading icon is restored after loading ends.

## Confirmed renderer defects

`M3E-001` and `M3E-002` were revalidated against installed `@m3e/web` `2.6.3` and remain active for the consumed `2.6.2–2.6.3` range:

- [`M3E-001`](../../docs/m3e-defects.md#m3e-001--loading-indicator-documented-size-input-is-not-implemented) — documented active-indicator size input is not the implemented input;
- [`M3E-002`](../../docs/m3e-defects.md#m3e-002--uncontained-host-size-is-coupled-to-active-indicator-size) — uncontained host width is coupled to active-indicator size.

```text
renderer status: divergent
current decision: temporary-renderer-workaround
long-term owner: m3e-fix
last revalidated version: @m3e/web 2.6.3
Mioframe status: workaround-active
upstream status: unreported
```

Current mitigation:

- explicit host width/height from public overall size;
- private effective active-size input at `overall × 38 / 48`;
- inherited active color through `currentColor`;
- no private DOM/method access;
- no renderer vocabulary in public API or parent adapters.

## Material–m3e–Vue matrix

| Material contract | Demand and evidence | Public Vue representation | Renderer status and mapping | Owner and decision | Verification |
| --- | --- | --- | --- | --- | --- |
| Component identity | Button loading requires an independently owned official dependency | root-exported `MDLoadingIndicator` | `direct` — renderer custom element | Loading Indicator — `implement-now` | unit + browser + visual |
| Uncontained presentation | current Button composition and standalone proof surface | no public variant prop | `direct` — renderer default | Loading Indicator — `implement-now` | story + visual |
| Contained presentation | no current consumer; official Loading Indicator sources above | none | `direct` — renderer supports the deferred surface | Loading Indicator — `defer` | none |
| Short indeterminate process | current Button action feedback | mounted while parent is loading | `direct` — renderer indeterminate behavior | Loading Indicator — `implement-now` | contract + visual |
| Standalone accessible purpose and role | standalone indicator must communicate process purpose | required `label` → accessible name | `partial` — renderer supplies progressbar role; wrapper requires the name | Loading Indicator — `wrapper-correction` | browser role/name |
| Decorative parent composition | nested Button indicator must not create a second semantic owner | explicit parent `aria-hidden`; no additional public mode | `not-applicable` — native accessibility attribute applied by Button | Button — `wrapper-correction` | unit + browser accessibility tree |
| Parent action availability | loading presentation must not silently disable an action | no Loading Indicator API; consumer supplies Button `disabled` and guards separately | `not-applicable` — outside dependency renderer ownership | consumer — `implement-now` | Button + consumer proof |
| Inherited active color | Button loading must follow Button content color | `currentColor` | `direct` — documented renderer color input | Loading Indicator — `implement-now` | independent visual |
| Overall and active size | selected Button composition and official 48/38 geometry | numeric overall `size` | `divergent` — `M3E-001`/`M3E-002`; host size plus private active-size mapping | Loading Indicator — `temporary-renderer-workaround` | unit + browser geometry + visual |
| Public component tokens | no current CSS consumer | none | `not-applicable` — renderer inputs remain private | Loading Indicator — `defer` | none |
| Motion and reduced motion | renderer motion is selected; no wrapper control is required | no public control | `direct` — renderer-owned animation | m3e — `implement-now` | installed-artifact assessment + operator reporting |
| Forced colors | selected environment must remain legible | none | `direct` — renderer uses `CanvasText` | m3e — `implement-now` | operator reporting |

## Token and parent boundary

No public Loading Indicator component token is currently required, so no placeholder declarations are added. Shared reference/system roles belong to foundation. Parent components use public props, inherited color, or standard native accessibility attributes; they do not set dependency-private renderer inputs.

Button renders `MDLoadingIndicator`, hands off the supported overall size, relies on inherited color, makes the nested instance decorative, and gives loading precedence over its icon route. It does not own renderer mapping, geometry, defects, motion, or action availability.

## Implemented proof

- package-derived Loading Indicator source type;
- contract tests for label, normalization, host geometry, and active-size mapping;
- standalone size and inherited-color stories/baselines;
- browser host bounding-box proof without shadow-DOM access;
- standalone browser progressbar role/name proof;
- Button composition proof for decorative accessibility, inherited presentation, size handoff, loading/disabled independence, and icon restoration;
- revalidation of `M3E-001` and `M3E-002` against installed `2.6.3`;
- renderer motion assessment without inventing an unsupported defect.
