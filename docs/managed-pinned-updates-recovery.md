# Managed update state recovery — architecture handoff

This is a normative extension to `docs/managed-pinned-updates.md` for PR 169. It supersedes only the existing clauses that leave an active managed channel permanently on a plain controlled `503` when controller state is absent, invalid, or unreadable. All other managed-update contracts remain unchanged.

## Goal

When the active managed worker cannot safely determine `activeRelease`, keep release selection fail-closed, explain the classified problem in a worker-owned recovery page, and let the user explicitly install the exact validated latest published release without deleting product data.

## Confirmed current behavior

- `controllerState` is the sole lifecycle source of truth.
- An absent or invalid record cannot identify the selected release.
- An IndexedDB read may also fail before a state classification is available.
- Current owned navigation returns a controlled `503`; a managed predecessor with absent state rejects silent re-bootstrap.
- Exact release preparation already validates descriptor identity, archived index, every listed file, sizes, and SHA-256 before a release becomes usable.

## Non-goals

- automatic recovery or silent installation of latest;
- guessing the active release from remaining Cache Storage entries;
- offline recovery without an authoritative controller state;
- a second persisted active-release pointer or recovery journal;
- rollback to Workbox;
- resetting origin storage, product settings, OPFS, Spaces, documents, or external storage;
- streaming progress protocol, generic recovery manager, retries, polling, or backoff;
- recovery for unrelated application-runtime failures or an ordinary valid selected release that is temporarily unavailable.

## Affected user scenarios

### State record is absent

The active managed worker serves a recovery page with code `UPDATE_STATE_ABSENT`. It does not choose a cached or published release until the user selects **Install latest version**.

### State record is invalid

The worker serves the same recovery page with code `UPDATE_STATE_INVALID`. It may state that the persisted record does not match the supported schema, but must not expose the raw record.

### Update storage cannot be read

The worker serves the recovery page with code `UPDATE_STORAGE_UNAVAILABLE`. **Retry** reloads and reclassifies the problem. **Install latest version** must first confirm the controller store is readable; if it remains unavailable, recovery stops before network or cache preparation.

### Recovery succeeds

The exact release referenced by `latest.json` at recovery start is fully validated and prepared. A short serialized finalization re-reads controller state:

- `valid` → preserve it and treat recovery as already completed by another window;
- `absent` or `invalid` → write a new initial state with the prepared release as `activeRelease`, no candidate, and `mode = automatic`;
- storage read/write failure → keep the recovery page and report a stable failure.

The page reloads only after valid state is durably present.

### Recovery cannot download or validate latest

The page remains available and reports a stable safe error such as network unavailable, latest metadata unavailable, invalid published metadata, integrity failure, Cache Storage failure, or controller-state write failure. No partial state is selected.

## Boundaries

Changes are limited to managed stable/develop worker recovery, its private same-channel protocol, recovery-page rendering, controller-state recovery finalization, and risk-specific tests.

Do not change:

- one-active/one-candidate state shape;
- candidate phases or activation semantics;
- Automatic/Manual behavior for valid state;
- publisher allocation and archive rules;
- `PreparationCoordinator` ownership;
- channel isolation;
- Workbox/manual-branch or PR-preview behavior;
- user-data storage.

## Ownership

| Owner | Responsibility |
| --- | --- |
| Controller-state service | classify `absent`, `invalid`, and storage read/write failure; perform the final serialized recovery write |
| Controller worker | serve recovery HTML, authorize same-channel recovery requests, orchestrate exact latest preparation, return stable recovery outcomes |
| `PreparationCoordinator` | deduplicate exact release preparation and arbitrate cleanup only |
| Recovery page | present safe diagnostics, copy diagnostic details, invoke Retry or explicit Install latest, show bounded busy/error state |
| Product application | no ownership; it may be unable to boot |

No entity, feature, widget, page, or Material component owns this flow because recovery must work without application JavaScript or application assets.

## Source of truth

- Before recovery: no application release is trusted when controller state is absent, invalid, or unreadable.
- Recovery target: the exact descriptor referenced by a validated `latest.json` fetched after explicit user action.
- Prepared bytes: the existing marker-last exact release cache.
- After recovery: the newly written valid controller state is again the sole lifecycle source of truth.

A newer release published while recovery is downloading does not invalidate the already selected exact descriptor. Normal reconciliation may discover that newer release after reload.

## Recovery page

The response is generated entirely by the active worker:

- self-contained HTML, CSS, and JavaScript;
- no Vue application or external assets;
- `Content-Type: text/html` and `Cache-Control: no-store`;
- accessible heading, status region, buttons, keyboard operation, and visible focus;
- safe at narrow mobile widths;
- returned with controlled `503` while recovery is required.

Required user-facing content:

- Mioframe cannot safely determine the installed application version;
- the classified reason;
- recovery installs the latest published application version;
- recovery resets update mode to Automatic because the previous mode is not trusted;
- recovery does not delete Mioframe user data;
- when offline or metadata is unavailable, an internet connection is required.

Required actions:

- **Install latest version**;
- **Retry**;
- **Copy diagnostic details**.

Safe diagnostic fields:

- stable problem code;
- managed channel;
- controller database name;
- current release: `unknown`;
- recovery action;
- timestamp;
- safe browser error name for storage failure, when available.

Forbidden diagnostic content:

- raw persisted state;
- document or Space content;
- local paths, access tokens, external-storage credentials, or sensitive URLs;
- stack traces or arbitrary exception messages.

## Public entry points and protocol

Add one private same-channel worker command owned by the recovery page:

```ts
type RecoverInstallLatestRequest = {
  protocolVersion: 1;
  type: 'RECOVER_INSTALL_LATEST';
};
```

