# Verify application-E2E discovery ownership

Status: **implemented and architect-reviewed**.

This document is the durable architecture/result record for the application-E2E discovery/selection boundary. `docs/testing/architecture.md` remains canonical testing policy; `docs/testing/verify-target-architecture.md` owns the wider verifier architecture; `docs/testing/verify-e2e-planner-precision.md` remains the product-scenario planning contract.

## Goal

Keep one code-level definition of the application-E2E file population across physical Playwright collection and verifier ownership:

```text
application E2E
→ direct tests/e2e/*.spec.ts only
```

The same contract drives:

- `playwright.config.ts` physical collection;
- `scripts/lib/e2eRisk.ts` direct changed-spec classification;
- `scripts/lib/e2eProjectApplicability.ts` registry validation;
- `scripts/lib/unitRisk.ts` bounded root-app inventory ownership.

Scenario mappings remain separately owned by `E2E_SCENARIO_SCOPES`.

## Cause and architecture decision

Repeated correction rounds exposed drift because the root-only application-spec invariant was independently implemented in several verifier/config modules. A further local `e2eRisk.ts` patch was rejected by the root `AGENTS.md` repeated-correction stop rule.

The accepted minimum design is one narrow pure owner:

```text
scripts/lib/appE2EPaths.ts
```

with exactly three public exports:

```ts
APP_E2E_SPEC_DIR
APP_E2E_TEST_MATCH
isRootAppE2ESpecPath(filePath)
```

Final semantics:

```text
APP_E2E_SPEC_DIR
= tests/e2e

APP_E2E_TEST_MATCH
= **/tests/e2e/*.spec.ts

isRootAppE2ESpecPath(tests/e2e/appSmoke.spec.ts)
= true

isRootAppE2ESpecPath(tests/e2e/other/example.spec.ts)
= false
```

The module is pure: no filesystem access, Playwright imports, scenario metadata, lane registry, or generic glob/path framework.

This additional abstraction is justified by observed ownership drift, not hypothetical reuse. A generic discovery framework remains explicitly rejected.

## Final ownership

| Owner | Responsibility |
| --- | --- |
| `scripts/lib/appE2EPaths.ts` | canonical application-E2E root/path-shape contract only |
| `playwright.config.ts` | physical Playwright execution using that contract |
| `scripts/lib/e2eRisk.ts` | product/source → app scenario planning and direct-spec/support classification |
| `scripts/lib/e2eProjectApplicability.ts` | app spec → desktop/mobile applicability |
| `scripts/lib/unitRisk.ts` | unit-impact ownership of repository scans; consumes the shared root-spec predicate |
| `playwright.lanes.test.ts` | independent real-collector/lane proof; never source of truth |

No product/FSD ownership changed.

## Accepted implementation

### Shared path owner

`scripts/lib/appE2EPaths.ts` exists with the exact three-export API above. Its internal implementation derives the root predicate from the canonical directory and keeps no external dependencies.

### Physical Playwright config

`playwright.config.ts` imports `APP_E2E_SPEC_DIR` and `APP_E2E_TEST_MATCH`.

Resolved values remain:

```text
testDir: ./tests/e2e
testMatch: **/tests/e2e/*.spec.ts
```

Project `testIgnore` remains applicability-only. Retries, workers, reporter, web server, and other execution policy are unchanged.

Because `playwright.config.ts` now imports verifier-owned TypeScript modules, `tsconfig.node.json` explicitly includes `scripts/lib/appE2EPaths.ts` alongside the already required applicability module. Focused type-check confirmed this project-boundary dependency; no broader TS project merge was introduced.

### Application planner

`e2eRisk.ts:isAppE2ESpecPath()` remains the public semantic concept but delegates directly to `isRootAppE2ESpecPath()`.

Final behavior:

```text
tests/e2e/appSmoke.spec.ts
→ app spec
→ focused direct app E2E

tests/e2e/other/example.spec.ts
→ not app spec
→ not app support
→ no app-E2E selection

tests/e2e/other/helper.ts
→ app support
→ conservative full app E2E

tests/e2e/example.test.ts
→ not app support

tests/e2e/example.test.mjs
→ not app support

existing *.testUtils.ts application helper
→ support behavior preserved
```

Reserved Storybook/visual/release paths remain excluded.

`validateE2EScenarioRegistry()` now requires every scenario and standalone application spec to satisfy the shared root predicate. An existing nested Storybook/release/arbitrary spec is invalid application metadata even when it exists on disk.

