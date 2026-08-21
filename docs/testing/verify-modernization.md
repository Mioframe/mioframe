# Verify modernization

Status: V1, V2A, V2B, V3A, V3B, and V3C-A are complete. Passes A-F of the finish branch (`refactor/verify-modernization-finish`) are complete and green under focused verifier-managed proof, including the `scripts/lib/REVIEW.md` (B1), `scripts/REVIEW.md` (B1), `.github/workflows/REVIEW.md` (B1), and the final `docs/testing/verify-unit-impact-correction.md` seven-mechanism unit-ownership correction round. Pass G's complete final benchmark is recorded below. Exact-head CI critical-path/merge-latency evidence remains architect-owned pending the published PR.

Source documents:

- `docs/testing/architecture.md` — canonical testing policy;
- `docs/testing/verify-target-architecture.md` — resolved impact/planning architecture;
- `docs/testing/verify-agent-output.md` — resolved agent-facing output contract;
- `docs/testing/verify-change-classification.md` — repository metadata/change-classification contract;
- `docs/testing/verify-finish-plan.md` — one-PR packaging and pass order;
- `.agents/skills/verification/SKILL.md` — verifier workflow and ownership.

Older `PR 0`, `PR 1`, `PR 2A`, `PR 2B`, and `PR 2C` labels in verifier design history identify logical slices only. They are no longer separate merge units.

## Goal

Make `pnpm verify` fast, reliable, fail-closed, and cheap for coding-agent context.

Target behavior:

```text
known irrelevant change
→ skip

known affected contract
→ focused proof

unknown but potentially significant impact
→ full affected lane / invalid

normal agent-facing execution
→ bounded progress + bounded actionable result
→ detailed diagnostics only by log/explicit verbose escalation

explicit full/release request
→ complete project/release proof
```

The same impact semantics serve local coding-agent feedback and exact-head GitHub CI. Coding agents own code and required proof; the architect owns PR publication, exact-head CI review, semantic review, and merge readiness.

For CI performance, optimize **wall-clock merge latency / critical path** before aggregate compute. Do not serialize independent proof owners merely to reuse setup/build work.

Modernization is not a goal by itself. Stop when the exit criterion is satisfied.

## Completed foundations

### V1 — native TypeScript verifier

Complete. Verifier entrypoints run as native Node TypeScript under the repository Node contract. Existing planning, locking, failure handling, timing, and log persistence are established foundations.

### V2 — planner precision

Complete except for the confirmed repository-metadata classification follow-up included in the finish PR.

- application E2E uses explicit product scenario ownership with fail-closed full fallback;
- visual planning distinguishes focused owner-local proof from broad fallback;
- lane planning uses inspectable `skip | focused | full | invalid` semantics.

### V3 — execution/proof cost

Completed:

- application E2E project applicability (`desktop | mobile | both`);
- local Storybook static-build reuse while CI behavior/visual lanes remain parallel/self-contained;
- Lists proof ownership cleanup in PR #213 (`9427fa4aea0b4fea0c72ea4ef4dd8d94711d6121`).

Measured V3C-A effect:

```text
visual Playwright executions: 201 → 87
visual + Storybook browser executions: 277 → 221
```

Latest known PR #213 browser baseline:

```text
Application E2E: ~8m22s verifier lane
Storybook behavior: ~4m22s verifier lane
Visual: ~5m30s verifier lane
Storybook static build inside a browser lane: ~2m17s
```

Behavior and visual lanes are independent and parallel. Duplicate build compute alone is not a reason to introduce cross-job artifact plumbing.

## Active finish implementation

Packaging and pass order are canonical in `docs/testing/verify-finish-plan.md`.

One branch / one PR:

```text
Pass A — bounded agent-facing output
Pass B — repository metadata/change classification
Pass C — durable unit impact
Pass D — explicit mutation ownership
Pass E — release impact planning
Pass F — exact-head CI integration
Pass G — representative benchmark / finish validation
```

These are bounded implementation passes, not separate architecture decisions or separate PRs.

### Pass A — bounded agent-facing output

Contract: `docs/testing/verify-agent-output.md`.

Key target:

- ordinary child stdout/stderr stays in `.verify/logs/**`;
- normal output shows compact runnable-check progress and long-check heartbeat;
- heartbeat does not repeat arbitrary child output;
- failure output gives the owning check, bounded actionable reason/excerpt, exact log path, and focused rerun;
- normal success output stays compact;
- `--verbose` changes presentation only.

