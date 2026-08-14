# Switch review

Artifact revision: 2026-08-11T14:15:00.000Z
DESIGN.md contract revision: 2026-08-10T19:28:25.068Z
ARCHITECTURE.md revision: 2026-08-11T13:30:00.000Z
IMPLEMENTATION.md revision: 2026-08-11T13:45:00.000Z
MIGRATION.md revision: 2026-08-11T13:47:00.000Z
Verdict: compliant
Required return family: none
Required return stage: none
Completion status: complete
Final workflow verification readiness: ready
Operator visual status: no-reported-defect
Blockers: none
Major issues: none
Minor issues: none
Accepted risks: none

## Goal and scenarios reviewed

Independent review, fresh worker, no memory of any prior implementation, migration, or review pass on this family. Read in full from the workspace: `DESIGN.md`, `ARCHITECTURE.md` (all sections, including "Selected and deferred Material surface", the `presentation` extension, "Dependency closure", "Ownership", "Public Vue API", "Host-attribute boundary", "Public token contract", "Renderer mapping and gaps", "State precedence and restoration", "Implementation passes", "TEST IMPACT", "Migration plan", "Acceptance criteria", "Risks", "Forbidden", "Implementation readiness"), `IMPLEMENTATION.md`, `MIGRATION.md` (all seven revalidation notes plus the original stage content), the prior `REVIEW.md` (the artifact this refreshes), `docs/m3e-defects.md`'s `M3E-004` record, `src/shared/ui/material/docs/component-adapter.md` (complete), and `docs/testing/migration-plan.md` (complete, including Stage S2's inventory and acceptance).

Also read production/proof source directly, not through artifact prose: `MDSwitch.vue`, `m3eSwitch.d.ts`, `MDSwitch.testUtils.ts`, `MDSwitch.test.ts` (all 16 tests), `MDSwitch.browser.spec.ts` (all 8 tests), `MDSwitch.stories.ts` (all 11 story exports), `index.ts`, both current consumers (`SettingsSwitchListItem.vue`, `AppUpdateSettings.vue`), `tests/e2e/visual/shared-ui/md-switch.spec.ts`.

The independent filesystem review recorded above was performed against installed `@m3e/web@2.6.3`. The current `2.7.4` compatibility revalidation is documented in `ARCHITECTURE.md`, `IMPLEMENTATION.md`, and `docs/m3e-defects.md`; it preserves the same private renderer boundary and does not represent a new independent family review.

The selected scope remains the simplest viable design: one thin `MDSwitch` adapter exposing `selected`, `disabled`, `presentation`, and `update:selected`; no icons, drag, form participation, speculative tokens, or generic adapter framework.

## Official design compliance

`DESIGN.md` contract revision `2026-08-10T19:28:25.068Z` is unchanged and remains current. The token catalogue, geometry, states, usage guidance, and accessibility sections are internally consistent and each documented gap (unpublished motion timing, unpublished accessibility role, unpublished numeric contrast) is correctly carried forward downstream as deferred/not-selected rather than fabricated. No design-contract defect found.

## Architecture compliance

Independently re-scanned every Coverage/Owner-decision cell in both `ARCHITECTURE.md` tables against `docs/component-adapter.md`'s exact enum definitions (`direct`/`partial`/`missing`/`divergent`/`not-applicable`; `implement-now`/`defer`/`wrapper-correction`/`temporary-renderer-workaround`/`m3e-fix`/`blocked`/`source-conflict`): every cell value found — `direct` (9), `not-applicable` (4, including the `presentation` extension row, unchanged from the prior review's confirmed enum-conformance fix), `missing` (drag-to-toggle), `divergent` (`M3E-004`) — is a valid member of the correct enum; no invalid or out-of-schema value exists anywhere.

The controlled-state architecture satisfies every element `docs/component-adapter.md`'s "Controlled state ownership" section requires: `selected` is the sole, one-directional public source of truth; the renderer's cancelable `beforeinput` (confirmed from the installed `2.6.3` compiled source cited in the table) is intercepted with `preventDefault()` before any renderer mutation; the adapter computes the intended next value from the still-unmutated `checked` and emits `update:selected`; rejected intent leaves `checked` unchanged because the mutation is prevented at the source, not repaired afterward; `presentation` blocks the intent path via an explicit no-op guard as defense-in-depth behind unreachable-by-construction suppression attributes; `disabled` blocks it via the renderer's own pre-`beforeinput` click guard, deliberately not duplicated at the wrapper level (matches the "Forbidden" list's rationale against masking a real renderer regression).

