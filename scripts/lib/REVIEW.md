# Review

Verdict: blocked

## Scope reviewed

- Complete `develop...refactor/verify-modernization-finish` verifier-modernization result, not only the latest Pass C correction.
- Unit, mutation, release, browser-impact, verifier-output, invocation, changed-path, and CI integration owners were checked against the current repository rules and canonical testing contracts.
- Exact-head CI is not considered because no PR is published yet; this review is the semantic precondition for publication.

## Blockers

### B1 — release-impact ownership is not a closed, truthful consumer model

Owner: `scripts/lib/releaseRisk.ts` and its independent proof.

Problem: the Pass E audit did not close the actual six-command release execution/input population. The current table has both a required release-execution false negative and several non-release proof/type false positives, while its self-validation checks only path existence.

#### Confirmed false negative: release container execution infrastructure

Current execution chain:

```text
artifact / release-smoke
→ pnpm e2e:release
→ scripts/e2eReleaseContainer.mjs
→ scripts/playwrightContainer.ts
→ playwright.release.config.ts

managed-updates
→ scripts/release/managedUpdatesProof.mjs
→ scripts/e2eReleaseContainer.mjs
→ scripts/playwrightContainer.ts
→ playwright.release.config.ts
```

Repository evidence:

- `package.json` owns `e2e:release = node scripts/e2eReleaseContainer.mjs`;
- `scripts/verify.ts` uses that command for `artifact` and `release-smoke`;
- `scripts/release/managedUpdatesProof.mjs` reaches the same release-container runner for its browser groups;
- `scripts/e2eReleaseContainer.mjs` calls `runPlaywrightInContainer()` from `scripts/playwrightContainer.ts` with `playwright.release.config.ts`;
- `docs/testing/verify-target-architecture.md` explicitly requires release-container infrastructure that changes release browser execution to select release proof.

But `releaseRisk.ts` maps neither:

- `scripts/e2eReleaseContainer.mjs`;
- `scripts/playwrightContainer.ts`.

A change to either can therefore resolve release-impact to `skip` even though it changes how `artifact`, `release-smoke`, and managed-update browser proof is actually executed. Unit/browser proof in another lane is not a substitute for the release-specific invocation contract.

#### Confirmed false positives: unit/type-only files are treated as release inputs

`NARROW_EXACT_MAPPINGS` currently promotes ordinary Vitest proof files to expensive release checks, including:

- `scripts/release/validateReleaseConfig.test.mjs`;
- `scripts/release/managedUpdatesProof.test.mjs`;
- `scripts/release/runManagedReleaseDataCompatibilityProof.test.mjs`;
- `tests/e2e/release/fixtures/managedReleaseFixture.test.mjs`.

The same file already documents the opposite rule for `buildArtifact.test.mjs`: changing an ordinary unit test does not change the release command it tests.

`FULL_LANE_PREFIXES = ['scripts/pages/lib/']` also promotes every `scripts/pages/lib/**/*.test.mjs` unit test to all six source-impact checks merely because it lives beside publisher implementation.

Exact mappings additionally include declaration-only `*.d.mts` fixture companions. They are type surfaces, not runtime inputs to the Playwright release commands; type-check owns declaration correctness unless executable release-consumer evidence proves otherwise.

This contradicts the canonical testing rule that one contract has one primary proof owner and release proof is reserved for the built/deploy/release boundary, plus the Pass E requirement to map source ownership to existing release contracts rather than infer ownership by directory/proximity.

#### Registry validation is incomplete

The target architecture requires invalid/fail-closed behavior for conflicting mapping data that can silently drop a consumer. Current validation only checks that every narrow-mapped path exists. `resolveReleasePlan()` then uses `NARROW_EXACT_MAPPINGS.find(...)`, so duplicate/conflicting entries for one path would silently use only the first entry.

Required final state:

1. Re-audit the **closed current release consumer population** from the six `RELEASE_CHECK_COMMANDS` entrypoints and their explicit config/orchestrator/runner seams. This is a semantic consumer audit, not a directory/extension sweep and not a generic dependency graph.
2. Represent `scripts/e2eReleaseContainer.mjs` and `scripts/playwrightContainer.ts` as release execution inputs for their actual consumers. Current evidence bounds them to `artifact`, `release-smoke`, and `managed-updates`; do not widen to all six unless another real consumer is proved.
3. Remove release-impact ownership from ordinary Vitest-only `*.test.ts` / `*.test.mjs` files unless a particular test file is itself executed/consumed by a release command (none of the confirmed examples above are).
4. Do not make `scripts/pages/lib/**` unit tests full release-impact solely through the implementation-directory prefix. Preserve conservative full fallback for unknown **implementation/runtime** inputs in that boundary.
5. Remove declaration-only `*.d.mts` mappings unless executable release-consumer evidence demonstrates that the release command consumes them. Static/type correctness remains owned by type-check.
6. Keep direct release Playwright specs and real release fixtures/orchestrators mapped to their actual release contracts.
7. Self-validate exact mapping integrity at least for duplicate/conflicting source ownership and empty consumer sets in addition to missing paths; compile-time `ReleaseImpactCheck` typing may continue to own the allowed check names.
8. Add independent `Must reject` proof for both directions:
   - release runner/config execution input must never `skip`;
   - unit/type-only proof beside release code must not select release-impact merely by filename/directory.
