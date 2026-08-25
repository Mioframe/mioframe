# Verify redesign — current continuation handoff

Use this file to resume the `architecture/verify-redesign` work in a fresh architect context.

## Read first

Before making a decision or assigning code work, read the current branch versions of:

1. root `AGENTS.md`;
2. `.agents/skills/verification/SKILL.md`;
3. `.agents/skills/project-review/SKILL.md` for review work;
4. `docs/testing/architecture.md`;
5. `docs/testing/verify-redesign-implementation-preflight.md`;
6. `docs/testing/verify-redesign-pass-d-implementation.md`;
7. `docs/testing/verify-redesign-pass-d-correction.md`;
8. `docs/testing/migration-plan.md`;
9. active `scripts/REVIEW.md`.

The repository is the source of truth. Do not continue from chat-memory assumptions when these files differ.

## Branch and review baseline

Branch:

```text
architecture/verify-redesign
```

Pass D architect pre-implementation baseline:

```text
09f5b6629a21fe03878ea190894c70fe2ae95aba
```

For the eventual final Pass D semantic re-review, inspect the complete resulting Pass D diff from that baseline to the then-current branch head, not only the latest correction patch.

Important recent implementation/review state:

```text
6ec930a5033a50cd83ef3351ca84b28ce06dcc14  latest coding correction reviewed
b6145d9c66a09cd06af7bb47b6908735602a7a66  architect review: one completeness blocker remains
b62af37a5b11e3d63912d3341b59b5c523f1467e  root rule: TypeScript-first tooling
2828e04a78ac463482d78ceaa3cb760fe6d49323  final Pass D correction contract narrowed to current blocker
524f4dbf6d227607a82d3f8f6201623398480060  migration plan refreshed to current Pass D state
```

Use the actual current branch head after reading this file; do not assume one of the above is still HEAD.

## Pass status

- Pass A: architect-accepted.
- Pass B: architect-accepted.
- Pass C: architect-accepted.
- Pass D: implementation landed; **not architect-accepted yet**.
- Pass E: must not start.
- Pass F: must not start.

## Accepted Pass D implementation state

Do not reopen these decisions without new repository evidence:

- Application E2E uses structural ownership only:
  - `tests/e2e/pages/<Owner>/**/*.e2e.spec.ts`
  - `tests/e2e/widgets/<Owner>/**/*.e2e.spec.ts`
- Primary owner comes from path and is validated against the corresponding `src/pages/<Owner>/` or `src/widgets/<Owner>/` directory.
- The old `E2E_SCENARIO_SCOPES`, standalone exception metadata, and production-path -> spec registry are removed and must not return.
- Project applicability remains a separate path-safe `desktop | mobile | both` registry.
- Current migrated inventory requires zero `_mioframe-owner` additional-owner annotations.
- The three production-artifact E2E scenarios have structural product owners but keep their existing release/fresh-container execution semantics.
- Ordinary E2E excludes `productionArtifact/` from dev-app Playwright discovery.
- `dependency-cruiser@18.2.0` is the only production import-graph engine for E2E affected-owner discovery.
- Real graph acquisition is proven. `src/entities/databaseData/useDatabaseData.ts` reaches `widget/DocumentView` and `page/DocumentViewPane` and focused verification selected the owned E2E without full fallback.
- Dependency-cruiser resolver options for package `exports`/conditions are required by the real repository graph.
- Unresolved ambiguous/code-module edges remain fail-closed. Unambiguously non-code unresolved asset edges may be dropped because they cannot carry TypeScript/Vue owner reachability.
- Playwright ownership metadata for both ordinary and release configs is collected through the existing Playwright container boundary in `--list`/reporter mode. No Pass D ownership path may run Playwright CLI on the host.
- The existing machine lock remains the single coordination mechanism for local `pnpm verify` and standalone expensive commands.
- `browser-integration-local` uses the existing Playwright container runner; appUpdate managed browser-integration remains on its release runner/browser matrix.

## Active review state

`scripts/REVIEW.md` is authoritative.

At handoff preparation, it contains exactly:

### Blocker B1 — Playwright target inventory completeness

The union of Playwright-collected target E2E paths is not currently proven equal to the complete filesystem target E2E set.

Required final behavior:

- filesystem target missing from Playwright inventory -> structural invalidity;
- unexpected Playwright target -> structural invalidity;
- duplicate Playwright target -> structural invalidity;
- complete equality -> valid;
- direct changed/added target cannot silently disappear when discovery is incomplete.

Reuse `validateE2ETargetTree().targetPaths`; do not add another owner/spec registry.

The current unit behavior that treats an empty collected inventory as technically valid must be removed/replaced by fail-closed completeness proof.

### Minor M1 — stale collector comments

