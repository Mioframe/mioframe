# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, latest pilot result, and next operator action. Durable workflow rules live in the other canonical documents.

## Current state

Last updated: 2026-08-02

Current milestone: `M0/M1 — runtime pilot complete; Button review refresh pending`

Status: `runtime-complete; independent-review-refresh-required`

Runtime implementation status: Loading Indicator and Button runtime, token, renderer-boundary, consumer migration, and focused proof are complete. No runtime redesign is identified.

Workflow-rule status: implemented. The durable workflow defines:

- one operator invocation;
- fresh isolated workers for five reasoning stages;
- one state-machine owner;
- fixed control fields and required headings;
- separate design artifact and design contract revisions;
- metadata-only source refresh without downstream invalidation;
- exact invalidating revision links;
- exact dependency review revisions in parent architecture;
- earlier-stage and cross-family correction routes;
- terminal `blocked + none/none` semantics;
- rejection of same-stage self-routes and terminal `partial` or `stale` worker results;
- durable origin-family resume after cross-family correction;
- full dependency pipelines through current independent review;
- active dependency-path cycle detection;
- deterministic no-consumer scenarios without speculative state APIs;
- implementation preflight before code and consumer edits;
- Git/PR-independent worker evidence;
- one final post-review workflow verification;
- external verifier blockers separated from family compliance;
- visual and motion feedback as a defect-reporting channel.

## Current family state

### Loading Indicator

```text
DESIGN.md          current
ARCHITECTURE.md    ready
IMPLEMENTATION.md  complete
MIGRATION.md       complete
REVIEW.md          compliant
```

- Design contract revision: `2026-08-01T09:59:39.918Z`.
- Current review revision: `2026-08-01T11:50:04.390Z`.
- Renderer revision: `@m3e/web@2.6.3`.
- Dependency families: none.
- Operator visual status: `no-reported-defect`.

A formatting-only design rewrite changed the design artifact revision while preserving the design contract revision. Architecture, implementation, and migration remained current, proving metadata-only refresh does not cascade.

### Button

```text
DESIGN.md          current
ARCHITECTURE.md    ready
IMPLEMENTATION.md  complete
MIGRATION.md       complete
REVIEW.md          stale (migration revision mismatch)
```

- Design contract revision: `2026-08-01T09:54:01.860Z`.
- Current architecture revision: `2026-08-01T11:51:42.309Z`.
- Current implementation revision: `2026-08-01T12:02:58.888Z`.
- Current migration revision: `2026-08-02T15:08:21.455Z`.
- Last compliant review revision: `2026-08-01T12:50:00.000Z`; it references migration revision `2026-08-01T12:15:27.037Z` and is not current.
- Dependency families: `loadingIndicator`.
- Recorded dependency review revision: `loadingIndicator=2026-08-01T11:50:04.390Z`.
- Renderer revision: `@m3e/web@2.6.3`.
- Operator visual status: `no-reported-defect`.

Button records the exact current Loading Indicator review revision. Navigation Path's undefined Button padding declaration was removed without adding a replacement API, private renderer input, compatibility token, or descendant override. Focused browser proof covers canonical small geometry, overflow, scrolling, and activation.

The migration artifact was corrected on 2026-08-02 to record intentional pending-presentation changes: generic dialogs retain form-level busy and disabled guards without an action-button spinner, while browser/provider permission waits use consumer-owned live status text. Runtime code, architecture, implementation, and focused proof did not change. Because every migration artifact revision invalidates review by project rule, Button now requires one fresh independent review.

### Switch

```text
DESIGN.md          current
ARCHITECTURE.md    ready
IMPLEMENTATION.md  complete
MIGRATION.md       complete
REVIEW.md          compliant
```

