# Floating action button review

Verdict: compliant-with-listed-risks
Required return family: none
Required return stage: none
Completion status: complete
Final workflow verification readiness: ready
Operator visual status: no-reported-defect
Blockers: none
Major issues: none
Minor issues: none
Accepted risks: one (see below) — local real-browser re-verification of two edited legacy/cross-owner Playwright specs was not run in this sandbox; independently confirmed low-risk by diff inspection; exact-head CI covers it.

## Goal and scenarios reviewed

Independent review, fresh worker, no memory of any prior design/architecture/implementation/migration work on this family. Read in full from the workspace: root `AGENTS.md`, `src/AGENTS.md`, `src/shared/AGENTS.md`, `src/shared/ui/AGENTS.md`, `src/shared/ui/material/AGENTS.md`, `src/shared/ui/material/docs/component-adapter.md`, and `docs/testing/migration-plan.md` (complete). Read the complete family artifact chain: `DESIGN.md` (status current), `ARCHITECTURE.md` (status ready), `IMPLEMENTATION.md` (status complete), `MIGRATION.md` (status complete, review readiness ready).

Read production/proof source directly, not through artifact prose: `MDFab.vue`, `m3eFab.d.ts`, `MDFab.test.ts` (all 12 tests), `MDFab.browser.spec.ts` (all 3 tests), `MDFab.visual.spec.ts` (all 4 tests) plus its 4 baseline PNGs, `MDFab.stories.ts` (all 5 story exports), `index.ts`, the root `@shared/ui/material` barrel, `config/vueCustomElements.ts`/`.test.ts`, and both edited legacy-proof files (`tests/e2e/storybook/focusIndicator.spec.ts`, `tests/e2e/visual/shared-ui/md-fab-family.spec.ts`) via their exact `git diff` against the last commit.

Scenario reviewed: the single approved no-consumer library scenario — a medium-size, primary-container-color FAB with a required icon, a required accessible `label`, and native click/keyboard activation. No product consumer currently adopts `MDFab`; `RepoExplorerPane.vue`'s pre-existing `MDExtendedFab`/`FabContainer` usage is a separate, out-of-scope official family and is unaffected.

## Official design compliance

