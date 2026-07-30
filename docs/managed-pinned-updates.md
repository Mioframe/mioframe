# Managed pinned application updates

This document is the canonical product and architecture contract for managed application-release updates. The general publication and release process remains documented in [`docs/release.md`](./release.md); any older managed-update wording there is superseded by this focused contract.

## Scope

Managed pinning applies only to the stable deployment (`/`) and the develop deployment (`/branch/develop/`). Arbitrary manually deployed branches keep the generated Workbox worker. PR previews do not register a service worker.

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

The persisted controller state is the source of truth and contains the update mode, active release, optional latest release, mutually exclusive approval or activation, optional failed release, and the last successful check time.

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

## Boot commit and rollback

Starting activation does not change `activeRelease`. The new release becomes active only after the initial router navigation succeeds, the Vue app mounts, the first render completes, and the worker durably commits `BOOT_OK`.

On `BOOT_FAILED`, the worker durably removes the activation, preserves the previous active release, records the failed target, and then reloads same-channel windows. Rollback persistence failure does not start a reload loop.

Automatic mode does not reapprove the exact failed release. In Manual mode the App updates pane shows **Retry update**, which uses the existing install-on-next-launch operation. A successful retry clears the failure. The ordinary “Mioframe update available” Snackbar is suppressed while the latest release is the recorded failed release.

## User-facing state

The dedicated App updates pane owns presentation and user actions. It shows:

- current and latest application versions;
- update mode;
- last successful check time;
- checking, available, ready, activation, failure, and unavailable states;
- Manual install, retry, and cancellation actions when applicable.

Manual discovery of a genuinely new release may show a temporary actionable Snackbar that opens the App updates pane. The notification is deduplicated per release for the current session and dismisses after seven seconds.

## Release identity and preparation

`updates/latest.json` points to an immutable release descriptor. The descriptor is validated before its release summary reaches persisted state or UI.

Each release owns one immutable Cache Storage cache. Preparation validates and stores the archived index and every content-hashed file, then writes the descriptor marker last. Invalid, malformed, or unreadable descriptor markers are treated as unavailable and enter the existing exact-release restoration path rather than failing the fetch handler.

Selected content is restored only from its exact immutable release. The worker never silently substitutes the live deployment or another release.

## State invariants

- `activeRelease` changes only on a matching successful boot commit.
- approval and activation are mutually exclusive;
- an approved release must be strictly newer than the active release;
- Automatic approval never targets the recorded failed release;
- Manual approval requires Manual mode but may explicitly retry a failed newer release;
- cancellation belongs only to Manual mode;
- same-sequence, different-release identity metadata fails closed and is not recorded as a successful check;
- preparation results are revalidated against current state before approval.

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

## Verification ownership

The `managed-updates` verification label owns focused browser proof for fresh install, Automatic and Manual lifecycle, preparation recovery, controller upgrade, legacy Workbox migration, cancellation, rollback and Manual retry, stable/develop isolation, uncontrolled-window blocking, exact-release restoration, and close-and-reopen activation.

The complete release-relevant change still requires the repository’s final `pnpm verify:release` gate in a working container environment. Green focused or GitHub checks supplement but do not replace that required local completion report.
