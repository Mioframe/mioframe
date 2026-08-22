# Verify modernization finish plan

Status: **application-E2E discovery correction closed; PR publication remains blocked by release-impact and unit-discovery findings**.

This document owns verifier-modernization packaging, correction order, and final integration state. It does not redefine lane semantics owned by the architecture documents.

## Authority

- `docs/testing/architecture.md` — project-wide testing policy;
- `docs/testing/verify-target-architecture.md` — verifier impact/planning architecture;
- `docs/testing/verify-agent-output.md` — agent-facing verifier output;
- `docs/testing/verify-change-classification.md` — repository metadata classification;
- `docs/testing/verify-unit-impact-correction.md` — unit-impact ownership amendment;
- `docs/testing/verify-app-e2e-discovery-correction.md` — closed application-E2E physical-discovery correction;
- `docs/testing/verify-release-impact-correction.md` — current ready Pass E release-consumer correction;
- `docs/testing/verify-modernization.md` — implementation/benchmark progress record;
- `scripts/lib/REVIEW.md` — currently active source-level findings;
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

No additional sync prerequisite is currently known. PR publication remains blocked by `scripts/lib/REVIEW.md`.

## Implemented passes

The branch still contains one coherent modernization result:

```text
Pass A — bounded agent-facing output
Pass B — repository metadata/change classification
Pass C — durable unit impact
Pass D — explicit mutation ownership
Pass E — source-impact release planning
Pass F — exact-head CI integration
Pass G — representative benchmark / finish validation
```

Passes are reviewed as one final system; green focused proof does not replace semantic review.

## Current review state

### Closed — application-E2E physical discovery

`docs/testing/verify-app-e2e-discovery-correction.md` is implemented and architect-reviewed.

Final physical contract:

```text
application Playwright
→ direct tests/e2e/*.spec.ts only
```

The real `playwright.config.ts` now enforces this with root-only `testMatch`; project `testIgnore` owns only desktop/mobile applicability. A real Playwright `--list` proof demonstrated meaningful RED before the fix and GREEN after it.

The existing root-only E2E scenario/applicability inventories and corresponding unit bounded-scan ownership are therefore now aligned with physical Playwright discovery.

### Open blocker — Pass E release-impact consumer model

Owner: `scripts/lib/releaseRisk.ts` and its proof.

Architecture for this correction is resolved in `docs/testing/verify-release-impact-correction.md`. The correction must audit the closed consumer population starting from the six real `RELEASE_CHECK_COMMANDS`, not add ad-hoc path exceptions.

Required outcomes include:

- release execution infrastructure such as `scripts/e2eReleaseContainer.mjs`, `scripts/playwrightContainer.ts`, `playwright.release.config.ts`, and `scripts/release/artifactServer.mjs` selects its actual browser release consumers;
- shared runtime support actually imported by release specs, including the confirmed `tests/e2e/helpers.ts` relation, is included in the consumer audit;
- ordinary Vitest-only proof and declaration-only type files do not inherit release-impact merely by adjacency/directory;
- conservative fallback under release implementation boundaries excludes proof/type-only files while retaining unknown implementation/runtime safety;
- exact mapping integrity rejects duplicate source ownership and empty consumer sets before first-match resolution can silently drop ownership;
- independent proof rejects both silent release-input omission and proof/type-only over-selection.

This is the next coding correction.

### Open major — exact Vitest direct-test discovery

Owner: `scripts/lib/unitRisk.ts`.

`isTestShapedPath()` must mirror the real `vitest.config.ts` include matrix exactly:

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

This is a local correction and must not introduce a new ownership abstraction.

### Open minor — stale durable comments/TSDoc

After behavioral corrections, remove references to resolved temporary `REVIEW.md` state and obsolete RED narration from durable source/test/workflow comments. Fix `isSafeVisualExclusionPath()` TSDoc so it no longer claims blanket Markdown exclusion.

Do not change behavior to satisfy old comments.

## Correction order

Use separate coding/test-author contexts for materially different ownership problems:

```text
1. application-E2E physical discovery            CLOSED
2. release-impact closed consumer correction     NEXT
3. exact Vitest test-discovery predicate          local follow-up
4. stale comment/TSDoc cleanup                    behavior-preserving
5. architect refreshes affected benchmark/status
6. full final semantic PR-level diff review
7. publish PR to develop
8. exact-head CI
9. merge-readiness verdict
```

Do not combine the release consumer audit with unrelated browser or mutation work.

## Proof-author discipline

For behavior-changing proof:

```text
accepted contract / TEST IMPACT
→ fresh test-author context
→ independent oracle + Must reject
→ meaningful RED where applicable
→ separate implementation context
→ GREEN focused proof
→ architect semantic review
```

The implementer treats accepted assertions as read-only. If proof conflicts with architecture, return it to the test owner/architect rather than weakening it.

## Final review boundary

Before PR publication, the architect reviews the complete `develop...refactor/verify-modernization-finish` result for:

- ownership and dependency direction;
- physical proof discovery vs declared inventories;
- status/fail-closed behavior;
- unit/release/mutation source of truth;
- removal of replaced inference;
- independent proof quality;
- agent-facing output boundedness/actionability;
- release-version separation;
- CI topology;
- final benchmark consistency.

No active `REVIEW.md` may remain in the final PR diff.

## PR and CI sequence

Only after semantic findings are closed:

```text
final full-diff review
→ remove resolved REVIEW.md artifacts
→ publish PR against develop
→ apply required version-intent label
→ inspect exact-head CI
→ if autofix/materialization changes head, review the new head and its CI
→ record actual CI critical path / merge latency
→ merge-readiness decision
```

Exact-head GitHub CI is the authoritative automatic repository gate.

## Stop rule

After exact-head CI is healthy and final review has no findings, stop verifier infrastructure modernization.

Do not continue automatically with additional jobs, sharding, shared cross-job artifacts, generic dependency graphs, Nx/Turbo, universal registries, speculative E2E optimization, or permanent benchmark infrastructure.
