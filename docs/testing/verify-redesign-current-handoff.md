# Verify redesign — current architect handoff

## Current state

Branch: `architecture/verify-redesign`

PR: #218 — `refactor(testing): redesign verification ownership` (base `develop`).

PR #218 is **draft** and **not merge-ready**. The previously reviewed exact head `50f16c4d231feef20f5f10c9d6a800c61ccfcce8` passed branch verification and exact-head CI, but a later full semantic audit found one remaining verifier-planning defect plus one canonical-documentation contradiction.

The documentation contradiction is resolved in the architect preparation commit containing this handoff: `docs/testing/architecture.md` now matches root `AGENTS.md`, the verification skill, and the migration plan on the required coding-agent branch handoff gate.

One active implementation finding remains in `scripts/REVIEW.md`: ordinary/default affected `static` planning can still emit the private `release-version` leaf, violating the independent PR version-policy gate contract.

## Required reading order for the correction

1. root `AGENTS.md`;
2. `.agents/skills/verification/SKILL.md`;
3. `.agents/skills/implementation-preflight/SKILL.md`;
4. `docs/testing/architecture.md`;
5. `docs/release.md`, especially PR version materialization and CI ownership;
6. `docs/testing/migration-plan.md`;
7. `scripts/REVIEW.md`;
8. `docs/testing/verify-redesign-release-version-isolation-agent-task.md`;
9. the current implementation/tests named by that task.

Repository source of truth overrides older verify-redesign historical records when they describe superseded intermediate behavior.

## Accepted public contract

Public verification types remain exactly:

```text
static
unit
behavior
visual
browser-integration
performance
mutation
e2e
```

Canonical entry points remain:

```text
pnpm verify
pnpm verify --base origin/develop
pnpm verify --only <type>
pnpm verify --files <paths...>
pnpm verify --only <type> --files <paths...>
pnpm verify --full
pnpm verify:status
pnpm verify:resume
pnpm verify --fix-only
```

Preserve all previously accepted invariants unless new repository evidence proves they are implicated:

- public `--only` exposes verification types, never private leaf labels;
- literal `pnpm verify --full` is the single release-grade verifier entry point and must continue to include version validation as a private `static` leaf;
- ordinary coding-agent PR handoff uses one cumulative `pnpm verify --base origin/<base>` result, separate from exact-head CI;
- unit uses Vitest-native related/affected selection with safe fallback;
- mutation uses one explicit four-target registry;
- Storybook behavior/visual discovery is target-only and owner-local;
- generic and exceptional browser-integration remain disjoint behind one public type;
- ordinary E2E remains structural page/widget ownership with `dependency-cruiser` only for production reachability;
- E2E structural/inventory/graph validation remains behind the accepted relevance gate;
- verifier-managed Playwright remains container-only;
- performance inventory remains intentionally empty;
- top-level/expensive locks, status/resume, logging, timeout, profile/base/fix, and fail-on-flaky semantics remain preserved;
- develop CI keeps independent implementation lanes and an independent PR-only `release-version` merge-policy job;
- PR preview depends on implementation `verification`, not on `release-version`.

## Active correction contract

The independent PR version-policy job in `.github/workflows/verify.yml` directly runs `node scripts/release/validateVersion.mjs`. Missing/invalid release-intent is intentionally allowed to block merge through the aggregate `verify` gate while leaving implementation verification and preview independent.

Current affected/default `static` planning violates that separation because `scripts/lib/releaseStaticRisk.ts` exposes `releaseVersion` as an affected leaf and `scripts/verify.ts` emits it outside literal `--full`.

Required final behavior:

- ordinary/default/affected `static` never emits `release-version`;
- the affected release-static plan no longer carries redundant `releaseVersion` state for a path that cannot be selected;
- a confirmed version-only `package.json` change does not select release-sensitive static proof solely for the version change;
- a runtime-relevant `package.json` change still selects the existing build/artifact/managed-updates static proof;
- changes to version-policy scripts/docs do not cause affected static to execute PR policy validation; the standalone PR CI gate remains the owner of that policy;
- literal `pnpm verify --full` still runs `release-version` and still classifies it as `static`;
- no workflow topology or validator semantics change is required.

The coding task is in `docs/testing/verify-redesign-release-version-isolation-agent-task.md`.

## Verification and handoff

The coding agent must use focused verifier-managed proof while implementing and then run exactly:

```bash
pnpm verify --base origin/develop
```

A retry-pass/flaky result is not clean proof. If the branch gate exposes a PR-caused in-contract failure, correct it and rerun the complete branch gate. If it exposes an unrelated or architecture-expanding issue, stop and report it.

After agent handoff, architect re-review must inspect the complete affected planner/CLI/CI contract, remove `scripts/REVIEW.md` only if the finding is truly resolved, then require new exact-head GitHub CI. Historical run #4511 is no longer merge proof once the head moves.

Current merge readiness: **should not merge until blockers are fixed**.
