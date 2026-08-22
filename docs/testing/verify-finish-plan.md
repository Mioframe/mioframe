# Verify modernization finish plan

Status: **application-E2E and release-impact corrections closed; PR publication remains blocked by one unit-discovery major and final comment/TSDoc cleanup**.

This document owns verifier-modernization packaging, correction order, and final integration state. It does not redefine lane semantics owned by the architecture documents.

## Authority

- `docs/testing/architecture.md` — project-wide testing policy;
- `docs/testing/verify-target-architecture.md` — verifier impact/planning architecture;
- `docs/testing/verify-agent-output.md` — agent-facing verifier output;
- `docs/testing/verify-change-classification.md` — repository metadata classification;
- `docs/testing/verify-unit-impact-correction.md` — unit-impact ownership amendment;
- `docs/testing/verify-app-e2e-discovery-correction.md` — closed application-E2E physical-discovery correction;
- `docs/testing/verify-release-impact-correction.md` — closed Pass E release-impact correction;
- `docs/testing/verify-modernization.md` — implementation/benchmark progress record;
- `scripts/lib/REVIEW.md` — active remaining source-level findings;
- `.agents/skills/verification/SKILL.md`, `test-first`, and `test-authoring` — execution/proof workflow.

Architecture/status/benchmark documents are architect-owned. Coding and test-author agents must not edit them unless explicitly assigned.

## Branch state

Finish branch:

```text
refactor/verify-modernization-finish
```

Synchronized `develop` baseline:

```text
13ae220900a2a724c867b01b5eb1f045c2a1d857
```

PR publication remains blocked by the active `scripts/lib/REVIEW.md` findings.

## Closed corrections

### Application-E2E physical discovery

Closed and architect-reviewed.

```text
application Playwright
→ direct tests/e2e/*.spec.ts only
```

The real `playwright.config.ts` enforces the boundary and a real Playwright `--list` proof established meaningful RED before the fix and GREEN after it.

### Pass E release-impact consumer model

Closed and architect-reviewed against `docs/testing/verify-release-impact-correction.md`.

The release planner now:

- starts from the six real `RELEASE_CHECK_COMMANDS` contracts;
- exact-maps release runner/config/server/shared-spec-support seams to their actual consumers;
- maps the publisher seam to `publisher-node-import + managed-updates` where real consumers require both;
- excludes ordinary Vitest proof and declaration-only files before broad runtime fallbacks;
- preserves full fail-closed selection for unknown significant release runtime/implementation input;
- validates empty/duplicate/missing exact mapping state before planning;
- keeps `release-version` independent;
- introduces no generic dependency graph, new release proof, or CI topology change.

Focused independent planner proof and type-check were green. Exact-head CI remains the final automatic gate after PR publication.

## Remaining findings

### Major — exact Vitest direct-test discovery

Owner: `scripts/lib/unitRisk.ts`.

`isTestShapedPath()` must mirror the current `vitest.config.ts` include matrix exactly:

```text
src/**/*.test.ts
config/**/*.test.ts
scripts/**/*.test.ts
scripts/**/*.test.mjs
tests/e2e/**/*.test.mjs
playwright.*.test.ts
eslint.config.test.ts
```

In particular, `src/**/*.test.mjs` and `config/**/*.test.mjs` are not direct Vitest tests.

This is a narrow local correction. Do not introduce another discovery abstraction or reopen the broader Pass C ownership model.

### Minor — stale durable comments/TSDoc

After the unit-discovery correction:

- remove references to resolved temporary `REVIEW.md` files;
- remove obsolete `current unfixed` / expected-RED narration;
- keep concise final-state rationale tied to canonical docs;
- fix `isSafeVisualExclusionPath()` TSDoc so it no longer claims plain Markdown is excluded.

This cleanup must not change behavior.

## Remaining order

```text
1. exact Vitest direct-test predicate correction
2. stale comment/TSDoc cleanup
3. architect refreshes affected benchmark/status
4. full final semantic PR-level diff review
5. remove resolved REVIEW.md artifacts
6. re-check branch against current develop
7. publish PR to develop
8. exact-head CI
9. record actual CI critical path / merge latency
10. merge-readiness verdict
```

## Proof discipline

For the remaining behavior-changing unit correction:

```text
accepted contract
→ fresh test-author context
→ independent positive/negative matrix proof
→ meaningful RED when applicable
→ separate implementation context
→ focused GREEN
→ architect semantic review
```

The implementation agent treats accepted assertions as read-only.

## Final review boundary

Before PR publication, review the complete `develop...refactor/verify-modernization-finish` result for:

- ownership and dependency direction;
- physical proof discovery vs declared inventories;
- fail-closed/status behavior;
- unit/release/mutation source of truth;
- removal of replaced inference;
- proof independence;
- verifier output boundedness/actionability;
- release-version separation;
- CI topology;
- benchmark consistency.

No active `REVIEW.md` may remain in the final PR diff.

## PR / CI sequence

Only after semantic findings are closed:

```text
final full-diff review
→ remove resolved REVIEW.md artifacts
→ compare with current develop
→ publish PR
→ apply release-intent/version label
→ inspect exact-head CI
→ if autofix/materialization changes head, review the new head and its new CI
→ record real CI critical path / merge latency
→ merge-readiness decision
```

Exact-head GitHub CI is the authoritative automatic repository gate.

## Stop rule

After exact-head CI is healthy and final review has no findings, stop verifier infrastructure modernization. Further jobs, sharding, cross-job artifacts, generic dependency graphs, task runners, universal registries, or speculative optimization require a separate measured need and architecture decision.