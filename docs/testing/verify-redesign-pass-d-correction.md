# Verify redesign — Pass D completion correction

- **Status:** Ready for final Pass D correction implementation
- **Applies to:** `docs/testing/verify-redesign-pass-d-implementation.md`
- **Active review:** `scripts/REVIEW.md`
- **Scope:** close the remaining Playwright ownership-inventory completeness blocker and related narrow cleanup only

## Current accepted Pass D implementation state

The structural E2E migration has landed. The following previously-blocking correction work is now implemented and architect-reviewed as acceptable:

- Playwright ownership metadata collection for both ordinary and release configs runs through the existing `runPlaywrightInContainer` boundary in `--list`/reporter mode; no Pass D metadata path invokes Playwright directly on the host.
- The existing `pnpm verify` machine-lock / expensive-command coordination remains the execution owner; no second lock or container runner was introduced.
- `dependency-cruiser@18.2.0` is installed and locked.
- The real Mioframe `src/**` graph acquires successfully with the required resolver options.
- A real `src/entities/databaseData/useDatabaseData.ts` proof reaches `widget/DocumentView` and `page/DocumentViewPane` and selects owned E2E without accidental full fallback.
- Ambiguous or code-module unresolved dependency edges remain fail-closed. An unambiguously non-code unresolved asset edge may be ignored because it cannot carry TypeScript/Vue reverse-owner reachability.
- The former root/release E2E assertion files are migrated to structural page/widget ownership and the old `E2E_SCENARIO_SCOPES` production-path registry is gone.

Do not redo any of that work.

Pass E remains blocked until the final Pass D correction is architect-accepted.

## Remaining blocker — ownership inventory completeness

The filesystem target inventory and Playwright-collected owner inventory must represent the same target E2E spec set.

Current code validates each collected Playwright entry, but does not prove that every structurally valid target spec on disk was collected by one of the two owning Playwright configs. An empty or partial Playwright inventory can therefore be accepted even though target specs exist.

The final validation must fail structurally when any of these are true:

- a filesystem target `tests/e2e/pages/<Owner>/**/*.e2e.spec.ts` or `tests/e2e/widgets/<Owner>/**/*.e2e.spec.ts` is missing from the Playwright-collected inventory;
- Playwright reports a target E2E path that is not in the filesystem target inventory;
- the collected inventory contains a duplicate target entry;
- a target entry is otherwise structurally/annotation invalid under the existing rules.

Use the existing filesystem discovery from `scripts/lib/e2eOwnerTree.ts`. Do not introduce another target-spec or owner registry.

The equality/completeness check may live in `e2eOwnerInventory.ts`, `e2eRisk.ts`, or a narrow existing owner-validation boundary, but there must remain one clear validation path rather than duplicated set-comparison logic.

### Direct changed/added target behavior

A direct changed or newly-added target E2E spec must never be silently dropped because the Playwright inventory omitted it.

After completeness validation, an incomplete inventory must produce structural invalidity before selection. Do not paper over the issue by making `selectedSpecsToPlan()` independently invent missing owner entries.

## TypeScript-first tooling cleanup in this correction

Root `AGENTS.md` now requires TypeScript for new or task-touched Node/tooling scripts whenever the current runtime/toolchain can execute TypeScript directly.

The Pass D files introduced/touched by this work must therefore be reviewed for unnecessary `.mjs` usage.

Prefer conversion to `.ts` for:

- `scripts/browserIntegration.mjs`;
- `scripts/lib/e2eGraphCollector.mjs`;
- `scripts/lib/e2eOwnerInventoryContainer.mjs`;
- `scripts/lib/e2eOwnerInventoryReporter.mjs`.

Convert each file that Node 24 / the current Playwright loader can execute as TypeScript without adding a transpilation/build layer.

For the Playwright reporter specifically, first verify that the reporter path accepts the `.ts` module in the actual containerized `--list` execution. If it does, convert it. If it does not, keep `.mjs` and report the concrete loader/runtime reason; do not invent a custom loader merely to force extension consistency.

Do not mass-convert unrelated legacy `.mjs` scripts.

All imports, verifier full-lane classifications, package scripts, comments, and reporter arguments must follow any file rename mechanically.

## Minor cleanup

Remove stale references to the non-existent `scripts/lib/e2eOwnerInventoryCollector.mjs` filename. Comments must describe the actual synchronous `.ts` adapter and container child/reporter path.

## Invariants that must not change

- every Playwright CLI invocation in Pass D remains containerized;
- Playwright owner metadata still uses Playwright's collected suite/reporter API, not source parsing;
- metadata collection launches no browser;
- ordinary and release target inventories remain collected from `playwright.config.ts` and `playwright.release.config.ts`;
- `pnpm verify` remains single-run coordinated through the existing machine lock;
- child container execution inherits the owning verify lock context and does not deadlock/reacquire it;
- standalone expensive/Playwright commands still reject an independent active verify;
- dependency-cruiser remains the only E2E production import-graph engine;
- graph acquisition remains once per relevant planning invocation;
- productionArtifact E2E retains existing release/fresh-container execution;
- project applicability remains unchanged;
- no E2E scenario or assertion changes;
- no owner changes or ordinary `_mioframe-owner` annotations;
- no Pass E or Pass F work.

## Required deterministic proof

Add/update focused unit proof for at least:

1. complete filesystem target set == Playwright target inventory -> valid;
2. one filesystem target missing from Playwright inventory -> invalid;
3. unexpected Playwright-collected target -> invalid;
4. duplicate Playwright target entry -> invalid;
5. direct changed/added target with incomplete discovery -> invalid, never skip;
6. existing additional-owner annotation validation remains intact;
7. current real inventory requires zero additional-owner annotations.

Unit tests must not execute Playwright, Podman, or dependency-cruiser.

After the code correction, run one real focused verifier-managed E2E invocation that exercises the containerized ownership inventory and proves the current repository filesystem/Playwright sets are complete.

If any `.mjs` -> `.ts` conversion changes an executable boundary, run the smallest faithful focused proof for that boundary. In particular, reporter conversion requires a real containerized Playwright `--list` path, not an import-only unit test.

Do not run `pnpm verify --full` merely for this correction.

## Acceptance

Pass D is ready for architect re-review only when:

1. filesystem and Playwright target E2E inventories are equality/completeness validated;
2. missing/unexpected/duplicate target inventory is structural invalidity;
3. direct changed/added target E2E cannot silently disappear from planning;
4. the current real inventory passes the completeness check through the containerized collector;
5. stale collector comments are corrected;
6. task-touched/new Node tooling uses TypeScript wherever the current runtime/loader supports it, with any retained `.mjs` justified by a concrete technical requirement;
7. Playwright container execution and verify single-run coordination remain unchanged;
8. real dependency-cruiser behavior remains unchanged and fail-closed for unsafe uncertainty;
9. no product/E2E scenario/applicability/owner/release-routing changes are introduced;
10. Pass E/F do not begin.

## Forbidden

- another E2E owner/spec registry;
- source parsing for Playwright annotations;
- accepting partial Playwright discovery as valid;
- making selection silently skip missing inventory entries;
- host Playwright fallback;
- second container runner or lock manager;
- nested `pnpm verify`;
- weakening graph uncertainty handling;
- custom TypeScript transpilation/loader infrastructure solely to eliminate `.mjs`;
- mass conversion of unrelated legacy `.mjs` files;
- product behavior or E2E assertion changes;
- Pass E or Pass F work;
- coding-agent edits to `docs/**`, `AGENTS.md`, `.agents/skills/**`, or `REVIEW.md`.
