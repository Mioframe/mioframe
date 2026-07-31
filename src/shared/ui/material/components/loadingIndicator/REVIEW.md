# Loading indicator review

Reviewed workspace state: current Loading Indicator design, host-attribute-boundary-corrected architecture, runtime (`MDLoadingIndicator.vue`), proof (`MDLoadingIndicator.test.ts`, `MDLoadingIndicator.stories.ts`, `tests/e2e/storybook/md-loading-indicator.spec.ts`), consumers (`MDButton.vue`, `MDButton.test.ts`, `tests/e2e/storybook/md-button-family.spec.ts`), and stage artifacts inspected fresh on 2026-07-31, independent of any prior review of this family.
Review date: 2026-07-31
DESIGN.md status: current
ARCHITECTURE.md status: ready (host-attribute boundary correction, architecture date 2026-07-31)
IMPLEMENTATION.md status: complete
MIGRATION.md status: complete
Operator visual status: required
Verdict: blocked

## Goal and scenarios reviewed

Reviewed the complete resulting `loadingIndicator` family after the host-attribute-boundary correction: standalone accessible-purpose labeling, bounded overall sizing (24–240, default 48) with the private 38/48 active-size mapping, the public active-indicator color token and its Button `currentColor` handoff, the M3E-001/M3E-002 exact-version workarounds, Button's decorative composition (`aria-hidden`, 24 px geometry, class-carried token override), and legacy-surface isolation. The correction's specific new contract — `inheritAttrs: false` plus the explicit host-attribute allow-list (`class`, `style`, `id`, `title`, `data-*`, `aria-hidden`, `aria-describedby`) — was the primary focus, independently re-derived from `ARCHITECTURE.md`, `MDLoadingIndicator.vue`, and both test suites rather than taken on the record's word.

Selected scope matches current scenarios; contained presentation, pull-to-refresh, determinate progress, and operation-state ownership remain correctly deferred/assigned outside the family, unchanged by this correction.

## Official design compliance

`DESIGN.md` remains a complete, unmodified current snapshot (status `current`, dated 2026-07-30); this correction did not and should not touch it. No official fact, token, or spec appears stale, omitted, or contradicted by the resulting code.

## Architecture compliance

`ARCHITECTURE.md` (status `ready`, dated 2026-07-31) adds a single, narrowly scoped `wrapper-correction`: `inheritAttrs: false` plus the exact allow-list (`class`, `style`, `id`, `title`, `data-*`, `aria-hidden`, `aria-describedby`), with `style`/`class` merge precedence rules (internal geometry always wins on a conflicting key; public token overrides still pass through). This selects no new public API, prop, emit, slot, or token, and is consistent with `docs/component-adapter.md`'s "Host-attribute boundary" section and its family-scoped minimum allow-list (`class`, `style`, `id`, `title`, `data-*`) extended here by two ARIA-composition attributes (`aria-hidden`, `aria-describedby`) with an explicit, non-symmetric rationale for each. Ownership (family owns adapter/mapping/tokens; Button owns composition semantics; m3e owns private anatomy/motion) is unchanged and correctly narrow.

## Implementation compliance

Independently read `MDLoadingIndicator.vue` line by line against the architecture contract and confirmed, without relying on `IMPLEMENTATION.md`'s claims:

- `defineOptions({ inheritAttrs: false })` is set; no `v-bind="$attrs"` appears anywhere in the file — only `v-bind="forwardedAttrs"`, a `computed` that iterates `useAttrs()` and forwards only `id`, `title`, `aria-hidden`, `aria-describedby`, and `data-*` keys. `class` and `style` are handled by separate explicit bindings (`:class="['md-loading-indicator', attrs.class]"`, `:style="[attrs.style, style]"`) so the adapter-owned class and the internal geometry object always participate in the merge — this is exactly the architecture-approved allow-list, no more and no less.
- `aria-label` is bound only from `props.label` (`:aria-label="props.label"`) and is never read from `attrs`/`forwardedAttrs`, so a consumer-passed `aria-label` cannot reach the host at all — confirmed both by code inspection and by the `Host-attribute boundary` test "keeps label as the effective accessible-purpose source."
- `useAttrs` is imported behind a documented `eslint-disable-next-line no-restricted-imports` comment that matches the exact escape-hatch condition defined in `eslint.config.mjs`'s `noAttrsImportPath` message ("document a transparent host/adaptor contract with a local lint exception") — this is the same accepted pattern already used identically in `MDButton.vue`, not a new mechanism.
- Style-merge precedence was independently verified in the test file and by re-running the tests: internal `width`/`height`/`--m3e-loading-indicator-size` always win over a conflicting consumer `style` key (`999px` never appears), while a different-key public token override (`--md-comp-loading-indicator-active-indicator-color`) still reaches the host in the same merged `style`.
- Re-ran `pnpm verify --only unit-tests --files MDLoadingIndicator.vue MDLoadingIndicator.test.ts` (passed), `pnpm verify --only type-check` (passed), and `pnpm verify --only storybook-behavior --files MDLoadingIndicator.vue MDLoadingIndicator.stories.ts tests/e2e/storybook/md-loading-indicator.spec.ts` (passed) myself rather than trusting `IMPLEMENTATION.md`'s record.
- The Storybook `AttributeBoundary` story and its Playwright spec exercise real rendered custom-element state in Chromium (accessibility-tree role, sentinel ARIA values chosen to differ from the renderer's own observed defaults, and a real `click()` on the rendered element) — this is genuine browser proof of the boundary, not a props-object or host-attribute-snapshot check, satisfying `docs/component-adapter.md`'s requirement that browser proof "demonstrate that undeclared inputs cannot alter actual rendered custom-element state."
- `docs/token-api.md`, `docs/m3e-defects.md` (M3E-001/M3E-002 both still `workaround-active`, unchanged), `config/vueCustomElements.ts` (`m3e-loading-indicator` still selected), and `package.json`'s `@m3e/web` range (`^2.6.3`, unchanged) were all independently checked and are unaffected by this correction.
- No `!important` exists in any changed file (only appears in prose/forbidden-list documentation). No generic adapter/wrapper/base/registry was introduced — `forwardedAttrs` is a small, local, duplicated computed in each of `MDLoadingIndicator.vue` and `MDButton.vue` independently, matching the explicit "local, per-adapter filtering responsibility" requirement in `docs/component-adapter.md`.
- Public API (`label`, `size` props; no slots/emits/exposed refs) is byte-for-byte unchanged from before the correction.

No architecture deviation was found.

## Migration and legacy removal

Independently re-read `MDButton.vue` (not merely `MIGRATION.md`'s summary) and confirmed its Loading Indicator composition uses only `class="md-button__loading-indicator"`, `aria-hidden="true"`, and the declared `label`/`size` props — every one of these is inside the corrected allow-list, so no consumer edit was required, matching `MIGRATION.md`'s no-op conclusion. Specifically confirmed:

- `aria-hidden="true"` is a static attribute on `<MDLoadingIndicator>` in `MDButton.vue`'s template, forwarded as-is by `forwardedAttrs`'s explicit `aria-hidden` branch, and is independently proven at the composed-tree level by the pre-existing, unmodified `MDButton.test.ts` assertion (`indicator.attributes('aria-hidden')` is `'true'`) plus the browser-level assertion in `md-button-family.spec.ts` that a loading button's `progressbar` role has zero count in the accessibility tree.
- `.md-button__loading-indicator { --md-comp-loading-indicator-active-indicator-color: currentColor; }` in `MDButton.vue`'s scoped `<style>` still resolves: the `md-button__loading-indicator` class reaches the rendered `m3e-loading-indicator` because `MDLoadingIndicator.vue`'s `class` binding always unions the internal `md-loading-indicator` class with the forwarded consumer class rather than replacing it (`['md-loading-indicator', attrs.class]`), and the custom-property key (`--md-comp-loading-indicator-active-indicator-color`) is a different key from the two geometry keys the merge protects, so it is never dropped. Browser-level color proof for this composition exists in `tests/e2e/storybook/md-button-family.spec.ts` ("MDButton variants and content keep component color inside a legacy Material surface"), which asserts a computed `color` on `.md-loading-indicator` inside a composed Button.
- No product consumer under `src/app`, `src/pages`, `src/widgets`, `src/features`, or `src/entities` imports `MDLoadingIndicator` or a raw `m3e-loading-indicator`; `SettingsSections`'s `data-testid="loading-indicator"` is confirmed unrelated (a plain HTML element, not this family).

## Proof and verification

- `pnpm verify --only unit-tests --files src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.vue src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.test.ts` — re-run by this review, passed.
- `pnpm verify --only type-check` — re-run by this review, passed.
- `pnpm verify --only storybook-behavior --files src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.vue src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.stories.ts tests/e2e/storybook/md-loading-indicator.spec.ts` — re-run by this review, passed (5 tests).
- Re-running the Button family's own `tests/e2e/storybook/md-button-family.spec.ts` was attempted for additional cross-check but was blocked by an already-active `pnpm verify` run in this workspace (concurrent verification lock); per root `AGENTS.md`, a duplicate expensive check was not started. Button composition correctness was instead independently confirmed by direct code reading of `MDButton.vue` plus the existing, unmodified `MDButton.test.ts` and `md-button-family.spec.ts` assertions described above, which already encode the exact required behavior (`aria-hidden` suppressing the AT role; `currentColor` resolving on `.md-loading-indicator`).
- The one-time full-repo release-sensitive gate (`pnpm verify --base origin/develop`) was not re-run by this review; `MIGRATION.md` records it as intentionally deferred to "whichever stage closes the family" and not yet run in this correction pass. This is a proof-completeness gap worth flagging (see Minor issues) but is not itself evidence of a defect in the reviewed code — all component-scoped/type-check/behavior lanes that exercise the changed files passed.

Automated proof establishes the public contract, the new host-attribute boundary (including negative-path browser proof), geometry, and color mapping. It does not and cannot establish subjective quality of the renderer-owned seven-shape motion — that remains an operator judgment.

## Blockers

1. Operator visual/motion acceptance for standalone and Button-composed Loading Indicator remains outstanding. `docs/roadmap.md` still lists "Remaining Loading Indicator gate: operator visual/motion acceptance" and lists it as unresolved pilot work. This predates and is unrelated to the host-attribute-boundary correction (the correction's own acceptance criteria explicitly state "no visual or motion behavior intentionally changes"), but no record anywhere in the workspace shows this gate has since been satisfied, so it still blocks marking the family fully review-complete. Not a stage defect — routes to the operator, not to design/architecture/implementation/migration.

## Major issues

None.

## Minor issues

1. `MIGRATION.md` (Consumer inventory table, and "Migrated consumers" bullet) explains that `MDButton.vue`'s Vue-injected scoped-CSS `data-v-<hash>` attribute "matches the `data-*` wildcard rule" so the scoped `.md-button__loading-indicator` selector still resolves against the forwarded host. This attribution is inaccurate: Vue applies a child component's root-element `scopeId` directly at the DOM-patch layer (independent of `$attrs`/`useAttrs()`/`inheritAttrs`), so the `data-v-<hash>` attribute was never subject to `forwardedAttrs`' filtering in the first place — it would land on the rendered `m3e-loading-indicator` root regardless of the allow-list, exactly as it did before this correction. The practical conclusion in `MIGRATION.md` (the scoped selector still resolves) is correct and independently confirmed compilable/testable via the class-merge mechanism this review checked, but the stated _mechanism_ could mislead a future stage into believing scoped-CSS reach depends on the `data-*` allow-list entry, when it does not. No functional risk and no code change is implicated — route to `material-component-migration` for a wording-only correction of this one explanation.

## Accepted risks

- The installed renderer still carries M3E-001 and M3E-002; both remain confirmed, exact-version-gated (`2.6.2`–`2.6.3`), family-local, and were explicitly revalidated (unchanged) in this correction's `IMPLEMENTATION.md` pass. Must be revalidated or removed on the next `@m3e/web` upgrade.
- Material publishes the seven-shape loop concept but not exact Web motion parameters; the renderer owns the private motion implementation. Automated proof establishes lifecycle/presence and stable pixels, not subjective motion quality — assigned to the operator.
- Contextual `currentColor` contrast remains parent-owned; Button composition proof covers the currently selected visual handoff, and future parents composing Loading Indicator must independently preserve the official 3:1 contrast requirement.
- The one-time release-sensitive `pnpm verify --base origin/develop` gate has not yet been run for this correction by any stage to date (see Proof and verification); whichever stage or reviewer finally closes the family must run it before claiming full completion.

## Items not required

- Contained configuration, container tokens, pull-to-refresh, determinate progress, long-wait behavior, live-region policy, rendered labels, disabled state, public motion controls, and product operation state — all correctly remain deferred/out of scope, unaffected by this correction.
- A broader host-attribute allow-list, a wrapping element, a generic adapter framework, or new public API — none were introduced, none are needed.
- New product migration or compatibility aliases for the previous unrestricted `$attrs` fallthrough — correctly not added; no consumer relied on the leaked access.

## Required return stage

Migration (wording-only `MIGRATION.md` correction, minor, non-blocking) and Operator (pre-existing visual/motion acceptance gate, blocking). No design, architecture, or implementation correction is required — the host-attribute-boundary correction itself is compliant with `ARCHITECTURE.md`, `docs/component-adapter.md`, and every specific claim in `IMPLEMENTATION.md`/`MIGRATION.md` that this review independently re-verified.

## Completion status

Blocked only on operator visual/motion acceptance (pre-existing, not introduced by this correction) and, non-blocking, a minor `MIGRATION.md` wording correction. The host-attribute-boundary correction itself is independently verified compliant: no renderer-boundary leakage remains, all re-run focused proof passes, and Button's internal composition is confirmed to still work correctly under the new allow-list. If operator acceptance is granted without new findings, a fresh independent pass may mark the family compliant with the listed accepted risks (including still running the deferred release-sensitive gate); any visual rejection routes to the earliest owning stage.
