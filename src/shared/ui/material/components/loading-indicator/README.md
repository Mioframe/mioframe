# Loading indicator adapter contract

Material component: Loading indicator

Migration target: `MDLoadingIndicator`

Implementation ownership: `migrating`

Canonical implementation: `src/shared/ui/material/components/loading-indicator/MDLoadingIndicator.vue`

## Status and ownership

Loading indicator is an independently owned official Material component:

```text
MDButton.loading
  → MDLoadingIndicator
      → @m3e/web/loading-indicator
```

Button owns composition state, placement, accessible-purpose handoff, and selected overall size. Loading Indicator owns its public API, renderer integration, accessibility, geometry, private mappings, defects, tests, stories, and visual proof.

The selected implementation and proof are complete. The family remains in `correction` only until stale version-specific wording in production comments is removed and the resulting branch passes final task-scope verification.

No unresolved operator-reported Loading indicator visual or motion issue is currently recorded. Operator review is manual during development; a reported issue reopens this family.

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

`label` describes the purpose of the ongoing process and is required for the progressbar accessible name.

`size`:

- represents overall component size in Material dp mapped to CSS px;
- defaults to `48`;
- accepts finite values clamped to `24..240`;
- normalizes non-finite values to `48`;
- does not expose arbitrary CSS strings or renderer vocabulary.

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
Button extra-small → Loading indicator 24
Button small       → Loading indicator 24
Button medium      → Loading indicator 24
Button large       → Loading indicator 32
Button extra-large → Loading indicator 40
```

This is a Mioframe parent/dependency composition mapping, not the complete Loading indicator API and not a copy of Button icon tokens.

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

Production comments should reference the defect IDs or consumed affected range rather than describe the workaround as specific only to 2.6.2.

## Material–m3e–Vue matrix

| Material contract | Required now | Public Vue representation | m3e support | Owner and decision | Verification |
| --- | --- | --- | --- | --- | --- |
| Component identity | yes | root-exported `MDLoadingIndicator` | direct renderer element | dependency — `implement-now` | unit + browser + visual |
| Uncontained presentation | yes | no public variant prop | renderer default | `implement-now` | story + visual |
| Contained presentation | no | none | available but unselected | `defer` | none |
| Short indeterminate process | yes | mounted while parent is loading | direct | `implement-now` | contract |
| Accessible purpose/role | yes | required `label` → `aria-label` | renderer supplies role | dependency `wrapper-correction` | browser role/name |
| Inherited active color | yes | `currentColor` | documented renderer color input | dependency — `implement-now` | independent visual |
| Overall/active size | yes | numeric overall `size` | divergent `M3E-001`/`M3E-002` | controlled workaround | unit + browser geometry + visual |
| Public component tokens | no current CSS consumer | none | renderer inputs private | `defer` | none |
| Motion/reduced motion | review only | no public control | renderer-owned animation; no selected wrapper correction | renderer ownership | installed-artifact assessment + operator reporting |
| Forced colors | selected environment | none | renderer uses `CanvasText` | direct | operator reporting |

## Token and parent boundary

No public Loading indicator component token is currently required, so no placeholder declarations are added. Shared reference/system roles belong to foundation. Parent components use public props, inherited color, or a selected official public token; they do not set dependency-private renderer inputs.

Button renders `MDLoadingIndicator`, hands off label and overall size, relies on inherited color, and gives loading precedence over icon routes. It does not own renderer mapping, geometry, defects, or motion.

## Implemented proof

- package-derived Loading indicator source type;
- contract tests for label, normalization, host geometry, and active-size mapping;
- standalone size and inherited-color stories/baselines;
- browser host bounding-box proof without shadow-DOM access;
- browser progressbar role/name proof;
- Button composition and selected state combinations;
- revalidation of `M3E-001` and `M3E-002` against installed `2.6.3`;
- renderer motion assessment without inventing an unsupported defect.

## Remaining

- replace stale 2.6.2-only production comments with current defect/range wording;
- pass focused unit/type/browser checks affected by the edit;
- pass the exact final branch/task-scope verification required by root policy on the resulting head;
- complete final full-PR review with no unresolved operator-reported issue.