Implement first so later passes use the bounded feedback surface themselves.

### Pass B — change classification

Contract: `docs/testing/verify-change-classification.md`.

Key target:

- narrow positive repository-metadata predicate;
- no global `*.md` exclusion;
- no generic Markdown-basename metadata rule;
- `PRIVACY.md` and `docs/user/**` remain runtime inputs;
- Help docs map to existing Help product E2E;
- E2E/Storybook behavior/visual use the metadata fact only where broad directory ownership would otherwise misclassify it;
- Storybook build remains unchanged after audit.

### Pass C — durable unit impact

Target from `docs/testing/verify-target-architecture.md`:

- `scripts/lib/unitRisk.ts` owns unit impact;
- status-aware deletion/rename safety;
- direct changed tests select themselves;
- ordinary source/test-support uses supported Vitest related resolution;
- exact file-as-data mappings only for verified consumers, including `PRIVACY.md -> DataStoragePrivacyPane.test.ts`;
- bounded audit seeds only confirmed workflow/config file-as-data relations;
- actual unit-global infrastructure and unresolved deleted/moved relations use full fallback;
- zero related tests is reportable and not itself full;
- remove sibling-basename `getVitestScope()` after replacement;
- no custom dependency graph.

### Pass D — explicit mutation ownership

Target from `docs/testing/verify-target-architecture.md`:

- one mutation-specific registry shared by verifier and Stryker;
- exact source + exact tests + concrete risk reason;
- bounded audit retains only justified high-risk targets;
- registered source/test changes select exact source;
- unregistered adjacency skips mutation;
- invalid registry fails closed;
- full/release does not automatically add mutation;
- remove adjacency inference after replacement.

### Pass E — release impact planning

Target from `docs/testing/verify-target-architecture.md`:

Source-impact release checks:

```text
release-config
build
publisher-node-import
artifact
release-smoke
managed-updates
```

`release-version` remains independent release policy.

Known source ownership selects exact checks; unknown significant impact inside confirmed release-sensitive boundaries selects all six. Version-only `package.json` does not create source-impact release work. Runtime dependency/lockfile impact remains conservative. Existing artifact reuse stays inside the release-impact invocation.

### Pass F — CI integration

Preserve parallel post-`autofix` ownership:

```text
autofix
   ├─ verification-static
   ├─ verification-browser-e2e
   ├─ verification-storybook-browser / storybook-behavior
   ├─ verification-storybook-browser / visual
   ├─ verification-release
   └─ release-version
```

`verification-release` starts directly after `autofix`, runs the specialized release-impact verifier surface, and becomes an independent requirement of the aggregate verification gate.

Do not duplicate release path classification in workflow YAML and do not add cross-job artifact transfer.

### Pass G — benchmark

After A–F, benchmark representative diff classes and record:

- selected/skipped checks;
- trigger reasons;
- duration;
- false positives;
- potential false negatives;
- critical-path / merge latency;
- aggregate expensive compute;
- default verifier output boundedness/liveness/actionability.

Representative classes:

| Change                                   | Expected behavior                                                    |
| ---------------------------------------- | -------------------------------------------------------------------- |
| docs / `AGENTS.md`                       | static/format only where applicable; no broad browser false positive |
| source-adjacent unknown Markdown         | fail closed to owning runtime lane; no basename-wide skip            |
| local entity source                      | type-check + related unit; mutation only if registered               |
| file-as-data input                       | exact mapped unit owner                                              |
| deleted/moved unit source                | conservative status-safe unit fallback                               |
| feature source                           | unit + only relevant product E2E                                     |
| Material component                       | relevant component/browser/visual proof                              |
| CSS runtime change                       | browser/visual proof where owned; never extension-skipped            |
| registered mutation source               | exact mutation target                                                |
| unregistered adjacent source             | no mutation                                                          |
| service-worker/PWA/managed-update source | exact release-sensitive proof in parallel release lane               |
| runtime dependency/lockfile              | conservative affected lanes including release impact                 |
| verifier tooling                         | verifier-owned proof + conservative affected verifier lanes          |

The benchmark is evidence for the stop decision, not permission to begin more infrastructure work automatically.

### Pass G — final complete benchmark (`refactor/verify-modernization-finish`)