The response must use stable result codes rather than raw exception messages. At minimum it distinguishes:

- success;
- controller storage unavailable;
- network/latest metadata unavailable;
- invalid latest release metadata;
- release integrity or preparation failure;
- controller-state persistence failure.

The existing same-channel window validation and protocol-version validation apply. The command is unavailable to foreign-channel clients.

`Retry` is an ordinary navigation reload, not a mutation command.

## Recovery algorithm

```text
owned top-level navigation
→ read controller state
→ valid: normal managed serving
→ absent/invalid/storage read failure: self-contained recovery page

explicit RECOVER_INSTALL_LATEST
→ confirm controller store can be read
→ if valid state now exists: success, preserve it
→ fetch and validate latest.json
→ fetch and validate its exact descriptor
→ fully prepare exact release through PreparationCoordinator
→ enter short OperationQueue finalization
→ re-read controller state
→ valid: preserve it
→ absent/invalid: write initial Automatic state for the prepared release
→ storage failure: fail without selecting a release
→ post stable result
→ on success reload recovery page
```

Preparation, network, hashing, and Cache Storage work remain outside `OperationQueue`. Only the final re-read/decision/write is serialized.

The invalid record is not deleted before successful release preparation. Recovery never leaves an intermediate empty or partially initialized state.

Concurrent recovery requests require no new persisted coordination. They may prepare the same exact release through existing deduplication; the first successful finalization writes valid state, and later finalizations preserve it.

## Minimum sufficient design

The required new concepts are:

1. three classified recovery reasons;
2. one self-contained worker recovery page;
3. one explicit private recovery command;
4. one serialized absent/invalid-to-valid finalization.

No second source of truth, cached-release inference, recovery state machine, progress stream, scheduler, or generic manager is required.

## Rejected approaches

### Automatically install latest

Rejected because it silently overrides a potentially Manual-pinned release and turns state loss into an uncontrolled update.

### Select a remaining cache

Rejected because cache presence does not prove which release was last committed active, and cache eviction may leave incomplete or stale releases.

### Keep permanent plain `503`

Rejected because a recoverable updater failure can make the local-first application indefinitely unusable without explanation or in-product recovery.

### Add a second persisted active-release pointer

Rejected for this PR because it introduces write ordering, divergence, migration, and compatibility rules solely for offline state-loss recovery.

### Clear site data

Rejected because updater recovery must never destroy or reset product data.

## Acceptance matrix

| Condition | Required result |
| --- | --- |
| Valid controller state | Existing normal managed-update behavior |
| Absent state under active managed worker | Recovery page with `UPDATE_STATE_ABSENT` |
| Invalid state | Recovery page with `UPDATE_STATE_INVALID` |
| IndexedDB read failure | Recovery page with `UPDATE_STORAGE_UNAVAILABLE` |
| Retry after transient storage recovery | Normal app or correctly reclassified recovery page |
| Install latest without readable controller store | Stable failure; no download or state change |
| Valid latest and preparation | Durable initial Automatic state, then reload |
| Another window recovers first | Preserve its valid state; return success |
| Network/metadata/integrity/cache failure | Detailed stable failure; no selected partial release |
| State write failure after preparation | Recovery page remains; prepared cache may be cleaned later |
| Offline recovery | Explain that internet is required; do not infer a cached release |
| Foreign-channel request | No response or mutation under existing protocol isolation |

## Risk matrix

| Risk | Mitigation |
| --- | --- |
| Silent release replacement | explicit user action and visible Automatic-mode reset |
| Partial recovery state | prepare fully before serialized state write |
| Concurrent recovery overwrite | final re-read preserves any valid state |
| Sensitive diagnostic leakage | stable allowlisted fields only |
| Recovery depends on broken app | worker-owned self-contained page |
| Long operation blocks navigation/state | network/cache work outside `OperationQueue` |
| Recovery deletes user data | updater-only ownership and explicit forbidden boundary |

## Required proof

Primary proof owners:

- unit tests for state classification, recovery finalization, concurrency, exact target preservation, and stable result mapping;
- worker fetch/message tests for response type, same-channel authorization, ordering, and no raw errors;
- browser proof using a real managed worker for absent state, invalid state, storage failure where feasible, successful explicit recovery, offline failure, and preserved product storage;
- accessibility/browser behavior proof for heading, status announcements, button operation, focus, diagnostic disclosure/copy, and mobile layout;
- release proof that the recovery page is self-contained and the managed worker contains the recovery contract.

Required ordering proof:

```text
prepare exact release completely
→ final serialized re-read
→ durable valid state
→ recovery response
→ reload
```

No test may clear all origin data to simulate recovery success; product data must remain present and readable after the recovered application boots.

## Required verification

After implementation and focused checks, run on one unchanged workspace:

```text
pnpm verify --full --only managed-updates
pnpm verify:release
```

The exact resulting head also requires the ordinary GitHub workflow and operator UI/accessibility acceptance of the recovery page.

## Forbidden

- silent or automatic recovery;
- selecting a release from cache enumeration;
- writing state before complete exact release preparation;
- deleting the invalid record before successful finalization;
- clearing origin data, OPFS, Spaces, documents, product settings, or external-storage configuration;
- raw state, raw exception messages, stack traces, tokens, paths, or document data in diagnostics;
- network/cache work inside `OperationQueue`;
- new persisted recovery state, second active pointer, polling, retry counters, backoff, scheduler, manager, registry, or generic RPC;
- changing valid-state update, activation, rollback, publisher, or channel behavior.

## Implementation readiness

Required product and architecture decisions are resolved.

Unresolved architecture blockers: none.

Verdict: **ready for implementation; PR 169 is not implementation-complete until this recovery flow and its required proof are present.**
