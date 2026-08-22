# Verify modernization finish plan

Status: **all known implementation/review findings closed; PR publication and exact-head CI remain**.

This document owns verifier-modernization packaging and final integration order. It does not redefine lane semantics owned by the architecture documents.

## Authority

- `docs/testing/architecture.md` — project-wide testing policy;
- `docs/testing/verify-target-architecture.md` — verifier impact/planning architecture;
- `docs/testing/verify-agent-output.md` — implemented agent-facing output;
- `docs/testing/verify-change-classification.md` — repository metadata classification;
- `docs/testing/verify-unit-impact-correction.md` — closed unit-impact ownership correction;
- `docs/testing/verify-app-e2e-discovery-correction.md` — closed single-owner application-E2E discovery architecture;
- `docs/testing/verify-release-impact-correction.md` — closed release-impact correction;
- `docs/testing/verify-modernization.md` — final implementation/selection status;
- `.agents/skills/verification/SKILL.md`, `project-review`, `architect-handoff`, `implementation-preflight`, `test-first`, and `test-authoring` — workflow/proof rules.

Architecture/status documents are architect-owned. Coding/test-author contexts must not edit them unless explicitly assigned.

## Branch

Finish branch:

```text
refactor/verify-modernization-finish
```

Last confirmed `develop` merge base:

```text
13ae220900a2a724c867b01b5eb1f045c2a1d857
```

The branch was confirmed ahead of and not behind `develop` during final review. Re-check immediately before PR publication.

## Closed implementation scope

### Pass A — agent-facing output

Closed. Default output is bounded; detailed diagnostics remain in `.verify/logs/**` / `--verbose`; heartbeats carry verifier-owned liveness only; failure fallback uses trusted semantic facts or exact exit code + log/rerun pointers rather than arbitrary output-tail inference.

### Pass B — repository metadata

Closed. `isNonRuntimeRepositoryMetadataPath()` remains a narrow positive classifier rather than a global documentation/Markdown exclusion.

### Pass C — unit impact

Closed. Direct Vitest discovery matches the real include matrix; ordinary dependency inputs are repository-wide and delegated to `vitest related`; exact external and bounded-scan ownership remains explicit and status-aware.

### Application-E2E discovery ownership

Closed after the architecture stop/rework.

One pure verifier module owns the repeated root application-spec contract:

```text
scripts/lib/appE2EPaths.ts
├─ APP_E2E_SPEC_DIR
├─ APP_E2E_TEST_MATCH
└─ isRootAppE2ESpecPath()
```

`playwright.config.ts`, `e2eRisk.ts`, `e2eProjectApplicability.ts`, and `unitRisk.ts` consume it. Replaced private predicates/constants are removed; scenario mappings and applicability data retain their original owners.

The real Playwright collector remains independent. Test probes are collision-safe and invocation-owned; filtered collection proves a root spec remains collected while a nested probe cannot bypass `testMatch`.

### Pass D — mutation

Closed. Mutation remains explicit high-risk opt-in through one verifier/Stryker registry; adjacency is not ownership.

### Pass E — release impact

Closed. Six source-impact release checks use audited consumer ownership and conservative fallback; proof/type-only paths do not inherit runtime release ownership; exact mapping integrity is validated; `release-version` remains independent.

### Pass F — CI topology

Closed. Verification lanes remain parallel after autofix, release-impact and release-version stay independent, and no speculative cross-job artifact layer or extra task-runner infrastructure was introduced.

### Final comment cleanup

Closed. The three final stale comments were corrected without executable or assertion changes:

- repository-wide ordinary unit-input wording in `unitRisk.test.ts`;
- separately owned release-lane wording in `e2eRisk.ts`;
- rolling-buffer/failure-reason wording in `verify.ts`.

## Final semantic review

The complete resulting `develop...refactor/verify-modernization-finish` scope was re-reviewed after the application-E2E architecture migration and final comment cleanup.

Current findings:

```text
blockers: 0
major issues: 0
minor issues: 0
accepted risks: 0
```

Before publishing the PR, remove the resolved temporary `scripts/lib/REVIEW.md`; no active review artifact may ship in the PR diff.

## Remaining order

```text
1. remove resolved scripts/lib/REVIEW.md
2. compare branch with current develop
3. if still ahead/not behind, publish PR to develop
4. apply exactly one version-impact label
5. inspect exact-head CI
6. if autofix/version materialization changes the head, review the new exact head and its new CI
7. record actual CI critical path / merge latency
8. give merge-readiness verdict
9. squash merge only after the exact-head automatic gate is healthy
```

## PR / version policy

This is an ordinary internal verification/tooling refactor into `develop`, with no user-facing product behavior change. Per `docs/release.md`, its release intent is:

```text
version:patch
```

Same-repository CI owns materialization of the exact `package.json` PATCH version after the PR carries that label.

## Exact-head rule

The exact PR head is authoritative. If `autofix` materializes `package.json`, applies formatting, or otherwise pushes a new head:

```text
old CI result is obsolete
→ inspect/review the new head
→ require the new head's CI
```

Do not merge based on green checks from an earlier head.

## Stop rule

After exact-head CI is healthy and merge-readiness is established, stop verifier infrastructure modernization. Further jobs, sharding, cross-job artifacts, generic dependency graphs, task runners, universal registries, or speculative optimization require a separate measured need and architecture decision.