This replaces the correction-subset benchmark with the complete final A-G representative record, taken after the Pass C ownership-mechanism correction that resolved `scripts/lib/REVIEW.md` B1 and `docs/testing/REVIEW.md` B1 (the full seven-mechanism unit-ownership model in `docs/testing/verify-unit-impact-correction.md`). It covers every canonical representative class from the table above plus the Pass C mechanism cases required by the correction. Pass B/D/E ownership logic was not changed by the Pass C correction; their resolver behavior below is recorded as current final state, not re-derived.

**Method:** each resolver (`resolveUnitPlan`, `resolveVisualPlan`, `resolveAppE2EPlan`, `resolveStorybookBehaviorPlan`, `resolveMutationPlan`, `resolveReleasePlan`) was invoked directly against representative changed-file sets, avoiding execution of the expensive child commands themselves (build/E2E/Playwright/mutation), since only planner correctness and timing are in scope for a repository-wide sweep. Planner resolution time was measured locally with `performance.now()`; this is real local planner timing, not a CI measurement. Separately, for the unit lane specifically, the mandatory delegated-resolver mechanisms were additionally proven through the REAL focused verifier (`pnpm verify --only unit-tests --files <path>`), which executes the actual `vitest related` invocation end-to-end against the real repository — see "Real unit resolver proof" below; those are not planner-only claims.

| Case                                                                     | unit                                                                                                                                                  | visual                                          | appE2E                                              | storybook-behavior                                                                              | mutation                                                 | release                                      | planner time |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------- | ------------ |
| `AGENTS.md`                                                              | skip                                                                                                                                                  | skip                                            | skip                                                | skip (`none`)                                                                                   | skip                                                     | skip                                         | ~14ms        |
| unclassified `src/shared/ui/Example/README.md`                           | skip                                                                                                                                                  | **full** (no resolvable colocated visual owner) | **full** (unmapped E2E-relevant path)               | skip (`none`)                                                                                   | skip                                                     | skip                                         | ~6ms         |
| local entity source `src/entities/document/model/document.ts`            | **focused** -> self + 2 bounded-scan owners (`readRecoveryImportBoundary.test.ts`, `rendererBoundary.test.ts`)                                        | skip                                            | **full** (unmapped)                                 | skip (`none`)                                                                                   | skip                                                     | skip                                         | ~6ms         |
| file-as-data `PRIVACY.md`                                                | **focused** -> `DataStoragePrivacyPane.test.ts`                                                                                                       | skip                                            | skip                                                | skip (`none`)                                                                                   | skip                                                     | skip                                         | ~6ms         |
| deleted/moved unit source `src/entities/foo/foo.ts`                      | **full** (deleted unit-relevant, unresolved surviving ownership)                                                                                      | skip                                            | **full** (unmapped)                                 | skip (`none`)                                                                                   | skip                                                     | skip                                         | ~5ms         |
| feature source `src/features/documentCreate/index.ts`                    | **focused** -> self + `fileSystemAccessImportBoundary.test.ts` (scan) + 2 other scan owners                                                           | skip                                            | **focused** -> `repositoryFlows.spec.ts`            | skip (`none`)                                                                                   | skip                                                     | skip                                         | ~5ms         |
| Material component `MDButton.vue`                                        | **focused** -> self + `readRecoveryImportBoundary.test.ts` (scan)                                                                                     | **focused** -> `MDButton.visual.spec.ts`        | **full** (unmapped)                                 | **focused** -> `MDButton.browser.spec.ts` + `focusIndicator.spec.ts`                            | skip                                                     | skip                                         | ~5ms         |
| CSS runtime / Material component-token scan `button/tokens.css`          | **focused** -> self (ordinary import) + `foundation/tokens.test.ts` (scan)                                                                            | **focused** -> `MDButton.visual.spec.ts`        | **full** (unmapped)                                 | **focused** -> `MDButton.browser.spec.ts` + `colorOwnership.spec.ts` + `focusIndicator.spec.ts` | skip                                                     | skip                                         | ~6ms         |
| registered mutation source `reorderArray.ts`                             | **focused** -> self + 2 scan owners                                                                                                                   | skip                                            | **full** (unmapped)                                 | **focused** -> 4 colocated Reorder browser specs (owner-directory ownership)                    | **focused** -> exact registered source                   | skip                                         | ~5ms         |
| unregistered adjacent mutation source `reorderGestureProfile.ts`         | **focused** -> self + 2 scan owners                                                                                                                   | skip                                            | **focused** -> `databaseViewsAndQueryFlows.spec.ts` | skip (`none`)                                                                                   | **skip** (unregistered adjacency correctly not promoted) | skip                                         | ~6ms         |
| managed-update/PWA source `src/sw.ts`                                    | **focused** -> self + 2 scan owners                                                                                                                   | skip                                            | **full** (unmapped)                                 | skip (`none`)                                                                                   | skip                                                     | **focused** -> `artifact`, `managed-updates` | ~5ms         |
| dependency/lockfile `pnpm-lock.yaml`                                     | **full**                                                                                                                                              | **full**                                        | **full**                                            | **full**                                                                                        | skip                                                     | **full** (all 6 source-impact checks)        | ~3ms         |
| verifier tooling `scripts/verify.ts`                                     | **focused** -> self only (no scan predicate matches a root `.ts` path)                                                                                | **full**                                        | **full**                                            | **full**                                                                                        | skip                                                     | **full** (all 6 source-impact checks)        | ~3ms         |
| root ordinary imported config `postcss.config.js`                        | **focused** -> self only (planner); real resolver additionally selects `config/postcss.config.test.ts`                                                | skip                                            | skip                                                | skip (`none`)                                                                                   | skip                                                     | skip                                         | ~6ms         |
| runtime-discovered ESLint config `eslint.config.mjs`                     | **focused** -> self + `eslint.config.test.ts` (mechanism 4)                                                                                           | skip                                            | skip                                                | skip (`none`)                                                                                   | skip                                                     | skip                                         | ~5ms         |
| Playwright inventory scan `tests/e2e/appSmoke.spec.ts`                   | **focused** -> `playwright.lanes.test.ts`, `e2eRisk.test.ts`, `e2eProjectApplicability.test.ts` (never the spec itself, mechanism 5)                  | skip                                            | **focused** -> itself (direct changed spec)         | skip (`none`)                                                                                   | skip                                                     | skip                                         | ~6ms         |
| exact existence/absence ownership `src/shared/lib/md/tokens.css` (added) | **focused** -> self + `foundation/tokens.test.ts` (mechanism 6) + `rendererBoundary.test.ts` (scan)                                                   | **full** (no resolvable colocated visual owner) | **full** (unmapped)                                 | skip (`none`)                                                                                   | skip                                                     | skip                                         | ~5ms         |
| ordinary import owner after redundant metadata removal `vite.config.ts`  | **focused** -> self + `config/viteConfigFixtureImport.test.ts` (planner); real resolver additionally selects `scripts/release/viteBuildDate.test.mjs` | **full**                                        | **full**                                            | skip (`none`)                                                                                   | skip                                                     | **full** (all 6 source-impact checks)        | ~5ms         |