Host-attribute boundary matches `docs/component-adapter.md`'s minimum common allow-list (`class`, `style`, `id`, `title`, `data-*`) plus two explicitly justified additions (`aria-label`, `aria-labelledby`, both tied to the official adjacent-label accessible-name requirement). Dependency closure (`none`) is accurate: `MDListItem` is correctly classified as a migration-stage consumer, not an architecture dependency, since it is generic shared UI, not an official Material family. Zero-token contract is justified (no confirmed contextual-override scenario). Proof ownership — owner-local `MDSwitch.browser.spec.ts` — matches `docs/testing/migration-plan.md`'s Stage S2 "complete" status exactly; Switch is not listed among the still-transitional or central-registry exceptions in that document.

The `M3E-004` citation (pointing at `IMPLEMENTATION.md`'s "Component-owned proof" section and `MDSwitch.browser.spec.ts`'s "resolves an accessible name from aria-labelledby and aria-label, and blocks disabled activation" test) was independently traced: that exact test exists at that file, asserting exactly the accessible-name and disabled-blocking behavior the citation describes.

## Implementation compliance

`MDSwitch.vue` implements the architecture exactly: `:checked="props.selected"` is the only writer of renderer `checked`; `onBeforeinput` narrows `event.target` with `instanceof M3eSwitchElement`, no-ops before computing anything when `presentation` is true, otherwise calls `preventDefault()` before computing `!event.target.checked` and emitting `update:selected`; no wrapper-local `ref` shadow of `selected` and no `watch`/`watchEffect` repair path exists; no wrapper-level `disabled` check is added inside the handler. `m3eSwitch.d.ts` correctly types the dispatched event as a plain `Event`, with an explanatory comment tying it to the installed `2.6.3` compiled source. The host-attribute allow-list is implemented as an explicit per-key function (`getForwardedAttrs`), not a generic filtering framework, matching the "no generic adapter framework" constraint.

`MDSwitch.test.ts` contains 16 tests (independently counted), covering demand-scoped defaults, explicit/false Boolean-property mapping (not dashed attributes), controlled re-assertion on prop change, the `beforeinput`-derived intent (single emission, correct negated value for both starting states, `defaultPrevented` true), rejected-intent non-mutation, disabled non-emission via a real `click` Event relying on the renderer's own guard, `presentation` full-suppression and its `beforeinput` no-op (`defaultPrevented` false), and the complete host-attribute allow-list/rejection matrix including rejection of duplicate `beforeinput`/`change`/`click` listeners and of `icons`/`name`/`value`/raw `checked`.

`MDSwitch.browser.spec.ts` contains 8 tests (independently counted and independently traced against `MDSwitch.stories.ts`'s exact export names and internal `data-testid`/`id`/role/name selectors — every locator used was confirmed present exactly as referenced), covering click/Space/Enter activation each producing exactly one public intent through the real renderer lifecycle, accessible name via `aria-labelledby`/`aria-label`, disabled-activation blocking via `page.mouse.click` at rendered coordinates (not a forbidden `{ force: true }` locator click), rejected-intent non-mutation, Tab-order unreachability for `disabled`/`presentation`, presentation pointer-unreachability and accessibility-tree hiding, the `presentation` composition pass-through fixture (satisfying `docs/component-adapter.md`'s both-sides-of-the-handoff requirement for a decorative/presentation child), the 48×48dp expanded target-hit, and host-attribute-boundary rejection at the actual rendered element.

`MDSwitch.testUtils.ts`'s localized `ElementInternals` shim installs only when `attachInternals` is absent, preserves any pre-existing implementation, and is installed/restored around `MDSwitch.test.ts`'s own `beforeAll`/`afterAll` — satisfying the "narrowest truthful test owner" rule in `docs/component-adapter.md`'s "Test-environment seams" section; `src/setupVitest.ts` independently confirmed to contain no `attachInternals`/`ElementInternals` reference. `config/vueCustomElements.ts` registers `m3e-switch`; both `config/vueCustomElements.test.ts` and `eslint.config.test.ts` independently confirm coverage; `scripts/lib/storybookBehaviorRisk.mjs` contains no remaining Switch entry (independently grepped).

## Migration and legacy removal

