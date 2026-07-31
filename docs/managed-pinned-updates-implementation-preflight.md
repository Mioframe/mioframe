# Managed pinned application updates — implementation preflight

**Status: ready for one consolidated implementation task.**

## 0. Authoring source

- Ready architecture handoff: [`docs/managed-pinned-updates.md`](./managed-pinned-updates.md).
- Current PR implementation is a source of reusable mechanisms and tests, not a compatibility contract.
- The feature has not been deployed; old PR-internal descriptor, state, snapshot, and protocol payload shapes must be removed rather than migrated.

## 1. Owner map

- **Publication source of truth:** `scripts/pages/lib/releaseDescriptor.mjs` and `releasePublish.mjs`; stable/develop entry points remain `publishStable.mjs` and `publishBranch.mjs`.
- **Persisted lifecycle source of truth:** `src/shared/service/appUpdate/contracts.ts`, `controllerState.ts`, and pure transitions in `stateTransitions.ts`.
- **Runtime lifecycle owner:** service-worker modules under `src/shared/service/appUpdate/**` plus `src/sw.ts`.
- **User actions:** existing feature APIs for check, mode change, install-on-next-launch, and cancellation.
- **UI read owner:** `src/entities/appUpdate/**`; composition remains `AppUpdateSettings` and `AppUpdatesPane`.
- **Failure/recovery owner:** worker state transitions, exact-release restoration, boot watchdog, commit/rollback handlers.
- **Verification owner:** colocated unit/component tests, `src/sw*.test.ts`, app navigation E2E, release E2E, and the existing `managed-updates` verify label.

## 2. Public entry points and compatibility

- Keep protocol request names and feature action entry points unchanged.
- Replace every release payload field with positive **safe-integer** `releaseNumber`; remove `releaseId` and `releaseSequence` completely from managed-update contracts, fixtures, watchdog payloads, cache names, and tests.
- Replace snapshot fields `latestRelease`, `scheduledRelease`, `activatingRelease`, and `failedRelease` with one optional discriminated `candidate`.
- Entity may expose phase-specific computed values for UI convenience, but they must derive from the single candidate and must not become a second state source.
- Preserve service-client capability behavior: malformed, absent, or stable failure responses resolve unavailable without exposing raw errors.
- No migration for superseded schema-v1 PR shapes; schema version `1` may be retained because no version has shipped.

## 3. Reuse

Preserve and adapt rather than replace:

- `OperationQueue`;
- `PreparationCoordinator`;
- descriptor/index/file hashing and marker-last cache commit;
- exact-release restoration;
- channel derivation and same-channel client filtering;
- clean-launch counting;
- watchdog injection and protocol parity proof;
- deferred response-before-follow-up contract;
- stable/develop Pages publication and release E2E fixtures;
- existing feature/widget/pane ownership.

Do not preserve old transition helpers, identity-conflict helpers, snapshot reconciliation, or tests whose only purpose is the removed multi-reference model.

## 4. Minimum sufficient design

- One `releaseNumber` is identity, ordering value, descriptor filename, archive directory, and cache suffix.
- `releaseNumber` validation uses `Number.isSafeInteger(value) && value > 0` in both Node publisher and runtime schemas.
- Persist only `activeRelease`, optional `candidate`, mode, and last successful check timestamp.
- Candidate is exactly one of `available | ready | activating | failed`.
- `SET_MODE` performs one short durable transition and never waits for preparation.
- Automatic preparation is a separate deferred worker transition validated against fresh mode, candidate number, and phase.
- Fetch ownership is decided in `src/sw.ts` before state/cache access: navigation and same-channel `assets/**` only.
- `ready` and `activating` are never superseded.
- Cleanup is triggered only when cache ownership can shrink.
- Expired-activation navigation durably changes `activating` to `failed`, serves the unchanged active release to the current navigation, and broadcasts rollback only to other same-channel windows; the current navigation client IDs are excluded because it already receives the active archived index.

The simpler alternative of patching old fields is rejected: it retains the duplicated release identity and invalid state combinations that caused the correction cycle.

## 5. Acceptance focus

The complete acceptance matrix remains in the handoff. Preflight-specific completion checks:

- no managed-update production contract retains `releaseId`, `releaseSequence`, `latestRelease`, `approvedRelease`, `activation.targetRelease`, or `failedActivationRelease`;
- no test or fixture asserts the removed model except an explicit negative/removal assertion;
- every durable transition returns the same state object for a no-op;
- every foreground durable change produces exactly one post-response invalidation;
- background preparation completion is a separate durable change and may produce its own later invalidation;
- non-release requests never read controller state, open release caches, or start restoration;
- publisher aborts corrupt/non-monotonic trees and unsafe next-number allocation before the first write;
- current selected and in-flight caches remain protected across every cleanup trigger;
- current navigation is not reloaded by expired-activation recovery broadcast.

## 6. Risk matrix

| Risk                                                  | Required control                                                                             |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Partial rewrite leaves two state models               | Replace contracts first, then remove all old-field consumers before integration verification |
| Publisher/runtime validator drift                     | Keep the existing shared fixture corpus and parity tests, rewritten for `releaseNumber`      |
| Unsafe numeric ordering                               | Positive safe-integer validation plus overflow rejection before publication writes           |
| Stale preparation mutates new user intent             | Fresh exact mode/number/phase checks inside the short queue transaction                      |
| Fetch handler re-enters metadata/API requests         | Route ownership in `src/sw.ts` before `respondWith` and before state read                    |
| Cleanup deletes selected or in-flight cache           | Protected set = active + candidate + coordinator in-flight numbers                           |
| Rollback reloads the recovering navigation            | Exclusion-aware rollback broadcast for expired-navigation recovery                           |
| Browser lifecycle regression                          | Preserve cross-engine close-all-and-reopen release E2E proof                                 |
| Rewrite hides obsolete tests instead of removing them | Review final test names/assertions against the new state machine, not only green execution   |

