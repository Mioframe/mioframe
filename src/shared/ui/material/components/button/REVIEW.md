# Button review

Reviewed workspace state: current uncommitted working-tree state of `DESIGN.md`/`ARCHITECTURE.md`/`IMPLEMENTATION.md`/`MIGRATION.md`; `MDButton.vue`, `MDButton.test.ts`, `MDButton.stories.ts` (full file contents read directly, not summarized); `tests/e2e/storybook/md-button-family.spec.ts` (host-attribute-boundary browser test read in full); `src/shared/ui/material/docs/component-adapter.md` "Host-attribute boundary" section; `src/shared/ui/material/AGENTS.md`; consumer files `src/shared/ui/Snackbar/MDSnackbar.vue`, `src/shared/ui/NavigationPath/MDNavigationPathSegmentButton.vue`, `src/features/databaseFilterEdit/DatabaseFilterAddButton.vue`, `src/widgets/RepositoryExplorerWidget/RepositoryExplorerWidget.vue`; a repository-wide grep for undeclared attributes/listeners near every `<MDButton` usage; `package.json`'s `@m3e/web` entry; `git diff` of every changed file in this correction; and fresh re-runs (this review, 2026-07-31) of `pnpm verify --only unit-tests`, `pnpm verify --only type-check`, and `pnpm verify --only storybook-behavior` for the touched files, independent of the implementation/migration workers' self-reports and independent of the prior `REVIEW.md` (which predates this correction and did not review it).
Review date: 2026-07-31
DESIGN.md status: `current`
ARCHITECTURE.md status: `ready`
IMPLEMENTATION.md status: `complete`
MIGRATION.md status: `complete`
Operator visual status: not-applicable (this correction changes no visual/motion behavior; no new rendered appearance requires acceptance)
Verdict: compliant

## Goal and scenarios reviewed

This review independently re-examines the host-attribute-boundary correction: `MDButton` previously rendered a single raw `m3e-button` root with Vue's default `inheritAttrs: true`, so any undeclared consumer attribute or listener (`toggle`, `selected`, `shape`, renderer `variant`, `contained`, `beforeinput`, or private ARIA state) reached the renderer unfiltered. The correction adds `inheritAttrs: false` plus an explicit host-attribute allow-list to `MDButton.vue`. The prior existing `REVIEW.md` in this directory (dated 2026-07-31, verdict `compliant-with-listed-risks`) reviewed a _different_, earlier correction round (a visual-spec assertion fix and an `MDAppBar` `--md-content-color` removal) and does not mention `inheritAttrs`, `useAttrs`, or the host-attribute allow-list anywhere — it precedes this correction and is superseded by this review for the host-attribute-boundary scope. All prior findings it recorded remain independently unaffected by this correction (not re-litigated here).

Scope reviewed: `MDButton.vue`'s host-attribute filtering mechanism; `MDButton.test.ts`'s and `md-button-family.spec.ts`'s proof that the filter is real (not merely asserted against a props object); the exact allow-list content against `ARCHITECTURE.md`'s "Host-attribute boundary" section and `docs/component-adapter.md`'s workspace-wide rule; `MIGRATION.md`'s consumer audit; and public-API/token/version stability.

## Official design compliance

No design change occurred in this correction. `DESIGN.md` is unchanged and remains `current`. The host-attribute boundary is a Vue-adapter implementation detail with no official Material counterpart; nothing here required a `DESIGN.md` update.

## Architecture compliance

`ARCHITECTURE.md`'s "Host-attribute boundary" section (added this round, architecture date 2026-07-31) is internally consistent with `docs/component-adapter.md`'s newly added workspace-wide "Host-attribute boundary" rule (verified via `git diff`): the family allow-list (`class`, `style`, `id`, `title`, `data-*`, plus `aria-controls`/`aria-describedby`/`aria-expanded`/`aria-haspopup`) extends the documented minimum common set with a stated, scenario-4-grounded reason (overlay/menu-trigger composition, Current scenarios item 7) rather than an unexplained broadening. The "Explicitly adapter/renderer-owned" table enumerates every attribute named in the task's forbidden list (`toggle`, `selected`, `shape`, renderer `variant`, `contained`, `beforeinput`) plus `aria-label`, `aria-busy`, `aria-disabled`, `role`, `tabindex`, `aria-pressed`, and native form attributes, each with an explicit owner and reason. Owner decision `wrapper-correction` is accurate: no new prop/emit/slot was selected, and the mechanism (`inheritAttrs: false` + explicit forwarding on the single existing `m3e-button` root) matches "Mechanism" exactly — no wrapping element was introduced. No architecture-owned finding remains.

## Implementation compliance