### Real unit resolver proof

Pure planner assertions cannot prove what `vitest related` actually resolves through the real module graph. The following were proven through the real focused verifier invocation (`pnpm verify --only unit-tests --files <path>`), reading the exact `vitest related <inputs>` command line and test-result output from `.verify/logs/unit-tests.log`:

- `postcss.config.js` -> real `vitest related` selects `config/postcss.config.test.ts` (3 assertions passed);
- `vite.config.ts` -> after removing the redundant `scripts/release/viteBuildDate.test.mjs` external mapping, the real invocation is `vitest related config/viteConfigFixtureImport.test.ts vite.config.ts`, and `viteBuildDate.test.mjs` is still selected and passes (6 assertions), proving the real ES-import edge alone reaches it — the mapping removal did not create a false negative;
- `eslint.config.mjs` -> real invocation `vitest related eslint.config.mjs eslint.config.test.ts` runs and passes all 18 `eslint.config.mjs m3e renderer boundary`/`private verifier implementation documentation` assertions, proving the runtime/tool-discovery mapping (mechanism 4) reaches a test with no ES import edge to it;
- `.github/workflows/verify.yml` -> real invocation selects all five owners (`scripts/ciAutofix.test.ts`, `scripts/release/buildDateWorkflow.test.mjs`, `scripts/release/managedDeploymentValidationWorkflow.test.mjs`, `scripts/release/materializePrVersionWorkflow.test.mjs`, `scripts/verify.test.ts`), including the newly added `scripts/verify.test.ts` owner (its `verification-release CI job timeout envelope` describe block: 3/3 assertions passed);
- `src/features/documentCreate/index.ts` -> real invocation additionally selects `src/features/fileSystemAccessImportBoundary.test.ts` (bounded scan, mechanism 5), which passes both its boundary assertions;
- `src/shared/ui/material/components/button/tokens.css` -> real invocation selects both `src/shared/ui/material/components/button/MDButton.test.ts` (ordinary import, 8 assertions passed) and `src/shared/ui/material/foundation/tokens.test.ts` (bounded scan, mechanism 5; token-ownership assertions passed), proving the two mechanisms are additive, not exclusive;
- `tests/e2e/appSmoke.spec.ts` -> real invocation is `vitest related playwright.lanes.test.ts scripts/lib/e2eProjectApplicability.test.ts scripts/lib/e2eRisk.test.ts` (the spec path itself never passed to Vitest), confirming Playwright inventory scan ownership (mechanism 5) without crossing the Playwright/Vitest ownership boundary.

