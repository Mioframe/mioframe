# Review

Verdict: blocked

## Scope reviewed

- PR #216 release-impact planning and execution ownership against the current release/build implementation, release Playwright corpus, and accepted verifier target architecture.
- Current `releaseRisk.ts`, production Vite/PWA build inputs, release proof grouping, and fail-closed validation behavior.

## Blockers

### B1 — Release-impact ownership is not closed over the actual release-sensitive population

Owner: `scripts/lib/releaseRisk.ts`

Problem: the release-impact planner can silently return `skip` for current production PWA/build inputs that the accepted architecture explicitly requires it to own. In particular, `vite.config.ts` imports and executes `config/plugins/pwa.ts` for production release builds, but `releaseRisk.ts` has no exact mapping or conservative boundary that includes that file. The same design also has no exhaustive fail-closed relation between release Playwright specs and the contracts that actually execute them: a new unrecognized `tests/e2e/release/*.spec.ts` can fall through to `skip`, while a new `managedUpdates*.spec.ts` is classified as `managed-updates` by filename even though `managedUpdatesProof.mjs` executes only hard-coded group arrays. Finally, mapping validation does not reject a check value outside `RELEASE_IMPACT_CHECKS`, despite the accepted architecture requiring unknown check values to make the plan invalid.

Evidence:

- [`../../docs/testing/verify-target-architecture.md`](../../docs/testing/verify-target-architecture.md) — "Required release-sensitive classes" explicitly includes `vite.config.ts` **and the production PWA/build plugin configuration it actually consumes**; unknown significant source inside a confirmed release-sensitive boundary must resolve full, not skip; planner validation must reject an unknown release check and unresolved release-proof ownership.
- [`../../vite.config.ts`](../../vite.config.ts) — production configuration imports `getPwaPlugins`/`resolveManagedAppUpdateChannel` from `config/plugins` and includes the resulting PWA plugins in the release build.
- [`../../config/plugins/pwa.ts`](../../config/plugins/pwa.ts) — owns production manifest, Workbox/cache isolation, stable/develop managed-worker selection, `injectManifest`/`generateSW`, and related service-worker artifact semantics.
- [`releaseRisk.ts`](./releaseRisk.ts) — the fail-closed exact set contains only `config/tooling.json`, `vite.config.ts`, `index.html`, `scripts/verify.ts`, and `scripts/lib/releaseRisk.ts`; the only broad prefix is `scripts/pages/lib/`. `config/plugins/pwa.ts` therefore matches no release-sensitive branch and resolves to `skip`.
- [`../../playwright.config.ts`](../../playwright.config.ts) — application E2E builds with `VITE_DISABLE_PWA=1`, so application E2E cannot substitute for the production PWA release proof that the release-impact architecture owns.
- [`../release/managedUpdatesProof.mjs`](../release/managedUpdatesProof.mjs) — the managed-update proof executes four fixed spec arrays rather than every spec matching the planner's `managedUpdates*.spec.ts` predicate.
- [`../release/managedUpdatesProof.test.mjs`](../release/managedUpdatesProof.test.mjs) — verifies the fixed groups against another hard-coded expected corpus; it does not prove that the repository's actual managed-update release-spec population is exhausted.
- [`releaseRisk.ts`](./releaseRisk.ts) — exact-mapping validation checks empty/duplicate/missing paths and empty check lists but does not verify that each referenced check belongs to `RELEASE_IMPACT_CHECKS`.

Basis:

- [`../../docs/testing/verify-target-architecture.md`](../../docs/testing/verify-target-architecture.md) — release build/PWA/update sources must select exact owning release contracts or conservatively fail closed when ownership is unknown; no known required proof may be silently missed.
- [`../../docs/testing/architecture.md`](../../docs/testing/architecture.md) — automatic selection must be deterministic, inspectable, and fail closed, and release-only behavior must be proved against the built/deployable artifact rather than a dev/source substitute.
- [`../../.agents/skills/implementation-preflight/SKILL.md`](../../.agents/skills/implementation-preflight/SKILL.md) — impact planners must be accepted by ownership mechanism/population, not by a hand-written example list, and delegated owners require representative real-resolver evidence.

Risk: after this PR merges, a change to real production PWA/build configuration such as `config/plugins/pwa.ts` can pass ordinary PR CI without running any source-impact release check. A future release spec can likewise be silently skipped or be reported as owned by `managed-updates` without actually being executed by that proof. This violates the verifier's central fail-closed contract and allows production artifact/update regressions to bypass the new `verification-release` merge gate.

Required final state: release-impact selection must cover the complete current release-sensitive ownership mechanisms, not only the current example table. Actual production PWA/build inputs consumed by release builds must select their truthful release owner(s), or conservatively full when ownership is not safely bounded. Every release Playwright spec must either map to a contract that actually executes it or fail closed; managed-update classification must not claim execution for a spec absent from the managed proof corpus. Mapping validation must reject unknown release-check values. Keep the solution release-local and explicit; do not introduce a generic dependency graph or universal registry.

Verification: add independent planner/ownership proof for at least one real production PWA build input (`config/plugins/pwa.ts`) showing it cannot skip; prove repository release-spec inventory against actual contract execution so an unowned/new spec cannot silently skip or be falsely classified as executed; add an invalid-mapping case for an unknown release check; preserve the existing exact narrow mappings and unknown-runtime full fallback. After correction, require exact-head `verification-release` and aggregate `verify` CI success.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

None.

## Unresolved questions

None.
