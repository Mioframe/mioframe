# Verify modernization finish plan

Status: **all known behavioral/architecture findings closed; PR publication blocked only by final source-comment cleanup and one final full-diff review**.

This document owns verifier-modernization packaging, correction order, and final integration state. It does not redefine lane semantics owned by the architecture documents.

## Authority

- `docs/testing/architecture.md` — project-wide testing policy;
- `docs/testing/verify-target-architecture.md` — verifier impact/planning architecture;
- `docs/testing/verify-agent-output.md` — implemented agent-facing verifier output;
- `docs/testing/verify-change-classification.md` — repository metadata classification;
- `docs/testing/verify-unit-impact-correction.md` — closed unit-impact ownership correction;
- `docs/testing/verify-app-e2e-discovery-correction.md` — closed single-owner application-E2E path architecture;
- `docs/testing/verify-release-impact-correction.md` — closed release-impact correction;
- `docs/testing/verify-modernization.md` — implementation/selection progress record;
- `scripts/lib/REVIEW.md` — active final review state;
- `.agents/skills/verification/SKILL.md`, `architect-handoff`, `implementation-preflight`, `test-first`, and `test-authoring` — workflow/proof rules.

Architecture/status/benchmark documents are architect-owned. Coding/test-author contexts must not edit them unless explicitly assigned.

## Branch state

Finish branch:

```text
refactor/verify-modernization-finish
```

Current comparison against `develop`:

```text
ahead: 107 commits
behind: 0
merge base: 13ae220900a2a724c867b01b5eb1f045c2a1d857
```

Re-check immediately before PR publication because `develop` may move.

## Closed areas

### Pass A — agent-facing output

Closed. Default output is bounded; detailed diagnostics remain in `.verify/logs/**` / `--verbose`; heartbeats carry verifier-owned liveness only; failure fallback uses trusted semantic facts or exact exit code + log/rerun pointers rather than arbitrary output-tail inference.

### Pass B — repository metadata

Closed. `isNonRuntimeRepositoryMetadataPath()` remains a narrow positive classifier rather than a global Markdown exclusion.

### Pass C — unit impact

Closed, including exact Vitest direct-test discovery. Ordinary dependency-input eligibility remains repository-wide and delegated to `vitest related`; external exact/scan/runtime ownership stays additive and status-aware.

### Application-E2E ownership architecture

Closed after architecture redo.

One pure module now owns the repeated root-app invariant:

```text
scripts/lib/appE2EPaths.ts
├─ APP_E2E_SPEC_DIR
├─ APP_E2E_TEST_MATCH
└─ isRootAppE2ESpecPath()
```

Consumers:

```text
playwright.config.ts
e2eRisk.ts
e2eProjectApplicability.ts
unitRisk.ts
```

The replaced private root predicates/constants were removed. Scenario mappings and project applicability data remain with their original owners.

Final contract:

```text
tests/e2e/appSmoke.spec.ts
→ root app spec / focused direct E2E

tests/e2e/other/example.spec.ts
→ not app spec/support / no app selection

tests/e2e/other/helper.ts
→ conservative app support / full

tests/e2e/example.test.ts
→ not app support

existing *.testUtils.ts app helper
→ support behavior preserved
```

Scenario/standalone and applicability metadata reject non-root app specs. `appE2EPaths.ts` is full application-E2E infrastructure only.

The real Playwright collector remains independent. Collision-safe probe ownership is closed, and the filtered collector succeeds with `appSmoke.spec.ts + nested probe` while excluding the nested probe.

`tsconfig.node.json` explicitly includes the new verifier module because `playwright.config.ts` imports it; focused type-check confirmed this TypeScript project boundary.

### Pass D — mutation

Closed. Mutation remains explicit registry-based high-risk proof shared with Stryker; adjacency does not create mutation work.

### Pass E — release impact

Closed. Six source-impact checks use exact/fallback consumer ownership; proof/type-only files are excluded before broad runtime fallback; malformed exact mappings fail invalid; unknown significant release-runtime input remains fail-closed; `release-version` remains independent.

### Pass F — CI topology

Closed. Verification lanes remain parallel after autofix; release-impact and release-version remain independent gates; no speculative cross-job artifact or topology redesign was introduced.

## Remaining review item

`scripts/lib/REVIEW.md` contains one minor, behavior-preserving comment cleanup only:

1. old ordinary-source prefix wording in `unitRisk.test.ts`;
2. obsolete release execution wording in `e2eRisk.ts`;
3. obsolete rolling-buffer/getFailureReason wording in `verify.ts`.

No executable behavior or assertions should change for this cleanup.

## Remaining order

```text
1. perform the three source/test comment corrections
2. architect refreshes verify-modernization.md final status/selection wording
3. full final semantic develop...branch review
4. if clean, delete scripts/lib/REVIEW.md
5. compare branch with current develop and integrate if needed
6. publish PR to develop
7. apply required release-intent/version label
8. inspect exact-head CI
9. if autofix/materialization changes head, review the new exact head and its CI
10. record actual CI critical path / merge latency
11. merge-readiness verdict
```

## Final review boundary

Before PR publication, review the complete resulting diff for:

- ownership and dependency direction;
- single source of truth for app-E2E root discovery;
- physical collector vs planner/registry/applicability alignment;
- fail-closed/status behavior;
- unit/release/mutation source of truth;
- removal of replaced inference/duplicate ownership;
- proof independence and test-state isolation;
- bounded/actionable verifier output;
- release-version separation;
- CI topology;
- final selection/status documentation consistency.

No active `REVIEW.md` may remain in the published PR diff.

## PR / CI sequence

Only after the final semantic review is clean:

```text
remove resolved REVIEW.md
→ compare with current develop
→ publish PR
→ apply required release-intent label
→ inspect exact-head CI
→ if head changes, review the new exact head and new CI
→ record real CI critical path / merge latency
→ merge-readiness decision
```

Exact-head GitHub CI is the authoritative automatic repository gate.

## Stop rule

After exact-head CI is healthy and final review has no findings, stop verifier infrastructure modernization. Further jobs, sharding, cross-job artifacts, generic dependency graphs, task runners, universal registries, or speculative optimization require a separate measured need and architecture decision.
