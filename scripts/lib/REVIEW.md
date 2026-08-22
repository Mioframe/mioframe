# Review

Verdict: blocked

## Scope reviewed

- PR #216 release-impact planning and execution ownership against the current release/build implementation, release Playwright corpus, and accepted verifier target architecture.
- Current `releaseRisk.ts`, production Vite/PWA build inputs, release proof grouping, and fail-closed validation behavior.

## Blockers

### B1 — Release-impact ownership is not closed over the actual release-sensitive population

Owner: `scripts/lib/releaseRisk.ts` plus the release-spec execution inventory shared with real runners.

Problem: the release-impact planner can silently return `skip` for current production PWA/build inputs that the accepted architecture explicitly requires it to own. `vite.config.ts` imports and executes `config/plugins/pwa.ts` for production release builds, but the current planner has no exact or bounded production-config relation for that file.

The same implementation does not close release Playwright ownership over actual execution:

- a new unrecognized `tests/e2e/release/**/*.spec.ts` can fall through to `skip`;
- a new `managedUpdates*.spec.ts` is classified as `managed-updates` from its filename even though `managedUpdatesProof.mjs` executes only fixed spec arrays;
- artifact/release-smoke spec paths are duplicated between runner command literals and planner mappings;
- exact-mapping validation does not reject a check value outside `RELEASE_IMPACT_CHECKS`.

Evidence:

- [`../../docs/testing/verify-target-architecture.md`](../../docs/testing/verify-target-architecture.md) requires production PWA/build configuration actually consumed by `vite.config.ts`, fail-closed unknown significant release ownership, unknown-check validation, and no silently missed required proof.
- [`../../vite.config.ts`](../../vite.config.ts) consumes `config/plugins`, `config/alias.ts`, `config/tooling.json`, and related production-build support.
- [`../../config/plugins/pwa.ts`](../../config/plugins/pwa.ts) owns production manifest, Workbox/cache isolation, managed worker selection, `injectManifest`/`generateSW`, and service-worker artifact semantics.
- [`releaseRisk.ts`](./releaseRisk.ts) currently has no bounded production-Vite support relation, uses a `managedUpdates*.spec.ts` filename heuristic, and does not validate check identity.
- [`../release/managedUpdatesProof.mjs`](../release/managedUpdatesProof.mjs) executes four fixed spec groups.
- [`../verify.ts`](../verify.ts) separately hard-codes artifact and release-smoke spec arguments.
- [`../../playwright.config.ts`](../../playwright.config.ts) builds application E2E with `VITE_DISABLE_PWA=1`, so app E2E cannot substitute for production PWA release proof.

Risk: production artifact/update changes can bypass `verification-release`, and release-spec files can be falsely reported as owned or silently remain unexecuted. This violates the verifier's fail-closed contract.

Required final state is resolved in [`../../docs/testing/verify-release-impact-correction.md`](../../docs/testing/verify-release-impact-correction.md). Do not patch this finding with additional filename/path examples. The repeated-correction stop rule has already been triggered.

## Major issues

None.

## Minor issues

None in this owner. The separate verifier-output minor findings remain in `scripts/REVIEW.md` and are intentionally out of scope for this correction.

## Accepted risks

None.

## Items not required

- No generic dependency graph/test registry.
- No new release check or CI job.
- No Playwright/managed-update scheduling redesign.
- No benchmark work until semantic corrections are accepted.

## Unresolved questions

None.

## NEXT CORRECTION

Owner: release-impact execution/selection boundary.

Ready architecture handoff:

- `docs/testing/verify-release-impact-correction.md`
- status: `ready`

Implementation scope:

```text
new scripts/release/releaseSpecInventory.ts
scripts/release/managedUpdatesProof.mjs
scripts/lib/releaseRisk.ts
scripts/verify.ts
```

Primary proof scope:

```text
scripts/lib/releaseRisk.test.ts
scripts/release/managedUpdatesProof.test.mjs
scripts/verify.test.ts
```

Required pass order:

1. fresh independent test-author proof;
2. separate implementation context against accepted assertions;
3. focused unit/type feedback only;
4. return to architect for complete Pass E owner-boundary review.

Do not combine the two `scripts/REVIEW.md` output minors into this pass.