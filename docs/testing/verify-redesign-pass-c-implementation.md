# Verify redesign — Pass C implementation contract

- **Status:** Implementation landed; architect review blocked by active WebKit proof finding
- **Scope:** Pass C only — owner-local behavior, visual, and browser-integration proof
- **Prerequisite:** Pass B architect-accepted

## Current correction boundary

Pass C implementation is present on `architecture/verify-redesign`. Architect review found no active behavior/visual ownership or baseline-migration finding, but Pass C is **not accepted** while [`src/shared/service/appUpdate/REVIEW.md`](../../src/shared/service/appUpdate/REVIEW.md) B1 remains open.

The only active correction is the required managed-update WebKit cross-engine lifecycle proof. The implementation feedback reported a flaky WebKit result; repository policy treats known flaky behavior as failed proof. The concrete failing assertion/root cause is not yet verified and must be established before changing behavior.

Pass D must not start until B1 is corrected, the complete Pass C scope is re-reviewed, and the architect closes the review artifact. Coding agents must not edit this document, the review artifact, `AGENTS.md`, or skills while performing the correction.

## Goal

Migrate the current behavior, visual, and browser-integration inventories to the accepted target suffixes and truthful owners without changing test meaning, product behavior, browser matrices, screenshot pixels, or managed-release execution semantics.

Pass A already made `*.behavior.spec.ts`, owner-local `*.visual.spec.ts`, and `*.browser-integration.spec.ts` discoverable and excluded them from unit/application TypeScript scopes. Reuse that foundation; do not add another compatibility mechanism.

## Non-goals

- Pass D application E2E ownership, dependency-cruiser, or `E2E_SCENARIO_SCOPES` removal.
- Pass E unit/mutation/performance final semantics.
- Pass F final CI/release alias cleanup.
- Story/fixture/product/runtime redesign.
- New generic registries, managers, runners, or DSLs.

## Behavior migration

Move current central Storybook behavior proof to these owners:

| Current | Target |
| --- | --- |
| `tests/e2e/storybook/routerHarness.spec.ts` | `.storybook/router/routerHarness.behavior.spec.ts` |
| `tests/e2e/storybook/focusIndicator.spec.ts` | `src/shared/ui/State/focusIndicator.behavior.spec.ts` |
| `tests/e2e/storybook/colorOwnership.spec.ts` | Snackbar-owned behavior under `src/shared/ui/Snackbar/` |
| `tests/e2e/storybook/overlayLifecycle.spec.ts` | Overlay-owned behavior under `src/shared/ui/Overlay/` |

Rename every remaining owner-local `src/**/*.browser.spec.ts` in place to `*.behavior.spec.ts`. Known examples include `LegacyButton.browser.spec.ts` and `MDIconButton.browser.spec.ts` under `src/shared/ui/Button/`.

If an owner already has the same target behavior contract, merge assertions rather than creating duplicate proof. If another legacy browser spec has ambiguous ownership/type, stop and report it instead of guessing.

After the last consumer moves, remove the central Storybook scenario registry/source mapping and legacy `*.browser.spec.ts` discovery from `scripts/lib/storybookBehaviorRisk.ts` and its config/tests. The private leaf label `storybook-behavior` may remain as an internal identifier.

## Visual inventory decisions

The central visual subtree contains mixed proof. Preserve every existing assertion exactly once and classify by contract.

- `tests/e2e/visual/fab-container.spec.ts` -> `src/shared/ui/Button/FabContainer.behavior.spec.ts` (geometry/reflow; not visual).
- `tests/e2e/visual/shared-ui/md-menu.spec.ts` -> `src/shared/ui/Menu/MDMenu.behavior.spec.ts` (focus lifecycle; not visual).
- `tests/e2e/visual/shared-ui/md-icon-button.spec.ts` -> split:
  - behavior/computed-style/geometry/DOM assertions -> the single owner-local `src/shared/ui/Button/MDIconButton.behavior.spec.ts`;
  - screenshot assertions -> `src/shared/ui/Button/MDIconButton.visual.spec.ts`.
- `tests/e2e/visual/shared-ui/md-list.spec.ts` -> owner-local visual spec under `src/shared/ui/Lists/` next to the existing MDList owner.
- `tests/e2e/visual/shared-ui/color-ownership.spec.ts` -> split by owner:
  - Snackbar screenshot -> owner-local visual spec under `src/shared/ui/Snackbar/`;
  - rich-tooltip screenshot -> owner-local visual spec under `src/shared/ui/Overlay/`.
- `tests/e2e/visual/shared-ui.spec.ts` -> split:
  - Card screenshot -> owner-local visual spec under `src/shared/ui/Card/`;
  - Card pointer-over/computed-shadow assertion -> owner-local behavior spec under `src/shared/ui/Card/`;
  - State success screenshot -> owner-local visual spec under `src/shared/ui/State/`.

Move existing screenshot baselines to the resulting owner-local snapshot locations. Do not regenerate/rebaseline pixels because paths changed.

`md-button-family.testUtils.ts` may move to the Button owner only if its remaining consumer set is Button-owned; keep helpers at the smallest truthful owner.

After all assertions are owner-local, remove ordinary central visual spec discovery and the central-visual fallback from `scripts/lib/visualRisk.ts` and its config/tests. No ordinary assertion spec may remain under `tests/e2e/visual/**`.

