# Verify modernization

Status: V1, V2A, V2B, V3A, V3B, and V3C-A are complete. The active finish line is: change-classification precision, expensive-check impact completion (unit / mutation / release), representative benchmark, then stop unless the benchmark proves another bottleneck.

`docs/testing/architecture.md` remains the canonical testing policy. `docs/testing/verify-target-architecture.md` is the resolved implementation target for all remaining verifier work. This document records progress, implementation order, and the stop criterion rather than duplicating the complete target design.

## Goal

Make `pnpm verify` fast without reducing verification quality.

Automatic verification must run only checks justified by changed-workspace impact while preserving fail-closed behavior:

```text
known irrelevant change
→ skip

known affected contract
→ focused proof

unknown but potentially significant impact
→ full affected lane / invalid

explicit full/release request
→ full project/release proof
```

The same risk-based planning semantics must serve local coding-agent feedback and exact-head GitHub CI. Coding agents own code and required proof; the architect owns PR review, exact-head CI, and merge readiness.

For CI performance, optimize the parallel **critical path / merge latency** first. Aggregate compute is secondary: do not serialize independent proof owners merely to reuse one provisioned runner or build artifact.

Modernization is not a goal by itself. Stop infrastructure work when the exit criterion below is satisfied.

## Source of truth and ownership

- `AGENTS.md` and `.agents/skills/verification/SKILL.md`: verification workflow and ownership rules;
- `docs/testing/architecture.md`: canonical proof ownership and project-wide testing policy;
- `docs/testing/verify-target-architecture.md`: complete target architecture for the remaining verifier work;
- `docs/testing/verify-change-classification.md`: implementation contract for finish PR 1;
- `docs/testing/storybook.md`: Storybook ownership and authoring policy;
- `docs/testing/migration-plan.md`: currently executable migration/discovery state;
- `scripts/verify.ts` and verifier-owned `scripts/lib/*.ts`: planning, execution, locking, and reporting implementation;
- verifier-owned tests: compatibility and planner regression proof;
- exact-head GitHub CI: authoritative automatic repository merge gate.

Repository verification tooling owns planning and execution. Product proof ownership stays with the product/test owners described by testing architecture.

## Canonical commands

```bash
pnpm verify
pnpm verify --only <label> --files <paths...>
pnpm verify --full
pnpm verify:release
pnpm verify:status
pnpm verify:resume
pnpm verify --fix-only
```

Focused local commands are implementation/diagnostic tools, not a mandatory final coding-agent handoff gate.

## Completed foundations

### V1 — native TypeScript verifier

Status: **complete**.

Verifier entrypoints and direct verifier-owned dependencies run as native Node TypeScript under the repository Node `>=24.12.0 <25` contract. V1 preserved CLI behavior, planning semantics, fail-closed behavior, locking, execution, and reporting while adding per-check and total elapsed-duration reporting.

No generic task runner, emitted tooling build, dependency graph, or verification framework was introduced.

### V2 — planner precision

Status: **complete, with one confirmed classification follow-up in finish PR 1**.

- **V2A — application E2E planner precision:** explicit product source-to-scenario mappings select focused proof; unknown relevant application source fails closed to full application E2E; proof-only files do not inherit product mappings.
- **V2B — visual planner precision:** visual impact distinguishes owner-local/focused proof from broad visual fallback and safe non-visual proof paths.

V2 established lane-specific `skip | focused | full | invalid` semantics. It did not prove every repository path purpose was classified optimally; `AGENTS.md` inside a broad runtime directory is the remaining confirmed classification defect.

### V3 — execution and proof cost

Completed:

- **V3A — application E2E project applicability:** application specs declare `desktop`, `mobile`, or `both`, removing project executions that do not prove an additional platform contract while preserving fail-safe behavior for unclassified specs.
- **V3B — Storybook build execution:** local verification can reuse one deterministic static Storybook prerequisite across behavior and visual proof. GitHub behavior and visual lanes remain independent/self-contained and may run in parallel; duplicated CI Storybook build compute is accepted unless benchmark data proves a critical-path reason to add artifact plumbing.
- **V3C-A — Lists proof ownership cleanup:** merged in PR #213 (`9427fa4aea0b4fea0c72ea4ef4dd8d94711d6121`). Lists visual proof is screenshot-only, reusable browser behavior moved to the owner-local browser spec, duplicated baselines/material-contract proof were removed, and the real focus flake was corrected. Production Lists code was unchanged.

Measured V3C-A effect:

```text
visual Playwright executions:
201 → 87

visual + Storybook browser executions:
277 → 221
```

Lists has a bounded legacy exception because it will later migrate to the canonical Mioframe Material wrapper backed privately by `@m3e/web`. Do not continue deep Lists proof idealization.

### Current exact-head browser baseline

Latest PR #213 CI observations:

```text
Application E2E:
65 tests
~7.7m Playwright runtime
~8m22s verifier lane

Storybook behavior:
58 selected MDList browser tests
~3.7m tests
~4m22s verifier lane

Visual:
~5m30s verifier lane
```

