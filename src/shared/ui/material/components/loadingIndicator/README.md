# Loading indicator adapter contract

Material component: Loading indicator

Migration target: `MDLoadingIndicator`

Implementation ownership: `migrating`

Canonical implementation: `src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.vue`

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

Loading Indicator owns its public API, standalone defaults, renderer integration, standalone accessibility, geometry, selected component tokens, private mappings, defects, tests, stories, and visual proof.

Button owns loading placement, `aria-busy`, decorative accessibility suppression, selected overall size, and any Button-specific override through the Loading Indicator public API or public component tokens. Loading does not imply disabled state or activation suppression; consumers own action availability and operation-specific guards. Button does not own Loading Indicator renderer inputs, standalone defaults, geometry, defects, or motion.

## Official sources

- `/components/loading-indicator/overview`;
- `/components/loading-indicator/specs`;
- `/components/loading-indicator/guidelines`;
- `/components/loading-indicator/accessibility`.

Selected official constraints requiring correction review:

- the uncontained standalone active-indicator default is the `primary` color role;
- Loading Indicator is intended for short indeterminate processes, approximately `200ms..5s`;
- long, determinate, transitional, user-blocked, or provider-controlled operations require separate classification;
- Button placement is supported, but the parent composition does not redefine standalone Loading Indicator defaults.

Renderer:

- declared `@m3e/web@^2.6.3`, resolved `2.6.3`;
- entry point `@m3e/web/loading-indicator`;
- installed artifacts and browser behavior are runtime evidence;
- `M3eLoadingIndicatorElement` is the package-derived type source.

## Completion findings

The standalone adapter and its Button composition are an operator-approved M1 library requirement and the required official dependency closure for `MDButton.loading`. They are not justified by a fabricated production consumer; current production operations are still classified separately against the official lifecycle guidance.

1. The standalone adapter now defaults its active indicator to `primary` through its family-owned public component token.
2. Button composition overrides only that public token to `currentColor`; the parent does not access a renderer variable.
3. Local file-system permission and Google authorization recovery actions can remain pending on browser/provider UI and are not short-process Loading Indicator scenarios. `loading` is not their state model: they use feature-owned pending state and textual status while explicit disabled/re-entry guards remain.
4. The standalone visual reference now covers the primary default and a distinctive public-token override; Button visual proof covers the composed `currentColor` handoff.

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

Contained presentation remains deferred pending the corrected current-demand reconstruction.

## Selected public token correction

The corrected family contract requires Loading Indicator ownership of:

```css
--md-comp-loading-indicator-active-indicator-color
```

Implemented ownership:

```text
Loading Indicator standalone default
  → --md-comp-loading-indicator-active-indicator-color: var(--md-sys-color-primary)
  → private m3e active-indicator color mapping

MDButton composition
  → override --md-comp-loading-indicator-active-indicator-color: currentColor
  → no private renderer input access
```

The runtime declaration, `docs/token-api.md` entry, implementation mapping, Button override, tests, and visual proof must change together. The final implementation must follow `docs/component-tokens.md`; the diagram records the required ownership result, not a substitute implementation mechanism.

## Geometry contract

Material distinguishes overall/container size from active-indicator size. The selected default is 48dp overall and 38dp active indicator.

```text
public overall size       = normalized size
private active-size input = normalized size × 38 / 48
renderer shape scale      = unchanged and renderer-owned
```

The adapter sets host width/height from public overall size and maps the active-size renderer input separately. It does not inspect or compensate internal animated-shape geometry.

| Public size | Host size | Active-size input |
| ----------- | --------- | ----------------- |
| `24`        | `24px`    | `19px`            |
| `32`        | `32px`    | `25.333333…px`    |
| `40`        | `40px`    | `31.666667…px`    |
| `48`        | `48px`    | `38px`            |

## Button composition mapping

```text
Button extra-small → Loading Indicator 24
Button small       → Loading Indicator 24
```

This is a Mioframe parent/dependency composition mapping, not the complete Loading Indicator API and not a copy of Button icon tokens.

Inside Button:

- the indicator replaces the leading icon while loading;
- the indicator is hidden from the accessibility tree;
- the Button remains the semantic owner and exposes `aria-busy`;
- loading does not set `disabled` or suppress activation;
- the leading icon is restored after loading ends;
- Button-composed active color must use the Loading Indicator-owned public token or public API rather than redefining the standalone adapter default.

## Production consumer applicability

| Consumer operation               | Lifecycle                                                      | Duration bounds                                                           | External suspension       | Decision                                                                                    |
| -------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| Repository read permission       | browser `requestPermission()` followed by recovery replay      | user-controlled; no reliable 5s upper bound                               | browser permission UI     | feature-owned textual pending status; disable conflicting actions and retain re-entry guard |
| Repository read/write permission | browser `requestPermission()` followed by recovery replay      | user-controlled; no reliable 5s upper bound                               | browser permission UI     | feature-owned textual pending status; disable conflicting actions and retain re-entry guard |
| VFS write-access recovery        | browser `requestPermission()` followed by pending-write replay | user-controlled and potentially storage-bound; no reliable 5s upper bound | browser permission UI     | feature-owned textual pending status; retain disabled/re-entry guard and result status      |
| Google Drive reauthorization     | provider token request                                         | provider/user-controlled; no reliable 5s upper bound                      | provider authorization UI | feature-owned textual pending status; disable the action and retain the re-entry guard      |

