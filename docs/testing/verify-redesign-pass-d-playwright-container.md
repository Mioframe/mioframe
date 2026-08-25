# Verify redesign — Pass D Playwright container amendment

- **Status:** Normative Pass D amendment
- **Applies to:** `docs/testing/verify-redesign-pass-d-implementation.md`
- **Reason:** make the repository's existing Playwright container execution and local verify single-run coordination contracts explicit for Pass D

## Playwright container decision

Every invocation of the Playwright CLI during verification, proof execution, discovery, or ownership-metadata collection must run through the repository's existing container execution boundary.

Do not invoke Playwright directly on the host with `playwright`, `npx playwright`, `pnpm exec playwright`, or an equivalent host process.

This applies to:

- ordinary application E2E;
- production-artifact/release E2E;
- behavior;
- visual;
- browser-integration;
- Playwright `--list` / collected-suite / reporter-based metadata inventory used for `_mioframe-owner` annotations.

Metadata collection must still avoid launching browsers. The Playwright list/reporter process itself runs inside the same controlled container environment, but uses collection/list mode only.

## Existing execution owners

Preserve the established wrappers/infrastructure rather than introducing another container mechanism:

- ordinary E2E -> `scripts/e2eContainer.mjs` -> `runPlaywrightInContainer`;
- release/production-artifact E2E and managed-update browser integration -> `scripts/e2eReleaseContainer.mjs` -> existing release container path;
- Storybook behavior -> existing Storybook behavior wrapper -> `runPlaywrightInContainer`;
- visual -> existing visual wrapper/container path;
- new generic browser integration -> `scripts/browserIntegration.mjs` -> `runPlaywrightInContainer`.

The Pass D Playwright ownership-inventory helper must reuse this same container boundary. It may add a narrow metadata/list invocation mode to an existing concrete Playwright container wrapper/helper when necessary, but must not create a parallel generic execution framework.

If metadata needs to be returned to the verifier process, use deterministic stdout or a narrow workspace-mounted temporary result produced by the container process. Do not execute Playwright on the host as a shortcut.

## Local verify single-run invariant

Preserve the current local machine-lock contract owned by `scripts/lib/commandLock.ts`, `scripts/lib/localCommandGuard.ts`, and the top-level `scripts/verify.ts` entrypoint.

Required behavior remains:

- a local top-level `pnpm verify` acquires the `verify` machine lock through `withVerifyCommandLock`;
- a second independent local `pnpm verify` fails fast while that lock is active;
- standalone expensive verification commands, including Playwright container wrappers, do not start while an independent top-level `pnpm verify` owns the machine lock;
- child commands started by the owning `pnpm verify` inherit the existing `MIOFRAME_MACHINE_LOCK_HELD` / `MIOFRAME_VERIFY_LOCK_HELD` context and therefore do not deadlock by attempting to reacquire their parent's lock;
- the heartbeat, stale-lock recovery, owner-token release protection, persisted verify invocation, active-command metadata, status/resume diagnostics, and current GitHub Actions exception remain unchanged.

Pass D must not replace, duplicate, narrow, or bypass this coordination mechanism.

New Pass D execution paths — including `browser-integration-local` and Playwright metadata/list collection — must participate as children of the existing verify execution/lock context when invoked by `pnpm verify`. Standalone wrappers must continue to use the existing guarded-expensive-command path so they are blocked by an independently running local verify.

Do not implement nested `pnpm verify` calls to perform E2E inventory, metadata collection, graph planning, or browser proof. Those operations are child work owned by the already-running verify process.

## Non-Playwright exceptions

These do not require a Playwright container because they do not execute the Playwright CLI/runtime:

- importing Playwright config objects in Vitest/Node structural tests;
- pure unit tests of owner parsing, applicability, graph traversal, routing, and inventory-result validation;
- dependency-cruiser execution;
- ordinary static/type/lint checks.

They still run under the existing top-level verify coordination when invoked by `pnpm verify`; they do not create another verify process.

## Acceptance

Pass D is not complete if:

- any verification/runtime code path directly executes the Playwright CLI on the host;
- a second independent local `pnpm verify` can run concurrently with an active local verify;
- a new standalone Pass D expensive/Playwright wrapper can bypass an active local verify;
- a child of the active verify deadlocks by reacquiring the parent's machine lock;
- Pass D changes the existing lock/stale/heartbeat/status-resume semantics without a separate architecture decision.

Repository search and focused tests must prove that all new Pass D Playwright execution and metadata collection flows through the controlled container boundary and preserves the existing machine-lock coordination.

At minimum keep the existing command-lock/local-command-guard proof green. Add only narrow tests needed to prove a new wrapper or metadata path participates in the existing mechanism; do not redesign the lock tests.

## Forbidden

- direct host `playwright test`;
- direct host `playwright --list` or equivalent list-mode metadata collection;
- host browser installation as a Pass D requirement;
- a second Docker/Podman/Playwright runner abstraction alongside `runPlaywrightInContainer` and the existing release container path;
- a second verify lock or new lock manager;
- bypassing `withVerifyCommandLock`, `runGuardedExpensiveLocalCommand`, or inherited verify-lock env for new Pass D execution paths;
- nested `pnpm verify` used as an implementation shortcut;
- weakening existing container profile, browser-version, user namespace, timeout, locking, stale recovery, heartbeat, or failure semantics.