Storybook static build inside a browser lane is about 2m17s. Behavior and visual lanes are independent and parallel, so duplicated build compute is not by itself evidence of a critical-path problem.

Current develop CI also deliberately starts `verification-static`, application E2E, Storybook behavior, visual, and the independent PR `release-version` gate after `autofix` without serial dependencies between those proof owners. Preserve that property when source-impact release proof is added.

## Active finish plan

The complete expected end state and ownership are already resolved in `verify-target-architecture.md`. The slices below are implementation boundaries for coding agents, not separate architecture explorations.

### PR 1 — verifier change-classification precision

Status: **next**.

Contract: `docs/testing/verify-change-classification.md`.

Goal: eliminate confirmed repository-path false positives without weakening runtime protection.

Required shape:

```text
narrow positive repository-metadata predicate
→ app E2E / Storybook behavior / visual use it where broad ownership would misclassify metadata
→ Storybook build unchanged after explicit audit
```

Important facts:

- Markdown cannot be globally excluded: `PRIVACY.md` and `docs/user/**` are runtime inputs;
- arbitrary source-adjacent `README.md` / `ARCHITECTURE.md` / `DESIGN.md` / `REVIEW.md` are not globally metadata by basename;
- `docs/user/**` maps to the existing Help product E2E owner;
- CSS/assets and unknown source-adjacent files in broad runtime domains remain protected;
- unknown runtime-relevant impact still fails closed;
- no generic cross-lane path classifier is introduced.

### PR 2A — durable unit impact

Status: **after PR 1**.

Goal: replace sibling-basename ownership with supported Vitest related selection plus only necessary exact file-as-data mappings.

Required shape:

```text
direct changed test
→ exact external file-as-data owner when confirmed
→ existing source/test-support input
→ Vitest related

unit runner/config change
or deleted/moved relation that cannot be resolved safely
→ full unit
```

Key constraints:

- use Vitest related; do not build a persistent module graph;
- consume status-aware `ChangedPath` data for removal/move safety;
- seed exact mappings only where tests demonstrably read repository files as data, including the confirmed `PRIVACY.md` owner and bounded workflow/config relations;
- zero related tests does not suppress other lanes;
- remove old `getVitestScope()` sibling ownership only after the new resolver fully replaces it.

### PR 2B — explicit mutation ownership

Status: **after PR 2A**.

Goal: mutation only for explicitly accepted high-risk contracts.

Required shape:

```text
registered source or registered owning test changes
→ mutate exact registered source

unregistered source, even with adjacent test
→ skip
```

One mutation-specific registry is shared by verifier planning and Stryker configuration. Each target has exact source, exact owning tests, and a concrete risk reason. Adjacency scanning is removed.

The repository currently has no canonical high-risk target list; before implementation is enabled, perform one bounded audit of current useful mutation targets and seed only justified entries. This is target-data population under the resolved architecture, not permission to redesign it or preserve every current Stryker candidate.

### PR 2C — release impact + exact-head CI parity

Status: **after PR 2B**.

Goal: ordinary verify automatically selects existing release contracts when a develop-bound diff is release-sensitive, without serializing those checks behind existing independent CI proof lanes.

Keep release policy separate:

```text
release-version
→ independent branch/label/version policy gate

source impact
→ release-config | build | publisher-node-import |
   artifact | release-smoke | managed-updates
```

Required shape:

- create specialized release-impact planning over the six existing source-impact checks;
- exact known owner → focused release checks;
- unknown significant source inside a confirmed release-sensitive boundary → all source-impact release checks;
- version-only `package.json` does not expand runtime/release impact;
- runtime dependency/lockfile changes stay conservative;
- `pnpm verify:release` remains the deliberate complete release gate;
- add a specialized `release-impact` orchestration label for one selected release invocation;
- individual source-impact release labels remain focused diagnostic entry points outside `--full`; `release-version` remains policy/full-only;
- keep existing artifact reuse within one release-impact invocation;
- do not add cross-job artifact transfer.

CI parity preserves the existing post-`autofix` parallel graph by adding **one dedicated `verification-release` job**:

```text
autofix
   ├─ verification-static
   ├─ verification-browser-e2e
   ├─ storybook-behavior
   ├─ visual
   ├─ verification-release
   └─ release-version
```

`verification-release` runs `pnpm verify --verbose --only release-impact`. It must not be appended after application E2E or static verification merely to reuse an existing runner. The aggregate `verification` gate additionally requires this lane.

The dedicated release lane may remain internally sequential initially so existing artifact reuse and managed-update isolation stay simple. If the post-finish benchmark proves that release-sensitive PRs are now dominated by this lane, splitting artifact-oriented and managed-update release proof into separate parallel jobs is a later measured optimization.

## Representative benchmark after PR 2C

Do not automatically continue V3C-B/C/D/E or V3D/V3E. First benchmark representative real diff classes.

