# Managed pinned updates Stage 6 — implementation preflight

**Status:** ready. The accepted Stage 1–5 controller, protocol, publication, reconciliation, activation, and broadcast contracts remain unchanged.

## Architecture handoff

- **Goal:** expose the managed-update lifecycle through the existing client, entity, action features, notification, and Settings pane without creating a second lifecycle source of truth or treating a transport timeout as capability loss.
- **Authoring source:** `docs/managed-pinned-updates.md`, `docs/managed-pinned-updates-implementation-preflight.md`, accepted Stage 1–5 owners, and the Stage 6 requirements.
- **Confirmed contract:** a valid v1 worker response contains a snapshot; the only worker failure envelope is `{ protocolVersion: 1, error: 'unavailable' }`; state-change broadcasts are invalidation-only and require a fresh `GET_SNAPSHOT`.
- **Non-goals:** Stage 7 proof expansion, worker/protocol/persisted-state/publication/activation/rollback changes, polling, request/action managers, Material component or global-style changes, and a new E2E spec.

| Owner                                      | Stage 6 responsibility                                                                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `shared/serviceClient/appUpdate/client.ts` | One `MessageChannel` request, validation, deadline, classified transport result, and state-change subscription.   |
| `entities/appUpdate`                       | Last valid snapshot, capability flag, stale-result token, stable read-model projection, and event-driven refresh. |
| Each `appUpdate*` action feature           | Its one action, finite busy ref, latest transport outcome, and result application.                                |
| `appUpdateNotify`                          | Session-local Manual available Snackbar eligibility only.                                                         |
| `AppUpdateSettings`                        | Action composition, local busy/timeout presentation, last-action selection, and disabled topology.                |
| `SettingsSections`                         | One concise stable entity status only.                                                                            |
| Existing worker owners                     | Persisted lifecycle, command semantics, broadcasts, and all activation protocol facts; unchanged.                 |

**Public contracts:** the client exports `AppUpdateClientResult<T>` and every command returns `Promise<AppUpdateClientResult<AppUpdateSnapshot>>`; the entity exposes projected `AppUpdateRelease`/`AppUpdateCandidate`, stable facts, `applyClientResult()`, and `refresh()` but not the raw snapshot or `deadlineAt`; each action exposes its existing action name, existing busy ref, and `outcome`.

**Minimum design:** one per-request timer and `MessagePort` cleanup in the client, one entity-local monotonically increasing token to reject an older refresh result, and named widget `computed` values for existing action topology. A request manager, queue, observable, polling timer, entity-owned busy state, or compatibility API adds concepts without satisfying an additional Stage 6 requirement and is rejected.

**Failure behavior:** success replaces the retained snapshot and restores capability; unavailable preserves it and disables mutations; timeout preserves both snapshot and current capability, clears only the invoking feature's busy state, and remains visible only as the latest widget action feedback. Late responses cannot mutate an already timed-out client request; older refreshes cannot overwrite a newer applied result.

## Action preservation

| Existing action                       | Existing entry/tier                          | Stage 6 entry/tier                          | Proof                                          |
| ------------------------------------- | -------------------------------------------- | ------------------------------------------- | ---------------------------------------------- |
| Check for updates                     | App updates pane, secondary list action      | unchanged                                   | widget unit and `appUpdatesNavigation.spec.ts` |
| Install on next launch / Retry update | Manual available/failed pane action, primary | unchanged                                   | widget unit                                    |
| Cancel scheduled update               | Manual ready pane list action                | unchanged                                   | widget unit                                    |
| Automatic updates                     | pane switch row                              | unchanged                                   | widget unit                                    |
| View update                           | Manual available Snackbar action             | injected app navigation callback, unchanged | notification unit                              |
| App updates navigation                | Settings entry to dedicated pane/back        | unchanged                                   | `appUpdatesNavigation.spec.ts`                 |

## Vue composition contract

- `AppUpdateSettings`: stable `<div class="app-update-settings">` root; no props, emits, slots, or `$attrs` forwarding; named computed values derive status, action visibility, disabled state, and only-the-latest action feedback; its named handlers delegate to feature actions; no DOM access; parent page owns visibility; app E2E covers pane reachability and activation refresh.
- `SettingsSections`: stable `<div class="settings-sections">` root; existing typed selection emits only; no new props, slots, `$attrs`, DOM access, or feature/action imports; one computed derives concise entity-only update text; parent composition owns visibility; app E2E covers the entry.

**Material impact:** none. Existing Material list, switch, button, and Snackbar surfaces retain their component choice, hierarchy, styling, and one injected `View` action. The checked Snackbar guidance supports one non-interruptive optional action; Stage 6 adds inline polite timeout feedback near the action rather than a new Material component contract.

## TEST IMPACT

**Changed contracts:** classified client outcomes and deadlines; snapshot/capability preservation and stale refresh rejection; feature busy/outcome ownership; entity-only stable display mapping; Manual notification capability eligibility; widget timeout/action matrix and Settings isolation.

**Risks:** timer/port leakage, late-response mutation, 10-second versus 120-second regression, unavailable/timeout conflation, stale refresh overwrite, raw activation deadline leakage, busy state never clearing, stale action timeout feedback, false notification while unavailable, and action discoverability regression.

**Proof owners:** deterministic client/entity/feature/notification behavior in the listed colocated unit tests; Vue composition wiring in `AppUpdateSettings.test.ts` and `SettingsSections.test.ts`; complete product behavior in the two existing specified E2E files; focused mutation audit for `client.ts` and `useAppUpdate.ts` after unit proof.

**Existing proof:** the Stage 1–5 service, worker, protocol, state transition, reconciliation, and activation suites remain authoritative and are not changed. Existing app-update and activation E2E specs are extended in place only if their current assertions need the new observable contract.

**New or changed tests:** `client.test.ts`, `useAppUpdate.test.ts`, `appUpdatesDisplayStatus.test.ts`, each four action test, `useAppUpdateNotify.test.ts`, `AppUpdateSettings.test.ts`, `SettingsSections.test.ts`, and the two named existing E2E specs.

**Repository impact metadata updates:** none expected. No Playwright spec is added, moved, renamed, or removed; current `src/widgets/AppUpdateSettings/`, `src/widgets/SettingsSections/`, and `src/entities/appUpdate/` mapping already owns `appUpdatesNavigation.spec.ts`; shared service-client changes use the existing broad E2E fallback and the explicitly required focused command.

**Task-specific measurements:** none; finite request deadlines are deterministic fake-clock contracts, not performance claims.

## Verification

Run `pnpm verify:status` before each expensive phase. Then run the required focused format, oxlint, eslint, type-check, unit, mutation, and E2E commands from the Stage 6 task. The one read-only completion gate is `pnpm verify:release`; do not run a second ordinary final gate.

**Implementation readiness:** ready. Ownership, public API replacement, failure semantics, action preservation, Vue contracts, proof owners, and final gate are resolved.