## 7. Breadth and implementation passes

### Pass 1 — publication identity

Rewrite release-number schema/allocation/layout first:

- `scripts/pages/lib/releaseDescriptor.mjs` and corpus/tests;
- `releasePublish.mjs` and tests;
- stable/develop publisher tests and artifact fixtures.

Focused proof must pass before runtime contracts are changed.

### Pass 2 — runtime contracts and pure state

Rewrite:

- `contracts.ts`, `controllerState.ts`, `stateTransitions.ts`, `snapshot.ts`, `protocol.ts`;
- their colocated tests;
- cache-name and descriptor consumers in `releaseCache.ts`, `releasePreparation.ts`, and `workerInstall.ts`.

Delete old identity and multi-reference helpers rather than adapting them.

### Pass 3 — worker orchestration and fetch lifecycle

Rewrite:

- `updateDiscovery.ts`, `workerMessages.ts`, `workerFetch.ts`, and `src/sw.ts`;
- corresponding unit and real-wiring tests;
- boot reporting/watchdog payloads and parity tests.

Preserve queue/coordinator modules unless a type-only release-number adaptation is required.

### Pass 4 — client, entity, features, and UI

Adapt:

- `src/shared/serviceClient/appUpdate/**`;
- `src/entities/appUpdate/**`;
- existing app-update feature tests;
- `AppUpdateSettings`, notification behavior, pane/navigation tests.

Feature action APIs remain stable; UI reads one candidate phase.

### Pass 5 — release fixtures and complete scenario proof

Rewrite existing managed-release fixtures/spec assertions in place. Do not create parallel “v2” specs when the existing scenario owner can be updated. Remove obsolete old-model scenarios and retain every user/browser outcome from the handoff.

## 8. TEST IMPACT

**Changed contracts:** publication identity/layout, retained-tree validation, persisted state, transitions, private protocol payloads, snapshot/entity read model, Automatic orchestration, fetch ownership, cache protection, boot/rollback payload identity.

**Risks:** release corruption, stale multi-window completion, invalid-state fail-open, cache deletion race, protocol drift, browser activation/rollback regression, cross-channel leakage.

**Proof owners:**

- deterministic publisher/runtime/state/protocol/cache tests;
- component-contract tests for candidate-phase actions and copy;
- `src/sw.test.ts` and `src/sw.rollbackOrdering.test.ts` for real wiring;
- `tests/e2e/appUpdatesNavigation.spec.ts` for application navigation/composition;
- existing `tests/e2e/release/managedUpdates*.spec.ts` files for production artifact and browser lifecycle;
- existing watchdog parity and fixture corpus tests.

**Existing proof to rewrite, not duplicate:**

- `scripts/pages/lib/releaseDescriptor.test.mjs`;
- `scripts/pages/lib/releasePublish.test.mjs`;
- `scripts/pages/publishStable.test.mjs` and `publishBranch.test.mjs`;
- `src/shared/service/appUpdate/{contracts,controllerState,stateTransitions,snapshot,protocol,releaseCache,releasePreparation,workerInstall,workerFetch,workerMessages,updateDiscovery}.test.ts`;
- `src/shared/service/appUpdate/activationDiscoveryOrchestration.test.ts` and `cleanLaunch.test.ts`;
- `src/shared/serviceClient/appUpdate/{client,bootReport}.test.ts`;
- entity/feature/widget app-update tests;
- managed-update release fixtures and eight specs already listed by the `managed-updates` verify label.

**New or materially changed proof:**

- safe-integer/overflow and monotonic retained-tree publication cases;
- complete single-candidate transition table;
- available replacement versus ready/activating pinning;
- Manual-failed versus Automatic-failed discovery policy;
- short `SET_MODE` plus deferred Automatic preparation ordering;
- stale number/phase/mode completion matrix;
- valid-state non-release request with empty cache never starts restoration;
- expired-navigation rollback excludes current navigation clients;
- protected-cache set for active/candidate/in-flight numbers.

**Repository impact metadata:**

- keep existing spec paths where possible, so `scripts/verify.mjs` managed-update list remains stable;
- keep the existing app-update entry in `scripts/lib/e2eRisk.mjs` unless production paths/spec ownership change;
- any renamed, removed, or added Playwright spec must update its owning registry/list in the same pass;
- confirm mutation selection still targets the rewritten `stateTransitions.ts`; do not add a second transition owner.

**Task-specific measurements:** none. No performance claim or benchmark infrastructure.

## 9. Verification

After each risky pass, run the smallest verify-managed focused proof for the changed files/contracts before continuing.

Before completion run:

```text
pnpm verify --full --only managed-updates
```

The single final completion gate for the complete rewritten PR is:

```text
pnpm verify:release
```

GitHub CI or standalone Playwright execution does not replace this gate.

## Implementation readiness

- Owners, boundaries, compatibility, pass order, test ownership, and verification are resolved.
- Required repository files and existing proof are available to the coding agent.
- GitHub metadata remains architect-owned; the coding agent changes repository files and runs local verification only.
- Unresolved blockers: none.
- Verdict: **ready**.
