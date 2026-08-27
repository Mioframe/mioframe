# Verify redesign — release-version isolation correction agent task

## Problem and cause

The develop workflow intentionally separates implementation verification from PR release-version policy. `.github/workflows/verify.yml` runs public `static` inside implementation verification, while an independent PR-only `release-version` job directly runs `node scripts/release/validateVersion.mjs`; preview depends on implementation `verification`, not on the version-policy job.

The current verifier violates that boundary. `scripts/lib/releaseStaticRisk.ts` models `releaseVersion` as an affected release-static leaf for `package.json`, version-policy scripts, release docs/checklists, and release notes, and `scripts/verify.ts` emits that leaf outside literal `--full`. As a result, PR version-policy failure can leak into ordinary `static` verification and block implementation verification/preview.

## Expected final state

- Ordinary/default/affected `static` planning never emits the private `release-version` leaf.
- The affected release-static planner no longer carries redundant `releaseVersion` state that exists only for the removed affected-selection path.
- A confirmed version-only `package.json` change does not select release-sensitive static proof solely because of the version change.
- A runtime-relevant `package.json` change still selects the existing build-derived static proof (`build`, `artifact-static`, `managed-updates-static`) exactly as required today.
- Changes to `scripts/release/validateVersion.mjs`, `scripts/release/versionPolicy.mjs`, `docs/release.md`, `docs/release-checklist.md`, or `docs/releases/**` do not cause ordinary affected release-static planning to execute PR version-policy validation solely because they are version-policy inputs.
- Literal `pnpm verify --full` still runs `release-version` unconditionally and still classifies it as the private `static` leaf it is today.
- The independent PR-only `release-version` CI job remains the owner of PR release-version policy. Existing workflow topology and preview dependency remain unchanged.

## Architecture decision and ownership

Use the existing separation already present in the repository:

- `scripts/lib/releaseStaticRisk.ts` owns affected/default release-sensitive static impact only.
- `scripts/verify.ts` owns command planning and keeps `release-version` in the private static label map plus unconditional full-mode release commands.
- `.github/workflows/verify.yml` owns PR release-version policy as an independent merge gate and must not be changed for this correction.
- `scripts/release/validateVersion.mjs` and `scripts/release/versionPolicy.mjs` keep their current policy semantics; do not change the validator to compensate for planner ownership.

The minimum complete implementation is to remove affected `release-version` selection from the release-static planner and its ordinary command-planning integration while leaving the existing full-mode path intact. Do not introduce a new type, flag, profile, registry, manager, or alternate validator path.

## Constraints

- Read and follow current root `AGENTS.md`, `.agents/skills/verification/SKILL.md`, `.agents/skills/implementation-preflight/SKILL.md`, `docs/testing/architecture.md`, `docs/release.md`, `docs/testing/migration-plan.md`, and `scripts/REVIEW.md` before editing.
- Treat the architect-authored documentation and review/task files as read-only.
- Keep public verification types exactly: `static`, `unit`, `behavior`, `visual`, `browser-integration`, `performance`, `mutation`, `e2e`.
- Keep all existing public CLI entry points and incompatibility rules unchanged.
- Keep literal `--full` release-grade semantics unchanged except for tests needed to prove they remain unchanged.
- Preserve package runtime-impact refinement and its fail-closed behavior when `packageJsonOldRef` is unresolved.
- Preserve accepted release config, build/artifact, managed-updates static, publisher Node import, Storybook, browser-integration, E2E, mutation, unit, fix/status/resume/lock/profile/timeout behavior.
- Do not alter Playwright execution or workflow topology.
- Follow the repository TypeScript-first rule for task-touched tooling; no new JavaScript tooling is needed.

## Acceptance criteria

1. `ReleaseStaticPlan` no longer exposes a `releaseVersion` affected-selection field or equivalent redundant state whose only purpose is ordinary affected release-version selection.
2. `resolveReleaseStaticPlan()` does not select `release-version` for:
   - a confirmed version-only `package.json` change;
   - `scripts/release/validateVersion.mjs`;
   - `scripts/release/versionPolicy.mjs`;
   - `docs/release.md`;
   - `docs/release-checklist.md`;
   - `docs/releases/**`.
3. A runtime-relevant `package.json` change still selects `build`, `artifact-static`, and `managed-updates-static` and does not require affected `release-version` selection.
4. Existing lockfile, Vite/application harness, local-command execution, release-config, publisher-import, production source, and managed-update impact behavior remains unchanged.
5. `addReleaseStaticCommands()` cannot emit `release-version` from ordinary/default affected planning.
6. `addReleaseOnlyCommands()` or the existing equivalent full-mode path still emits `release-version` for literal `--full`.
7. `VERIFICATION_TYPE_BY_LABEL['release-version']` remains `static`.
8. Focused tests explicitly prove both isolation outside full mode and preservation inside full mode. Update stale comments/test names that describe the old affected-selection contract.
9. No accepted test assertion is weakened merely to make the correction pass; tests must encode the new architecture contract.
10. No files outside the smallest scripts implementation/test scope are modified unless a concrete compile/test failure proves they are directly required. Do not edit `.github/workflows/verify.yml` or architect-owned docs/review/task files.

## Verification

Use focused verifier-managed feedback while implementing. At minimum, run:

```bash
pnpm verify --only unit --files scripts/lib/releaseStaticRisk.ts scripts/lib/releaseStaticRisk.test.ts scripts/verify.ts scripts/verify.test.ts
pnpm verify --only static --files scripts/lib/releaseStaticRisk.ts scripts/lib/releaseStaticRisk.test.ts scripts/verify.ts scripts/verify.test.ts
```

When the implementation is complete, run the required cumulative branch handoff gate exactly:

```bash
pnpm verify --base origin/develop
```

If the branch gate finds a PR-caused failure that remains inside this accepted architecture, fix it, use the smallest relevant focused verifier command for feedback, and rerun the complete branch gate. If it exposes an unrelated failure or requires material architecture/ownership expansion, stop and report the evidence instead of broadening the task.

A retry-pass/flaky result is not a clean handoff.

Report exactly:

```text
TASK RESULT
status: complete | partial | blocked
remaining: none | <remaining implementation/proof/blocker>

LOCAL FEEDBACK
commands: none | <focused verifier-managed commands actually useful during implementation/diagnosis>
status: not run | passed | failed | partial
reason if failed/partial: <exact reason>

BRANCH VERIFICATION
command: pnpm verify --base origin/develop | skipped
status: passed | failed | skipped
reason if failed/skipped: none | <exact reason>

CI GATE
status: architect-owned
```

## Forbidden

- Do not change `.github/workflows/verify.yml` or move version policy into another workflow/lane.
- Do not remove `release-version` from literal `pnpm verify --full`.
- Do not change the private `release-version` -> `static` classification.
- Do not add a public `release` type, restore `verify:release`, expose private leaf labels through `--only`, or add an exclude/version-policy CLI flag.
- Do not change release-version validator/materialization semantics, version labels, or release policy.
- Do not introduce a new planner registry, generic release manager, DSL, cache, dependency graph, or compatibility layer.
- Do not broaden unit, mutation, Storybook, browser-integration, E2E, or performance selection to compensate for this change.
- Do not alter container-only Playwright, command locks, status/resume, logging, timeout, profile/base/fix, or fail-on-flaky behavior.
- Do not edit `docs/testing/architecture.md`, `docs/testing/migration-plan.md`, `docs/testing/verify-redesign-current-handoff.md`, `scripts/REVIEW.md`, or this task file.
- Do not weaken tests, accept flaky/retry success, inflate timeouts, or add unrelated cleanup/refactors.