`scripts/lib/appE2EPaths.ts` itself is full application-E2E infrastructure because changing it can change both physical discovery and planner ownership. It does not acquire Storybook, visual, release, or mutation ownership merely because it lives under `scripts/lib/`.

### Project applicability

`e2eProjectApplicability.ts` imports `APP_E2E_SPEC_DIR` and `isRootAppE2ESpecPath()` and no longer has a private canonical root predicate/prefix.

Its local non-recursive filesystem scanner remains local because arbitrary `specDir` overrides are scanner/test behavior, not another canonical root-path contract. `E2E_PROJECT_APPLICABILITY` data is unchanged.

### Unit scan ownership

`unitRisk.ts` imports `isRootAppE2ESpecPath()` for root application inventory ownership and no longer carries its private duplicate root-app predicate.

The intentionally broader `isPlaywrightOnlyProofPath()` remains separate because it answers a different question: which Playwright proof paths must not become ordinary Vitest dependency inputs. No other unit-impact semantics changed.

## Independent collector proof

`playwright.lanes.test.ts` remains independent of the shared predicate as an expected-value oracle and exercises the installed Playwright CLI against the real config with `PLAYWRIGHT_EXTERNAL_BASE_URL`, so no app server/browser launch is required for collection proof.

The proof establishes:

- a real root `appSmoke.spec.ts` is collected;
- a unique nested `*.spec.ts` probe is not collected;
- a unique direct-root `*.test.mjs` probe is not collected;
- Storybook/visual/release specs remain outside application collection;
- a filtered invocation containing both the real root spec and nested probe succeeds, collects the root spec, and still excludes the nested probe.

This confirms CLI filtering can narrow the configured lane but cannot expand it beyond `testMatch`.

## Probe ownership and safety

Collector probe state is collision-safe:

- nested probe directory is unique and invocation-owned via `mkdtempSync`;
- direct-root probe filename is unique;
- probe files use exclusive `wx` creation;
- created files are explicitly tracked;
- cleanup unlinks only those created files;
- only the invocation-owned directory is removed, non-recursively;
- no fixed generic repository path or pre-existing directory is deleted.

The previous destructive fixed-path proof defect is closed.

## Acceptance matrix

| Path / change | Final application-E2E result |
| --- | --- |
| `tests/e2e/appSmoke.spec.ts` | root app spec; collect + focused direct selection |
| another direct `tests/e2e/*.spec.ts` | root app spec; must enter scenario/applicability ownership |
| `tests/e2e/other/example.spec.ts` | not app spec/support; no app selection |
| `tests/e2e/other/helper.ts` | non-spec support; conservative full app E2E |
| `tests/e2e/example.test.ts` | not app spec/support |
| `tests/e2e/example.test.mjs` | not app E2E; Vitest when applicable |
| `tests/e2e/storybook/**` | Storybook behavior only |
| `tests/e2e/visual/**` | visual only |
| `tests/e2e/release/**` | release only |
| scenario registry references nested existing spec | invalid |
| applicability registry references nested existing spec | invalid |
| `scripts/lib/appE2EPaths.ts` changes | full application E2E only |

## Proof result

Fresh test-author proof established meaningful RED for the remaining pre-migration defects:

- direct `tests/e2e/example.test.ts` was incorrectly treated as app support;
- existing non-root scenario metadata was incorrectly accepted;
- future canonical owner path was not classified as full app-E2E infrastructure.

The already-correct nested-spec planner assertions stayed green during that RED phase, preventing regression-oriented proof from manufacturing a failure that no longer existed.

After implementation, focused unit verification passed for:

- `appE2EPaths.ts`;
- `e2eRisk.ts` / `e2eRisk.test.ts`;
- `e2eProjectApplicability.ts` / its tests;
- `unitRisk.ts` / its tests;
- `playwright.config.ts` / `playwright.lanes.test.ts`.

Focused type-check also passed after adding the required `tsconfig.node.json` inclusion.

## Non-goals retained

- no nested application-E2E convention;
- no application spec moves;
- no product scenario or applicability-data changes;
- no Storybook/visual/release/unit-impact/mutation redesign;
- no retry/worker/timeout/CI-topology change;
- no generic path/glob/discovery registry.

## Closure

The application-E2E ownership architecture is now **closed and architect-reviewed**.

The repeated-drift cause has been removed rather than patched around: one pure verifier module owns the root-app path contract, all production/verifier consumers use it, and the real Playwright collector remains an independent integration oracle.

Any remaining verifier-modernization findings are tracked separately in `scripts/lib/REVIEW.md` and must not be used to reopen this architecture without new repository evidence.
