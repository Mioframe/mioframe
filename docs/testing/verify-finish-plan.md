# Verify modernization finish plan

Status: **implementation passes A–G complete; final PR publication and exact-head CI pending**.

This document owns implementation packaging, pass boundaries, and final integration order. It does not redefine proof ownership or planner semantics.

Authoritative contracts:

- `docs/testing/architecture.md` — project-wide testing policy;
- `docs/testing/verify-target-architecture.md` — verifier impact/planning architecture;
- `docs/testing/verify-agent-output.md` — default agent-facing output contract;
- `docs/testing/verify-change-classification.md` — repository metadata/change-classification contract;
- `docs/testing/verify-unit-impact-correction.md` — final unit-impact ownership amendment;
- `docs/testing/verify-modernization.md` — final implementation/benchmark record;
- `.agents/skills/verification/SKILL.md` — verification workflow;
- `.agents/skills/test-first/SKILL.md` and `.agents/skills/test-authoring/SKILL.md` — independent proof-authoring workflow.

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

The branch has been synchronized with `develop`; no further sync prerequisite is currently known before PR publication.

Git/GitHub lifecycle remains architect/integration-owner responsibility. Coding and test-author agents own workspace edits and focused implementation proof only; they do not run direct Git lifecycle commands.

## Completed pass order

### Pass A — bounded agent-facing verifier output

Completed against `docs/testing/verify-agent-output.md`.

Final state:

- routine child output is captured in `.verify/logs/**`;
- normal mode emits compact check progress and bounded heartbeat;
- heartbeat contains verifier-owned liveness only;
- failure summaries use trustworthy verifier-owned reasons where available and otherwise the exit code;
- exact logs and focused reruns remain available;
- `--verbose` is presentation/diagnostic escalation only.

### Pass B — repository change-classification precision

Completed against `docs/testing/verify-change-classification.md`.

Final state:

- confirmed repository metadata is identified by a narrow positive predicate;
- no global Markdown exclusion exists;
- `PRIVACY.md` and `docs/user/**` retain runtime ownership;
- arbitrary source-adjacent Markdown remains fail-closed;
- Storybook build ownership remains explicit and separate.

### Pass C — durable unit impact

Completed against `docs/testing/verify-unit-impact-correction.md`.

Final state:

- `scripts/lib/unitRisk.ts` owns unit impact;
- Vitest test-discovery roots are separate from repository-wide dependency-input eligibility;
- ordinary import ownership is delegated to real `vitest related`;
- exact external ownership is additive and status-aware;
- bounded repository scans have narrow predicates matching the owning tests' actual inventory;
- runtime/tool config discovery and exact existence/absence contracts are represented explicitly;
- Playwright `*.spec.ts` remains outside ordinary Vitest ownership;
- unsafe removed/moved/global unit relations fail closed;
- no second module/dependency graph exists.

Post-sync semantic external-ownership audit found no new ownership mechanism or relation requiring planner expansion.

### Pass D — explicit mutation ownership

Completed against the mutation section of `docs/testing/verify-target-architecture.md`.

Final state:

- one explicit high-risk registry is shared by verifier planning and Stryker configuration;
- registered source/owning-test changes select exact targets;
- unregistered adjacency does not create mutation work;
- registry/config semantic changes revalidate all registered targets or fail invalid;
- full/release verification does not automatically add mutation.

### Pass E — source-impact release planning

Completed against the release section of `docs/testing/verify-target-architecture.md`.

Final state:

- `scripts/lib/releaseRisk.ts` owns six source-impact release contracts:
  - `release-config`;
  - `build`;
  - `publisher-node-import`;
  - `artifact`;
  - `release-smoke`;
  - `managed-updates`;
- `release-version` remains independent policy;
- known ownership selects narrow checks;
- unknown significant release-sensitive impact fails closed;
- runtime dependency/lockfile impact remains conservative;
- release-impact execution uses one specialized verifier invocation.

### Pass F — exact-head CI integration

Completed against the CI section of `docs/testing/verify-target-architecture.md`.

Final topology:

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

No workflow `paths` copy of release impact and no cross-job artifact transfer were introduced.

### Pass G — representative benchmark / finish validation

Completed and recorded in `docs/testing/verify-modernization.md`.

The final benchmark covers every canonical representative class and the distinct Pass C ownership mechanisms, including:

- docs / `AGENTS.md`;
- unknown source-adjacent Markdown;
- local entity source;
- file-as-data/external input;
- deleted/moved unit source;
- feature source;
- Material component;
- CSS runtime change;
- registered mutation source;
- unregistered adjacent mutation source;
- managed-update/PWA source;
- runtime dependency/lockfile;
- verifier tooling;
- root imported config;
- runtime-discovered config;
- Playwright inventory scan;
- exact absence/existence ownership;
- import owner retained after redundant external metadata removal.

Final correction-specific benchmark cases additionally prove status-aware delete/rename ownership, exact Playwright inventory boundaries, and one production source introduced by the synchronized `develop` baseline.

## Proof-author / implementer discipline

For behavior-changing pass work, accepted sequence remains:

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

Coding/test contexts do not own broad final local verification or PR CI.

## Final review boundary

The architect reviews the complete PR, not only the final correction patch.

Semantic review must cover:

- planner ownership and dependency direction;
- fail-closed behavior;
- deletion/rename handling;
- independent proof quality;
- agent-facing output boundedness/actionability;
- release-policy separation;
- CI critical-path topology;
- complete removal of replaced inference;
- representative benchmark consistency with the final tree.

Green focused checks or green CI do not replace this review.

The current implementation has completed semantic A–G review with no known runtime/ownership blocker. Exact-head PR CI remains the final automatic gate.

## PR publication sequence

After documentation closure:

```text
final branch/diff inspection
→ publish PR against develop
→ apply required release-intent/version label
→ inspect exact-head CI
→ if autofix changes the PR head, review the new head and its new CI run
→ record/assess actual CI critical path in the final benchmark
→ merge-readiness decision
```

Do not treat CI from an earlier head as authoritative for a later autofix/version-materialized head.

## Completion criteria

The finish PR is implementation-complete when:

- Passes A–G are complete;
- no known required proof can silently be missed;
- default agent output remains bounded and progress-visible;
- unit impact no longer relies on sibling-basename inference;
- mutation applicability no longer relies on adjacency;
- release-sensitive source changes select source-impact release proof;
- `release-version` remains independent;
- release proof runs in its own parallel CI lane;
- no known flake is accepted as green;
- no obsolete replaced planner/inference path remains active;
- final benchmark matches the final synchronized implementation.

Merge readiness additionally requires exact-head GitHub CI on the published PR head.

## Stop rule / deferred work

After the exact-head gate is healthy, stop verifier infrastructure modernization.

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
