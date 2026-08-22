# Verify modernization

Status: **implementation present; Passes A–F are accepted except the application-E2E path boundary, whose architecture has been redone and is ready for one consolidated implementation pass; PR CI pending**.

Current finish branch: `refactor/verify-modernization-finish`.

Last synchronized `develop` merge-base: `13ae220900a2a724c867b01b5eb1f045c2a1d857`.

This document records current verifier-modernization implementation shape, representative selection evidence, accepted corrections, and remaining finish work. Canonical architecture remains in the documents listed below.

## Authority

- `docs/testing/architecture.md` — project-wide testing policy;
- `docs/testing/verify-target-architecture.md` — verifier impact/planning architecture;
- `docs/testing/verify-agent-output.md` — implemented agent-facing output contract;
- `docs/testing/verify-change-classification.md` — repository metadata classification;
- `docs/testing/verify-unit-impact-correction.md` — closed unit-impact correction;
- `docs/testing/verify-app-e2e-discovery-correction.md` — **ready redesigned application-E2E path-owner handoff**;
- `docs/testing/verify-e2e-planner-precision.md` — application product-scenario mapping contract;
- `docs/testing/verify-release-impact-correction.md` — closed release-impact correction;
- `docs/testing/verify-finish-plan.md` — remaining integration order;
- `scripts/lib/REVIEW.md` — active final PR-level findings;
- `.agents/skills/verification/SKILL.md` — verifier workflow.

## Goal

`pnpm verify` selects the smallest reliable proof while remaining fail-closed for uncertain impact:

```text
known irrelevant change → skip
known affected contract → focused proof
unknown significant impact → full affected lane / invalid
normal agent-facing run → bounded trustworthy result + durable detailed logs
explicit full/release request → complete project/release gate
```

Exact-head GitHub CI remains the authoritative automatic merge gate.

## Pass status

### Pass A — bounded agent-facing output

Implemented and accepted.

Default child output is captured under `.verify/logs/**`; progress/heartbeat is verifier-owned and bounded; failure reasons prefer owned semantic facts and otherwise exact exit status plus log/rerun pointers rather than guessing from arbitrary output tails. `verify-agent-output.md` is aligned with this behavior.

### Pass B — repository metadata classification

Implemented and accepted. `isNonRuntimeRepositoryMetadataPath()` remains a narrow positive fact; there is no global Markdown exclusion.

### Pass C — unit impact

Implemented and architect-reviewed.

The planner separates direct Vitest discovery from repository-wide ordinary dependency inputs and explicit external ownership. Direct Vitest discovery matches `vitest.config.ts` exactly:

```text
src/**/*.test.ts
config/**/*.test.ts
scripts/**/*.test.ts
scripts/**/*.test.mjs
tests/e2e/**/*.test.mjs
playwright.*.test.ts
eslint.config.test.ts
```

The upcoming application-E2E architecture pass changes no unit-impact semantics; it only replaces `unitRisk.ts`'s duplicate root-app inventory predicate with the shared app-E2E path owner.

### Application-E2E path ownership — architecture redone

Repeated correction rounds exposed that the invariant:

```text
application E2E = direct tests/e2e/*.spec.ts only
```

was independently implemented by several verifier/config owners. Physical Playwright collection became root-only while `e2eRisk.ts` remained broader, proving the duplicated design can drift.

Per the repository stop rule, the next pass is not another local predicate patch.

Ready target architecture:

```text
scripts/lib/appE2EPaths.ts
├─ APP_E2E_SPEC_DIR
├─ APP_E2E_TEST_MATCH
└─ isRootAppE2ESpecPath()
        │
        ├─ playwright.config.ts
        ├─ scripts/lib/e2eRisk.ts
        ├─ scripts/lib/e2eProjectApplicability.ts
        └─ scripts/lib/unitRisk.ts
```

The new module owns only file-population facts. `E2E_SCENARIO_SCOPES` remains the sole explicit product source-to-scenario mapping registry.

Required behavior includes:

```text
tests/e2e/appSmoke.spec.ts → application spec
tests/e2e/other/example.spec.ts → no application spec/support selection
tests/e2e/other/helper.ts → conservative application support
tests/e2e/example.test.ts → no application support
```

Scenario/applicability metadata referencing nested app specs must fail validation. A change to `appE2EPaths.ts` must select full application E2E.

