# Verify modernization

Status: V1, V2A, V2B, V3A, V3B, and V3C-A are complete. The active finish line is now: change-classification precision, expensive-check impact completion (unit / mutation / release), representative benchmark, then stop unless the benchmark proves another bottleneck.

`docs/testing/architecture.md` remains the canonical testing policy. This document records the verifier modernization architecture, implemented state, current finish plan, and exit criterion.

## Goal

Make `pnpm verify` fast without reducing verification quality.

Automatic verification must run only checks that are justified by the changed workspace impact while preserving fail-closed behavior:

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

Modernization is not a goal by itself. Stop infrastructure work when the exit criterion below is satisfied.

## Source of truth and ownership

- `AGENTS.md` and `.agents/skills/verification/SKILL.md`: verification workflow and ownership rules;
- `docs/testing/architecture.md`: proof ownership and project-wide testing policy;
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

Status: **complete, with one confirmed classification follow-up described below**.

- **V2A — application E2E planner precision:** explicit product source-to-scenario mappings select focused proof; unknown relevant application source fails closed to full application E2E; proof-only files do not inherit product mappings.
- **V2B — visual planner precision:** visual impact distinguishes owner-local/focused proof from broad visual fallback and safe non-visual proof paths.

V2 established the lane-specific `skip | focused | full | invalid` model. It did not prove that every repository path class was classified optimally; the current `AGENTS.md` false positive is the remaining concrete defect.

### V3 — execution and proof cost

Completed:

- **V3A — application E2E project applicability:** application specs declare `desktop`, `mobile`, or `both`, removing project executions that do not prove an additional platform contract while preserving fail-safe behavior for unclassified specs.
- **V3B — Storybook build execution:** local verification can reuse one deterministic static Storybook prerequisite across behavior and visual proof. GitHub behavior and visual lanes remain independent/self-contained and may run in parallel; duplicated CI Storybook build compute is accepted unless benchmark data shows it increases the critical path enough to justify extra artifact plumbing.
- **V3C-A — Lists proof ownership cleanup:** merged in PR #213 (`9427fa4aea0b4fea0c72ea4ef4dd8d94711d6121`). Lists visual proof is screenshot-only, reusable browser behavior moved to the owner-local browser spec, duplicated baselines/material-contract proof were removed, and the real focus flake was corrected. Production Lists code was unchanged.

Measured V3C-A effect:

```text
visual Playwright executions:
201 → 87

visual + Storybook browser executions:
277 → 221
```

Lists now has a bounded legacy exception because it will later migrate to the canonical Mioframe Material wrapper backed privately by `@m3e/web`. Do not continue deep Lists proof idealization.

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

## Active finish plan

### PR 1 — verifier change classification precision

Status: **next**.

Goal: eliminate confirmed repository-path false positives without weakening runtime protection.

Confirmed defect:

```text
src/shared/ui/material/AGENTS.md
→ application-E2E relevant
→ unmapped relevant source
→ full application E2E
```

The current cause is `scripts/lib/e2eRisk.ts`: broad application-E2E domains intentionally treat every non-story/non-test path under `src/app/`, `src/shared/service/`, `src/shared/serviceClient/`, `src/shared/lib/`, and `src/shared/ui/` as runtime-relevant so CSS/assets are not accidentally skipped.

The fix must classify repository/instruction metadata by **path purpose**, not by file extension.

Important repository facts:

- Markdown cannot be globally excluded: `PRIVACY.md` is imported as runtime text with `?raw`;
- `docs/user/**/*.md` is imported with `import.meta.glob(..., { query: '?raw' })` and is application runtime content;
- therefore `*.md = irrelevant` is forbidden.

Minimum path classes to cover with planner tests:

- nested/root `AGENTS.md` and `.agents/**` instruction metadata;
- architecture/testing documentation and ordinary repository README/docs metadata;
- runtime Markdown/content such as `PRIVACY.md` and `docs/user/**`;
- stories, unit tests, owner-local browser specs, and visual specs;
- runtime CSS and other non-TypeScript/Vue assets inside broad runtime domains;
- verifier/config/tooling paths with their existing full-lane semantics.

Acceptance:

- instruction-only/docs-only metadata does not select browser lanes without an owning reason;
- `src/shared/ui/material/AGENTS.md` does not select full application E2E;
- runtime CSS/assets in broad runtime domains remain protected;
- runtime Markdown/content remains protected and is not hidden by a generic extension exclusion;
- unknown runtime-relevant impact still fails closed;
- representative planner tests show the selected mode and reason for every important path class;
- no generic cross-lane path-classification framework is introduced unless an existing lane-specific mechanism is demonstrably insufficient.

### PR 2 — complete expensive-check impact planning

