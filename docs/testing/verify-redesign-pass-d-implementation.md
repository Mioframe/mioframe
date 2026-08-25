# Verify redesign — Pass D implementation record

- **Status:** Completed and architect-accepted
- **Accepted implementation HEAD:** `c0aa686235d291089d413b77c4b5fe176acc07b3`
- **Baseline reviewed:** `09f5b6629a21fe03878ea190894c70fe2ae95aba`
- **Scope:** structural application E2E ownership and affected-owner planning
- **Prerequisite:** Pass C architect-accepted
- **Next pass:** Pass E

## Accepted result

Pass D is complete. The full resulting Pass D range was architect-reviewed, not only the final correction patch. No active blocker, major issue, minor issue, or accepted architectural risk remains.

The accepted implementation provides:

- target application E2E ownership only under `tests/e2e/pages/<Owner>/**/*.e2e.spec.ts` and `tests/e2e/widgets/<Owner>/**/*.e2e.spec.ts`;
- path-derived primary owners validated against current `src/pages/<Owner>/` and `src/widgets/<Owner>/` directories;
- exceptional additional owners only through validated Playwright `_mioframe-owner` annotations; the current migrated inventory requires zero such annotations;
- one `dependency-cruiser` production reverse graph for changed-source -> widget/page reachability;
- widget traversal that records the widget and continues upward, and page traversal that records the page and stops that branch;
- independent project applicability through the recursive `desktop | mobile | both` registry;
- ordinary E2E discovery separated from `productionArtifact/` discovery;
- the three production-artifact product scenarios routed through their existing release/fresh-container execution leaves;
- containerized Playwright `--list`/reporter owner-inventory collection for both ordinary and release configs;
- fail-closed equality between the structurally valid filesystem target E2E set and the union of Playwright-collected target E2E paths;
- removal of `E2E_SCENARIO_SCOPES`, source-prefix -> spec mapping, and mapping-specific validation.

## Completeness invariant

The filesystem target tree is the independent source of truth for what target E2E exists. Playwright inventory is metadata/discovery evidence, not the source of truth for target existence.

Before any affected-spec selection, verification must reject structural state when:

- a filesystem target was not collected by the owning Playwright configs;
- Playwright collected a target not present in the current filesystem target tree;
- the Playwright inventory contains duplicate target entries;
- a target path or owner is structurally invalid;
- an additional-owner annotation is malformed, stale, unknown, or redundantly repeats the primary owner.

An empty or partial Playwright inventory must never become a successful `skip` when filesystem targets exist.

## Execution boundaries that remain frozen

- All Playwright CLI execution remains containerized through the existing `runPlaywrightInContainer`/Podman boundary.
- The existing top-level `pnpm verify` machine lock and expensive-command lock remain the execution owners. Do not introduce a second lock or container runner.
- `dependency-cruiser` remains the only E2E production import-graph engine and is acquired once per relevant planning invocation.
- Ambiguous/code-module unresolved graph edges remain fail-closed; only unambiguously non-code asset edges may be ignored.
- Project applicability is independent from E2E owner selection.
- Product behavior, test assertions, desktop/mobile applicability, and fresh-container release semantics were not redesigned in Pass D.
- New/task-touched verifier tooling follows the repository TypeScript-first rule when the actual runtime/loader supports native `.ts` execution.

## Accepted proof

The accepted review included:

- deterministic owner parsing/traversal/inventory/completeness tests;
- missing/unexpected/duplicate/empty-inventory fail-closed cases;
- direct added/changed/removed/moved E2E behavior;
- project applicability preservation;
- full review of the migrated E2E inventory and split scenarios;
- real repository dependency-cruiser acquisition;
- real `src/entities/databaseData/useDatabaseData.ts` selection reaching `widget/DocumentView` and `page/DocumentViewPane` without accidental full fallback;
- real containerized Playwright `--list` execution after the reporter/container tooling was converted to TypeScript.

Exact-head GitHub CI remains a separate architect-owned repository/merge gate. Semantic Pass D acceptance does not imply final PR merge readiness.

## Forbidden regressions

Do not restore:

- `E2E_SCENARIO_SCOPES` or any equivalent production-path -> E2E-spec registry;
- owner tags on ordinary E2E files;
- host Playwright execution for ownership metadata;
- a second E2E graph framework;
- silent fallback from invalid structure to `skip`;
- ordinary dev-app execution for `productionArtifact/` scenarios.

Pass E may build on this state but must not reopen accepted Pass D mechanisms without new repository evidence.