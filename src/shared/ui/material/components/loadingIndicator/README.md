# Loading Indicator adapter contract

Material component: Loading indicator

Migration target: `MDLoadingIndicator`

Implementation ownership: `migrating`

Canonical implementation: `src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.vue`

Design artifact: `src/shared/ui/material/components/loadingIndicator/DESIGN.md` — **missing; adapter contract blocked**.

The current milestone status, remaining blockers, and next action are owned only by [`docs/roadmap.md`](../../docs/roadmap.md).

## Design gate

This README is a provisional demand-scoped adapter record created before the required complete family `DESIGN.md` existed. Its source list, lifecycle conclusions, selected API, geometry, token choice, and matrix are implementation claims to revalidate, not the complete official Material description.

Before completion:

1. create `DESIGN.md` from every applicable official Loading Indicator and delegated Progress Indicator source;
2. include all official presentations, states, lifecycle guidance, accessibility, geometry, motion, containment, usage restrictions, and component tokens, including unused capability;
3. record exact source snapshot metadata, unresolved values, and source conflicts;
4. rebuild this README with exact `DESIGN.md` references;
5. revalidate the standalone default, Button composition, lifecycle applicability, selected token, and `M3E-001`/`M3E-002` classification.

Do not create a shortened design document containing only the current uncontained/Button scenario.

## Ownership

Loading Indicator is an independently owned official Material component:

```text
standalone MDLoadingIndicator
  → @m3e/web/loading-indicator

MDButton.loading
  → decorative MDLoadingIndicator
      → @m3e/web/loading-indicator
```

Loading Indicator owns its public API, standalone defaults, renderer integration, standalone accessibility, geometry, selected runtime component tokens, private mappings, defects, tests, stories, and visual proof.

Button owns loading placement, `aria-busy`, decorative accessibility suppression, selected overall size, and Button-specific overrides through the Loading Indicator public API or supported public component tokens. Loading does not imply disabled state or activation suppression; consumers own action availability and operation-specific guards.

## Official source inventory pending DESIGN extraction

Required official sources include:

- `/components/loading-indicator/overview`;
- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`;
- `/components/loading-indicator/accessibility`;
- `/components/progress-indicators/guidelines`;
- `/components/progress-indicators/accessibility`;
- every related-component and delegated foundation source referenced by those pages.

Renderer evidence remains separate:

- declared `@m3e/web@^2.6.3`, resolved `2.6.3`;
- entry point `@m3e/web/loading-indicator`;
- installed artifacts and browser behavior are runtime evidence;
- `M3eLoadingIndicatorElement` is the package-derived type source.

## Provisional completion findings

The current implementation asserts:

1. standalone uncontained active color defaults to `primary` through a family-owned public runtime token;
2. Button composition overrides only that supported token to `currentColor`;
3. browser/provider-controlled recovery actions are not short bounded Loading Indicator scenarios and use feature-owned status plus explicit guards;
4. standalone and composed visual references cover their different color contracts.

These conclusions must be confirmed against the complete `DESIGN.md` before approval.

## Provisional selected public API

```ts
label: string;
size?: number;
```

Current interpretation:

- `label` describes the ongoing process and is required for standalone progressbar accessibility;
- `size` represents overall component size in Material dp mapped to CSS px;
- default `48`;
- finite values clamped to `24..240`;
- non-finite values normalized to `48`;
- no arbitrary CSS strings or renderer vocabulary.

`MDButton` currently applies `aria-hidden="true"` to its nested decorative indicator. Contained presentation remains provisionally deferred pending complete design and demand review.

## Provisional selected runtime token

```css
--md-comp-loading-indicator-active-indicator-color
```

Current ownership:

```text
standalone default
  → var(--md-sys-color-primary)
  → private m3e active-indicator color mapping

Button composition
  → public token override to currentColor
  → no parent access to private renderer inputs