- Design contract revision: `2026-08-10T19:28:25.068Z`.
- Current architecture revision: `2026-08-11T02:00:00.000Z`. Selected: controlled `selected`/`update:selected`, `disabled`, and one Mioframe `presentation` extension for the two confirmed decorative consumers (`SettingsSwitchListItem`, `AppUpdateSettings`); zero public `--md-comp-switch-*` tokens; icons/drag/form-participation deferred. Corrected once by review routing: the renderer-mapping table's native-`<label>` accessible-naming row was reclassified `direct` → `divergent` (`M3E-004`, recorded in `docs/m3e-defects.md`); `aria-label`/`aria-labelledby` remain `direct` and are what the component actually uses.
- Current implementation revision: `2026-08-11T05:00:00.000Z`. Round 1 was a revalidation-only refresh against the corrected architecture (no code change). Round 2 fixed two real lint defects a first final-`pnpm verify` run found: forbidden `as` type assertions in `MDSwitch.vue:55` (now an `instanceof M3eSwitchElement` runtime guard) and `md-switch-family.spec.ts:92` (now Playwright's generic `Locator.evaluate<R,E>()` typing), plus formatting on 5 files. `type-check`, unit tests, `storybook-behavior` (6/6), and `visual` (212/212) all re-passed.
- Current migration revision: `2026-08-11T05:15:00.000Z` (revalidation-only refresh after each implementation round; consumers confirmed unaffected both times — `SettingsSwitchListItem`/`AppUpdateSettings` use `MDSwitch presentation`, whose short-circuit guard makes the corrected event-handler code path unreachable from either consumer). `SettingsSwitchListItem` and `AppUpdateSettings` migrated from the legacy `src/shared/ui/Switch` `MDSwitch` to the canonical `@shared/ui/material` `MDSwitch`; legacy `src/shared/ui/Switch` fully removed with no compatibility alias.
- Current review revision: `2026-08-11T06:00:00.000Z`. Verdict `compliant`, no major/minor issues, no accepted risks, completion `complete`, final workflow verification readiness `ready`. Independently reran the eslint check itself (0 errors/0 warnings) and confirmed the `instanceof`/generic-typing fixes, the M3E-004 defect record, legacy removal, and consumer action preservation are all still accurate.
- Renderer revision: `@m3e/web@2.6.3`.
- Dependency families: none.
- Operator visual status: `no-reported-defect`.

History: an earlier review pass in this invocation found a genuine documentation-accuracy defect in ARCHITECTURE.md's renderer-mapping table (native `<label>` association claimed `direct` but is actually `divergent`) and routed back to architecture; that correction cascaded through revalidation-only refreshes of implementation and migration (no code changed at either), then a fresh independent review confirmed the correction and returned `compliant`. Separately, an earlier pass also misdiagnosed a `chmod /run/user/1000/libpod: read-only file system` error as sandbox-wide Podman infrastructure corruption — the real cause was invoking `node scripts/verify.mjs` directly instead of `pnpm verify` (this project's `.claude/settings.local.json` `sandbox.excludedCommands` runs `pnpm verify*` outside the Bash sandbox specifically; the raw node script doesn't match that exclusion and runs inside the sandbox, where that path is genuinely unwritable). Podman is fine in this environment when invoked via `pnpm verify`. See `[[verify-wrapper-sandbox]]` memory for the corrected record.

Round 2: the first `pnpm verify` run found real Switch-owned lint defects (forbidden `as` type assertions in `MDSwitch.vue:55` and `md-switch-family.spec.ts:92`) plus pure formatting on 5 files. Final-verifier routing classified this material-owned and routed `self/implementation`; the fix replaced the assertions with an `instanceof` guard and Playwright's generic `evaluate<R, E>()` typing, and cascaded cleanly through migration revalidation and a fresh compliant review.

Round 2's `pnpm verify` rerun passed `format`/`eslint`/`type-check`/`unit-tests`/`e2e`/`storybook-build` cleanly, confirming the lint fix. `storybook-behavior` then failed — but final-verifier routing classified this an **external-workspace blocker**, not a Switch (or any Material family) defect: the Playwright container mounted and ran a _different sibling git worktree's_ files (`.claude/worktrees/dnd-kit-reorder-fix/tests/e2e/storybook/reorder.spec.ts`, a live-reorder-geometry test unrelated to Switch and not even present in this checkout), then was killed by the fixed 17-minute container timeout before ever reaching Switch's own spec. Root cause: `scripts/playwrightContainer.mjs` mounts the container via ambient `process.cwd()` with no explicit repo-path scoping, which can collide with a concurrent `pnpm verify`/Playwright-container run in a sibling worktree on the same machine. See `[[verify-cross-worktree-container-mount]]` memory. Per the workflow's external-workspace-blocker contract, `switch/REVIEW.md` was left untouched (still `compliant`, revision `2026-08-11T06:00:00.000Z`) and no Material family artifact was edited for this.

A back-to-back immediate retry of `pnpm verify --only storybook-behavior` (no other session running verification per `ListAgents`) reproduced the identical failure — same worktree prefix, same failure point (spec 31/85, `reorder.spec.ts:237`, killed at the 17-minute timeout). This rules out a simple concurrent-run race; the container mount appears stuck/cached within this session rather than re-resolved per invocation. Not retrying further per the project's "cap retries at one unmodified attempt" convention (here: two identical attempts).

Next action for Switch: this blocker requires environment-level intervention outside the sandbox (clearing the stale Podman container/volume for the Storybook lane, or a fresh session) — not further Material-family rework. Once storybook-behavior runs against the correct checkout, rerun the ordinary final `pnpm verify` gate; Switch M2's design/architecture/implementation/migration/review are all current and compliant and are not expected to need rebuilding.

## Pilot result

The original `material-component Button` invocation exercised the complete dependency, correction, independent-review, and ordinary final-verification path. A later documentation correction changed only the Button migration artifact revision, so the historical pilot evidence remains valid while the current artifact chain awaits a fresh independent review.

| Scenario                                      | Result           | Durable evidence                                                                                                   |
| --------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| Loading Indicator full dependency pipeline    | passed           | five current revision-linked artifacts; compliant review `2026-08-01T11:50:04.390Z`                                |
| Button dependency queue and review linkage    | passed           | exact Loading Indicator review revision recorded; dependency queue cleared                                         |
| Button implementation and migration           | passed           | complete implementation and migration artifacts with exact upstream revisions                                      |
| Independent Button family review              | refresh required | review `2026-08-01T12:50:00.000Z` passed for the prior migration revision; current migration requires fresh review |
| Metadata-only design refresh                  | passed           | Loading Indicator contract revision and downstream artifacts remained current                                      |
| Earlier-stage correction and fresh review     | passed           | Loading Indicator correction propagated through a fresh compliant review                                           |
| Dependency-review propagation                 | passed           | Button architecture recorded the refreshed Loading Indicator review revision                                       |
| Navigation Path ownership correction          | passed           | obsolete padding declaration removed; focused browser proof added                                                  |
| Focused unit, type, browser, and visual proof | passed           | family artifacts record successful focused proof without baseline drift                                            |
| Ordinary final `pnpm verify`                  | passed           | GitHub verify run `3261` passed format, lint, type-check, unit, E2E, Storybook behavior, visual, and mutation      |
| External final-verifier ownership             | passed           | the earlier unrelated shared-reorder timeout did not alter compliant family reviews and did not reproduce          |

The required full release-sensitive gate also passed through isolated validation PR #171. Release workflow run `19` (`30705988050`) executed the real `pnpm verify:release` path against exact product head `89bdcd52b114263ac92001e368082155ad70a3f5`, including release configuration, full project proof, production build, artifact validation, and release smoke checks. The validation PR was closed without merge; its three validation-only changes are not part of this branch.

The documented self-route, terminal-state, cycle, interruption-recovery, and worker-isolation invariants remain part of the workflow contract. Separate synthetic executions are optional workflow hardening, not a pilot or merge gate. They should be added only when a real regression, repeated implementation failure, or a justified executable workflow harness makes them durable and proportionate.

## Current blockers

Button `REVIEW.md` references the previous migration revision. Run a fresh isolated Button review against migration revision `2026-08-02T15:08:21.455Z`, then run the ordinary final `pnpm verify` gate on the resulting documentation head.

No runtime correction is identified. The earlier shared-reorder Storybook timeout was confirmed transient by subsequent complete verifier runs and does not require a Material or shared-reorder change in this PR.

## Pilot closure criteria

Runtime and focused proof for M0/M1 are complete. Current merge closure additionally requires:

- a fresh independent Button review referencing migration revision `2026-08-02T15:08:21.455Z`;
- one ordinary final `pnpm verify` run after that review.

The exact dependency review linkage remains valid; the full release-sensitive verification already passed against the unchanged product implementation head; focused component, browser, and visual proof passed; no operator-reported visual or motion defect remains unresolved; and the workflow preserved family compliance when an unrelated final-verifier failure occurred.

Synthetic malformed-result and cycle scenarios are not required for closure. Do not introduce production defects, a workflow database, registry, parser framework, artifact hashes, or persistent invalid family artifacts to prove them.

## Milestones

| ID  | Milestone                           | Status                     | Exit gate                                                                              |
| --- | ----------------------------------- | -------------------------- | -------------------------------------------------------------------------------------- |
| M0  | workflow architecture and rules     | `complete`                 | coherent staged workflow and corrected terminal/verifier ownership                     |
| M1a | Loading Indicator dependency family | `complete`                 | five current artifacts, compliant review, no unresolved reported defect                |
| M1  | Button action family                | `review-refresh-required`  | fresh review must reference the corrected current migration artifact                   |
| M1b | outer pilot verification            | `final-rerun-required`     | ordinary verifier reruns after current independent review; release proof remains valid |
| M2  | Switch stateful pilot               | `blocked-external-tooling` | family compliant; blocked only by cross-worktree Playwright container mount defect     |
| M3  | sequential component migration      | `planned`                  | dependency-first autonomous family migrations                                          |

## Next operator action

Run `material-component Button`. The orchestrator should detect the migration/review revision mismatch, execute only a fresh isolated Button review, and then run the ordinary final verification selected by project policy. Do not rerun design, architecture, implementation, migration, Loading Indicator, or release-sensitive verification unless the workflow finds a genuine additional mismatch or Material defect.

After the refreshed review and final verifier pass, mark PR 162 ready and squash merge it into `develop`. Then start the next selected family through one new operator invocation; the current planned stateful pilot is Switch.

No dependency pin, worker registry, artifact hash system, workflow database, generic adapter framework, positive visual acknowledgement, or synthetic pilot ledger is required.
