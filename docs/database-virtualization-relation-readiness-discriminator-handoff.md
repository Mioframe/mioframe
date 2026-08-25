# Database virtualization relation readiness discriminator handoff

Status: **ready for diagnosis**.

## Problem

Exact-head CI run #4348 on `cf2d9c246c324193bf0398327a1268edfad75426` failed application E2E with one flaky scenario:

`tests/e2e/databaseViewsAndQueryFlows.spec.ts:269` -> `uses default relation view inline and switches to a selected relation view`.

The first Chromium attempt failed before view switching because the default relation field rendered no data rows (`joined === ""`). Retry passed.

The same scenario also failed during local branch verification.

## Goal

Determine which readiness state owns the empty relation table before selecting a production correction.

## Discriminator

At the initial default-view checkpoint, observe through existing DOM only:

- loading indicator present/absent;
- `DatabaseDataTable` present/absent;
- table `aria-rowcount`;
- `.db-data-table__row-bootstrap` present/absent;
- mounted non-`aria-hidden` tbody row count;
- selected relation view chip.

Classify the reproduced failure as exactly one of:

### `properties-loading-table-not-mounted`

Loading indicator is present and the table is absent.

This supports delayed table/data-query startup caused by the current loading/table composition.

### `table-mounted-logical-rows-pending`

Table is present, `aria-rowcount === 1`, and no real rows are mounted.

This supports data-query readiness after table mount rather than virtualizer bootstrap.

### `logical-rows-present-no-mounted-range`

Table is present, `aria-rowcount > 1`, but no real rows are mounted; record whether row bootstrap is present.

This supports nested relation virtualization/bootstrap readiness.

### `other`

The failure does not match the states above. Return the exact observed state.

## Method

Use temporary test-side diagnostic instrumentation only in `tests/e2e/databaseViewsAndQueryFlows.spec.ts` or existing E2E helpers if needed.

Do not add production diagnostics or permanent test assertions in this pass.

First run the focused E2E using the normal verifier profile. If it does not reproduce, run the same focused E2E once with `--profile github-actions`.

If the failure reproduces and classification is obtained, stop. Remove all temporary diagnostic edits before handoff.

If neither authorized run reproduces, report `not-reproduced` with the observed successful readiness sequence and stop.

## Forbidden

- production behavior changes;
- changing `RelationValueFieldData` loading composition;
- changing `DatabaseDataTable` virtualization/bootstrap;
- changing `useVirtualCollection` or TanStack integration;
- duplicate preload/query paths;
- remount/retry recovery;
- sleeps or timeout increases;
- weakening `expectDatabaseValuesInOrder`;
- accepting retry-pass as green;
- permanent diagnostic DOM attributes/logging;
- unrelated performance work.

## Verification

Diagnosis only. No branch gate is required when all temporary edits are removed and no tracked implementation change remains.