## Browser-integration migration

Move these runtime specs from `tests/e2e/release/` to `src/shared/service/appUpdate/`, keeping the basename and changing the suffix to `.browser-integration.spec.ts`:

- managedUpdatesAutomaticCheck
- managedUpdatesControllerUpgrade
- managedUpdatesCrossEngineLifecycle
- managedUpdatesDevelop
- managedUpdatesLifecycle
- managedUpdatesMigration
- managedUpdatesRecovery
- managedUpdatesRollbackDiagnostics
- managedUpdatesUncontrolledWindow
- managedUpdatesVueBootFailure
- productionArtifactSmoke

Do **not** move these release E2E specs in Pass C:

- `firstUserAndReturningUserSmoke.spec.ts`
- `managedReleaseDataCompatibility.spec.ts`
- `managedUpdatesActivationUi.spec.ts`

Their product ownership is Pass D.

### Execution semantics

Ownership moves do not imply a runner rewrite. `scripts/e2eReleaseContainer.mjs`, `playwright.release.config.ts`, and release fixtures/build helpers may remain internal execution infrastructure while browser-integration proof needs their built-artifact, fresh-container, and cross-engine semantics.

Mechanically update all code/config references to the moved browser-integration paths, including `scripts/release/managedUpdatesProof.mjs` and tests. Preserve:

- the three fresh browser-integration groups and order;
- Chromium applicability for ordinary managed-update runtime groups;
- Firefox/WebKit applicability for cross-engine lifecycle;
- existing release artifact/environment behavior;
- E2E group paths for the unmoved E2E specs.

Do not replace the managed-update suite with the generic Chromium-only browser-integration configuration if that weakens current proof.

Direct owner-local browser-integration spec changes must be recognized as `browser-integration` proof after the move. Reuse the existing managed-update browser-integration leaf/orchestration and add only the minimum path-based planning required for the owner-local inventory. Preserve at least the current fail-closed protection for `src/shared/service/appUpdate/**` production changes.

## Required removals at Pass C boundary

Before acceptance there must be no remaining consumer for:

- `src/**/*.browser.spec.ts`;
- ordinary `tests/e2e/storybook/*.spec.ts` behavior ownership;
- the central Storybook scenario registry/source mapping;
- ordinary `tests/e2e/visual/**/*.spec.ts` ownership/fallback;
- release-directory paths for specs now owned as browser-integration.

Do not remove release E2E infrastructure, root application E2E compatibility, `E2E_SCENARIO_SCOPES`, or `verify:release`.

## Acceptance

1. Every surviving ordinary behavior spec uses `*.behavior.spec.ts` at its truthful owner.
2. Every surviving visual assertion is owner-local `*.visual.spec.ts`; misplaced behavior assertions are behavior proof.
3. Mixed central files are split by the decisions above with no lost or duplicated assertions.
4. Existing visual baselines are moved, not regenerated.
5. Behavior and visual legacy central/suffix compatibility is removed after its inventory is empty.
6. All listed managed-update runtime specs are owner-local `*.browser-integration.spec.ts` under `src/shared/service/appUpdate/`.
7. Managed-update grouping, order, environment, and browser coverage remain equivalent.
8. Release E2E specs remain untouched for Pass D.
9. Direct moved/add/remove target specs remain deterministically discoverable and cannot silently bypass verification.
10. Vitest/application TypeScript still exclude the moved Playwright specs.
11. No Pass D/E/F work is pulled forward.
12. Required Firefox/WebKit cross-engine lifecycle proof is deterministic; a known flaky result is failed proof and blocks acceptance.

## Focused proof

Tooling tests must prove target-only behavior/visual discovery after compatibility removal, direct/add/remove/move handling, moved browser-integration path recognition, unchanged managed-update grouping/order, and target suffix exclusions.

Use focused verifier-managed feedback. Run representative moved `behavior`, `visual`, and browser-integration proof where needed to validate execution-path migration. For the active B1 correction, capture the concrete WebKit failure, correct its truthful root cause, and run the smallest faithful browser-integration proof that exercises the cross-engine lifecycle contract cleanly. Do not use retry-until-pass as acceptance evidence. Do not run `pnpm verify --full` merely for Pass C, and do not use screenshot update mode.

## Forbidden

- guessing ownership for an unexpected ambiguous spec;
- leaving parallel old/new behavior or visual ownership after migration;
- rebaselining screenshots because paths moved;
- weakening/deleting/duplicating assertions;
- accepting a flaky WebKit retry as proof without correcting the root cause;
- weakening browser applicability, assertions, lifecycle semantics, or timing requirements to make the cross-engine proof green;
- moving release/application E2E early;
- adding dependency-cruiser or changing `E2E_SCENARIO_SCOPES`;
- implementing Pass E semantics or Pass F cleanup;
- weakening managed-update browser/runtime coverage;
- changing product behavior, public UI APIs, locks, timeouts, or status/resume ownership unless the diagnosed B1 root cause is in the product/runtime contract itself and the correction is required to restore that existing contract;
- editing `docs/**`, `AGENTS.md`, `.agents/skills/**`, or review artifacts — those are architect-owned.