# Loading indicator review

Reviewed workspace state: independently reviewed the complete resulting `loadingIndicator` family after the attrs-projection correction — full current `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`; `MDLoadingIndicator.vue` and `MDLoadingIndicator.test.ts` read in full; `tokens.css`, `MDLoadingIndicator.stories.ts`, `tests/e2e/storybook/md-loading-indicator.spec.ts`, `tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts`, `docs/component-adapter.md`, `docs/m3e-defects.md`, `docs/token-api.md`, and `docs/roadmap.md` read in full; `MDButton.vue` read in full as the composing consumer, with `MDButton.test.ts` and `tests/e2e/storybook/md-button-family.spec.ts` inspected for the composition-relevant assertions; `config/vueCustomElements.ts`, `package.json`, and `pnpm-lock.yaml` checked for renderer selection/version; independent of any prior review of this family or its record.
Review date: 2026-07-31
DESIGN.md status: current
ARCHITECTURE.md status: ready
IMPLEMENTATION.md status: complete
MIGRATION.md status: complete
Operator visual status: no-reported-defect
Verdict: compliant-with-listed-risks

## Goal and scenarios reviewed

Reviewed the complete resulting family, not only the attrs-projection correction: standalone accessible-purpose labeling and progressbar semantics; default/explicit/clamped/non-finite overall sizing (24-240, default 48) with the private 38/48 active-size mapping; the public active-indicator color token, its standalone-primary default, and its Button `currentColor` handoff; the host-attribute boundary (`inheritAttrs: false` plus the explicit allow-list: `class`, `style`, `id`, `title`, `data-*`, `aria-hidden`, `aria-describedby`) and its render-time projection mechanism; the M3E-001/M3E-002 exact-version workarounds; Button's decorative composition (`aria-hidden`, 24 px geometry, class-carried token override, `aria-busy`, icon restoration); and legacy-surface isolation. Contained presentation, pull-to-refresh, determinate progress, and operation-state ownership remain correctly deferred/assigned outside the family — unchanged and confirmed still absent from the public API and code.

## Official design compliance

`DESIGN.md` is a complete, current snapshot (status `current`, dated 2026-07-30) covering identity/purpose, variants and configurations, anatomy, color, geometry, placement, behavior/motion, usage guidance, accessibility, the complete official component-token catalogue (including the documented display-name swap, the `container.color` conflict, and the dark-high-contrast serialization discrepancy, all explicitly preserved as conflicts rather than silently resolved), and related contracts. No official fact, token, or spec appears stale, omitted, or contradicted by the resulting code. Neither correction round (host-attribute boundary, attrs-projection) touched `DESIGN.md`, and none was required to.

## Architecture compliance

`ARCHITECTURE.md` (status `ready`, dated 2026-07-31) selects a minimum-complete uncontained adapter: required `label`, optional bounded `size`, one public color token, and the host-attribute boundary allow-list with explicit `class`/`style` merge precedence (internal geometry always wins on a conflicting key; a differently-keyed public token override still passes through). Deferrals (contained configuration, pull-to-refresh, determinate progress) are justified against `DESIGN.md` sections and current Mioframe demand; no current scenario requires them. Ownership is unchanged and correctly narrow: the family owns the adapter/mapping/tokens/allow-list; Button owns composition semantics, `aria-busy`, and icon restoration; m3e owns private anatomy and motion. The allow-list itself (`class`, `style`, `id`, `title`, `data-*`, `aria-hidden`, `aria-describedby`) matches `docs/component-adapter.md`'s minimum common allow-list (`class`, `style`, `id`, `title`, `data-*`) extended by exactly two ARIA-composition attributes, each with an explicit rationale (`aria-hidden` for the Button suppression scenario; `aria-describedby` for consumer-supplied description, consistent with Button's own allowance). No new demand, prop, emit, slot, or token was introduced by either correction.

## Implementation compliance

Independently read `MDLoadingIndicator.vue` line by line against `ARCHITECTURE.md`, without relying on `IMPLEMENTATION.md`'s claims:

- `defineOptions({ inheritAttrs: false })` is set. No `v-bind="$attrs"` appears anywhere in the file.
- The allow-list projection is `getForwardedAttrs()`, a plain function (not `computed()`, `watch()`, or `watchEffect()`) that iterates `Object.entries(attrs)` and forwards only `id`, `title`, `aria-hidden`, `aria-describedby`, and `data-*`-prefixed keys, called directly from the template as `v-bind="getForwardedAttrs()"`. This matches the corrected mechanism `IMPLEMENTATION.md` describes: because Vue guarantees `useAttrs()` reflects the latest attrs during render but does not guarantee that object is a supported `computed()` reactive dependency, a plain function invoked from the template — which necessarily re-executes on every render — has no cache-staleness surface, unlike the previous cached `computed()` it replaced.
- `class` and `style` are handled by separate explicit bindings: `:class="['md-loading-indicator', attrs.class]"` (union, not replacement) and `:style="[attrs.style, style]"`. Vue's array-style normalization merges array entries in order with later entries overwriting earlier ones on a matching key (`normalizeStyle` in `@vue/runtime-dom`), so the internal `style` object (width/height/`--m3e-loading-indicator-size`) — listed second — always wins over a conflicting consumer key, while a differently-keyed consumer entry (for example the public `--md-comp-loading-indicator-active-indicator-color` token) is preserved. This was independently re-derived from Vue's merge semantics, not merely taken from a code comment, and is exercised by `MDLoadingIndicator.test.ts`'s two dedicated style-merge tests (both re-run and passing).
- `aria-label` is bound only from `props.label` (`:aria-label="props.label"`); it is never read from `attrs`/`getForwardedAttrs()`, so a consumer-passed `aria-label` cannot reach the host. `getForwardedAttrs()` explicitly excludes `aria-label`, `role`, value ARIA (`aria-valuenow`/`aria-valuemin`/`aria-valuemax`), `tabindex`, raw renderer `variant`/`contained`, and arbitrary listeners — all outside the allow-list, matching `ARCHITECTURE.md`'s explicit rejection table.
- `useAttrs` is imported behind `// eslint-disable-next-line no-restricted-imports -- see comment above`. Independently confirmed against `eslint.config.mjs` (`noAttrsImportPath`, `paths: [{ importNames: ['useAttrs'], ... 'document a transparent host/adaptor contract with a local lint exception' }]`) that this is the exact accepted escape-hatch condition, not an ad hoc suppression, and that the identical pattern is used in `MDButton.vue`.
- M3E-001 and M3E-002 mappings (`style` computed: `width`/`height` from normalized `size`; `--m3e-loading-indicator-size` from `size × 38/48`) are unchanged from the prior correction and match `docs/m3e-defects.md`, which independently confirms both remain `workaround-active` against the exact lockfile-resolved `@m3e/web@2.6.3` (verified in `pnpm-lock.yaml`, matching `package.json`'s `^2.6.3` range and `config/vueCustomElements.ts`'s `m3e-loading-indicator` selection).
- Public API (`label: string` required, `size?: number` default 48 with dev-mode clamp/normalize warnings; no slots, emits, or exposed refs) is unchanged and matches `ARCHITECTURE.md`'s Public Vue API table exactly.
- No `!important`, no generic adapter/wrapper/base/registry framework, no shadow-DOM inspection or private-state recreation.

I independently re-ran the family's focused proof rather than trusting `IMPLEMENTATION.md`'s recorded results:

