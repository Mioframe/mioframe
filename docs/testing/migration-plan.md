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
- **Pass F:** previously accepted on the bounded Pass F scope.

A later complete resulting-PR review of head `f5927142e724b7eb3787f751448cf5a5b2717e5c` found current implementation gaps that supersede the earlier final-completion claim.

Active review state:

- `scripts/REVIEW.md` — active scripts-owned blockers/issues;
- `.github/workflows/REVIEW.md` — active downstream browser-integration CI blocker.

Active correction architecture and coding task:

- `docs/testing/verify-redesign-final-review-correction.md`;
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

- **Static:** deterministic release/build/config leaves participate in normal affected `static` ownership when relevant; they are not reachable only through `--full`.
- **Unit:** Vitest remains the only affected/dependency engine, with the already accepted safe fallback and zero-match behavior.
- **Behavior:** owner-local `*.behavior.spec.ts` remains the isolated UI interaction proof.
- **Visual:** owner-local `*.visual.spec.ts` and owner-local baselines remain the visual proof.
- **Browser integration:** generic owner-local proof and exceptional managed-update/artifact proof have disjoint truthful runners, complete affected support ownership, and fail-closed special execution inventory.
- **Performance:** the public type remains valid with an intentionally empty persistent inventory.
- **Mutation:** the explicit four-target registry remains unchanged, and mutation toolchain/lockfile impact selects the complete registry when relevant.
- **E2E:** ordinary page/widget ownership remains structural; productionArtifact special execution membership is complete/fail-closed; shared release support cannot silently skip dependent proof.
- **Planning cost:** expensive E2E Playwright inventory/dependency-graph acquisition occurs only after cheap relevance proves it is needed, except literal `--full` complete validation.
- **Tooling:** new/task-touched verifier Node entry points follow the repository TypeScript-first rule unless a concrete runtime exception exists.
- **CI:** develop verification runs public `browser-integration` and aggregate `verification` requires its success.

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
- status/resume/logging/timeout/profile/base/fix behavior unless the active correction explicitly requires a planning-order change without changing those semantics;
- fail-closed structural validation and safe widening under uncertain affected ownership;
- known flaky behavior as failed proof, not accepted evidence.

## Completion gate

The migration may be marked complete again only after:

1. the scripts-owned correction task is implemented and `scripts/REVIEW.md` is clean;
2. the downstream `.github/workflows/REVIEW.md` browser-integration CI blocker is fixed;
3. the architect re-reviews the complete resulting PR against `docs/testing/architecture.md`;
4. active review artifacts are removed only after their findings are actually resolved;
5. GitHub CI is green on the exact final PR head, including the corrected browser-integration lane;
6. PR #218 is moved out of draft;
7. merge into `develop` uses squash merge.

Current merge readiness: **should not merge until blockers are fixed**.