Independently re-read `MDButton.vue` in full (not diffed against the workers' prose) and confirmed, line by line:

- `defineOptions({ inheritAttrs: false })` is present (line 17). No `v-bind="$attrs"` appears anywhere in the file — `git diff` confirms the _only_ template-level attrs binding added is `v-bind="forwardedAttrs"`, a locally computed, explicitly filtered object, not the raw `$attrs` proxy.
- `forwardedAttrs` (lines 101–118) is a positive allow-list: it iterates `Object.entries(attrs)` and forwards a key only if it is exactly `id`, `title`, `aria-controls`, `aria-describedby`, `aria-expanded`, `aria-haspopup`, or starts with `data-`. This is a strict allow-list, not a denylist — every attribute/listener not named (`toggle`, `selected`, `shape`, `variant`, `contained`, `role`, `tabindex`, `aria-label`, `aria-busy`, `aria-disabled`, `aria-pressed`, `onBeforeinput`, or any other undeclared key) is excluded by construction, not merely by omission from a test list. `class`/`style` are read directly from `attrs` in the template (`:class="['md-button', attrs.class]"`, `:style="attrs.style"`) rather than through the loop, and are additive/never-replacing by construction of the `:class` array form (`'md-button'` always present; `attrs.style` has no adapter-owned inline style to be replaced, since the adapter's own presentation is entirely scoped-CSS class-based).
- Explicit adapter bindings (`:disabled`, `shape="rounded"`, `:size`, `:toggle="false"`, `:type`, `:variant`, `:aria-busy`, `@click`) are declared _after_ `v-bind="forwardedAttrs"` in template source order, so they win on any (currently nonexistent, by allow-list construction) key collision — matching `ARCHITECTURE.md`'s stated precedence.
- Listeners: because the loop only ever copies the six named attribute keys (never any `onXxx`-shaped key), no undeclared listener — including `beforeinput` — can ever be attached to the host through this mechanism. The declared `click(event: MouseEvent)` emit is untouched by `git diff`.
- `loading`/`disabled` ownership (`aria-busy`, native `disabled`) bindings are byte-identical to the pre-correction file except for position in the diff; `git diff` shows no change to their logic.
- Public API: `git diff` on `MDButton.vue` shows only the `inheritAttrs`/`useAttrs`/`forwardedAttrs` addition and the template's `v-bind`/`:class`/`:style` replacement of the previous static `class="md-button"`. No prop, slot, or emit was added, removed, or retyped.
- `package.json`'s `@m3e/web` entry is unchanged (`^2.6.3`, confirmed via `git diff -- package.json` returning no output).
- No `!important` was introduced (grepped the family directory; the only hit is `ARCHITECTURE.md` prose listing it as forbidden).
- No generic adapter framework, wrapper, base class, registry, schema, or composable was introduced: the filter is a single inline `computed()` local to `MDButton.vue`, matching `docs/component-adapter.md`'s explicit prohibition and `ARCHITECTURE.md`'s "Forbidden" section.

**Test-file critical read (per task instruction):** `MDButton.test.ts`'s host-attribute-boundary suite does not merely assert against a props bag — every assertion reads the actual mounted `m3e-button` custom element via `Reflect.get(element, property)` (`getElementProperty`) or Vue Test Utils' `.attributes()`/`.classes()` against the real DOM node returned by `wrapper.get('m3e-button')`. The "does not forward toggle, selected, shape, renderer type/variant, or an unknown attribute" test passes `selected`, `shape`, `toggle`, `type`, `variant`, and an unrelated unknown attribute all simultaneously as `attrs` and then reads the _live element property_ (not a re-serialized prop), confirming `variant: 'filled'`, `shape: 'rounded'`, `toggle: false`, `selected: false`, `type: 'button'` — i.e., adapter-owned values, not attacker-attempted ones. The `beforeinput` test dispatches a real `Event('beforeinput')` on the actual host element and asserts the spy was never called, which proves no listener was attached (a props-object assertion could not prove this). This is genuine DOM-level proof, not a shortcut.

Browser proof (`tests/e2e/storybook/md-button-family.spec.ts`, `'MDButton drops undeclared dynamic attrs and never exposes their renderer state'`, lines 161–208) independently re-read: it opens the real Storybook-rendered story, reads `variant`/`shape`/`toggle`/`selected` directly off the live custom element via `page.evaluate`, and re-asserts after two dynamic attempted-override updates driven by a real button click — exceeding `ARCHITECTURE.md`'s stated minimum (`toggle`, `shape`, `variant`) by also covering `selected` and an unknown attribute, and by proving the state stays pinned across live updates rather than only at initial render.

No implementation-owned finding remains.

## Migration and legacy removal

`MIGRATION.md`'s consumer inventory and host-attribute allow-list audit were independently spot-checked, not accepted on its prose:

- `src/shared/ui/Snackbar/MDSnackbar.vue`: `<MDButton v-if="actionLabel" color="text" class="md-snackbar__action" :label="actionLabel" @click="onClickAction" />` — confirmed: only `color`/`label` (declared props), `@click` (declared emit), and `class` (allow-listed, merged). Matches the claim exactly.
- `src/shared/ui/NavigationPath/MDNavigationPathSegmentButton.vue`: `<MDButton :label="label" color="text" class="md-navigation-path-segment-button" @click="onClick" />` — same pattern, matches the claim.
- `src/features/databaseFilterEdit/DatabaseFilterAddButton.vue`: `<MDButton v-if="parentPropertyId" ref="addButton" :label="label" size="extra-small" color="outlined" @click="onClickAdd">` with an `icon` slot — only declared props/slot/emit plus a Vue component `ref` (not `$attrs`-mediated; resolves through the component root regardless of the allow-list, as `MIGRATION.md` correctly states). Matches the claim.
- `src/widgets/RepositoryExplorerWidget/RepositoryExplorerWidget.vue`: four `<MDButton>` usages, all only `label`/`color`/`disabled`/`@click` — matches the claim.
- Independent repository-wide grep for `aria-label|role=|tabindex|beforeinput|toggle|selected|shape=|variant=|@keydown|@focus|@blur|@input` within 15 lines after every `<MDButton` usage found exactly the two hits `MIGRATION.md` itself calls out as unrelated (an `aria-label` on a sibling `<MDMenu>` element and a `role`/`aria-label` pair on a sibling element in `OverlayLifecycleRegressionStory.vue`, neither attached to `MDButton` itself). This independently confirms `MIGRATION.md`'s "no matches outside the one unrelated `aria-label`" claim rather than merely repeating it.

No consumer file appears in `git diff` for this correction (confirmed via `git diff --stat`), consistent with `MIGRATION.md`'s claim that no consumer required a code change. The audit is credible.

No migration-owned finding remains.

## Proof and verification

Re-ran the following myself, from a clean invocation, rather than trusting `IMPLEMENTATION.md`/`MIGRATION.md`'s recorded results:

- `pnpm verify --only unit-tests --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.test.ts` — **passed** (13/13 tests, including all 5 host-attribute-boundary cases; log confirms `.verify/logs/unit-tests.log`, run at 13:25:57).
- `pnpm verify --only type-check` — **passed**.
- `pnpm verify --only storybook-behavior --files src/shared/ui/material/components/button/MDButton.vue src/shared/ui/material/components/button/MDButton.stories.ts tests/e2e/storybook/md-button-family.spec.ts` — **passed** (15/15 tests in the full button-family spec + smoke test, including `'MDButton drops undeclared dynamic attrs and never exposes their renderer state'`; log confirms `.verify/logs/storybook-behavior.log`).

All three independently reproduce the results `IMPLEMENTATION.md` and `MIGRATION.md` recorded; nothing was taken on trust.

`docs/token-api.md` is untouched by this correction (not in `git diff`) and remains consistent with the unrelated, already-complete seven-token contextual contract — out of scope for this pass and not re-verified here beyond confirming it was not touched.

## Blockers

None.

## Major issues

None.

## Minor issues

None.

## Accepted risks

- The allow-list is a manually maintained positive list local to `MDButton.vue`; any future edit that reintroduces `v-bind="$attrs"` or removes `inheritAttrs: false` would silently reopen the leak. `ARCHITECTURE.md`'s "Risks" section already names this ("regressing to accidental `v-bind=\"$attrs\"` reintroduction") and the existing `MDButton.test.ts`/browser-proof suite would catch such a regression on the next run; no independent lint rule enforces it structurally. This is an accepted, already-documented risk, not a new finding.
- This correction's browser proof covers `toggle`, `shape`, `variant`, `selected`, and one unknown attribute at the rendered custom-element level, but not every named forbidden attribute (e.g. `contained`, `aria-pressed`) individually in the browser lane. This is acceptable: the forwarding mechanism is a positive allow-list enumerated by exact key match, so every non-listed key (including `contained`/`aria-pressed`) is excluded by the same code path already proven for the tested keys, not by a separate per-key check that could diverge. `ARCHITECTURE.md`'s own proof-ownership section only requires the minimum (`toggle`, `shape`, `variant`) at the browser layer, which is met and exceeded.

## Items not required

- No change to `DESIGN.md`, `ARCHITECTURE.md`'s selected/deferred surface, the public Button Vue API (props/slots/emits), or the seven-token contextual contract.
- No `@m3e/web` version change.
- No consumer code change (none needed; audit confirms every current consumer already fits the allow-list).
- No new operator visual/motion acceptance is required by this correction: it changes no rendered appearance, color, geometry, or motion — only which non-visual attributes/listeners can reach the host.

## Required return stage

None. No design, architecture, implementation, or migration finding requires routing back.

## Completion status

Complete. `MDButton.vue` sets `inheritAttrs: false` with no unrestricted `v-bind="$attrs"`; exactly the architecture-approved allow-list (`class`, `style`, `id`, `title`, `data-*`, `aria-controls`, `aria-describedby`, `aria-expanded`, `aria-haspopup`) is forwarded, verified by direct code inspection (a positive allow-list, not a denylist) and independently re-run component-contract and Storybook-behavior proof at the real rendered custom-element level; `toggle`, `selected`, `shape`, renderer `variant`, `contained`, and `beforeinput` cannot reach or affect `m3e-button` regardless of consumer input; `class`/`style` merge rather than replace; the `click(MouseEvent)` emit and `loading`/`disabled` ownership are unchanged; the public API is unchanged; no `!important` or generic adapter framework was introduced; the `@m3e/web` version range is unchanged; and the migration's consumer audit is independently confirmed accurate against the actual consumer source files. No operator visual/motion acceptance gate applies to this non-visual correction.