- `pnpm verify --only unit-tests --files src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.vue src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.test.ts` — passed.
- `pnpm verify --only type-check` — passed.
- `pnpm verify --only storybook-behavior --files src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.vue src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.stories.ts tests/e2e/storybook/md-loading-indicator.spec.ts` — passed (5 tests), including the browser-level rejection test that toggles undeclared dynamic attrs/listeners against the real rendered custom element (sentinel ARIA values chosen to differ from the renderer's own defaults; a real `click()`).

`MDLoadingIndicator.test.ts` (30 tests, read in full) proves: canonical rendering with progressbar role and `aria-label`; public color-token pass-through; default/explicit/clamped/non-finite geometry with dev warnings; the full allow-list forwarding matrix (`class`/`style`/`id`/`title`/`data-*`/`aria-hidden`/`aria-describedby`); style-merge precedence in both directions (internal geometry wins; differently-keyed public token still passes); rejection of raw renderer `variant`/`contained`/`role`/value-ARIA/unknown attrs/an arbitrary listener; `label` as the sole accessible-name source even against a consumer-passed `aria-label`; reactivity of every allow-listed key to consumer changes; and the new lifecycle test proving an allow-listed `id`/`data-*` key can be added, removed, and re-added after mount while a dynamically added forbidden attribute/listener remains rejected throughout — the specific coverage needed to prove the render-time mechanism has no cache-staleness gap relative to the prior `computed()` mechanism.

No architecture deviation was found.

## Migration and legacy removal

Independently re-read `MDButton.vue` (not `MIGRATION.md`'s summary alone) and confirmed its Loading Indicator composition uses only `class="md-button__loading-indicator"`, static `aria-hidden="true"`, and declared `label`/`size` props — every one of these is inside the allow-list, so no consumer edit was required, matching `MIGRATION.md`'s no-op conclusion.

- `aria-hidden="true"` is forwarded by `getForwardedAttrs()`'s explicit `aria-hidden` branch; independently confirmed at the composed-tree level by `MDButton.test.ts`'s unmodified assertion (`indicator.attributes('aria-hidden')` is `'true'`) and by `md-button-family.spec.ts`'s browser-level assertion that a loading button's accessible `progressbar` role has zero count.
- `.md-button__loading-indicator { --md-comp-loading-indicator-active-indicator-color: currentColor; }` still resolves: the class reaches the rendered `m3e-loading-indicator` because `MDLoadingIndicator.vue`'s class binding unions rather than replaces (`['md-loading-indicator', attrs.class]`). `md-button-family.spec.ts` (read directly, lines 255-263) independently confirms this at the browser level: `.md-loading-indicator`'s computed `color` inside a composed loading Button matches the label text's computed color (`rgb(103, 80, 164)`), proving the `currentColor` handoff actually resolves, not merely that the class landed.
- `MIGRATION.md`'s explanation of why Vue's scoped-CSS `data-v-<hash>` attribute reaches the composed root is accurate as currently written: it correctly states that Vue applies the child component's `scopeId` directly to the rendered root element at the DOM-patch layer, independent of `$attrs`/`useAttrs()`/`inheritAttrs`/the allow-list filter — not because `data-v-<hash>` matches the `data-*` wildcard. This corrects the previously inaccurate attribution and was independently verified against Vue's compiler/runtime scope-ID application model, not merely taken on the document's word.
- No product consumer under `src/app`, `src/pages`, `src/widgets`, `src/features`, or `src/entities` imports `MDLoadingIndicator` or a raw `m3e-loading-indicator`, and `SettingsSections`'s `data-testid="loading-indicator"` is confirmed an unrelated plain-HTML test stub (independently re-checked, not merely cited from `MIGRATION.md`).

## Proof and verification

- `pnpm verify --only unit-tests --files .../MDLoadingIndicator.vue .../MDLoadingIndicator.test.ts` — re-run by this review, passed.
- `pnpm verify --only type-check` — re-run by this review, passed.
- `pnpm verify --only storybook-behavior --files .../MDLoadingIndicator.vue .../MDLoadingIndicator.stories.ts tests/e2e/storybook/md-loading-indicator.spec.ts` — re-run by this review, passed.
- `pnpm verify:status` was checked before each run (`verification: idle`); no active/locked run was encountered, so no resume-vs-fresh-run judgment call was needed.
- The visual lane (`tests/e2e/visual/shared-ui/md-loading-indicator.spec.ts`, three snapshot tests: size matrix, color contract, legacy-surface color) was inspected by reading the spec and its three existing baseline PNGs on disk; it was not re-executed by this review because neither correction round changed any visual/motion/token/geometry output (both `IMPLEMENTATION.md` records state "no visual or motion behavior intentionally changes," and code inspection confirms the allow-list content, tokens.css, and geometry math are byte-identical to the pre-correction contract). No baseline drift is implicated by either correction.
- The single one-time release-sensitive current-head gate (`pnpm verify` / `pnpm verify --base origin/develop`) has not been run for this correction round by any stage to date. `MIGRATION.md`'s own "Final verification" section defers it to "whichever stage closes the family" and explicitly excludes it from the correction-migration worker's task scope. This review did not run it either, since the family-scoped checks that exercise every changed file (unit tests, type-check, Storybook behavior) were independently re-run and all passed, and `docs/roadmap.md`'s own "Remaining pilot gates" separates "fresh independent review" from a later "final full pilot review" step. Flagged below as a final-verification gap, not as a blocker to this family's own compliance.

Automated proof establishes the public contract, the host-attribute boundary (including negative-path browser proof against the real rendered custom element), geometry, and color mapping. It does not and cannot establish subjective quality of the renderer-owned seven-shape motion — that remains an operator judgment, and its absence is not evidence of a defect.

## Blockers

None.

## Major issues

None.

## Minor issues

1. The single final current-head release-sensitive gate (`pnpm verify` / `pnpm verify --base origin/develop`) has not yet been run for this correction round by any stage. `ARCHITECTURE.md`'s `TEST IMPACT` and `MIGRATION.md`'s "Final verification" both explicitly assign this gate to "whichever stage closes the family," and it remains outstanding. This is a final-verification gap, not a functional defect — every family-scoped check that exercises the changed files (unit tests, type-check, Storybook behavior) independently passed. Route to `material-component-migration` (or whichever stage/operator action finally closes the family) to run it before the pilot is declared fully complete.

## Accepted risks

- M3E-001 and M3E-002 remain `workaround-active` against the exact lockfile-resolved `@m3e/web@2.6.3` (independently confirmed in `pnpm-lock.yaml`); both are family-local, exact-version-gated, and revalidated unchanged by the correction. Must be revalidated or removed on the next `@m3e/web` upgrade.
- Material publishes the seven-shape loop concept but no exact Web motion parameters; the renderer owns the private motion implementation. Automated proof establishes lifecycle/presence and stable pixels, not subjective motion quality — this is an operator judgment, and no operator has reported a defect against it.
- Contextual `currentColor` contrast is parent-owned; Button's current composition is proven to resolve correctly, but any future parent composing Loading Indicator must independently preserve the official 3:1 contrast requirement.
- The visual lane (`md-loading-indicator.spec.ts`, three snapshot baselines) was not re-executed in this review pass (see Proof and verification); no visual/geometry/token output changed in either correction, so no baseline drift is expected, but this is inspection rather than a fresh pixel re-run.

## Items not required

- Contained configuration, container tokens, pull-to-refresh, determinate progress, long-wait behavior, live-region policy, rendered labels, disabled state, public motion controls, and product operation state all correctly remain deferred/out of scope, unaffected by either correction.
- A broader host-attribute allow-list, a wrapping element, a generic adapter/wrapper framework, or new public API — none were introduced, none are needed.
- New product migration or compatibility aliases for the previous unrestricted `$attrs` fallthrough — correctly not added; no consumer relied on the leaked access.
- Positive operator acknowledgement — not required by the corrected workflow model; absence of a reported defect is sufficient and no fabricated confirmation was created.

## Required return stage

Migration (non-blocking): run the deferred single final current-head release-sensitive gate before the family/pilot is declared fully complete. No design, architecture, or implementation correction is required — the resulting family code, tests, tokens, consumer composition, and every independently re-run focused check are compliant with `ARCHITECTURE.md` and `docs/component-adapter.md`.

## Completion status

Compliant with the listed accepted risks and one non-blocking minor final-verification gap (the deferred release-sensitive current-head gate). No operator-reported visual/motion defect exists for this family; absence of a report is not a blocker under the corrected workflow model and requires no positive acknowledgement. No functional, ownership, API, dependency, or proof defect was found in the complete resulting family, including consumers.