Status: **after PR 1**.

Keep each lane specialized. Do not create a generic planner abstraction merely to make the APIs look uniform.

#### Unit

Durable target:

```text
direct changed test
→ known deterministic local ownership
→ supported Vitest related resolution
→ cannot resolve safely
    → full unit fallback
```

Use Vitest-supported related resolution rather than building a second dependency graph.

#### Mutation

Durable target:

```text
changed path
→ explicit small high-risk mutation registry?
    yes → focused mutation
    no  → skip
```

The registry must contain exact high-risk source ownership, focused proof, and a concrete risk reason. File adjacency is not mutation ownership.

#### Release

Ordinary `pnpm verify` must resolve release-sensitive impact:

```text
changed path
→ known release-sensitive owner
    → focused required release proof

unknown release-sensitive impact
    → conservative full relevant release lane

irrelevant
    → skip
```

Release-sensitive domains include production build/release configuration, routing/base behavior, PWA/service-worker/channel isolation, release scripts/artifact assembly, and runtime dependency changes that affect production output.

`pnpm verify:release` remains the deliberate full release command; ordinary PWA changes do not automatically imply that every release check must run when narrower faithful proof is known.

## Representative benchmark after PR 2

Do not automatically continue V3C-B/C/D/E or V3D/V3E. First benchmark representative real diff classes.

| Change | Expected verify |
| --- | --- |
| docs / AGENTS | format/static only where applicable |
| local entity source | type-check + related unit; mutation only if registered |
| feature source | unit + only relevant product E2E |
| Material component | relevant component/browser/visual proof |
| shared runtime primitive | conservative affected lane |
| CSS runtime change | corresponding browser/visual proof; never skipped merely by extension |
| service worker / PWA | release-sensitive proof |
| verifier tooling | verifier tests + conservative affected verifier lanes |

For every benchmark record:

- selected checks;
- skipped checks;
- trigger reasons;
- duration;
- false positives;
- potential false negatives;
- critical-path time;
- aggregate expensive compute.

## Exit criterion

Verifier modernization is complete when all of these are true:

1. every expensive check has risk-based impact selection;
2. known scope selects focused proof;
3. proven irrelevant impact skips the lane;
4. unknown significant risk selects the full affected lane or produces an invalid plan;
5. there are no known false-positive full runs such as `AGENTS.md → full E2E`;
6. ordinary `pnpm verify` has no known required proof that it can silently miss;
7. coding agents have a fast focused feedback surface;
8. exact-head CI uses the same planner semantics;
9. known flakes are absent;
10. further test-suite optimization is required only when a benchmark identifies a real remaining bottleneck.

Once these are satisfied, **stop verifier infrastructure modernization**.

## Deferred unless benchmark proves need

Do not start without measurement:

- further sequential cleanup of legacy Material visual suites;
- V3D-style optimization of individual expensive tests;
- V3E parallelism;
- more Playwright workers;
- additional CI jobs;
- CI Storybook artifact transfer between behavior/visual runners;
- sharding;
- Nx/Turbo or another task runner;
- a generic dependency graph;
- a universal test registry;
- broad E2E scenario optimization without evidence that it remains a bottleneck.

Parallelism is specifically inactive. Reconsider it only if correct impact planning leaves an irreducible critical-path bottleneck whose measured wall-clock benefit justifies added compute and complexity.

## Rejected approaches

- `*.md = irrelevant`: rejected because Mioframe has runtime Markdown inputs.
- moving repository responsibility into a generic cross-lane classifier without a current need: rejected; lane-specific resolvers keep ownership explicit.
- building a custom unit dependency graph: rejected; use supported Vitest related resolution plus conservative fallback.
- mutation by neighboring test/source adjacency: rejected; mutation applies only to explicit high-risk targets.
- full `verify:release` for every release-adjacent change: rejected when focused release proof can faithfully own the changed contract.
- continuing component-by-component legacy proof cleanup before measuring the post-planning bottleneck: rejected because it no longer serves the primary goal directly.
- adding workers/jobs/sharding solely because aggregate CI work is duplicated: rejected unless critical-path improvement is measured and worth the complexity.

## Forbidden

- Do not weaken fail-closed behavior, tests, flaky handling, lock guards, timeouts, or invalid-plan failures to make verification faster.
- Do not globally exclude a file extension that currently contains runtime inputs.
- Do not add a persistent generic dependency graph or generic verification DSL.
- Do not add a cross-lane registry when lane-local ownership is sufficient.
- Do not accept retry-pass/flaky classification as green proof.
- Do not claim performance improvement without before/after measurement.
- Do not require coding agents to reproduce the architect-owned exact-head repository gate locally solely for handoff.