### Accepted false positives / conservative over-selection

- `pnpm-lock.yaml` and `scripts/verify.ts` correctly triggering conservative `full` across every affected lane is expected fail-closed behavior for real infrastructure/dependency changes, not a false positive.
- `src/readRecoveryImportBoundary.test.ts`'s bounded-scan predicate (every non-test `src/**/*.{ts,vue}`) and `src/shared/ui/material/rendererBoundary.test.ts`'s predicate (every `src/**/*.{css,vue,ts,mts,tsx}` outside `src/shared/ui/material/**`, with no `.test.` exclusion) are each genuinely broad: most `src/**` changes now additionally select one or both of these scan-owner tests. This is accepted conservative over-selection, not a defect — each predicate mirrors the real, already-existing scan the owning test performs (confirmed by direct read), so the extra selection is truthful, not fabricated; it is cheap (one additional focused Vitest file per lane run, never a full-suite fallback), and removing it would silently under-select those two real boundary owners for the majority of the population they actually observe.
- A colocated Playwright spec (`*.browser.spec.ts`, `*.visual.spec.ts`) or any `tests/e2e/**/*.spec.ts` path now selects its real scan-owner test(s) (`playwright.lanes.test.ts` and, where applicable, `storybookBehaviorRisk.test.ts` / `visualRisk.test.ts` / `e2eRisk.test.ts` / `e2eProjectApplicability.test.ts`) in the unit lane, in addition to whatever the Storybook-behavior/visual/appE2E lanes already select for the same path independently. This is intentional additive ownership (mechanism 5), not duplication of proof — the unit-lane test and the browser-lane test verify different contracts (registry/inventory correctness vs. rendered behavior).
- `src/shared/lib/md/tokens.css` (currently absent) resolving to `full` in the visual/appE2E lanes if it were ever added is expected fail-closed behavior for an unmapped, unmigrated visual-relevant path; it is unrelated to the unit lane's mechanism-6 existence/absence mapping, which correctly stays narrowly scoped to `foundation/tokens.test.ts`.

### Potential false negatives, and their resolution

The Pass C correction closed every false negative identified in `scripts/lib/REVIEW.md` B1 / `docs/testing/REVIEW.md` B1:

