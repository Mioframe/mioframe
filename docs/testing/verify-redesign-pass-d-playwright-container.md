# Verify redesign — Pass D Playwright container amendment

- **Status:** Normative Pass D amendment
- **Applies to:** `docs/testing/verify-redesign-pass-d-implementation.md`
- **Reason:** make the repository's existing Playwright container execution contract explicit for every Pass D Playwright invocation, including metadata/list collection

## Decision

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

## Non-Playwright exceptions

These do not require a Playwright container because they do not execute the Playwright CLI/runtime:

- importing Playwright config objects in Vitest/Node structural tests;
- pure unit tests of owner parsing, applicability, graph traversal, routing, and inventory-result validation;
- dependency-cruiser execution;
- ordinary static/type/lint checks.

## Acceptance

Pass D is not complete if any verification/runtime code path directly executes the Playwright CLI on the host.

Repository search and focused tests must prove that all new Pass D Playwright execution and metadata collection flows through the controlled container boundary.

## Forbidden

- direct host `playwright test`;
- direct host `playwright --list` or equivalent list-mode metadata collection;
- host browser installation as a Pass D requirement;
- a second Docker/Podman/Playwright runner abstraction alongside `runPlaywrightInContainer` and the existing release container path;
- weakening existing container profile, browser-version, user namespace, timeout, locking, or failure semantics to simplify metadata collection.