Comments still reference a non-existent `e2eOwnerInventoryCollector.mjs`. Correct them to the actual synchronous `.ts` adapter/container child path.

There are no other active blocker/major findings at handoff preparation.

## TypeScript-first rule

Root `AGENTS.md` now defines the durable policy:

- prefer TypeScript for new or task-touched Node/tooling scripts when the current runtime/toolchain can execute it directly;
- use `.js`/`.mjs` only for a concrete loader/runtime requirement;
- do not build custom transpilation/loader infrastructure only to eliminate `.mjs`;
- do not mass-convert unrelated legacy scripts solely for extension consistency.

For the final Pass D correction, review the new/task-touched Pass D files:

```text
scripts/browserIntegration.mjs
scripts/lib/e2eGraphCollector.mjs
scripts/lib/e2eOwnerInventoryContainer.mjs
scripts/lib/e2eOwnerInventoryReporter.mjs
```

Convert each to `.ts` when the actual Node 24 / Playwright loader supports it directly. For the Playwright reporter, prove `.ts` loading through the real containerized `--list` path before removing `.mjs`; if Playwright requires JavaScript there, retaining `.mjs` is allowed with concrete evidence.

Any rename must mechanically update imports, verifier infrastructure classification, package scripts, reporter arguments, and comments.

## Invariants that must remain true

- Public `pnpm verify --only` exposes only: `static`, `unit`, `behavior`, `visual`, `browser-integration`, `performance`, `mutation`, `e2e`.
- `pnpm verify --full` remains literal complete current proof and rejects narrowing flags per the accepted Pass B contract.
- Any Playwright CLI execution used by verification, including metadata/list collection, stays inside the repository container boundary.
- One independent local `pnpm verify` owns the machine lock; a second independent verify fails fast.
- Standalone expensive/Playwright commands cannot bypass an active verify.
- Child commands of the owning verify inherit its lock context and do not reacquire/deadlock.
- Heartbeat, stale recovery, owner token, persisted invocation, active-command metadata, status/resume, and GitHub Actions lock semantics are not redesigned in Pass D.
- No E2E scenario/assertion, owner, project applicability, product behavior, release execution ordering, or browser matrix changes are part of the remaining correction.
- No host Playwright fallback.
- No second container abstraction.
- No second lock.
- No nested `pnpm verify`.
- No source parsing for Playwright annotations.
- No restoration of manual E2E source mapping.
- No Pass E/F work.

## Next coding correction

The coding task must be derived directly from `docs/testing/verify-redesign-pass-d-correction.md` and `scripts/REVIEW.md`.

It should contain only:

1. fail-closed filesystem/Playwright target inventory equality/completeness validation;
2. deterministic unit proof for complete/missing/unexpected/duplicate/direct-changed-or-added cases;
3. one real focused E2E proof through the containerized owner inventory on the current repository;
4. stale comment cleanup;
5. TypeScript-first conversion of the new/task-touched Pass D Node scripts where the current runtime/Playwright loader proves it is supported.

Do not ask the coding agent to redesign Pass D.

## After the next coding correction

Perform a **complete Pass D re-review**, not a patch-only review:

1. inspect root/nested rules and applicable skills again;
2. inspect the full diff from `09f5b6629a21fe03878ea190894c70fe2ae95aba` to current head;
3. confirm every original E2E assertion survived exactly once;
4. confirm no root/release assertion owner or manual source registry returned;
5. verify structural owner parsing and filesystem owner validation;
6. verify Playwright inventory equality/completeness and additional-owner validation;
7. verify exact project applicability;
8. verify real dependency graph/fail-closed behavior;
9. verify productionArtifact routing and absence of ordinary-run duplication;
10. verify generic browser-integration vs appUpdate special routing;
11. verify all Playwright execution remains containerized;
12. verify single-verify machine-lock behavior is preserved;
13. verify TypeScript-first conversions did not introduce loader/runtime workarounds;
14. inspect focused verification evidence;
15. inspect exact-head GitHub CI separately as the architect-owned automatic gate.

If that correction closes B1/M1 and reveals no new findings:

- delete `scripts/REVIEW.md`;
- mark Pass D architect-accepted in `docs/testing/verify-redesign-pass-d-implementation.md`;
- update `docs/testing/migration-plan.md` to open Pass E;
- remove/mark the correction record completed as appropriate;
- then prepare Pass E architecture before implementation.

If this next correction still reveals another ownership/fail-closed architectural defect or growing workaround logic, **stop patching and revisit the Pass D architecture decision** per root `AGENTS.md`; do not start a third local correction loop.

## Merge/CI note

Pass acceptance and merge readiness are separate. Even after semantic Pass D acceptance, exact-head GitHub CI remains the architect-owned automatic gate. Do not claim merge readiness solely from the coding agent's local verification report.