9. Refresh Pass G with representative release-runner and release-proof-only cases after the correction.

Risk: a real release execution change can pass ordinary verification without the release-specific proof that it changes, while unrelated unit-test edits can trigger the longest CI lane (including managed-updates). The former is a silent required-proof miss; the latter can materially regress merge critical path.

Verification for closure:

- fresh independent test-author oracle derived from the six real release commands/consumers;
- focused `releaseRisk` planner proof;
- command-level proof that the selected checks from the corrected planner match `scripts/verify.ts` release command ownership;
- no broad release/browser run as a coding-agent completion ritual.

## Major issues

### M1 — direct Vitest test discovery does not exactly match `vitest.config.ts`

Owner: `scripts/lib/unitRisk.ts`.

Problem: `docs/testing/verify-unit-impact-correction.md` explicitly separates Vitest test discovery from dependency-input eligibility and lists the exact current include contract:

```text
src/**/*.test.ts
config/**/*.test.ts
scripts/**/*.test.ts
scripts/**/*.test.mjs
tests/e2e/**/*.test.mjs
playwright.*.test.ts
eslint.config.test.ts
```

`unitRisk.ts:isTestShapedPath()` instead accepts both `.test.ts` and `.test.mjs` under every `src/`, `config/`, and `scripts/` prefix. Therefore `src/**/*.test.mjs` and `config/**/*.test.mjs` are classified as direct Vitest tests even though current Vitest does not discover them.

This also weakens external-owner/scan-owner registry validation because an invalid future owner path in those shapes would be accepted as “Vitest-owned”.

Required final state:

- `isTestShapedPath()` mirrors the actual current Vitest include matrix exactly;
- `src/**` and `config/**` accept direct `.test.ts` only;
- `scripts/**` accepts `.test.ts` and `.test.mjs`;
- `tests/e2e/**` accepts `.test.mjs` only;
- root special cases remain exact;
- a non-discovered `src/**.test.mjs` / `config/**.test.mjs` remains eligible only as an ordinary module input when its extension is otherwise supported, never as a direct test merely by name;
- add negative matrix proof adjacent to the positive discovery cases.

Risk: planner/registry validation claims a direct proof owner that the actual Vitest include contract does not own, violating the central Pass C boundary and allowing focused execution to report a misleading zero/incorrect scope.

Verification for closure: focused unit planner proof; no new ownership abstraction.

## Minor issues

### m1 — durable comments/TSDoc still describe deleted review state or obsolete behavior

Affected current examples:

- `scripts/lib/unitRisk.ts` still cites deleted `scripts/lib/REVIEW.md` in final implementation comments;
- `scripts/lib/unitRisk.test.ts` and `scripts/lib/releaseRisk.test.ts` retain long correction-round commentary describing the final implementation as “current unfixed”, “expected red”, and citing deleted temporary review artifacts;
- `scripts/verify.ts` / `scripts/verify.test.ts` still cite deleted `scripts/REVIEW.md` / `.github/workflows/REVIEW.md` in final failure/timeout explanations;
- `.github/workflows/verify.yml` still cites deleted `.github/workflows/REVIEW.md`;
- exported `visualRisk.ts:isSafeVisualExclusionPath()` says its safe exclusions include “plain Markdown documentation”, while the implementation deliberately excludes only proof suffixes and the modernization explicitly removed blanket Markdown exclusion.

Required final state:

- durable source/test/workflow comments cite canonical testing documents or current code contracts, never resolved temporary `REVIEW.md` files;
- remove obsolete “current unfixed” / expected-RED narration after behavioral corrections are complete while retaining concise useful oracle rationale;
- make the `isSafeVisualExclusionPath()` TSDoc match the implementation and change-classification contract exactly (no Markdown claim);
- do not change behavior merely to make the old comments true.

Verification for closure: source/comment inspection plus formatting/lint if needed; no behavioral proof required solely for this cleanup.

## Accepted risks

None.

## Items not required

- Do not reopen mutation architecture: the explicit mutation registry and Stryker source of truth are consistent in this review.
- Do not redesign verifier output or CI topology solely because Pass E is blocked; the output contract and parallel `verification-release` placement are otherwise sound.
- Do not introduce a generic dependency graph, cross-lane registry, or release-specific filesystem crawler.
