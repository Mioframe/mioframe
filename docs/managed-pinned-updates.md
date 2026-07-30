# Managed pinned application updates

This document is the canonical product and architecture contract for managed application-release updates. The general publication and release process remains documented in [`docs/release.md`](./release.md).

## Scope

Managed pinning applies only to the stable deployment (`/`) and the develop deployment (`/branch/develop/`). Arbitrary manually deployed branches keep the generated Workbox worker. PR previews do not register a service worker.

## Architecture status

The architecture is ready for implementation with the hardening decisions in this document. These decisions replace earlier assumptions that release identity, archived-index integrity, the UI/worker wire protocol, activation read state, and message-event follow-up work were already complete.

The solution remains deliberately small:

- no persisted operation status;
- no operation IDs or polling;
- no generic RPC framework;
- no protocol negotiation or version registry;
- no additional release manager or cache registry;
- no browser-specific reload logic;
- no user-data rollback or speculative data-format subsystem.

## Two independent lifecycles

The browser owns the lifecycle of the controller worker script (`sw.js`): installation, waiting, and activation. The managed controller worker owns the lifecycle of immutable Mioframe application releases.

The worker never calls `skipWaiting()` or `clients.claim()`. A controller-code replacement must preserve the selected application release and pending discovery state.

Application release state moves through:

```text
active release
→ prepared approval
→ clean-launch activation
→ boot commit or rollback
```

The persisted controller state remains the only source of truth for update mode and release lifecycle. Network fetch, hashing, and cache population remain outside short serialized state transitions. The existing `OperationQueue` and `PreparationCoordinator` remain the only orchestration mechanisms.

## Release identity

A release identity is the pair `{ releaseId, releaseSequence }` with a strict one-to-one invariant:

```text
one releaseId maps to exactly one releaseSequence
one releaseSequence maps to exactly one releaseId
```

Any conflict fails closed without changing persisted state or deleting a cache. The invariant must be enforced at every durable boundary:

- retained-release publication validation;
- discovery against every release reference in controller state;
- persisted controller-state parsing;
- release-cache preparation before an existing cache can be deleted or replaced.

`startActivation` does not accept an independent target. It derives the target only from `state.approvedRelease`, and is a no-op when no valid approval exists. This removes the possibility of activating a release different from the approved release.

The persisted-state schema also enforces:

- `approvedRelease` and `activation` never coexist;
- approved and activation targets are strictly newer than `activeRelease`;
- all release references obey the one-to-one identity invariant.

## Immutable release integrity

`updates/latest.json` points to an immutable release descriptor. The descriptor is validated before its release summary reaches persisted state or UI.

Every executable byte of a release is covered by descriptor integrity metadata. In addition to ordinary release files, the descriptor contains:

```text
indexUrl
indexSha256
indexByteSize
```

The publisher computes `indexSha256` and `indexByteSize` from the final archived `index.html` bytes after boot-watchdog injection. Runtime preparation verifies both fields before writing the index marker.

Each release owns one immutable Cache Storage cache addressed by `releaseId`. A valid committed cache is never rebuilt or deleted. An identity conflict must be rejected before any existing cache deletion. Invalid, malformed, or unreadable descriptor markers are treated as unavailable and enter exact-release restoration.

Selected content is restored only from its exact immutable release. The worker never substitutes the live deployment or another release.

## Versioned private protocol

The application, controller worker, and publisher-injected watchdog communicate through private protocol version 1:

```text
protocolVersion: 1
```

The version is present in requests, responses, acknowledgements, and broadcasts. TypeScript boundaries parse external data at runtime rather than casting `event.data`.

Protocol v1 evolves additively:

- existing fields and semantics do not change;
- new fields are optional for v1 consumers;
- incompatible changes require a new explicit protocol version and separate architecture decision.

No negotiation service, compatibility adapter registry, generic RPC abstraction, or request IDs are required. Each request already owns a dedicated `MessageChannel`.

The watchdog performs a small explicit runtime check of the v1 fields it consumes. Tests prove that a pinned v1 application and watchdog remain compatible with later additive v1 controller changes.

## Command execution and timeouts

Long-running update commands remain ordinary request/response operations owned by the worker. The service-worker `message` event keeps their work alive through `event.waitUntil()`.

The client must not apply the short transport timeout to commands that may download and hash a release:

- `CHECK_FOR_UPDATES`;
- `SET_MODE` when switching to Automatic;
- `INSTALL_ON_NEXT_LAUNCH`.

Fast local requests retain a bounded transport timeout. The UI continues to use existing local `isChecking` and `isPreparing` state while waiting for long commands. No persisted operation state, polling, progress protocol, or operation IDs are introduced.

After any foreground command durably changes snapshot-relevant state, the worker invalidates other same-channel UI readers. The initiating caller receives the resulting snapshot directly; other windows refresh through the existing state-changed broadcast.

## Event-lifetime follow-up work

A worker message handler returns the response plus optional follow-up work owned by the same message event:

```ts
interface WorkerMessageResult<Response> {
  response: Response;
  lifetimeWork?: Promise<void>;
}
```

The worker posts the response and keeps `lifetimeWork` inside the original `event.waitUntil()` promise. This follow-up work includes cache cleanup and required state-change or rollback broadcasts.

Cleanup remains best effort: its failure does not change an already durable lifecycle result. No durable cleanup scheduler or retry database is introduced.

## Modes

### Automatic

A successful discovery records the latest valid release. If it is newer than the active release, not already approved, not currently activating, and not the recorded failed release, the existing preparation coordinator prepares and approves it.

