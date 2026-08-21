# Verify modernization

Status: V1, V2A, V2B, V3A, V3B, and V3C-A are complete. Passes A-F of the finish branch (`refactor/verify-modernization-finish`) are complete and green under focused verifier-managed proof, including the `scripts/lib/REVIEW.md` (B1), `scripts/REVIEW.md` (B1), and `.github/workflows/REVIEW.md` (B1) correction-round blockers. Pass G's representative benchmark is recorded below. Exact-head CI critical-path/merge-latency evidence remains architect-owned pending the published PR.

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

### Pass G — recorded results (correction round, `refactor/verify-modernization-finish`)

This records the representative benchmark after the active correction round that resolved `scripts/lib/REVIEW.md` B1 (unit-impact ownership), `scripts/REVIEW.md` B1 (failure-detail extraction), the stale `visualRisk.test.ts` unmigrated-owner fixture, and `.github/workflows/REVIEW.md` B1 (`verification-release` timeout). Only the cases affected by these corrections were rerun; Pass B/D/E ownership was unchanged by this round and is not re-benchmarked here.

**Method:** each resolver (`resolveUnitPlan`, `resolveVisualPlan`, `resolveAppE2EPlan`, `resolveStorybookBehaviorPlan`, `resolveMutationPlan`, `resolveReleasePlan`) was invoked directly against representative changed-file sets, avoiding execution of the expensive child commands themselves (build/e2e/Playwright) since only planner correctness and timing are in scope for this round. Planner resolution time was measured locally with `performance.now()`; this is real local timing, not a CI measurement.

| Case                                                             | unit                                                                    | visual                                          | appE2E                                | storybook-behavior                                             | mutation | release                                      | planner time |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------- | -------------------------------------------------------------- | -------- | -------------------------------------------- | ------------ |
| `AGENTS.md`                                                      | skip                                                                    | skip                                            | skip                                  | skip                                                           | skip     | skip                                         | ~15ms        |
| unclassified `src/shared/ui/Example/README.md`                   | skip                                                                    | **full** (no resolvable colocated visual owner) | **full** (unmapped E2E-relevant path) | skip                                                           | skip     | skip                                         | ~6ms         |
| local entity source `src/entities/document/model/document.ts`    | **focused** (Vitest related)                                            | skip                                            | **full** (unmapped)                   | skip                                                           | skip     | skip                                         | ~6ms         |
| file-as-data `PRIVACY.md`                                        | **focused** -> `DataStoragePrivacyPane.test.ts`                         | skip                                            | skip                                  | skip                                                           | skip     | skip                                         | ~6ms         |
| root config `postcss.config.js` (B1 case)                        | **focused**, self in `relatedInputs`                                    | skip                                            | skip                                  | skip                                                           | skip     | skip                                         | ~6ms         |
| `tests/e2e/release/fixtures/managedReleaseFixture.mjs` (B1 case) | **focused**, self in `relatedInputs`                                    | skip                                            | skip                                  | skip                                                           | skip     | **focused** -> `managed-updates`             | ~5ms         |
| CSS runtime `button/tokens.css`                                  | **focused** (Vitest related; no exclusive-mapping suppression, B1 case) | **focused** -> `MDButton.visual.spec.ts`        | **full** (unmapped)                   | **focused** -> `MDButton.browser.spec.ts` + 2 shared scenarios | skip     | skip                                         | ~5ms         |
| `src/sw.ts` (managed-update runtime)                             | **focused**                                                             | skip                                            | **full** (unmapped)                   | skip                                                           | skip     | **focused** -> `artifact`, `managed-updates` | ~5ms         |
| `pnpm-lock.yaml`                                                 | **full**                                                                | **full**                                        | **full**                              | **full**                                                       | skip     | **full** (all 6 checks)                      | ~3ms         |
| `scripts/verify.ts` (verifier tooling)                           | **focused**                                                             | **full**                                        | **full**                              | **full**                                                       | skip     | **full** (all 6 checks)                      | ~3ms         |
| deleted `src/entities/foo/foo.ts`                                | **full** (deleted unit-relevant, unresolved surviving ownership)        | n/a                                             | n/a                                   | n/a                                                            | n/a      | n/a                                          | —            |

**Accepted false positives:** none newly introduced by this correction round. `pnpm-lock.yaml` and `scripts/verify.ts` correctly triggering conservative `full` across every affected lane is expected fail-closed behavior for real infrastructure/dependency changes, not a false positive.

**Potential false negatives, and their resolution:** the four B1-identified silent under-selections are confirmed fixed and re-covered by fresh proof in `scripts/lib/unitRisk.test.ts`:

- root-level imported modules (e.g. `postcss.config.js`, root Playwright config) are no longer skipped merely for living outside `src/`, `config/`, `scripts/` — ordinary-source eligibility for `vitest related` is repository-wide;
- `tests/e2e/**` non-test helpers (e.g. `managedReleaseFixture.mjs`) are now eligible the same way;
- an exact file-as-data mapping over a CSS/`.vue` source no longer suppresses that source's own real ordinary-source pass-through (`isMappedCssSource` exclusivity removed; mappings are strictly additive);
- the `.gitignore -> scripts/agentEnvironment.test.mjs` mapping was independently re-verified against the real fixed-path read in that test (not a temp fixture) and remains justified.

One new exclusion was required to avoid a regression while widening ordinary-source eligibility to repository-wide: `tests/e2e/**/*.spec.ts` Playwright specs and `package.json` are now explicitly excluded from `isOrdinaryUnitSourcePath` (previously excluded only incidentally by the removed `src/config/scripts` prefix restriction). Both exclusions are covered by existing/updated unit-planner tests. No other known false negative remains.

**Verifier output boundedness/actionability (Pass A):** `getFailureReason` no longer derives a default reason from an arbitrary output tail. Verified locally: a real TS2322 error followed by unrelated build-tool/npm-notice trailing chatter no longer surfaces that chatter as `reason`; the default fallback is the exact `exit code N`, and a genuine verifier-owned `timeout: exceeded <duration>` reason was added (independent of output content, driven by the existing `runCommand` timeout signal) so timeout failures stay actionable without any output-tail inference. Confirmed via this session's own focused `pnpm verify --only unit-tests` runs, whose own failure summaries correctly showed `reason: exit code 1` with no injected tail content.

**CI critical-path / merge latency:** explicitly **pending, architect-owned** — no PR exists yet against this branch. The `verification-release` job timeout was raised from 60 to 120 minutes (`.github/workflows/verify.yml`), driven by a measured worst-case sequential source-impact release envelope of ~103 minutes (`build` 10m + `artifact` 8m + `release-smoke` 17m + `managed-updates` 68m, per the derived `COMMAND_TIMEOUT_MS_BY_LABEL` constants in `scripts/verify.ts`) plus a 5-minute setup allowance, safely exceeding both that envelope and the prior 90-minute precedent. Real exact-head wall-clock/merge-latency numbers require the published PR's CI run.

**Aggregate expensive compute:** unchanged by this correction round — no new CI jobs, workers, or sharding were added; Pass F only raised one existing job's `timeout-minutes`.

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