```

The complete official component-token catalogue belongs in `DESIGN.md`. The runtime declaration, `token-api.md`, implementation mapping, Button override, tests, and proof must remain atomic for the selected supported subset.

## Provisional geometry contract

Current implementation distinguishes overall/container size from active-indicator size:

```text
public overall size       = normalized size
private active-size input = normalized size × 38 / 48
renderer shape scale      = unchanged and renderer-owned
```

| Public size | Host size | Active-size input |
| --- | --- | --- |
| `24` | `24px` | `19px` |
| `32` | `32px` | `25.333333…px` |
| `40` | `40px` | `31.666667…px` |
| `48` | `48px` | `38px` |

Button currently maps both selected Button sizes to Loading Indicator overall size `24`.

The complete design stage must confirm official overall/active geometry, containment variants, all documented sizes, and motion before this contract is accepted.

## Production consumer applicability

Current lifecycle assessment:

| Consumer operation | Lifecycle | Duration bounds | External suspension | Current decision |
| --- | --- | --- | --- | --- |
| Repository read permission | browser permission plus recovery replay | user-controlled; no reliable upper bound | browser UI | feature-owned textual pending status; explicit guards |
| Repository read/write permission | browser permission plus recovery replay | user-controlled; no reliable upper bound | browser UI | feature-owned textual pending status; explicit guards |
| VFS write-access recovery | permission plus pending-write replay | user/storage-controlled | browser UI | feature-owned status and guards |
| Google Drive reauthorization | provider token request | provider/user-controlled | provider UI | feature-owned status and guards |

No current production recovery operation uses `MDButton.loading`. The standalone adapter and Button composition remain an explicit M1 library requirement, but the complete design document must confirm the official lifecycle contract before completion.

## Provisional renderer defects

`M3E-001` and `M3E-002` are currently recorded for the consumed `2.6.2–2.6.3` range:

- `M3E-001` — documented active-indicator size input is not the implemented input;
- `M3E-002` — uncontained host width is coupled to active-indicator size.

Current mitigation:

- explicit public host width/height;
- private effective active-size input at `overall × 38 / 48`;
- no private DOM/method access;
- no renderer vocabulary in public API or parent adapters.

The complete `DESIGN.md` must establish the exact official geometry requirement used to classify these renderer behaviors as divergent.

## Provisional Material–m3e–Vue matrix

This matrix must be rebuilt with a `DESIGN.md reference` column.

| Material contract | Demand and evidence | Public Vue/token representation | Renderer status and mapping | Owner and decision | Verification |
| --- | --- | --- | --- | --- | --- |
| Component identity | operator-approved M1 Button dependency closure | root-exported `MDLoadingIndicator` | `direct` — renderer custom element | Loading Indicator — `implement-now` | unit + browser + visual |
| Uncontained presentation | selected standalone/dependency surface | no public variant prop | `direct` — renderer default | Loading Indicator — `implement-now` | story + visual |
| Contained presentation | no confirmed current consumer | none | renderer supports deferred surface | Loading Indicator — `defer` | none |
| Short indeterminate process | operator-approved library surface | use only for consumers matching official lifecycle guidance | renderer behavior available | Loading Indicator — provisional `implement-now` | standalone proof + lifecycle review |
| Standalone role/name | purpose must be communicated | required `label` → accessible name | `partial` — renderer role, wrapper name | Loading Indicator — `wrapper-correction` | browser role/name |
| Decorative Button composition | nested indicator must not create another semantic owner | parent `aria-hidden` | `not-applicable` | Button — `wrapper-correction` | unit + browser tree |
| Parent action availability | presentation must not silently disable action | consumer-owned `disabled`/guards | `not-applicable` | consumer | Button + consumer proof |
| Standalone active color | current interpretation: primary | selected public runtime token | private family mapping | Loading Indicator — provisional `implement-now` | token + visual |
| Button-composed active color | follows Button content | parent override to `currentColor` | no private parent access | Button — provisional `implement-now` | visual + boundary proof |
| Overall and active size | current 48/38 interpretation plus Button composition | numeric overall `size` | `divergent` — provisional `M3E-001`/`M3E-002` | Loading Indicator — workaround | unit + browser + visual |
| Motion and reduced motion | renderer motion selected | no public control | `direct` — renderer-owned | m3e | artifact assessment + operator review |
| Forced colors | must remain legible | none | renderer uses platform color | m3e | operator review |

## Current proof and blockers

Reusable implementation evidence:

- package-derived renderer source type;
- contract tests for label, normalization, host geometry, and active-size mapping;
- browser host bounding-box proof without shadow-DOM access;
- standalone progressbar role/name proof;
- Button composition proof for accessibility, size handoff, loading/disabled independence, and icon restoration;
- current defect revalidation against installed `2.6.3`;
- standalone/default and composed visual references.

Completion blockers:

- create and accept the complete Loading Indicator `DESIGN.md`;
- rebuild this README with exact design references;
- revalidate lifecycle, standalone/contained configurations, geometry, accessibility, complete official token catalogue, and renderer divergence claims;
- revalidate Button composition against both family design artifacts;
- pass final verification and operator visual/motion review.