`DESIGN.md` is current (source checked 2026-08-14, matching today's date; refresh check due 2026-09-13) and complete: identity/anatomy, variants/configurations, geometry, states/behavior, usage guidance, accessibility, and the full official token catalogue (11 token sets) are all present with an explicit source ledger. Genuine official ambiguities (the undocumented "lowered" elevation applicability, the Web Expressive "Unavailable" platform status against an installed general-Web renderer) are correctly recorded as unresolved/accepted rather than guessed. No design-contract defect found.

## Architecture compliance

`ARCHITECTURE.md` correctly applies the workflow's no-consumer default-scenario rule: it independently confirms zero product consumers of a plain FAB and selects the one unambiguous official standalone default (medium size, primary-container color) rather than building unused configurability. Every deferred surface (other sizes/colors, deprecated small/surface, `disabled`, `lowered`, Extended anatomy, link/form fields, hover/focus tooltip) is traced to an exact `DESIGN.md` section and given a valid `docs/component-adapter.md` enum value (`direct`/`not-applicable` coverage; `implement-now`/`defer`/`blocked`/`source-conflict`/`not-applicable` owner decisions — no invalid enum value found). The `disabled` omission is correctly classified as guidance-forbidden, not merely deferred, matching DESIGN.md's explicit "don't disable the FAB" accessibility guidance and the absence of a disabled token set.

The host-attribute boundary matches `docs/component-adapter.md`'s minimum common allow-list exactly (`class`, `style`, `id`, `title`, `data-*`) with no unjustified addition. The zero-token contract is conditioned on an implementation-stage installed-artifact confirmation rather than assumed by analogy — this condition was independently re-verified (see Implementation compliance). Dependency closure (`none`) is accurate; `FabContainer.vue` is correctly classified as migration-stage inventory, not an architecture dependency, since it is generic shared UI, not an official Material family.

## Implementation compliance

`MDFab.vue` implements the architecture exactly: `defineOptions({ inheritAttrs: false })`, no `v-bind="$attrs"` anywhere, an explicit `getForwardedAttrs()` allow-listing only `id`/`title`/`data-*`, with `class`/`style` merged separately in the template (`['md-fab', attrs.class]`) so the adapter-owned class always wins. The private renderer constants `variant: RendererFabVariant = 'primary-container'` and `size: RendererFabSize = 'medium'` are typed against `@m3e/web/fab`'s exported unions, are never derived from props/attrs, and are asserted in tests to survive an attempted override via `v-bind`. `label` maps directly to `aria-label`; the `icon` slot renders into the renderer's default (unnamed) slot with no `slot` attribute leak (independently confirmed by the test asserting `attributes('slot')` is `undefined`); a DEV-only `onMounted` + `useSlots()` check warns on an empty icon slot, matching the legacy convention.

`MDFab.test.ts` contains exactly 12 tests (independently counted), covering: renderer-constant immutability; `label` → `aria-label`; icon-slot rendering into the renderer's default slot; DEV-mode empty-slot warning present/absent; `click` forwarding; and the complete host-attribute allow-list/rejection matrix, including reactive add/remove/re-add of allowed attributes and rejection of `disabled`/`disabled-interactive`/`lowered`/`extended`/link/form attributes/`variant`/`size`/an unknown attribute/an undeclared listener — independently confirmed present at exactly those assertions, not merely claimed.

`MDFab.browser.spec.ts` contains exactly 3 tests (independently counted): accessible-name resolution plus native click; Space and Enter keyboard activation each producing exactly one `click`; and host-attribute-boundary rejection at the actual rendered custom-element state across dynamic updates (`disabled`/`extended`/`lowered`/`size`/`variant` all read directly from the live DOM element, not from a Vue-level assumption).

`MDFab.visual.spec.ts` contains exactly 4 tests with 4 correspondingly named baseline PNGs present in `MDFab.visual.spec.ts-snapshots/` (`md-fab-states-linux.png`, `md-fab-hover-linux.png`, `md-fab-focus-linux.png`, `md-fab-pressed-linux.png`): resting appearance plus real pointer-hover, real keyboard-focus, and real pointer-press feedback, matching the Button/Checkbox/Switch `RealInteractionFeedback` precedent. Light/dark coverage is honestly documented as a repository-wide visual-runner gap (one fixed light desktop-Chrome project), not FAB-specific, and not fabricated.

The zero-`--md-comp-fab-*`-token decision was independently re-verified against the installed renderer artifact rather than trusted from `IMPLEMENTATION.md` prose: `node_modules/@m3e/web/package.json` confirms version `2.6.3` (matching `ARCHITECTURE.md`'s recorded renderer revision); `dist/fab.js` line 325 shows the primary-container FAB's `containerColor` resolving through `DesignToken.color.primaryContainer`; line 47 shows the medium-size `shape` resolving through `DesignToken.shape.corner.largeIncreased`; lines 96/129 (etc.) show resting/hover container elevation resolving through `DesignToken.elevation.level3`/`level4`. `dist/core.js` independently confirms each of those `DesignToken` members resolves to a public `--md-sys-*` custom property with a literal Material-spec fallback (`--md-sys-color-primary-container`, `--md-sys-shape-corner-large-increased` at 1.25rem/20dp, `--md-sys-elevation-level3`/`level4`, and `--md-sys-state-hover/focus/pressed-state-layer-opacity`). `src/shared/ui/material/foundation/tokens.css` independently confirms every one of those `--md-sys-*` variables is actually declared (lines 19, 38, 41, 160, 167, 170), so the resolution chain is complete end to end with no dangling fallback-only value. No token-resolution gap exists; the zero-token architecture decision is correct.

`m3e-fab` is registered in `config/vueCustomElements.ts` and independently confirmed covered by `config/vueCustomElements.test.ts`. `m3eFab.d.ts` scopes the Vue custom-element typing to exactly `variant`/`size`/`onClick` plus `HTMLAttributes`/`PublicProps` — no speculative renderer surface leaks into the public typing.

## Migration and legacy removal

Independently re-ran the architecture-stage consumer grep across `src/pages`, `src/widgets`, `src/features`, `src/entities`: zero matches for `MDFab` anywhere in product code. `RepoExplorerPane.vue` was independently re-read and confirmed unchanged — it still imports `FabContainer`/`MDExtendedFab` from `@shared/ui/Button`, not the canonical `MDFab`.

Legacy `src/shared/ui/Button/MDFab.vue`/`.test.ts`/`.stories.ts` are confirmed deleted (`ls` of the directory and `git status` both show only `D` entries for these three files); `src/shared/ui/Button/index.ts` no longer exports `MDFab` (confirmed by direct grep — no match); a repository-wide search for any remaining import of `Button/MDFab` found only the family's own documentation artifacts (expected historical record), no live code reference.

Both cross-owner legacy-proof edits were independently verified via exact `git diff`, not trusted from `MIGRATION.md` prose:

- `tests/e2e/storybook/focusIndicator.spec.ts`: the diff is a pure removal of the `'MDFab focus indicator follows real keyboard focus and is not clipped'` test block; the surrounding `MDButton`/`MDIconButton`/`MDExtendedFab` tests and the shared `assertFocusIndicatorFollowsHost` helper are byte-for-byte unchanged.
- `tests/e2e/visual/shared-ui/md-fab-family.spec.ts`: the diff removes exactly the nine legacy-`MDFab`-only tests, the orphaned `FAB_TOKEN_MATRIX` fixture, and the `MDFab`-only lines of the one mixed loading-colors test (the surviving `MDExtendedFab` half of that test is textually unchanged, only renamed from the shared title); every remaining line in the file belongs to the `MDExtendedFab` suite. The file was read in full after the edit and contains no remaining plain-`MDFab` reference.
- The three now-orphaned baseline PNGs (`md-fab-states-linux.png`, `md-fab-interaction-states-linux.png`, `md-fab-size-comparison-linux.png`) are confirmed deleted via `git status`; the snapshots directory now contains only the two `MDExtendedFab` baselines, matching the surviving tests.

`docs/testing/migration-plan.md` was independently re-read in full: its S2-D inventory and migration-group entries now carry an accurate historical note that the legacy plain `MDFab` referenced by the original S2-D wording no longer exists, with a pointer to this family's `MIGRATION.md` — no dangling reference to a deleted component remains in that document.

No compatibility alias was kept for the removed legacy `MDFab`, correctly, since it had zero product consumers.

## Proof and stage verification

Test counts were independently re-verified by counting actual test bodies, not trusted from artifact prose: `MDFab.test.ts` has exactly 12 `it(` blocks; `MDFab.browser.spec.ts` has exactly 3 `test(` blocks; `MDFab.visual.spec.ts` has exactly 4 `test(` blocks — all matching `IMPLEMENTATION.md`'s claimed counts.

Owner-local `MDFab.browser.spec.ts`/`MDFab.visual.spec.ts` placement is correctly authorized: `docs/testing/migration-plan.md`'s current executable state confirms mixed discovery (legacy central plus owner-local `src/**/*.browser.spec.ts`/`*.visual.spec.ts`) is executable, and explicitly authorizes "a canonical Material family migration... to establish final owner-local Storybook browser/visual ownership in the same family workflow." This is not a still-transitional or central-registry exception.

`IMPLEMENTATION.md` reports passing focused `type-check`, `unit-tests` (17/17 then 12/12), `eslint`, `format`, `storybook-build`, `storybook-behavior` (3/3), and `visual` (4/4) — all for the FAB family's own owned files. This is the family's complete required proof per `ARCHITECTURE.md`'s TEST IMPACT, and it is complete with no gap.

**One genuine, narrow gap exists, independently assessed rather than accepted on the migration worker's word:** `MIGRATION.md` reports that the podman-backed `storybook-behavior`/`visual` Playwright lanes were not re-run in this sandbox against the two edited legacy/cross-owner files (`focusIndicator.spec.ts`, `md-fab-family.spec.ts`) after the deletions described above — this sandbox cannot run podman-backed verify commands, and no attempt was made to work around that restriction. This review independently re-examined both edits at the diff level (see "Migration and legacy removal") and confirms: (a) both edits are pure subtractions — zero new or modified assertion logic exists in the surviving code, only removal of dead-component test bodies and one fixture; (b) `type-check`, `eslint`, `format`, and `storybook-build` already ran successfully against exactly these files, which would catch syntax errors, unused imports, or reference breaks; (c) the surviving `MDButton`/`MDIconButton`/`MDExtendedFab` assertions in both files are textually identical to their pre-edit state. Given this, the residual risk that the podman-backed real-browser lanes would newly fail on these exact files is assessed as very low, and exact-head GitHub CI will run both lanes on the PR regardless — it is the authoritative gate for this exact contract, consistent with `src/shared/ui/material/AGENTS.md`'s "Final workflow verification readiness... does not mean a local broad verifier command has run." This is recorded as an accepted risk with an explicit required operator/architect action, not a route back to migration: the underlying edit is correct and complete; only its local real-browser re-confirmation is outstanding, and it is bounded to exactly two named files with no ambiguity about what needs to run.

## Blockers

None.

## Major issues

None.

## Minor issues

None.

## Accepted risks

- The podman-backed `storybook-behavior` lane for `tests/e2e/storybook/focusIndicator.spec.ts` and the podman-backed `visual` lane for `tests/e2e/visual/shared-ui/md-fab-family.spec.ts` were not re-run in this (or the migration) sandbox after this migration's subtractive edits to both files. Independently confirmed via exact diff inspection that both edits are pure deletions of already-passing legacy-`MDFab` test bodies/fixtures with zero new or changed assertion logic in the surviving `MDButton`/`MDIconButton`/`MDExtendedFab` proof; `type-check`/`eslint`/`format`/`storybook-build` already passed on exactly these files. Required action: the architect should run `pnpm verify --only storybook-behavior --files tests/e2e/storybook/focusIndicator.spec.ts` and `pnpm verify --only visual --files tests/e2e/visual/shared-ui/md-fab-family.spec.ts` via a podman-capable environment before or alongside opening the PR, or treat the exact-head GitHub CI run of these same lanes as satisfying this confirmation before merge. Do not skip both.

## Items not required

- No FAB (regular)/large size, no non-default color, no deprecated small/surface variant — no confirmed scenario requires them; correctly deferred.
- No `disabled`/`disabled-interactive` prop — official guidance forbids disabling a FAB; correctly omitted, not merely deferred.
- No `lowered` elevation — official source does not resolve when it applies; correctly left unimplemented pending a future source resolution, not guessed.
- No Extended FAB or FAB menu behavior inside this family — both are separate official families, correctly out of scope; `RepoExplorerPane.vue`'s existing `MDExtendedFab` usage is untouched.
- No link/form (`href`/`download`/`target`/`rel`/`name`/`value`/`type`) surface — renderer supports it, no confirmed scenario selects it.
- No web hover/focus tooltip — documented "should" guidance, but no canonical Material Tooltip family exists yet to compose as a dependency; correctly deferred rather than faked.
- No `--md-comp-fab-*` public token — no confirmed contextual-override scenario; default appearance resolves entirely from already-public foundation tokens, independently confirmed above.
- No fabricated product consumer — the explicit no-consumer library-only scenario is honestly recorded, not worked around with an invented integration.

## Routing evidence

No architecture, implementation, or migration defect was found. Every artifact claim independently spot-checked in this review (test counts, renderer-registration, zero-token resolution chain against the installed `@m3e/web@2.6.3` artifact and foundation tokens, consumer-inventory grep, and the exact content of both edited legacy-proof files via `git diff`) matched the documented record exactly. The single accepted risk above is a bounded, independently-assessed-low-risk, sandbox-caused local-execution gap on non-family-owned blast-radius proof, not a content or design defect in this family's own work — it does not require returning to `migration` or any earlier stage. Route is `none/none`; the family is ready for the outer orchestrator's final workflow verification and architect-owned PR/CI, contingent on the one listed operator action being completed (locally or via CI) before merge.