No current production recovery operation uses `MDButton.loading`. The standalone `MDLoadingIndicator` adapter and its `MDButton.loading` composition remain first-class, non-deprecated surface because M1 explicitly approves that library contract and requires the dependency to be complete before Button composes it. A future product consumer must still satisfy the short-indeterminate lifecycle contract before using it.

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

Current accepted geometry mitigation:

- explicit host width/height from public overall size;
- private effective active-size input at `overall × 38 / 48`;
- no private DOM/method access;
- no renderer vocabulary in public API or parent adapters.

The prior unconditional `currentColor` mapping was a Mioframe contract/ownership issue, not a renderer defect. It has been replaced by the standalone primary default and explicit Button public-token override.

## Material–m3e–Vue matrix

| Material contract                      | Demand and evidence                                                            | Public Vue/token representation                                                        | Renderer status and mapping                                                   | Owner and decision                                      | Verification                                       |
| -------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| Component identity                     | operator-approved M1 Button dependency closure                                 | root-exported `MDLoadingIndicator`                                                     | `direct` — renderer custom element                                            | Loading Indicator — `implement-now`                     | unit + browser + visual                            |
| Uncontained presentation               | selected dependency and standalone API surface                                 | no public variant prop                                                                 | `direct` — renderer default                                                   | Loading Indicator — `implement-now`                     | story + visual                                     |
| Contained presentation                 | no confirmed current consumer                                                  | none                                                                                   | `direct` — renderer supports the deferred surface                             | Loading Indicator — `defer`                             | none                                               |
| Short indeterminate process            | operator-approved library surface; no current production operation qualifies   | mounted only for consumers confirmed to satisfy official guidance                      | renderer indeterminate behavior is available                                  | Loading Indicator — `implement-now`; features — `defer` | standalone proof + consumer lifecycle review       |
| Standalone accessible purpose and role | standalone indicator must communicate process purpose                          | required `label` → accessible name                                                     | `partial` — renderer supplies progressbar role; wrapper requires the name     | Loading Indicator — `wrapper-correction`                | browser role/name                                  |
| Decorative parent composition          | nested Button indicator must not create a second semantic owner                | explicit parent `aria-hidden`; no additional public mode                               | `not-applicable` — native accessibility attribute applied by Button           | Button — `wrapper-correction`                           | unit + browser accessibility tree                  |
| Parent action availability             | loading presentation must not silently disable an action                       | no Loading Indicator API; consumer supplies Button `disabled` and guards separately    | `not-applicable` — outside dependency renderer ownership                      | consumer — `implement-now`                              | Button + consumer proof                            |
| Standalone active color                | official uncontained default uses `primary`                                    | `--md-comp-loading-indicator-active-indicator-color`; default `--md-sys-color-primary` | private family mapping to renderer active-indicator color input               | Loading Indicator — `implement-now`                     | token contract + standalone visual                 |
| Button-composed active color           | active indicator must contrast with and follow Button content                  | parent override of Loading Indicator public token to `currentColor`                    | no parent access to private renderer input                                    | Button — `implement-now`                                | Button loading visual + token boundary proof       |
| Legacy Material surface context        | standalone and Button-composed indicators render inside `.md` product surfaces | no consumer reset; standalone keeps primary while Button composition follows content   | `direct` — native inheritance plus component-token ownership                  | legacy surface, Loading Indicator, and Button owners    | source contract + browser + visual                 |
| Overall and active size                | selected Button composition and official 48/38 geometry                        | numeric overall `size`                                                                 | `divergent` — `M3E-001`/`M3E-002`; host size plus private active-size mapping | Loading Indicator — `temporary-renderer-workaround`     | unit + browser geometry + visual                   |
| Public component token catalogue       | standalone and Button-composed active colors differ                            | selected active-indicator color token and `token-api.md` entry                         | private family mapping only                                                   | Loading Indicator — `implement-now`                     | declaration/catalogue/runtime/visual agreement     |
| Motion and reduced motion              | renderer motion is selected; no wrapper control is required                    | no public control                                                                      | `direct` — renderer-owned animation                                           | m3e — `implement-now`                                   | installed-artifact assessment + operator reporting |
| Forced colors                          | selected environment must remain legible                                       | none                                                                                   | `direct` — renderer uses `CanvasText`                                         | m3e — `implement-now`                                   | operator reporting                                 |

## Proof status

Confirmed and reusable:

- package-derived Loading Indicator source type;
- contract tests for label, normalization, host geometry, and active-size mapping;
- browser host bounding-box proof without shadow-DOM access;
- standalone browser progressbar role/name proof;
- Button composition proof for decorative accessibility, size handoff, loading/disabled independence, and icon restoration;
- revalidation of `M3E-001` and `M3E-002` against installed `2.6.3`;
- renderer motion assessment without inventing an unsupported defect.

Corrected in this completion pass:

- standalone default active color;
- Loading Indicator public token declaration/catalogue/private mapping agreement;
- Button public-token override and resulting presentation;
- standalone and Button-composed color visual references;
- standalone primary and Button-composed `currentColor` presentation inside a real `.md` surface;
- production consumer applicability under official duration and lifecycle guidance.
