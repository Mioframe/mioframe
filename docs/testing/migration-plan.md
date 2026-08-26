# Testing architecture migration plan

`docs/testing/architecture.md` is the durable testing and verification contract. This file records only the current executable migration state; detailed intermediate pass history remains in the `verify-redesign-*` records and Git history.

## Status

On `architecture/verify-redesign` / PR #218, the verify redesign is implementation-complete and architect-accepted through all passes:

- **Pass A:** architect-accepted;
- **Pass B:** architect-accepted;
- **Pass C:** architect-accepted;
- **Pass D:** architect-accepted at `c0aa686235d291089d413b77c4b5fe176acc07b3`;
- **Pass E:** architect-accepted on reviewed implementation head `60a097a077cb834e4cab28f5a2a8fad616ff77fd`;
- **Pass F:** architect-accepted after full Pass F re-review and complete resulting-PR review on semantic head `853d3f8f370b781b9f74071fd383cee588f18e55`.

The first Pass F review found one documentation-only blocker in `docs/release.md`; the architect corrected it before final acceptance. There is no active `REVIEW.md` for this redesign.

GitHub Actions run `32970768337` / run number `4413` completed successfully on exact semantic head `853d3f8f370b781b9f74071fd383cee588f18e55`, including `static`, `unit`, real `mutation`, application E2E, behavior, visual, aggregate verification, release-version, final `verify`, and preview deployment.

Architect-only completion documentation after that reviewed semantic head does not reopen the implementation; the final resulting documentation head still requires its own exact-head CI before merge.

## Current executable public contract

The public verification types are exactly:

- `static`;
- `unit`;
- `behavior`;
- `visual`;
- `browser-integration`;
- `performance`;
- `mutation`;
- `e2e`.

Supported public entry points include:

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

`--only` accepts verification types, never private planner leaves. `--full` runs every current type inventory with no affected narrowing and rejects narrowing combinations such as `--full --only` and `--full --files`.

The former public `verify:release` compatibility alias is removed. The `develop -> main` release workflow uses literal `pnpm verify --full --verbose`.

## Final ownership state

- **Static:** formatting, linting, type-checking, Storybook buildability, release/version/config/build invariants, and other deterministic static proof remain internal leaves owned by public `static`.
- **Unit:** Vitest is the only affected/dependency engine; changed/related selection uses native Vitest behavior with deterministic snapshot handling and safe full-unit fallback. Zero-match affected/related execution fails visibly.
- **Behavior:** ordinary isolated browser interaction proof uses truthful owner-local `*.behavior.spec.ts`.
- **Visual:** persistent visual proof uses owner-local `*.visual.spec.ts` plus owner-local baselines.
- **Browser integration:** owner-local `*.browser-integration.spec.ts` covers browser/runtime boundaries. Managed-update and production-artifact runners retain their release/container infrastructure where required by real runtime semantics.
- **Performance:** the public type is valid; the persistent inventory is intentionally empty until a real measurable budget exists.
- **Mutation:** `scripts/lib/mutationTargets.ts` is the single explicit validated registry for the four accepted targets; `stryker.config.mjs` derives its complete mutate inventory directly from it.
- **E2E:** application E2E assertions live under structural page/widget owners; production source impact uses the dependency-cruiser reverse graph; filesystem target inventory must equal Playwright-collected target inventory before selection.

## Compatibility removed

The completed migration removed the obsolete public/ownership mechanisms that the redesign replaced:

- public low-level `--only` labels;
- the `verify:release` public alias;
- legacy ordinary `*.browser.spec.ts` discovery;
- ordinary central behavior/visual assertion ownership;
- root/release application E2E assertion ownership;
- `E2E_SCENARIO_SCOPES` and production-path -> E2E-spec mappings;
- host Playwright ownership-metadata execution;
- unit adjacency/custom dependency-graph selection;
- mutation adjacency and duplicate mutation registries.

Internal release-named commands/files remain where they own real built-artifact, service-worker, fresh-container, cross-engine, logging, timeout, lock, or deployment constraints. They are not public verification types.

## Preserved invariants

The redesign preserves:

- top-level single-run verify locking and expensive-command locking;
- container-only Playwright execution for verifier-managed browser proof;
- project applicability and release/fresh-container semantics;
- status/resume/logging/timeout/profile/base/fix behavior unless explicitly changed by the accepted contracts;
- fail-closed structural validation and safe widening under uncertain affected ownership;
- known flaky behavior as failed proof, not accepted evidence.

## Completion gate

The redesign is semantically complete. Merge readiness requires only repository-level finalization:

1. final architect-owned documentation/PR state is committed;
2. GitHub CI is green on that exact final PR head;
3. PR #218 is moved out of draft;
4. ordinary merge into `develop` uses squash merge.