Both current consumers were independently re-read directly from source: `SettingsSwitchListItem.vue` renders `<MDSwitch presentation :selected="checked" :disabled="disabled" />` inside an `MDListItem` with `mode="single-action" role="switch" :aria-checked="checked" :aria-disabled="..." @action="onChange"`; `AppUpdateSettings.vue` renders the equivalent trailing presentation-only visual (`<MDSwitch presentation :selected="mode === 'automatic'" :disabled="isAutomaticToggleDisabled" />`) inside its own `MDListItem` "Automatic updates" row. In both, `MDListItem` — not `MDSwitch` — owns the accessible role, `aria-checked`, and the click-driven toggle, satisfying the negative half of the decorative-composition proof requirement; the positive half (pointer input on the decorative region reaching a composition owner's action, with state flowing back into `selected`/`checked`) is independently confirmed by `MDSwitch.browser.spec.ts`'s `PresentationComposition` test.

Legacy `src/shared/ui/Switch` is confirmed absent from the filesystem. A repository-wide search for `shared/ui/Switch` and `md-switch-family` finds only historical prose inside the family's own documentation and stale prose in `docs/roadmap.md` (see "Items not required"); no remaining import, alias, or reference exists anywhere else in the workspace. `MDStateLayer.test.ts`'s stale legacy file-path listing is confirmed removed. `MIGRATION.md`'s seven revalidation notes are each proportionate to the change they respond to and each independently re-inspects both consumers rather than assuming a prior conclusion; the latest note (`2026-08-11T13:47:00.000Z`) correctly identifies that this round's formatting-only architecture correction touches no file reachable from either consumer's build, render, or test path. No consumer migration or legacy-removal defect found.

## Proof and stage verification

Independently ran `pnpm verify --only format --files` against all six current family documentation artifacts (`DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, `REVIEW.md`, `docs/m3e-defects.md`): passed (`oxfmt --check`, exit 0), confirming the exact defect the prior `REVIEW.md` (artifact revision `2026-08-11T13:05:00.000Z`, blocked, self/architecture) blocked on is fixed. Independently confirmed the fix is formatting-only, not a content change: `ARCHITECTURE.md`'s and `docs/m3e-defects.md`'s substantive content (the `presentation` row's `not-applicable` Coverage value, the `M3E-004` row's citation, every other cell, section, and decision) was read in full this round and matches the content the prior `compliant`-track review pass had already confirmed correct before the format-only defect was found — no wording, citation, Coverage value, or decision differs.

`IMPLEMENTATION.md` and `MIGRATION.md` report passing focused type-check, format, eslint, 16 Switch unit tests, a full unrestricted-scope unit-tests run (330 files, 4457 tests) after the `ElementInternals` shim localization, 8 owner-local Storybook behavior tests, 212 visual checks, and focused e2e/blast-radius proof for both consumers. Test counts were independently re-verified by reading and counting the actual test bodies, not trusted from artifact prose. The revalidation-only refreshes this round (`IMPLEMENTATION.md` `2026-08-11T13:45:00.000Z`, `MIGRATION.md` `2026-08-11T13:47:00.000Z`) correctly required no new verifier-managed check, since the only changed files (`ARCHITECTURE.md`, `docs/m3e-defects.md`) are documentation with no reachability into any runtime, test, or consumer path — independently confirmed by inspecting both consumers and finding no reference to either changed file.

No test-environment blast-radius issue, no obsolete browser-proof placement (owner-local `*.browser.spec.ts` matches `docs/testing/migration-plan.md`'s Stage S2 "complete" status — Switch is not among the still-transitional exceptions listed there), and no missing rejected-intent or composition-pass-through proof were found.

## Blockers

None.

## Major issues

None. The formatting defect the prior `REVIEW.md` blocked on is confirmed fixed by an independently-run `pnpm verify --only format` pass covering the complete current family documentation set, with the underlying content confirmed unchanged.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- No architecture redesign of the controlled-state mapping, host-attribute boundary, or `presentation` extension's behavior — all are already correct.
- No new public Switch API; no reintroduction of drag, icons, form participation, legacy aliases, or component tokens.
- No change to the disabled-pointer browser-proof mechanism — it is already correct real pointer input, not `force`.
- No change to consumer code — both consumers are already correctly migrated and unaffected by this round's documentation-only correction.
- No change to `IMPLEMENTATION.md` or `MIGRATION.md` production/test content — both are current revalidation-only refreshes with no runtime, test, story, or consumer change.
- No update to `docs/roadmap.md` — mutable milestone status is owned outside this family's `REVIEW.md` and outside this review's writing scope (`src/shared/ui/material/AGENTS.md` "Authority"). Independently confirmed this round that `roadmap.md` is stale: it still describes an already-resolved `self/implementation` browser-proof `{ force: true }` defect (fixed per `IMPLEMENTATION.md`'s "Implemented passes" #4 and "Stage verification") and cites outdated artifact revisions. Noted to the requester so the outer orchestrator can refresh it; this does not affect family compliance, since `roadmap.md` records mutable status, not a compliance fact.

## Routing evidence

The formatting defect the prior review round blocked on (`oxfmt --check` failing on `ARCHITECTURE.md` and `docs/m3e-defects.md`) is confirmed fixed by an independently-run `pnpm verify --only format --files` pass covering the complete current family documentation set (`DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, `REVIEW.md`, `docs/m3e-defects.md`): exit 0, "format: passed". The complete controlled-state architecture, the `MDSwitch.vue` runtime, the component-contract and browser proof, and both consumer migrations were independently re-verified sound in this pass, not merely re-confirmed from the prior review's conclusions. No defect of any class was found. Route is `none/none`; the family is ready for the outer orchestrator's final workflow verification.
