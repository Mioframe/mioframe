# Testing architecture migration plan

`docs/testing/architecture.md` is the durable testing and verification contract. This file records only the current executable migration state; detailed intermediate pass history remains in the `verify-redesign-*` records and Git history.

## Status

On `architecture/verify-redesign` / PR #218, the verify redesign is **not currently merge-ready**.

Historical pass status remains:

- **Pass A:** architect-accepted;
- **Pass B:** architect-accepted;
- **Pass C:** architect-accepted;
- **Pass D:** architect-accepted at `c0aa686235d291089d413b77c4b5fe176acc07b3`;
- **Pass E:** architect-accepted on reviewed implementation head `60a097a077cb834e4cab28f5a2a8fad616ff77fd`;
- **Pass F:** previously accepted on its bounded public-compatibility scope.

A later complete resulting-PR review of head `f5927142e724b7eb3787f751448cf5a5b2717e5c` found affected/execution ownership gaps that supersede the earlier final-completion claim.

The first scripts-owned correction was implemented at `ab4efa5dbb822bc1a1d1e4b2a2def60e3a65e67f`. Architect re-review accepted several individual fixes but did **not** accept the scripts correction as complete.

Active review state:

- `scripts/REVIEW.md` — 3 blockers and 2 major issues remain;
- `.github/workflows/REVIEW.md` — downstream browser-integration CI blocker, intentionally deferred until the scripts review is clean.

Active correction architecture:

- `docs/testing/verify-redesign-final-review-correction.md`.

Current coding-agent assignment:

- `docs/testing/verify-redesign-final-review-correction-02-agent-task.md`.

The prior first-correction assignment remains historical context:

- `docs/testing/verify-redesign-final-review-agent-task.md`.

## Current executable public contract

The intended and still-binding public verification types are exactly:

- `static`;
- `unit`;
- `behavior`;
- `visual`;
- `browser-integration`;
- `performance`;
- `mutation`;
- `e2e`.

Supported public entry points remain:

```text
pnpm verify
pnpm verify --only <type>
pnpm verify --files <paths...>
pnpm verify --only <type> --files <paths...>
pnpm verify --full
pnpm verify:status
pnpm verify:resume
pnpm verify --fix-only
```

`--only` accepts verification types, never private planner leaves. `--full` remains the release-grade full-project entry point and rejects narrowing combinations such as `--full --only` and `--full --files`. The former public `verify:release` alias remains removed.

## Correct executable state still required

The migration is complete only when all of the following are true in the current repository:

- **Static:** deterministic release/build/config leaves participate in normal affected `static` ownership for every production/build input they can actually prove; ordinary Vite production/artifact inputs select `build` + `artifact-static`, and controller/appUpdate production impact additionally selects `managed-updates-static`.
- **Unit:** Vitest remains the only affected/dependency engine, with the already accepted safe fallback and zero-match behavior.
- **Behavior:** owner-local `*.behavior.spec.ts` remains the isolated UI interaction proof.
- **Visual:** owner-local `*.visual.spec.ts` and owner-local baselines remain the visual proof.
- **Browser integration:** generic owner-local proof and exceptional managed-update/artifact proof have disjoint truthful runners, complete affected support ownership, one central exceptional membership source, and fail-closed special execution inventory in focused, full, and direct special-runner execution.
- **Performance:** the public type remains valid with an intentionally empty persistent inventory.
- **Mutation:** the explicit four-target registry remains unchanged; package/lock/config impact, including removed/renamed infrastructure identity, cannot silently disappear before mutation planning.
- **E2E:** ordinary page/widget ownership remains structural; productionArtifact special execution membership is complete/fail-closed; shared release execution support cannot silently skip dependent proof.
- **Planning cost:** `--fix-only` returns its fixer plan before any proof planner/validator resolves, while default E2E Playwright/dependency-graph acquisition happens only after cheap relevance proves it is needed except for literal `--full` validation.
- **Tooling:** the three task-touched verifier entry points remain native TypeScript; unrelated legacy `.mjs` tooling is not mass-converted.
- **CI:** after scripts semantics are accepted, develop verification runs public `browser-integration` and aggregate `verification` requires its success.

## Compatibility already removed and not to be restored

The correction must not restore obsolete migration mechanisms:

- public low-level `--only` labels;
- the `verify:release` public alias;
- legacy ordinary `*.browser.spec.ts` discovery;
- ordinary central behavior/visual assertion ownership;
- root/release application E2E assertion ownership;
- `E2E_SCENARIO_SCOPES` and production-path -> ordinary E2E-spec mappings;
- host Playwright ownership-metadata execution;
- unit adjacency/custom dependency-graph selection;
- mutation adjacency or duplicate mutation registries.

Internal release-named commands/files remain where they own real built-artifact, service-worker, fresh-container, cross-engine, logging, timeout, lock, or deployment constraints. They are not public verification types.

## Preserved invariants

The correction must preserve:

- top-level single-run verify locking and expensive-command locking;
- container-only Playwright execution for verifier-managed browser proof;
- E2E project applicability and release/fresh-container semantics;
- status/resume/logging/timeout/profile/base/fix behavior, except the explicitly required planner-order cleanup that leaves fixer semantics unchanged;
- fail-closed structural validation and safe widening under uncertain affected ownership;
- known flaky behavior as failed proof, not accepted evidence.

This is the second scripts correction round under the current architecture. If architect re-review still finds ownership drift, mixed responsibilities, unresolved scenarios, or growing workaround logic, return to the architecture decision instead of issuing another incremental scripts patch.

## Completion gate

The migration may be marked complete again only after:

1. the current second scripts correction task is implemented and every `scripts/REVIEW.md` blocker/major is resolved in architect re-review;
2. the downstream `.github/workflows/REVIEW.md` browser-integration CI blocker is fixed;
3. the architect re-reviews the complete resulting PR against `docs/testing/architecture.md`;
4. active review artifacts are removed only after their findings are actually resolved;
5. GitHub CI is green on the exact final PR head, including the corrected browser-integration lane;
6. PR #218 is moved out of draft;
7. merge into `develop` uses squash merge.

Current merge readiness: **should not merge until blockers are fixed**.
