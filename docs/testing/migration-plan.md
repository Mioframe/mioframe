# Testing architecture migration plan

`docs/testing/architecture.md` is the durable testing and verification contract. This file records only the current executable migration state; detailed intermediate pass history remains in the `verify-redesign-*` records and Git history.

## Status

On `architecture/verify-redesign` / PR #218, the verify redesign is **not currently merge-ready**.

Historical Pass A-F acceptance remains evidence for those reviewed boundaries. A later complete resulting-PR review reopened implementation acceptance.

Two scripts correction rounds have now been implemented and re-reviewed:

- first correction implementation: `ab4efa5dbb822bc1a1d1e4b2a2def60e3a65e67f`;
- second correction implementation: `8911f44078676ccaceb19c8de8c05364b5ec6698`.

The second correction resolves central exceptional release-proof inventory/full/direct validation, true `--fix-only` early return, and status-preserving mutation infrastructure impact. Architect re-review nevertheless found repeated affected-ownership drift in production-build inputs and shared Playwright execution infrastructure. Per root `AGENTS.md`, implementation has returned to architecture rather than proceeding with a third incremental path-list correction.

Active review state:

- `scripts/REVIEW.md` — 2 blockers and 1 major issue;
- `.github/workflows/REVIEW.md` — downstream browser-integration CI blocker, intentionally deferred until scripts review is clean.

Current ready architecture handoff:

- `docs/testing/verify-redesign-final-review-architecture-revision.md`.

Older final-review correction tasks remain historical implementation records and are no longer the current implementation contract.

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

`--only` accepts verification types, never private planner leaves. `--full` remains the release-grade full-project entry point and rejects narrowing combinations such as `--full --only` and `--full --files`. `verify:release` remains removed.

## Correct executable state still required

The migration is complete only when all of the following are true:

- **Static:** production artifact ownership uses a stable broad capability covering production `src/**`, `public/**`, non-test/proof `config/**`, current root build inputs, package/lock, and the release build entry; all capable inputs select `build` + `artifact-static`, with controller/appUpdate production additionally selecting `managed-updates-static`.
- **Unit:** Vitest remains the only affected/dependency engine with the accepted safe fallback and zero-match behavior.
- **Behavior:** owner-local `*.behavior.spec.ts` remains the proof, and changes to shared Playwright execution infrastructure widen the complete behavior type.
- **Visual:** owner-local `*.visual.spec.ts`/baselines remain the proof, and shared Playwright execution infrastructure widens the complete visual type.
- **Browser integration:** generic and exceptional runners remain disjoint; exceptional membership stays centrally validated; shared Playwright execution infrastructure widens the complete public browser-integration type, including both generic and exceptional inventories.
- **Performance:** the public type remains valid with an intentionally empty persistent inventory.
- **Mutation:** the explicit four-target registry remains unchanged and deleted/renamed infrastructure remains status-aware.
- **E2E:** ordinary page/widget ownership remains structural; productionArtifact special execution remains central/fail-closed; shared Playwright execution infrastructure widens full E2E.
- **E2E relevance:** target-tree, project-applicability, Playwright owner inventory, and dependency graph validation happen only for E2E-relevant scopes or literal `--full`.
- **Fix mode:** `--fix-only` returns before proof planning.
- **CI:** after scripts semantics are accepted, develop verification runs public `browser-integration` and aggregate `verification` requires it.

## Compatibility already removed and not to be restored

Do not restore:

- public low-level `--only` labels;
- `verify:release`;
- legacy ordinary `*.browser.spec.ts` discovery;
- central ordinary behavior/visual assertion ownership;
- root/release ordinary application E2E assertion ownership;
- `E2E_SCENARIO_SCOPES` or production-path -> ordinary E2E mappings;
- host Playwright ownership-metadata execution;
- unit adjacency/custom graph selection;
- mutation adjacency or duplicate mutation registries.

Internal release-named commands/files remain where required by built-artifact, service-worker, fresh-container, cross-engine, deployment, logging, timeout, or lock semantics.

## Preserved invariants

- top-level single-run verify lock and expensive-command lock;
- container-only Playwright for verifier-managed browser proof;
- E2E project applicability and release/fresh-container semantics;
- status/resume/logging/timeout/profile/base/fix behavior except the accepted planning-order/relevance corrections;
- fail-closed structural validation when the owning type is relevant;
- known flaky behavior remains failed proof.

## Completion gate

The migration may be marked complete again only after:

1. the ready architecture revision is implemented and `scripts/REVIEW.md` is clean in architect re-review;
2. the downstream `.github/workflows/REVIEW.md` browser-integration CI blocker is fixed;
3. the complete resulting PR receives a clean semantic review against `docs/testing/architecture.md`;
4. active review artifacts are removed only after their findings are actually resolved;
5. GitHub CI is green on the exact final head, including browser-integration;
6. PR #218 is moved out of draft;
7. merge into `develop` uses squash merge.

Current merge readiness: **should not merge until blockers are fixed**.