- `eslint.config.mjs -> eslint.config.test.ts` (runtime/tool discovery, mechanism 4) was previously invisible to the planner entirely; now mapped and proven through the real resolver above;
- `.github/workflows/verify.yml -> scripts/verify.test.ts` (introduced on the finish branch itself, mechanism 3) was previously missing from the external mapping; now added and proven;
- the five bounded-scan owners newly represented (`readRecoveryImportBoundary.test.ts`, `fileSystemAccessImportBoundary.test.ts`, `rendererBoundary.test.ts`, `foundation/tokens.test.ts`'s component-token scan, `playwright.lanes.test.ts`) and the four inventory/registry-validation scan owners (`e2eRisk.test.ts`, `e2eProjectApplicability.test.ts`, `storybookBehaviorRisk.test.ts`, `visualRisk.test.ts`) were previously silently unreachable from unit planning for any path in their real scanned population outside the import graph; all nine are now represented with narrow local predicates mirroring their real production scan code (confirmed by direct read, not inferred) and proven through both pure planner assertions (`scripts/lib/unitRisk.test.ts`) and, for the highest-risk cases, the real focused verifier invocation above;
- `src/shared/lib/md/tokens.css` (exact existence/absence ownership, mechanism 6) was previously invisible to unit planning entirely; a resurrection of this forbidden legacy path is now caught.

One redundancy was also removed rather than added: `vite.config.ts -> scripts/release/viteBuildDate.test.mjs` was a duplicate exact mapping over an already-import-reachable owner (violates decision #4, "an import-reachable owner being redundantly required through external metadata"); its removal was proven not to introduce a false negative via the real resolver invocation above.

No other known false negative remains in the unit lane. Pass B/D/E ownership was not touched by this correction and carries forward its previously recorded false-negative-free status.

### Verifier output boundedness/actionability (Pass A)

`getFailureReason` does not derive a default reason from an arbitrary output tail; the default fallback is the exact `exit code N`, and a genuine verifier-owned `timeout: exceeded <duration>` reason exists independent of output content. Reconfirmed via this session's own focused `pnpm verify --only unit-tests` runs (a dozen-plus real invocations during Pass C implementation and probing), whose failure/success summaries stayed compact and accurate throughout.

### CI critical-path / merge latency

Explicitly **pending, architect-owned** — no PR exists yet against this branch. The `verification-release` job timeout remains 120 minutes (`.github/workflows/verify.yml`), sized against the measured worst-case sequential source-impact release envelope (`build` 10m + `artifact` 8m + `release-smoke` 17m + `managed-updates` 68m, ~103 minutes) plus a 5-minute setup allowance. Real exact-head wall-clock/merge-latency numbers require the published PR's CI run.

### Aggregate expensive compute

Unchanged by the Pass C correction — no new CI jobs, workers, or sharding were added; only `scripts/lib/unitRisk.ts`'s in-process planner logic changed. Every added case above resolves in single-digit milliseconds locally; the aggregate planner cost of the finish branch remains negligible relative to any expensive child command it selects.

## Exit criterion

Verifier modernization is complete when all are true:

1. every expensive proof lane has reliable impact selection;
2. known ownership selects focused proof;
3. proven irrelevant impact skips;
4. unknown significant impact uses full affected lane or invalid;
5. no known false-positive full runs such as `AGENTS.md -> full E2E` remain;
6. ordinary `pnpm verify` has no known required proof it can silently miss;
7. unit impact uses supported related resolution plus status-safe fallback;
8. mutation ownership is explicit high-risk opt-in;
9. release-sensitive develop diffs select source-impact release proof while `release-version` stays independent;
10. coding agents have a fast focused feedback surface;
11. default output is bounded and does not stream/repeat routine child diagnostics;
12. long checks remain visibly alive without fake progress;
13. failures point to concise actionable information, exact detailed log, and focused rerun;
14. exact-head CI uses the same planner semantics;
15. release proof runs as its own parallel CI lane;
16. known flakes are absent;
17. the representative benchmark identifies no remaining verifier-infrastructure problem that materially affects correctness or merge critical path.

Once satisfied, **stop verifier infrastructure modernization**.

## Deferred unless the benchmark proves need

Do not start automatically:

- more verifier/CI parallelism beyond the dedicated release lane;
- split release jobs;
- Storybook/release cross-job artifacts;
- more Playwright workers or sharding;
- Nx/Turbo or another task runner;
- generic dependency graphs;
- universal path/test registries;
- broad legacy suite cleanup;
- speculative E2E optimization.

## Rejected / forbidden

- No global `*.md = irrelevant` rule.
- No common-Markdown-basename metadata rule.
- No generic cross-lane classifier/DSL for symmetry.
- No custom persistent unit dependency graph.
- No mutation-by-adjacency ownership.
- No copying every historical Stryker candidate into the new registry.
- No source-impact inference for `release-version`.
- No workflow `paths` duplicate of `releaseRisk.ts`.
- No serialization of release-impact behind static/E2E just to reuse setup/build.
- No raw child-output streaming or repeated child-output heartbeat in normal agent mode.
- No retry-pass/flaky classification as green proof.
- No weakening fail-closed behavior, timeouts, locks, tests, or proof to improve speed.
- No performance claim without before/after evidence.
- No mandatory broad local verification ritual for coding-agent handoff; exact-head CI remains architect-owned.
