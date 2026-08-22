# Verify modernization finish plan

Status: **implementation passes A–G exist; final PR-level review reopened required corrections; PR publication is blocked**.

This document owns implementation packaging, pass boundaries, and final integration order. It does not redefine proof ownership or planner semantics.

Authoritative contracts:

- `docs/testing/architecture.md` — project-wide testing policy;
- `docs/testing/verify-target-architecture.md` — verifier impact/planning architecture;
- `docs/testing/verify-agent-output.md` — default agent-facing output contract;
- `docs/testing/verify-change-classification.md` — repository metadata/change-classification contract;
- `docs/testing/verify-unit-impact-correction.md` — unit-impact ownership amendment;
- `docs/testing/verify-app-e2e-discovery-correction.md` — current application-E2E physical-discovery correction;
- `docs/testing/verify-modernization.md` — implementation/benchmark record; affected rows remain provisional while review findings are open;
- `.agents/skills/verification/SKILL.md` — verification workflow;
- `.agents/skills/test-first/SKILL.md` and `.agents/skills/test-authoring/SKILL.md` — independent proof-authoring workflow.

Active findings are recorded only in the narrowest owner-local `REVIEW.md` files. They override any older completion wording in historical implementation sections until final re-review closes them.

## Goal

Deliver one coherent verifier end state in one branch / one PR:

```text
bounded agent-facing verify output
        +
precise repository metadata classification
        +
status-safe unit impact
        +
explicit mutation ownership
        +
source-impact release planning
        +
parallel release CI placement
        +
representative benchmark
```

The complete resulting system is the review boundary. Individual passes are implementation slices, not independently mergeable architectures.

## Branch / integration state

Finish branch:

```text
refactor/verify-modernization-finish
```

Current synchronized `develop` baseline:

```text
13ae220900a2a724c867b01b5eb1f045c2a1d857
```

The branch has been synchronized with `develop`. No additional branch sync prerequisite is currently known, but PR publication is blocked by the active semantic findings in `docs/testing/REVIEW.md` and `scripts/lib/REVIEW.md`.

Git/GitHub lifecycle remains architect/integration-owner responsibility. Coding and test-author agents own workspace edits and focused implementation proof only; they do not run direct Git lifecycle commands. Architecture/status/benchmark documents remain architect-owned unless an implementation task explicitly says otherwise.

## Implemented pass order and reopened corrections

### Pass A — bounded agent-facing verifier output

Implemented against `docs/testing/verify-agent-output.md`.

Current accepted state:

- routine child output is captured in `.verify/logs/**`;
- normal mode emits compact check progress and bounded heartbeat;
- heartbeat contains verifier-owned liveness only;
- failure summaries use trustworthy verifier-owned reasons where available and otherwise the exit code;
- exact logs and focused reruns remain available;
- `--verbose` is presentation/diagnostic escalation only.

No active behavioral review finding currently reopens Pass A.

### Pass B — repository change-classification precision

Implemented against `docs/testing/verify-change-classification.md`.

Current accepted state:

- confirmed repository metadata is identified by a narrow positive predicate;
- no global Markdown exclusion exists;
- `PRIVACY.md` and `docs/user/**` retain runtime ownership;
- arbitrary source-adjacent Markdown remains fail-closed;
- Storybook build ownership remains explicit and separate.

No active behavioral review finding currently reopens Pass B.

### Pass C — durable unit impact

Implementation exists against `docs/testing/verify-unit-impact-correction.md`.

Accepted core state remains:

- `scripts/lib/unitRisk.ts` owns unit impact;
- Vitest test-discovery roots are separate from repository-wide dependency-input eligibility;
- ordinary import ownership is delegated to real `vitest related`;
- exact external ownership is additive and status-aware;
- bounded repository scans use owner-specific predicates;
- runtime/tool config discovery and exact existence/absence contracts are represented explicitly;
- Playwright `*.spec.ts` remains outside ordinary Vitest ownership;
- unsafe removed/moved/global unit relations fail closed;
- no second module/dependency graph exists.

Two PR-level findings still affect completion:

1. the application-E2E inventory predicate is trustworthy only after the real app Playwright config is made root-only according to `docs/testing/verify-app-e2e-discovery-correction.md`;
2. direct Vitest test discovery in `isTestShapedPath()` must exactly match the current `vitest.config.ts` include matrix (`scripts/lib/REVIEW.md`).

The post-sync semantic external-ownership audit itself found no additional external repository-observation mechanism or relation.

### Pass D — explicit mutation ownership

Implemented against the mutation section of `docs/testing/verify-target-architecture.md`.

Current accepted state:

- one explicit high-risk registry is shared by verifier planning and Stryker configuration;
- registered source/owning-test changes select exact targets;
- unregistered adjacency does not create mutation work;
- registry/config semantic changes revalidate all registered targets or fail invalid;
- full/release verification does not automatically add mutation.

No active behavioral review finding currently reopens Pass D.

### Pass E — source-impact release planning

Implementation exists against the release section of `docs/testing/verify-target-architecture.md`.

Intended owner remains `scripts/lib/releaseRisk.ts` for:

- `release-config`;
- `build`;
- `publisher-node-import`;
- `artifact`;
- `release-smoke`;
- `managed-updates`.

`release-version` remains independent policy, runtime dependency/lockfile impact remains conservative, and release-impact execution remains one specialized verifier invocation.

However Pass E is **not complete**: the final PR-level review found that the release consumer model omits real release-container execution inputs while over-selecting ordinary unit/type-only files and does not fully validate conflicting exact mappings. The consolidated correction contract remains in `scripts/lib/REVIEW.md` and must be resolved in a separate implementation context after the application-E2E discovery correction.

### Pass F — exact-head CI integration

Implemented against the CI section of `docs/testing/verify-target-architecture.md`.

Current topology:

```text
autofix
   ├─ verification-static
   ├─ verification-browser-e2e
   ├─ verification-storybook-browser / storybook-behavior
   ├─ verification-storybook-browser / visual
   ├─ verification-release
   └─ release-version
```

`verification-release` starts directly after `autofix`, runs `pnpm verify --verbose --only release-impact`, and is required by the aggregate implementation-verification gate.

No workflow `paths` copy of release impact and no cross-job artifact transfer were introduced. The topology itself is not currently reopened; the release planner feeding the lane is.

### Pass G — representative benchmark / finish validation

The complete benchmark structure exists in `docs/testing/verify-modernization.md`, but it is **provisional** while active semantic findings remain.

Already-valid A/B/D/F representative evidence should be retained. Do not rebuild the full benchmark merely because a correction touches one owner.

The final record must refresh only evidence invalidated by the active corrections, including:

- real application Playwright discovery boundaries;
- the nested/default-test negative application cases;
- corrected release runner/proof-only consumer cases;
- the exact Vitest direct-test discovery matrix where it changes benchmark reasoning.

Exact-head CI critical-path/merge-latency remains unavailable until the PR is actually published and its final head is tested.

## Proof-author / implementer discipline

For behavior-changing correction work, the accepted sequence remains:

```text
accepted contract / TEST IMPACT
→ fresh test-author context
→ independent oracle + Must reject
→ meaningful RED where applicable
→ implementation context
→ GREEN focused proof
→ independent semantic review
```

Implementation must not change accepted assertions merely to make its own design pass. A disputed oracle returns to the test owner/architect.

Coding/test contexts do not own broad final local verification or PR CI. Architect-owned testing/architecture/status documents are not coding-agent deliverables unless explicitly assigned.

## Final review boundary

The architect reviews the complete PR, not only the final correction patch.

Semantic review must cover:

- planner ownership and dependency direction;
- physical test discovery versus declared inventories;
- fail-closed behavior;
- deletion/rename handling;
- independent proof quality;
- agent-facing output boundedness/actionability;
- release-policy separation;
- release consumer truthfulness;
- CI critical-path topology;
- complete removal of replaced inference;
- representative benchmark consistency with the final tree.

Green focused checks or green CI do not replace this review.

Current PR-level semantic review verdict is **blocked**. The open findings are owned by `docs/testing/REVIEW.md` and `scripts/lib/REVIEW.md`. PR publication must not occur until those findings are corrected and a final full-tree semantic re-review closes them.

## PR publication sequence

Current required order:

```text
application-E2E discovery correction
→ architect re-review of that owner
→ release-impact consumer correction
→ exact Vitest discovery + source/comment cleanup
→ full final semantic PR-level re-review
→ close/delete resolved REVIEW.md artifacts
→ architect refreshes affected benchmark/status documentation
→ publish PR against develop
→ apply required release-intent/version label
→ inspect exact-head CI
→ if autofix changes the PR head, review the new head and its new CI run
→ record/assess actual CI critical path in the final benchmark
→ merge-readiness decision
```

Do not treat CI from an earlier head as authoritative for a later autofix/version-materialized head.

## Completion criteria

The finish PR is implementation-complete only when:

- all active owner-local review findings are closed;
- Passes A–G satisfy the final corrected architecture;
- no known required proof can silently be missed;
- default agent output remains bounded and progress-visible;
- physical application Playwright discovery matches application registry/applicability ownership;
- unit impact no longer relies on sibling-basename inference and direct-test discovery matches Vitest config;
- mutation applicability no longer relies on adjacency;
- release-sensitive source/execution changes select truthful source-impact release proof without treating ordinary unit/type proof as release inputs;
- `release-version` remains independent;
- release proof runs in its own parallel CI lane;
- no known flake is accepted as green;
- no obsolete replaced planner/inference path remains active;
- final benchmark matches the final synchronized implementation.

Merge readiness additionally requires exact-head GitHub CI on the published PR head.

## Stop rule / deferred work

After the corrected exact-head gate is healthy, stop verifier infrastructure modernization.

Do not continue automatically with:

- additional CI jobs/workers/sharding;
- split release jobs;
- Storybook/release cross-job artifacts;
- generic dependency graphs;
- Nx/Turbo or another task runner;
- universal path/test registries;
- broad legacy-suite cleanup;
- speculative E2E optimization;
- permanent benchmark/metrics infrastructure.

Any such work requires a separate measured need and architecture decision.
