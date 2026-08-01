# Mioframe Material migration roadmap

This file is the only owner of current Material milestone status, family-stage status, technical blockers, latest pilot result, and next operator action. Durable workflow rules live in the other canonical documents.

## Current state

Last updated: 2026-08-01

Current milestone: `M0/M1 — autonomous Loading Indicator/Button pilot complete`

Status: `pilot-complete; PR merge verification pending`

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

## Pilot result

One `material-component Button` invocation produced the current revision-linked Loading Indicator and Button artifacts and exercised the complete dependency, correction, independent-review, and ordinary final-verification path.

| Scenario                                      | Result | Durable evidence                                                                                              |
| --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| Loading Indicator full dependency pipeline    | passed | five current revision-linked artifacts; compliant review `2026-08-01T11:50:04.390Z`                           |
| Button dependency queue and review linkage    | passed | exact Loading Indicator review revision recorded; dependency queue cleared                                    |
| Button implementation and migration           | passed | complete implementation and migration artifacts with exact upstream revisions                                 |
| Independent Button family review              | passed | compliant review `2026-08-01T12:50:00.000Z`                                                                   |
| Metadata-only design refresh                  | passed | Loading Indicator contract revision and downstream artifacts remained current                                 |
| Earlier-stage correction and fresh review     | passed | Loading Indicator correction propagated through a fresh compliant review                                      |
| Dependency-review propagation                 | passed | Button architecture recorded the refreshed Loading Indicator review revision                                  |
| Navigation Path ownership correction          | passed | obsolete padding declaration removed; focused browser proof added                                             |
| Focused unit, type, browser, and visual proof | passed | family artifacts record successful focused proof without baseline drift                                       |
| Ordinary final `pnpm verify`                  | passed | GitHub verify run `3257` passed format, lint, type-check, unit, E2E, Storybook behavior, visual, and mutation |
| External final-verifier ownership             | passed | the earlier unrelated shared-reorder timeout did not alter compliant family reviews and did not reproduce     |

The documented self-route, terminal-state, cycle, interruption-recovery, and worker-isolation invariants remain part of the workflow contract. Separate synthetic executions are optional workflow hardening, not a pilot or merge gate. They should be added only when a real regression, repeated implementation failure, or a justified executable workflow harness makes them durable and proportionate.

## Current blockers

There is no Material family or pilot blocker.

PR merge remains blocked by required full release-sensitive verification. This PR adds a production-output dependency and changes shared Vite/Vue build configuration. Under the repository verification contract, the final completion gate is therefore:

```text
pnpm verify:release
```

The ordinary PR verifier and preview build do not replace the full-only `release-config`, `build`, `artifact`, and `release-smoke` checks. The existing `release.yml` runs this gate only for PRs into `main` and pushes to `main`, so PR 162 into `develop` requires an explicit current-head run in a normal project checkout.

The earlier shared-reorder Storybook timeout was confirmed transient by the subsequent complete passing verifier run. It does not require a Material or shared-reorder change in this PR.

## Pilot closure criteria

M0/M1 is complete because:

- Loading Indicator and Button are current and compliant;
- exact dependency review linkage is valid;
- the ordinary final verifier path passed on the unchanged Material artifact chain;
- focused component, browser, and visual proof passed;
- no operator-reported visual or motion defect remains unresolved;
- the workflow preserved family compliance when an unrelated final-verifier failure occurred.

Synthetic malformed-result and cycle scenarios are not required for closure. Do not introduce production defects, a workflow database, registry, parser framework, artifact hashes, or persistent invalid family artifacts to prove them.

## Milestones

| ID  | Milestone                           | Status     | Exit gate                                                                           |
| --- | ----------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| M0  | workflow architecture and rules     | `complete` | coherent staged workflow and corrected terminal/verifier ownership                  |
| M1a | Loading Indicator dependency family | `complete` | five current artifacts, compliant review, no unresolved reported defect             |
| M1  | Button action family                | `complete` | exact dependency linkage, five current artifacts, migrated consumers, focused proof |
| M1b | outer pilot verification            | `complete` | ordinary final verifier passed without invalidating compliant family artifacts      |
| M2  | Switch stateful pilot               | `planned`  | controlled state/event contract and no-consumer/default-scenario behavior           |
| M3  | sequential component migration      | `planned`  | dependency-first autonomous family migrations                                       |

## Next operator action

After the current-head PR verifier completes, run exactly:

```text
pnpm verify:release
```

Do not rerun the Button or Loading Indicator family pipeline unless a genuine revision mismatch or Material finding appears. When the release gate passes, update the PR verification status, mark PR 162 ready, and decide squash merge readiness.

After PR 162 is merged, start the next selected family through one new operator invocation. The current planned stateful pilot is Switch.

No dependency pin, worker registry, artifact hash system, workflow database, generic adapter framework, positive visual acknowledgement, or synthetic pilot ledger is required.