A temporary preparation failure does not require a newer publication to recover. A later successful check of the same latest release retries preparation. Automatic approvals cannot be cancelled while the mode remains Automatic.

### Manual

Discovery records newer releases without preparing them. The user may schedule the latest release through **Install on next launch**, cancel a scheduled Manual update before activation, or explicitly retry the latest release after a failed activation.

Manual installation commands are no-ops outside Manual mode at both orchestration and pure-transition boundaries.

## Applying an update

The portable user contract is:

```text
close every Mioframe window
→ reopen Mioframe
→ the scheduled release starts activation
```

The worker counts other controlled and uncontrolled same-channel windows. It excludes only the current navigation identities exposed by standard `FetchEvent.clientId` and `FetchEvent.resultingClientId`.

The system does not detect reloads and does not promise or forbid activation on a sole-window reload. Browser timing may differ. Closing every Mioframe window and reopening it is the only cross-browser guaranteed trigger and is the scenario verified in Chromium, Firefox, and WebKit.

Existing sessions are never force-updated when an update is approved.

## Activation read model

The UI-facing snapshot includes:

```ts
activatingRelease?: ReleaseSummary
```

It is derived directly from `state.activation?.targetRelease`; it is not new persisted state.

The entity exposes an `activating` status with priority over `ready`, `update-available`, and rollback-derived failure status. Update-available Snackbar notifications are suppressed while an activation exists.

After a durable `BOOT_OK` commit, the worker returns the acknowledgement and schedules a same-channel state invalidation under the same message-event lifetime. Existing UI readers therefore refresh from the committed active release instead of remaining on the pre-commit snapshot.

A browser-level UI test must cover clean launch through commit and prove that the activating state is shown without a false update-available Snackbar.

## Boot commit and rollback

Starting activation does not change `activeRelease`. The new release becomes active only after the initial router navigation succeeds, the Vue app mounts, the first render completes, and the worker durably commits `BOOT_OK`.

On `BOOT_FAILED`, the worker durably removes the activation, preserves the previous active release, records the failed target, and then reloads same-channel windows. Rollback persistence failure does not start a reload loop.

Automatic mode does not reapprove the exact failed release. In Manual mode the App updates pane shows **Retry update**, which uses the existing install-on-next-launch operation. A successful retry clears the failure. The ordinary “Mioframe update available” Snackbar is suppressed while the latest release is the recorded failed release.

## User-facing state

The dedicated App updates pane owns presentation and user actions. It shows:

- current and latest application versions;
- update mode;
- last successful check time;
- checking, preparing, available, ready, activating, failure, and unavailable states;
- Manual install, retry, and cancellation actions when applicable.

Manual discovery of a genuinely new release may show a temporary actionable Snackbar that opens the App updates pane. The notification is deduplicated per release for the current session and dismisses after seven seconds.

## Channel isolation

Stable and develop share one origin but use distinct IndexedDB databases, Cache Storage namespaces, path/origin checks, private-protocol authorization, window counts, and rollback broadcasts. A foreign channel cannot read or mutate another channel’s update state.

## Data compatibility contract

Application rollback is not user-data rollback. Managed releases never copy, restore, or revert Mioframe spaces, documents, Automerge history, or provider data.

Because Manual mode may pin an application release indefinitely, every release published while this contract is active must preserve backward-readable user data for all still-supported pinned releases. An irreversible data migration is forbidden unless a separate architecture is implemented first that defines and verifies:

- a durable data-format compatibility/version contract;
- detection of unsupported data by an older application;
- the required fail-closed behavior, such as blocking mutation, read-only access, or blocking open;
- migration and recovery behavior independent of application-release rollback.

This PR introduces no irreversible user-data migration, so it does not add speculative schema negotiation or read-only infrastructure.

## TEST IMPACT

Changed contracts:

- release identity validation and cache immutability;
- release descriptor schema v1 and archived-index integrity;
- private UI/worker/watchdog protocol v1;
- client timeout ownership for long commands;
- activation snapshot and UI status;
- message-event lifetime for cleanup and invalidation.

Primary proof owners:

- publisher, descriptor, state-schema, transition, cache, preparation, protocol, client, snapshot, entity, notification, and worker-message unit tests;
- managed-update browser tests for clean launch, activation UI, boot commit, rollback, retry, long preparation, controller upgrade, and cross-engine close-and-reopen;
- watchdog parity and pinned-v1 compatibility tests.

Repository impact metadata must continue selecting all managed-update release suites for these paths.

## Verification ownership

The `managed-updates` verification label owns focused browser proof for fresh install, Automatic and Manual lifecycle, preparation recovery, controller upgrade, legacy Workbox migration, cancellation, activation UI, rollback and Manual retry, stable/develop isolation, uncontrolled-window blocking, exact-release restoration, identity conflicts, archived-index integrity, protocol compatibility, and close-and-reopen activation.

The complete release-relevant change requires the repository’s final `pnpm verify:release` gate in a working container environment. Green focused or GitHub checks supplement but do not replace that required completion report.

## Forbidden complexity

This architecture does not permit adding any of the following without a new confirmed requirement and architecture decision:

- persisted operation status or history;
- operation IDs, progress polling, retry counters, or backoff;
- generic RPC or message-bus infrastructure;
- protocol negotiation, version registries, or adapter layers;
- a second release manager, cache registry, or state source;
- browser detection or reload classification;
- durable cleanup scheduling;
- user-data rollback or speculative data-format compatibility infrastructure.
