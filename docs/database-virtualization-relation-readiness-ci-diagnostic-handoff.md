# Database virtualization relation readiness CI diagnostic handoff

Status: **ready for implementation**.

## Problem

`tests/e2e/databaseViewsAndQueryFlows.spec.ts` scenario `uses default relation view inline and switches to a selected relation view` is a known Chromium flake.

Exact-head CI #4348 observed zero initial relation rows before any explicit view switch; whole-test retry passed. A local discriminator did not reproduce the failure, and exact-head CI #4357 later passed without a production correction.

The failing readiness state is therefore still unknown.

## Goal

Make the existing initial default-view assertion preserve its current behavior while emitting one structured readiness snapshot only when that assertion finally fails.

This pass is test-only. It does not select or implement a production correction.

## Owner

Primary proof owner:

`tests/e2e/databaseViewsAndQueryFlows.spec.ts`

Expected changed file: that spec only. Use an existing E2E helper only if the same-file implementation is impractical.

## Required diagnostic

At the initial default-view row-order assertion, preserve the existing `expect.poll` contract and matcher.

During failed poll attempts, retain the latest observable snapshot from the relation field. If the poll ultimately fails, print exactly one clearly prefixed structured diagnostic line, then rethrow the original failure.

Snapshot fields:

- loading indicator count using `.md-circular-progress-indicator`;
- Database table count using `.db-data-table`;
- table `aria-rowcount` when present;
- `.db-data-table__row-bootstrap` count;
- mounted non-`aria-hidden` `tbody > tr` count;
- current rendered row texts;
- selected relation-view chip text(s) from `.md-chip_selected`.

A passing assertion must produce no diagnostic output.

## Behavior preservation

Do not change:

- the existing initial default-view expected values `[alphaValue, betaValue]`;
- `expect.poll` timeout or retry behavior;
- `expectDatabaseValuesInOrder` semantics;
- the later descending-view assertion;
- production code.

The diagnostic may observe DOM state but must not wait for additional state, perform recovery, or deliver another user action.

## Verification

Run:

`pnpm verify --only e2e --files tests/e2e/databaseViewsAndQueryFlows.spec.ts`

Then applicable format/lint checks for the changed test file.

Because this is a tracked test change intended for the PR, run the normal branch gate:

`pnpm verify --base origin/develop`

Do not force the GitHub Actions profile on the branch gate.

A local non-reproduction is acceptable for this task if the diagnostic is implemented, the owning proof remains green, and the branch gate is clean. Exact-head CI is the environment that must capture a future failing state.

## Forbidden

- production changes;
- timeout increases or `test.slow()`;
- sleeps;
- retry/recovery logic;
- extra waits before the owned assertion;
- weakening `expectDatabaseValuesInOrder`;
- changing expected row values/order;
- duplicate preload/query paths;
- forced remount;
- `virtualizer.measure()` or cache reset;
- shared virtualization changes;
- permanent production diagnostics;
- unrelated cleanup or performance work.

## Handoff result

Report whether the diagnostic was implemented, focused verification, branch verification, and whether any local failure produced a snapshot. CI remains architect-owned.