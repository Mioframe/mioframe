# Review

Verdict: blocked

## Scope reviewed

- Complete Verify Redesign Pass D implementation and the correction at current branch head.
- Structural E2E migration/splits, owner parsing, Playwright owner inventory, project applicability, dependency-cruiser reverse graph, productionArtifact routing, generic browser-integration, Playwright container execution, and local verify single-run coordination.
- The prior host-Playwright inventory blocker and missing real dependency-cruiser proof are resolved by the current implementation and were removed from active findings.

## Blockers

### B1 — Playwright ownership inventory is not completeness-validated against the target E2E tree

Owner: `scripts/lib/e2eOwnerInventory.ts` / `scripts/lib/e2eRisk.ts`

Problem: the current owner-inventory validation checks only the entries returned by Playwright. It does not prove that every structurally valid `tests/e2e/{pages,widgets}/<Owner>/**/*.e2e.spec.ts` file on disk was actually collected by either `playwright.config.ts` or `playwright.release.config.ts`. An empty or incomplete Playwright inventory is therefore considered valid. `resolveStructuralE2EPlan()` builds its selectable spec map only from that inventory, and `selectedSpecsToPlan()` silently skips a selected path when the map has no entry.

Evidence:

- [`lib/e2eOwnerInventory.ts`](lib/e2eOwnerInventory.ts) — `validateE2EOwnerInventory()` validates only supplied entries and has no expected-target-set completeness check.
- [`lib/e2eOwnerTree.ts`](lib/e2eOwnerTree.ts) — `validateE2ETargetTree()` independently discovers the complete filesystem target set, but its `targetPaths` are not reconciled with the Playwright owner inventory.
- [`lib/e2eRisk.ts`](lib/e2eRisk.ts) — `selectedSpecsToPlan()` does `entryBySpecPath.get(specPath)` and continues when the Playwright inventory lacks the path, so an existing/added changed target can disappear from the plan.
- [`lib/e2eRisk.test.ts`](lib/e2eRisk.test.ts) — the current test explicitly treats `collectOwnerInventory: () => []` as a technically valid empty inventory and expects a skip plan.
- [`../playwright.config.ts`](../playwright.config.ts) and [`../playwright.release.config.ts`](../playwright.release.config.ts) — these two configs jointly define the target E2E discovery whose union must cover the filesystem target inventory.

Basis:

- [`../docs/testing/verify-redesign-pass-d-implementation.md`](../docs/testing/verify-redesign-pass-d-implementation.md) — target E2E ownership is structural; ownership inventory is collected from ordinary + release Playwright configs; duplicate/missing/malformed ownership inventory is structural invalidity; direct existing/added target E2E must select itself and structural invalidity must fail rather than silently skip.
- [`../AGENTS.md`](../AGENTS.md) — add/modify/remove/move proof must not silently skip relevant verification and structural invalidity must fail closed.

Risk: a target E2E file can exist under a valid owner and have a valid project-applicability entry, yet be omitted by Playwright discovery because of `testMatch`/`testIgnore`/project drift. The affected planner can then silently omit that proof, including for a direct changed/added target spec, defeating the structural ownership contract.

Required final state: validate equality/completeness between the filesystem target E2E set and the union of Playwright-collected target inventory. A target file missing from Playwright inventory, an unexpected collected target, or a duplicate must make the E2E plan structurally invalid. Direct changed/added target specs must never be silently dropped when no inventory entry exists. Reuse the existing filesystem target discovery/validation; do not introduce another owner/spec registry.

Verification: deterministic unit proof must cover a filesystem target missing from Playwright inventory, an unexpected/duplicate collected target, a complete matching inventory, and direct changed/added target behavior when discovery is incomplete. Run a real focused E2E plan through the containerized inventory after correction to prove the current repository inventory is complete.

## Major issues

None.

## Minor issues

### M1 — owner-inventory comments reference a non-existent collector filename

Owner: `scripts/lib/e2eOwnerInventory.ts` / `scripts/lib/e2eOwnerInventoryReporter.mjs`

Problem: comments still say the reporter/validation path is invoked through `scripts/lib/e2eOwnerInventoryCollector.mjs`, while the current synchronous adapter is `e2eOwnerInventoryCollector.ts` and the container child is `e2eOwnerInventoryContainer.mjs`.

Evidence:

- [`lib/e2eOwnerInventory.ts`](lib/e2eOwnerInventory.ts) — module comment references `e2eOwnerInventoryCollector.mjs`.
- [`lib/e2eOwnerInventoryReporter.mjs`](lib/e2eOwnerInventoryReporter.mjs) — reporter comment references `e2eOwnerInventoryCollector.mjs`.

Basis:

- [`../AGENTS.md`](../AGENTS.md) — touched code and comments must remain explicit and accurate; obsolete replaced paths should be removed rather than retained as misleading compatibility descriptions.

Risk: maintainers are directed to a file that does not exist, obscuring the actual containerized metadata execution boundary.

Required final state: comments describe the current `.ts` synchronous adapter and/or `e2eOwnerInventoryContainer.mjs` child accurately, with no obsolete filename.

Verification: static/lint checks for the touched files; no behavior change required.

## Accepted risks

None.

## Items not required

- The pre-existing missing `src/shared/lib/md/container-with-states.css` import is not a Pass D product-code correction. The current graph adapter may ignore an unambiguously non-code unresolved asset edge because it cannot carry TypeScript/Vue reverse-owner reachability; unresolved code or ambiguous imports must continue to fail closed.

## Unresolved questions

None.
