# Review

Verdict: blocked

## Scope reviewed

- PR #218 complete verifier/CI contract after exact-head run #4511, including `scripts/lib/releaseStaticRisk.ts`, `scripts/verify.ts`, their focused tests, the develop verification workflow, release/version policy, and canonical testing/verification ownership.

## Blockers

None.

## Major issues

### M1 — Affected `static` planning violates independent PR version-policy ownership

Owner: `scripts` verifier planning

Problem: Ordinary/default affected `static` planning can select the private `release-version` leaf. `scripts/lib/releaseStaticRisk.ts` marks `releaseVersion` affected for `package.json`, version-policy scripts, release docs/checklists, and release notes, and `scripts/verify.ts` emits that leaf outside literal `--full`. The develop workflow intentionally owns PR version policy in a separate `release-version` job whose failure must not block implementation `verification` or preview publication.

Evidence:

- [`lib/releaseStaticRisk.ts`](lib/releaseStaticRisk.ts) — `RELEASE_VERSION_EXACT_FILES`, `RELEASE_VERSION_PREFIXES`, `ReleaseStaticPlan.releaseVersion`, and `resolveReleaseStaticPlan()` make `release-version` an affected static leaf.
- [`verify.ts`](verify.ts) — `addReleaseStaticCommands()` emits `release-version` from the affected release-static plan, while `addReleaseOnlyCommands()` already owns unconditional full-mode execution.
- [`verify.test.ts`](verify.test.ts) — the current integration test explicitly expects `release-version` outside full mode for a `package.json` change.
- [`../.github/workflows/verify.yml`](../.github/workflows/verify.yml) — `verification-static` runs public `static`, while the separate PR-only `release-version` job directly runs `node scripts/release/validateVersion.mjs`; `deploy-preview` depends only on aggregate implementation `verification`.

Basis:

- [`../docs/testing/architecture.md`](../docs/testing/architecture.md#static) — PR release-intent validation is a separate merge-policy gate; affected/default `static` must not select the private `release-version` leaf, while literal `--full` must retain it as release-grade static proof.
- [`../docs/release.md`](../docs/release.md#what-ci-verifies-automatically) — missing/invalid version intent must block only the independent `release-version` merge gate, not implementation verification or PR preview.

Risk: A version-policy failure can leak into `verification-static`, causing aggregate implementation `verification` and preview to fail even though repository policy deliberately isolates that failure to the merge-policy gate. The same validator can also run redundantly in both implementation verification and the independent version job.

Required final state: Remove `release-version` from ordinary/default affected release-static planning, including redundant planner state that exists only to select it. Preserve runtime-relevant `package.json` build/artifact impact, preserve the private `release-version` type classification and unconditional literal `pnpm verify --full` execution, and leave the independent develop-CI version job/topology unchanged.

Verification: Focused unit proof must demonstrate that version-only `package.json` and version-policy input changes do not emit `release-version` outside full mode, runtime-relevant package changes still select the existing build-derived static leaves, and literal `--full` still emits `release-version` as `static`. The final coding handoff must then pass `pnpm verify --base origin/develop` cleanly with no retry/flaky acceptance.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Further CI parallelization or Storybook build artifact sharing is not required by this correction.
- Cleanup of historical `verify-redesign-*` implementation records is not required by this correction.

## Unresolved questions

None.