| Change | Expected verify |
| --- | --- |
| docs / AGENTS | format/static only where applicable |
| source-adjacent unknown Markdown | fail-closed owning-lane behavior; no basename-wide skip |
| local entity source | type-check + related unit; mutation only if registered |
| external file-as-data unit input | exact mapped unit proof |
| deleted/moved unit source | conservative unit fallback when previous ownership cannot be resolved |
| feature source | unit + only relevant product E2E |
| Material component | relevant component/browser/visual proof |
| shared runtime primitive | conservative affected lane |
| CSS runtime change | corresponding browser/visual proof; never skipped merely by extension |
| registered high-risk mutation source | exact mutation target only |
| unregistered source with adjacent unit test | no mutation |
| service worker / PWA / managed update source | exact release-sensitive proof in parallel release CI lane |
| runtime dependency/lockfile | conservative affected lanes including release impact |
| verifier tooling | verifier tests + conservative affected verifier lanes |

For every benchmark record:

- selected checks;
- skipped checks;
- trigger reasons;
- duration;
- false positives;
- potential false negatives;
- critical-path / merge latency;
- aggregate expensive compute.

Use critical-path time as the primary CI performance metric. Aggregate compute is a secondary cost metric and must not be reduced by making previously independent lanes serial without a measured wall-clock benefit.

## Exit criterion

Verifier modernization is complete when all of these are true:

1. every expensive check has risk-based impact selection;
2. known scope selects focused proof;
3. proven irrelevant impact skips the lane;
4. unknown significant risk selects the full affected lane or produces an invalid plan;
5. there are no known false-positive full runs such as `AGENTS.md → full E2E`;
6. ordinary `pnpm verify` has no known required proof that it can silently miss;
7. unit impact uses supported related resolution and status-safe fallback rather than sibling guesses;
8. mutation ownership is explicit high-risk opt-in rather than adjacency;
9. release-sensitive develop diffs automatically select existing release contracts while release-version stays independent;
10. coding agents have a fast focused feedback surface;
11. exact-head CI uses the same planner semantics;
12. source-impact release proof runs as its own parallel implementation lane rather than extending unrelated static/E2E/Storybook lanes;
13. known flakes are absent;
14. further test-suite/CI optimization is required only when the representative benchmark identifies a real remaining bottleneck.

Once these are satisfied, **stop verifier infrastructure modernization**.

## Deferred unless benchmark proves need

Do not start without measurement:

- further sequential cleanup of legacy Material visual suites;
- V3D-style optimization of individual expensive tests;
- extra parallelism beyond the required dedicated release-impact lane;
- splitting release-impact into artifact/managed-update jobs;
- more Playwright workers;
- additional CI jobs for performance;
- CI Storybook/release artifact transfer between runners;
- sharding;
- Nx/Turbo or another task runner;
- a generic dependency graph;
- a universal test registry;
- broad E2E scenario optimization without evidence that it remains a bottleneck.

The new `verification-release` job is not speculative V3E-style parallelism: it is the minimum execution boundary needed to add required release proof without destroying the existing independent CI critical path. Further parallelism remains inactive until measured.

## Rejected approaches

- `*.md = irrelevant`: rejected because Mioframe has runtime Markdown inputs.
- common Markdown basename = metadata: rejected because future runtime content could otherwise become a silent false negative.
- moving repository responsibility into a generic cross-lane classifier: rejected; lane-specific resolvers keep ownership explicit.
- building a custom unit dependency graph: rejected; use Vitest related plus conservative fallback/exact external-input mappings.
- mutation by neighboring test/source adjacency: rejected; mutation applies only to explicit high-risk targets.
- copying every current Stryker candidate into the new registry: rejected; historical adjacency is not risk ownership.
- full `verify:release` for every release-adjacent change: rejected when focused existing release contracts can faithfully own the changed behavior.
- treating `release-version` as source impact: rejected; version intent is independent human/release policy.
- appending release checks to `verification-browser-e2e` or `verification-static`: rejected because it serializes newly required proof behind independent existing lanes and can increase merge latency.
- workflow `paths` filters for release relevance: rejected because they duplicate `releaseRisk.ts` and can drift.
- continuing component-by-component legacy proof cleanup before measuring the post-planning bottleneck: rejected because it no longer serves the primary goal directly.

## Forbidden

- Do not weaken fail-closed behavior, tests, flaky handling, lock guards, timeouts, or invalid-plan failures to make verification faster.
- Do not globally exclude a file extension or common source-adjacent Markdown basename that can contain runtime inputs.
- Do not add a persistent generic dependency graph or generic verification DSL.
- Do not add a cross-lane registry when lane-local ownership is sufficient.
- Do not accept retry-pass/flaky classification as green proof.
- Do not infer mutation targets from adjacency.
- Do not infer PATCH/MINOR/MAJOR from source paths.
- Do not duplicate release impact classification in workflow YAML.
- Do not serialize release-impact behind static/application E2E merely to reuse setup or build work.
- Do not claim performance improvement without before/after measurement.
- Do not require coding agents to reproduce the architect-owned exact-head repository gate locally solely for handoff.
