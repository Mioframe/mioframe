# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, latest pilot result, and next operator action. Durable workflow rules live in the other canonical documents.

## Current state

Last updated: 2026-08-01

Current milestone: `M0/M1 — close the autonomous Loading Indicator/Button pilot`

Status: `externally-blocked`

Runtime implementation status: Loading Indicator and Button runtime, token, renderer-boundary, consumer migration, and focused proof are complete. No runtime redesign is identified.

Workflow-rule status: implemented. The durable workflow now defines:

- one operator invocation;
- fresh isolated workers for five reasoning stages;
- one state-machine owner;
- fixed control fields and required headings;
- separate design artifact and design contract revisions;
- one fixed 30-calendar-day documentation refresh interval;
- metadata-only source refresh without downstream invalidation;
- exact invalidating revision links;
- exact dependency review revisions in parent architecture;
- earlier-stage and cross-family correction routes;
- terminal `blocked + none/none` semantics;
- prohibition of same-stage self-routes;
- no terminal `partial` or `stale` worker results;
- stage-contract blocking instead of automatic malformed-result retries;
- durable origin-family resume after cross-family correction;
- gate-free dependency queues and full dependency pipelines through current review;
- active dependency-path cycle detection;
- deterministic no-consumer standalone scenarios without speculative state APIs;
- implementation preflight before code and consumer edits;
- Git/PR-independent worker evidence;
- a compact execution ledger;
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
REVIEW.md          compliant
```

- Design contract revision: `2026-08-01T09:54:01.860Z`.
- Current architecture revision: `2026-08-01T11:51:42.309Z`.
- Current implementation revision: `2026-08-01T12:02:58.888Z`.
- Current migration revision: `2026-08-01T12:15:27.037Z`.
- Current review revision: `2026-08-01T12:50:00.000Z`.
- Dependency families: `loadingIndicator`.
- Recorded dependency review revision: `loadingIndicator=2026-08-01T11:50:04.390Z`.
- Renderer revision: `@m3e/web@2.6.3`.
- Operator visual status: `no-reported-defect`.

Button records the exact current Loading Indicator review revision. Navigation Path's undefined Button padding declaration was removed without adding a replacement API, private renderer input, compatibility token, or descendant override. Focused browser proof covers canonical small geometry, overflow, scrolling, and activation.

## Latest pilot result

One `material-component Button` invocation produced the current revision-linked Loading Indicator and Button artifacts and ran the outer `pnpm verify` command.

| Scenario | Result | Durable evidence |
| --- | --- | --- |
| Loading Indicator full dependency pipeline | passed | five current revision-linked artifacts; compliant review `2026-08-01T11:50:04.390Z` |
| Button dependency queue and review linkage | passed | Button architecture queue `none`; exact Loading Indicator review revision recorded |
| Button implementation and migration | passed | complete implementation and migration artifacts with exact upstream revisions |
| Independent Button family review | passed | compliant review `2026-08-01T12:50:00.000Z` |
| Metadata-only design refresh | passed | Loading Indicator artifact revision changed while contract revision and downstream revisions remained current |
| Earlier-stage correction and fresh review | passed | Loading Indicator design-format correction cleared through a fresh compliant review |
| Dependency-review propagation | passed | Button architecture reran and recorded the refreshed Loading Indicator review revision |
| Navigation Path ownership correction | passed | obsolete padding declaration removed; focused browser proof added |
| Focused unit, type, browser, and visual proof | passed | stage artifacts record passing focused commands; visual lane passed 219 references without baseline updates |
| Final `pnpm verify` | blocked externally | unrelated `shared-reorder` Storybook timeout in `reorderDocumentViewportFallback.spec.ts`; Material smoke and family proof passed |
| External final-verifier ownership | corrected | compliant family reviews remain unchanged; outer result owns the external blocker |
| Same-stage self-route rejection | not durably evidenced | workflow rule is defined; no committed pilot ledger entry proves the synthetic case |
| Terminal `partial` rejection | not durably evidenced | workflow rule is defined; no committed pilot ledger entry proves the synthetic case |
| Terminal `stale` rejection | not durably evidenced | workflow rule is defined; no committed pilot ledger entry proves the synthetic case |
| Synthetic dependency-cycle detection | not durably evidenced | workflow rule is defined; no committed pilot ledger entry proves the synthetic case |
| Invocation-local state discard and recovery | partially evidenced | dependency and revision propagation are durable; no explicit interruption ledger is committed |
| Fresh-worker isolation count | not durably evidenced | artifacts are stage-separated; no compact committed execution ledger proves worker identities/count |

## Current blocker

The Material families are compliant and ready. The outer workflow remains blocked because `pnpm verify` exited 1 when the unrelated shared-reorder Storybook behavior test `tests/e2e/storybook/reorderDocumentViewportFallback.spec.ts` timed out in its initial run and retry.

This failure belongs outside the Button and Loading Indicator families. It must not change their review verdicts, dependency gates, or artifact revisions.

The existing non-failing ESLint warning in `scripts/agentEnvironment.mjs` is also outside Material and does not alter family compliance. Its treatment follows the root verification contract.

## Pilot closure criteria

M0/M1 is complete only when:

- Loading Indicator and Button remain current and compliant;
- exact dependency review linkage remains valid;
- the external shared-reorder verifier failure is corrected or confirmed transient by the prescribed focused rerun;
- the original `pnpm verify` passes on the unchanged Material artifact chain;
- the compact pilot ledger durably records the required synthetic terminal-state and cycle scenarios;
- interruption recovery and fresh-worker isolation are recorded with enough evidence to audit without worker prose;
- no operator-reported visual or motion defect remains unresolved.

Synthetic workflow checks must not inject a production defect or persist invalid family artifacts. Use orchestrator-level control-field inputs and record only the compact result.

## Milestones

| ID | Milestone | Status | Exit gate |
| --- | --- | --- | --- |
| M0 | workflow architecture and rules | `implemented` | corrected ownership and terminal-state rules remain consistent through final pilot closure |
| M1a | Loading Indicator dependency family | `complete` | five current artifacts, compliant review, no unresolved reported defect |
| M1 | Button action family | `family-complete` | exact dependency linkage, five current artifacts, compliant review |
| M1b | outer pilot verification | `externally-blocked` | focused shared-reorder rerun and original `pnpm verify` pass; compact synthetic ledger committed |
| M2 | Switch stateful pilot | `planned` | controlled state/event contract and no-consumer/default-scenario behavior through workflow |
| M3 | sequential component migration | `planned` | dependency-first autonomous family migrations |

## Next operator action

Do not rerun the Material family pipeline and do not manually patch current family artifacts.

Perform the verifier-prescribed focused Storybook behavior command for the shared-reorder failure, correct the external owner only if the failure reproduces, then rerun the original `pnpm verify`.

Before declaring the pilot complete, record compact results for the synthetic self-route, terminal `partial`, terminal `stale`, dependency-cycle, interruption-recovery, and fresh-worker-isolation scenarios. Preserve the current compliant Loading Indicator and Button review revisions unless a genuine Material revision mismatch or finding appears.

No dependency pin, worker registry, artifact hash system, workflow database, generic adapter framework, positive visual acknowledgement, or local `verify:release` is required.