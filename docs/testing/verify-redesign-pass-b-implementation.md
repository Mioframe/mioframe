# Verify redesign — Pass B implementation contract

- **Status:** Completed and architect-accepted
- **Scope:** Pass B only — public verification-type CLI
- **Upstream:** `verify-redesign-architecture.md`, `verify-redesign-implementation-preflight.md`, `migration-plan.md`
- **Prerequisite:** Pass A architect-accepted

## Goal

Replace the public low-level `--only` label API with the eight canonical verification types while preserving the existing verifier orchestration and current affected planners.

## Non-goals

- No spec moves/renames or owner-local migration (Pass C).
- No E2E ownership/dependency-cruiser work (Pass D).
- No Vitest-native unit redesign, explicit mutation target registry, or performance inventory (Pass E).
- No final CI topology/release-gate cleanup or `verify:release` removal (Pass F).
- No lock, timeout, container, logging, status/resume, or product behavior redesign.

## Resolved transition details

### Public invocation

- `VerifyInvocation.onlyLabel` becomes `onlyType: VerificationType | null`.
- `--only` accepts exactly `static`, `unit`, `behavior`, `visual`, `browser-integration`, `performance`, `mutation`, `e2e`.
- Legacy low-level labels are no longer accepted by public `--only` after this pass; leaf labels remain private identifiers for logs, weights, locks, and command execution.
- Bump `VERIFY_INVOCATION_VERSION`; version-4 persisted invocation/status metadata must be rejected as stale.
- Remove the public `--storybook-build-ci-fallback` flag and persisted field.
- `--repeat` is valid only with `--only behavior --files ...` and remains bounded by the existing limits.
- Fix-only type narrowing is supported only by `static`; `--fix-only --only <non-static>` is invalid.
- `--full` rejects `--only`, `--files`, `--base`, `--repeat`, and `--fix-only`. `--profile` remains valid. `--fix` may remain valid because it still executes the complete full proof after applying supported fixers.

### Type selection

- Select proof leaves by the `verificationType` ownership established in Pass A.
- A selected type must never execute a proof leaf owned by another type.
- Preserve required pure execution prerequisites only. Currently `e2e-install` may accompany selected `e2e`; it does not become a verification type.
- `performance` currently has no persistent proof inventory. `--only performance` is a valid empty/skipped type selection, not an error and not a reason to invent infrastructure.
- Current release-only leaves remain part of literal `--full`; do not invent new affected release planning in Pass B merely to make focused type runs non-empty.

### Literal full and mutation transition

- `--full` must now execute mutation instead of excluding it.
- Pass B must **not** introduce the Pass E explicit mutation registry early.
- For this transitional pass, full mutation executes the existing Stryker-configured inventory (`pnpm exec stryker run` without an affected `-m` override). Focused/default mutation keeps the current affected behavior.
- Pass E will replace adjacency-inferred mutation ownership with the accepted explicit target inventory.
- An empty persistent performance inventory contributes no command to full mode.

### Storybook CI fallback

- Storybook buildability remains `static`; behavior/visual artifact reuse remains an execution optimization.
- Preserve the current CI duplicate-build avoidance without a public flag.
- Derive the fallback internally when running the `github-actions` profile for a focused `static` type invocation. The planner may inspect the existing behavior/visual plans to skip a duplicate static Storybook build when those self-contained CI lanes will build the equivalent artifact.
- Do not add another environment variable, public flag, registry, or manager for this.

### Current verify workflow compatibility

Changing `--only` to types would immediately break `.github/workflows/verify.yml`, which currently invokes low-level labels. Therefore the minimum consumer migration required to keep the repository executable is part of Pass B, not deferred to Pass F.

Update the existing workflow commands only:

- static job: one `--only static` step, one `--only unit` step, one `--only mutation` step;
- remove the explicit Storybook fallback flag/step contract; static type planning owns the GitHub-profile fallback internally;
- E2E job: keep/use `--only e2e`;
- Storybook browser matrix: `behavior` and `visual` public types.

Do **not** add final browser-integration/performance CI topology in this pass merely to create empty lanes. Pass C/E will provide their ordinary affected inventories; Pass F owns final workflow topology, release workflow migration to `pnpm verify --full`, consumer cleanup, and alias removal.

The independent direct `release-version` merge gate remains unchanged.

## Rerun/status behavior

- Persist and render `onlyType`, never `onlyLabel`.
- For a non-full failure/warning, a focused rerun may use the failed leaf's owning verification type.
- A full invocation cannot be reformatted as `--full --only <type>`; full failures must retain a valid full-scope rerun.
- CI-profile rerun advice must also remain valid under the no-`--full --only` rule.
- Status/resume must reject stale version-4 invocation metadata and continue to use the new structured invocation as source of truth.

## Acceptance

1. Public `--only` accepts exactly the eight canonical types and rejects old labels such as `eslint`, `unit-tests`, `storybook-behavior`, `artifact`, and `managed-updates`.
2. Invocation shape uses `onlyType`; version is bumped and old persisted shape is stale.
3. Type selection is ownership-based and type-isolated; `e2e-install` is the only current untyped prerequisite admitted where needed.
4. `--only performance` succeeds as an empty current inventory.
5. `--repeat` works only for focused behavior + files.
6. `--full` rejects every narrowing combination listed above and includes current full Stryker inventory.
7. No Pass E mutation registry is introduced.
8. Public Storybook CI fallback flag is gone; equivalent GitHub static-lane optimization is internal.
9. Help, summaries, rerun suggestions, lock metadata, status/resume tests, and validation use type terminology and emit valid commands.
10. `.github/workflows/verify.yml` no longer calls low-level `--only` labels and remains behaviorally equivalent for the currently implemented lanes.
11. `verify:release` remains as transitional alias; `.github/workflows/release.yml` is not migrated in this pass.
12. No Pass C/D/E/F implementation is pulled forward beyond the two transition necessities explicitly resolved above.

## Required focused proof

Primary proof owners:

- `scripts/lib/verifyInvocation.test.ts`
- `scripts/lib/verifyInvocation.validation.test.ts`
- `scripts/verify.test.ts`

Prove canonical type parsing/rejection, full+narrowing rejection, fix/repeat rules, stale invocation version, type isolation/prerequisites/empty performance, full mutation command composition, internal Storybook GitHub fallback, valid rerun formatting for focused vs full scopes, and workflow command inventory.

Use the current verifier CLI for feedback until the new type CLI becomes executable; after that point use the new type CLI. Do not require browser/release suites solely for this parser/planner migration unless implementation changes their execution behavior.

## Forbidden

- accepting both legacy labels and canonical types through public `--only`;
- adding a hidden/public second low-level CLI to keep CI working;
- allowing `--full --only ...` compatibility;
- inventing a ninth type or public `release` type;
- moving release/browser/E2E specs;
- implementing explicit mutation targets early;
- adding empty browser-integration/performance CI jobs as ritual proof;
- changing test meaning, product behavior, locks, timeouts, or container boundaries;
- starting Pass C before Pass B architect review is accepted.