The real Playwright collector remains an independent proof boundary; its temporary probes must become collision-safe and cleanup may remove only test-owned paths.

### Pass D — mutation ownership

Implemented and accepted. Mutation is explicit high-risk opt-in through one registry shared by verifier planning and Stryker; adjacency is not ownership.

### Pass E — release impact

Implemented and architect-reviewed. Release source-impact ownership is based on the six real release command consumers, unit/type-only paths are excluded before runtime fallbacks, malformed exact mappings fail invalid, unknown significant runtime remains fail-closed, and `release-version` remains independent policy.

### Pass F — CI integration

Implemented and accepted:

```text
autofix
   ├─ verification-static
   ├─ verification-browser-e2e
   ├─ verification-storybook-browser / storybook-behavior
   ├─ verification-storybook-browser / visual
   ├─ verification-release
   └─ release-version
```

No cross-job artifact transfer or additional release job was introduced.

## Representative selection matrix

This is semantic selection evidence, not CI wall-clock evidence. Application-E2E rows affected by the ready architecture remain provisional until implementation/review closes them.

| Case | Unit | Visual | App E2E | Storybook behavior | Mutation | Release |
| --- | --- | --- | --- | --- | --- | --- |
| `AGENTS.md` | skip | skip | skip | skip | skip | skip |
| source-adjacent unknown Markdown | skip | full | full | skip | skip | skip |
| feature source | focused + scan owners | skip | focused product E2E | skip | skip | skip |
| Material component | focused | focused | full | focused | skip | skip |
| `src/sw.ts` | focused | skip | full | skip | skip | artifact + managed-updates |
| `pnpm-lock.yaml` | full | full | full | full | skip | full six |
| `scripts/verify.ts` | focused | full | full | full | skip | full six |
| `scripts/playwrightContainer.ts` | ordinary unit ownership as applicable | full | full | full | skip | artifact + release-smoke + managed-updates |
| root app `tests/e2e/appSmoke.spec.ts` | focused inventory owners | skip | focused direct spec | skip | skip | skip |
| nested `tests/e2e/other/example.spec.ts` | no root inventory owner | skip | **target: skip** | skip | skip | skip |
| nested `tests/e2e/other/helper.ts` | ordinary unit ownership as applicable | skip | **target: full support fallback** | skip | skip | skip |
| new `scripts/lib/appE2EPaths.ts` | related unit owners | skip | **target: full infrastructure** | skip | skip | skip |
| `scripts/e2eReleaseContainer.mjs` | ordinary unit ownership as applicable | n/a | n/a | n/a | skip | artifact + release-smoke + managed-updates |
| `playwright.release.config.ts` | ordinary unit/config ownership as applicable | n/a | n/a | n/a | skip | artifact + release-smoke + managed-updates |
| release fixture `*.d.mts` | static/type ownership | n/a | n/a | n/a | skip | skip |
| unknown executable release fixture | ordinary ownership as applicable | n/a | n/a | n/a | skip | full six |

## Delegated-resolver evidence

Unit ownership continues to delegate ordinary import relations to real `vitest related`; application physical discovery is delegated to the real Playwright collector. The application-E2E correction must retain an independent `playwright test --list` proof, including a nested-path file-filter case, rather than treating the shared predicate as proof of Playwright semantics.

## Remaining finish work

1. Implement the ready shared application-E2E path owner and migrate all named consumers.
2. Make real collector probes collision-safe and prove file filters cannot bypass the configured root-only lane.
3. Architect re-review the complete application-E2E owner scope and confirm duplicate production predicates are removed.
4. Close the small remaining source/comment wording drift in `scripts/lib/REVIEW.md`.
5. Refresh only evidence/status invalidated by the implementation.
6. Run one complete semantic PR-level diff review.
7. Remove resolved `REVIEW.md` artifacts.
8. Compare with current `develop` and integrate if needed.
9. Publish PR and inspect exact-head CI.
10. Record actual CI critical path / merge latency.
11. Give merge-readiness verdict.

## CI critical path / merge latency

**Pending exact-head PR CI.** No final wall-clock claim is made before the published exact head runs.

## Stop rule

Verifier modernization stops when the remaining findings are closed, the selection matrix matches the resulting tree, the full PR-level review is clean, and exact-head CI succeeds. Further infrastructure, parallelism, sharding, task runners, dependency graphs, universal registries, or permanent benchmark systems require a separate measured need.
