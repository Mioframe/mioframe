# Verify application-E2E discovery correction

Status: **implemented and architect-reviewed**.

This document is the durable architecture and closure record for the application-E2E physical-discovery blocker found during the final verifier-modernization PR review. `docs/testing/architecture.md` remains the canonical testing policy; `docs/testing/verify-target-architecture.md` owns the wider verifier architecture.

## Goal

Make physical application Playwright collection match Mioframe ownership:

```text
application E2E
→ direct tests/e2e/*.spec.ts only

Storybook behavior
→ tests/e2e/storybook/**/*.spec.ts
→ src/**/*.browser.spec.ts

visual
→ tests/e2e/visual/**/*.spec.ts
→ src/**/*.visual.spec.ts

release
→ tests/e2e/release/**/*.spec.ts
```

A file must not execute in the application Playwright lane while remaining invisible to application scenario/applicability/inventory ownership.

## Architecture decision

The physical source of truth is the resolved `playwright.config.ts`.

Application collection is intentionally root-only because every current product E2E spec is already a direct child of `tests/e2e`, while `E2E_SCENARIO_SCOPES`, `APP_E2E_STANDALONE_SPECS`, `E2E_PROJECT_APPLICABILITY`, and lane inventory are already designed around that corpus. No current requirement needs nested application specs.

The approved config contract is:

```text
testDir: ./tests/e2e
testMatch: **/tests/e2e/*.spec.ts
```

The single `*` after `tests/e2e/` is intentional: nested directories do not match.

`testMatch` is the single physical lane boundary. Application project `testIgnore` is reserved only for desktop/mobile applicability returned by `getProjectIgnoredSpecs(...)`; Storybook/visual/release subtree ignores are not retained as a second lane-boundary mechanism.

## Ownership

| Owner | Responsibility |
| --- | --- |
| `playwright.config.ts` | physical application-E2E collection |
| `scripts/lib/e2eRisk.ts` | source → root application scenario ownership |
| `scripts/lib/e2eProjectApplicability.ts` | root application spec → desktop/mobile applicability |
| `playwright.lanes.test.ts` | cross-lane physical inventory/disjointness and real collector proof |
| `scripts/lib/unitRisk.ts` | unit ownership of tests that scan the real Playwright inventories |

Product/FSD ownership is unchanged.

## Accepted implementation

`playwright.config.ts` now:

- keeps `testDir: './tests/e2e'`;
- sets top-level `testMatch: '**/tests/e2e/*.spec.ts'`;
- removes the former shared Storybook/visual/release subtree `testIgnore` layer;
- keeps project `testIgnore` exactly as `getProjectIgnoredSpecs(DESKTOP_PROJECT_NAME)` / `getProjectIgnoredSpecs(MOBILE_PROJECT_NAME)`.

No semantic changes were required in `e2eRisk.ts`, `e2eProjectApplicability.ts`, or `unitRisk.ts`; their root-only model became truthful once the real Playwright config was narrowed.

## Acceptance matrix

| Path shape | Application Playwright collection | Owner |
| --- | --- | --- |
| `tests/e2e/appSmoke.spec.ts` | yes | application E2E |
| `tests/e2e/<another-root>.spec.ts` | yes | application E2E; must enter scenario/applicability ownership as applicable |
| `tests/e2e/other/example.spec.ts` | no | none until explicitly assigned |
| `tests/e2e/example.test.ts` | no | not application E2E |
| `tests/e2e/example.test.mjs` | no | Vitest only when its Vitest contract applies; never application E2E |
| `tests/e2e/storybook/example.spec.ts` | no | Storybook behavior |
| `tests/e2e/visual/example.spec.ts` | no | visual |
| `tests/e2e/release/example.spec.ts` | no | release |
| `src/**/Example.browser.spec.ts` | no | Storybook behavior |
| `src/**/Example.visual.spec.ts` | no | visual |

## Independent proof and RED → GREEN evidence

A fresh test-author context added a real collector proof in `playwright.lanes.test.ts`.

The proof invokes the installed Playwright CLI in collection-only mode against the real `playwright.config.ts`:

```text
node_modules/@playwright/test/cli.js test --list --config=playwright.config.ts
```

`PLAYWRIGHT_EXTERNAL_BASE_URL` disables the application web server, so the proof does not start the server or a browser.

The test creates temporary controlled probes and removes them in `finally`:

- `tests/e2e/other/example.spec.ts`;
- `tests/e2e/example.test.mjs`.

Pre-fix RED was meaningful: real Playwright discovery collected both probes (reported 69 tests / 19 files), demonstrating that local root-only registries were narrower than the physical lane.

Post-fix GREEN demonstrates through the real collector that:

- `tests/e2e/appSmoke.spec.ts` is collected;
- the nested `other/example.spec.ts` probe is not collected;
- the root `example.test.mjs` default-test-shape probe is not collected;
- existing Storybook, visual, and release specs are not collected by the application config.

Supporting focused proof keeps scenario-registry completeness, project applicability, lane disjointness, and unit inventory ownership aligned with the same root-only contract. The real `tests/e2e/appSmoke.spec.ts` focused unit invocation remains green.

## Non-goals / preserved behavior

- no nested application-E2E convention;
- no recursive application registries;
- no movement of current application specs;
- no generic Playwright discovery registry;
- no Storybook/visual/release config redesign;
- no retries, workers, timeouts, CI-topology, or product behavior changes.

## Review result

The application-E2E physical-discovery blocker is closed.

The remaining verifier-modernization review findings are separate owners under `scripts/lib/REVIEW.md` and do not reopen this correction.