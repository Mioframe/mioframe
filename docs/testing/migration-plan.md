# Testing architecture migration plan

`docs/testing/architecture.md` is the durable testing and verification contract. This file records only the current executable migration state; detailed intermediate pass history remains in the `verify-redesign-*` records and Git history.

## Status

On `architecture/verify-redesign` / PR #218, the verify redesign is **not currently merge-ready**.

Historical Pass A-F acceptance remains evidence for those reviewed boundaries. A later complete resulting-PR review reopened implementation acceptance.

Scripts correction history now includes:

- first correction implementation: `ab4efa5dbb822bc1a1d1e4b2a2def60e3a65e67f`;
- second correction implementation: `8911f44078676ccaceb19c8de8c05364b5ec6698`;
- first architecture-revision implementation: `ccd2bc0842428b3fde973afa9caf2f1a44b2aa53`.

`ccd2bc...` correctly implements its assigned revision, including the E2E relevance gate. Complete consumer re-review then found that the architecture handoff itself modeled two shared boundaries too narrowly: low-level local command execution is also consumed by static proof, and Vite-backed build/harness inputs are shared across several public proof types. Runtime-relevant package impact is also incomplete across generic versus exceptional browser-integration. The remaining work therefore follows a second architecture revision rather than another independent path-list patch.

Active review state:

- `scripts/REVIEW.md` — **3 blockers**, no major/minor issues or accepted risks;
- `.github/workflows/REVIEW.md` — downstream browser-integration CI blocker, intentionally deferred until scripts review is clean.

Current ready architecture handoff:

- `docs/testing/verify-redesign-final-review-architecture-revision-02.md`.

Current coding-agent assignment:

- `docs/testing/verify-redesign-final-review-architecture-revision-02-agent-task.md`.

Older final-review correction/revision tasks remain historical implementation records and are no longer current implementation contracts.

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

- **Static:** release-sensitive artifact planning uses truthful shared ownership: production `src/**`, application Vite harness inputs, package/lock/build-entry handling, and the neutral local-command execution boundary select the dependent `build` + `artifact-static` leaves; appUpdate/controller production and shared local-command execution also select `managed-updates-static` where the current proof path depends on them.
- **Unit:** Vitest remains the only affected/dependency engine with the accepted safe fallback and zero-match behavior; shared command infrastructure does not widen unit solely because optional standalone wrappers reuse it.
- **Storybook static:** one neutral shared Vite capability and the neutral local-command execution boundary widen the Storybook static build when its real build/runtime can change.
- **Behavior:** owner-local `*.behavior.spec.ts` remains the proof; shared Playwright execution and shared Vite build inputs widen the complete behavior type.
- **Visual:** owner-local `*.visual.spec.ts`/baselines remain the proof; shared Playwright execution and shared Vite build inputs widen the complete visual type.
- **Browser integration:** generic and exceptional runners remain disjoint; exceptional membership stays centrally validated; shared Playwright execution and application Vite harness inputs widen the complete public browser-integration type, including both inventories; runtime-relevant `package.json` also widens both inventories while confirmed version-only remains narrow.
- **Performance:** the public type remains valid with an intentionally empty persistent inventory.
- **Mutation:** the explicit four-target registry remains unchanged and deleted/renamed infrastructure remains status-aware; shared command infrastructure does not widen mutation solely because optional standalone wrappers reuse it.
- **E2E:** ordinary page/widget ownership remains structural; productionArtifact special execution remains central/fail-closed; shared Playwright execution and application Vite harness inputs widen full E2E.
- **E2E relevance:** target-tree, project-applicability, Playwright owner inventory, productionArtifact membership, and dependency graph validation remain behind the accepted E2E relevance decision; literal `--full` remains always relevant.
- **Fix mode:** `--fix-only` returns before proof planning.
- **CI:** only after scripts semantics are architect-accepted, develop verification runs public `browser-integration` and aggregate `verification` requires it.

The shared Vite capability must cover current global/ownerless build inputs without another dependency graph or repeated per-planner lists: non-test/proof `config/**`, `vite.config.ts`, `postcss.config.js`, `.browserslistrc`, root `tsconfig*.json`, and `public/**`; application-harness ownership additionally covers `index.html` and `pwa-assets.config.ts`. Ordinary production `src/**` stays with existing colocated/dependency ownership rather than a new global mapping.

The neutral local-command execution capability must represent only the real common command/lock/result/signal boundary. Playwright execution composes it; release-static and Storybook static consume it directly. Do not generalize it into `all scripts/**` or a verification-type registry.

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
- accepted E2E relevance gate from `ccd2bc...`;
- status/resume/logging/timeout/profile/base/fix behavior;
- fail-closed structural validation when the owning type is relevant;
- central exceptional release-proof inventory/full/direct validation;
- known flaky behavior remains failed proof.

## Completion gate

The migration may be marked complete again only after:

1. `docs/testing/verify-redesign-final-review-architecture-revision-02-agent-task.md` is implemented and `scripts/REVIEW.md` is clean in architect re-review;
2. `scripts/REVIEW.md` is removed only after its findings are actually resolved;
3. the downstream `.github/workflows/REVIEW.md` browser-integration CI blocker is fixed and its review artifact removed after re-review;
4. the complete resulting PR receives a clean semantic review against `docs/testing/architecture.md`;
5. GitHub CI is green on the exact final head, including browser-integration;
6. PR #218 is moved out of draft;
7. merge into `develop` uses squash merge.

Current merge readiness: **should not merge until blockers are fixed**.
