# Testing architecture

This document is the canonical project-wide testing and verification policy for Mioframe.

`docs/testing/verify-redesign-architecture.md` records the design rationale. `docs/testing/migration-plan.md` records which parts of this target are executable in the current repository state. When current implementation differs from this document, the migration plan describes the temporary compatibility path; coding work must not invent a third model.

## Goal

Use the smallest set of checks and tests that can be **proven safe**, while keeping ownership explicit and maintenance low.

Verification must be:

- deterministic and inspectable;
- safe for coding agents;
- conservative under uncertainty;
- driven by repository structure and runner-native dependency information where possible;
- free from large manual source-to-test mapping tables;
- simpler than the verification problem it solves.

The goal is not the mathematically minimal test set. A broader safe run is preferable to complex inference.

## Proof design principles

### Test contracts, not implementation

Tests protect observable behavior, public contracts, persisted state, data safety, accessibility, accepted visible output, browser/runtime behavior, complete product flows, or explicit non-functional requirements.

Do not test private methods, incidental classes, framework lifecycle, render counts, internal branches, or third-party behavior unless Mioframe owns the observable adaptation.

### Independent oracle and proof authorship

Expected results for assertion-bearing tests/specs and accepted visual baselines come from an independent contract, not from the production implementation being changed.

Valid oracle sources include an accepted architecture/product/public contract, a reproducible defect with required corrected behavior, persisted/protocol compatibility rules, an authoritative platform/dependency contract, or independently accepted visible output.

For every materially changed contract, proof planning names at least one plausible incorrect observable result the primary proof must reject.

When a new assertion-bearing automated test/spec is required, or an existing test/spec materially changes its oracle, expectations, assertions, or failure semantics, author that proof in a separate test-author context before production implementation. This is an authoring-context boundary only: it does not create a verification type, proof owner, placement rule, registry, or affected-selection relation.

Intentional visual-baseline changes follow the same independence rule but different timing. Before production implementation, the test-author context establishes the accepted visible contract and visual-spec intent. When the new pixels cannot exist until after implementation, baseline creation and acceptance happen in a fresh test-author/visual pass after production rendering is available. The production implementation context must not regenerate or approve the baseline it is expected to satisfy.

Test-authoring does not apply merely because verification work changes. Static verifier/check implementation, mutation-target registration, ownership/applicability metadata, proof-only moves/renames, formatting, comments, or other mechanical proof maintenance with an unchanged assertion oracle stay in their existing owner/workflow. Assertion-bearing tests/specs added for such mechanisms still follow their truthful proof type.

When a meaningful pre-fix failure exists, the test-author context owns the RED evidence for new/materially changed proof. Production implementation consumes accepted non-visual proof and existing accepted baselines read-only until the first GREEN result. RED is valid only when the failure is caused by the missing/incorrect contract under test; a deterministic failure caused exactly by an absent required public seam may therefore be valid, while unrelated compilation/setup errors, wrong environment, unrelated exceptions, timeouts, missing fixtures, or infrastructure failures are not. If implementation exposes a genuine defect in the accepted proof or contract, return to the test-author/architect. Do not rewrite an accepted oracle in the production implementation context merely to make changed code pass.

### One contract has one primary proof owner

One observable contract has one primary proof owner. Higher-level proof may protect an integration seam or complete product outcome, but must not duplicate the complete lower-level contract.

One production change may legitimately require several verification types.

### Use the lowest faithful proof

Use the cheapest environment that reproduces the real semantics.

`happy-dom` does not prove real focus, keyboard behavior, pointer/touch input, layout, geometry, scrolling, overlays, responsive behavior, browser APIs, service-worker lifecycle, or other real browser behavior.

### Failures remain visible

Do not hide defects with arbitrary sleeps, `force`, broad retries, repeated user actions, silent recovery, or weakened assertions.

Known flaky behavior is failed proof until the owning defect is corrected.

## Public `verify` contract

### Default

```bash
pnpm verify
```

Default verification:

1. compares the current workspace with `develop`;
2. preserves changed path status, including add, modify, remove, and move/rename identities;
3. determines which verification types are relevant;
4. narrows inside each relevant type using that type's own impact mechanism;
5. widens only the affected type when safe narrowing cannot be proven;
6. validates structural invariants required by affected-test selection.

Skipping a complete type requires deterministic evidence that the change is irrelevant to that type. For ordinary production changes, several types may remain applicable; the main optimization is normally **inside a type**.

### Type filter

```bash
pnpm verify --only <type>
```

`--only` exposes verification types, not low-level runner/check labels.

The public type names are:

```text
static
unit
behavior
visual
browser-integration
performance
mutation
e2e
```

Internal operations such as format, Oxlint, ESLint, type-check, Storybook build, browser setup, build/artifact preparation, or individual runtime checks remain verifier implementation details.

`--only` keeps the selected type's normal affected-test selection. It does not imply the full type.

### Explicit file scope

```bash
pnpm verify --files <paths...>
pnpm verify --only <type> --files <paths...>
```

`--files` is an explicit focused scope for readable existing paths, primarily for implementation feedback and diagnosis. It is not a replacement for status-aware automatic planning of removed or moved paths.

### Full mode

```bash
pnpm verify --full
```

`--full` means complete project verification:

- every verification type;
- every test/spec in those types;
- every registered mutation target;
- every registered persistent performance target;
- no affected-test narrowing;
- no dependency-graph optimization.

`--full` must reject narrowing options such as `--only` and `--files`.

`--full` is the release-grade verification mode for the `develop` -> `main` path. There is no separate top-level `release` verification type.

## Verification types and file naming

Every independently discovered test-spec type has one deterministic suffix.

| Verification type   | Target file naming                             | Primary purpose                                                       |
| ------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| static              | no test suffix                                 | deterministic source/workspace/config validation                      |
| unit                | `*.test.<supported-ext>`; normally `*.test.ts` | deterministic behavior and component contracts through Vitest         |
| behavior            | `*.behavior.spec.ts`                           | isolated interactive UI behavior in a real browser                    |
| visual              | `*.visual.spec.ts`                             | bounded deterministic appearance regression                           |
| browser-integration | `*.browser-integration.spec.ts`                | browser/runtime contract of a module/service/worker/entity boundary   |
| performance         | `*.performance.spec.ts`                        | measurable performance/stress invariant                               |
| mutation            | no dedicated spec suffix                       | mutation of registered production targets using existing owning tests |
| e2e                 | `*.e2e.spec.ts`                                | complete product/user flows                                           |

Legacy suffixes and locations remain executable only where `docs/testing/migration-plan.md` explicitly records them during migration. They are not the target naming contract.

## Static

Static verification includes formatting, linting, type-checking, instruction compatibility, configuration validation, build/config invariants that can be proved deterministically, and other repository-owned static checks.

Static impact uses file capability and configuration ownership rather than semantic test ownership.

Removed files are never passed as formatter/linter inputs. Shared static configuration changes run the complete owning static check when narrower execution cannot be proved safe.

PR release-intent validation is a merge-policy gate, not affected implementation verification. The private `release-version` leaf is classified as `static` because literal `pnpm verify --full` must include version validation for release-grade proof, but default/affected `static` planning must not select that leaf. Develop PR CI runs `release-version` independently so a missing or incorrect version-intent label can block merge without blocking implementation verification or preview publication.

## Unit

Unit tests use Vitest.

Affected selection uses, in order:

1. directly changed unit tests;
2. deterministic snapshot/test ownership where applicable;
3. changed source or test-support paths through Vitest's native related/affected dependency analysis;
4. full-unit fallback when the relation cannot be represented safely.

Do not build a second persistent dependency graph merely to enumerate unit tests.

A focused related run with no matching tests must be reported as such; it is not evidence that no unit proof is needed.

## Behavior

Behavior tests verify isolated interactive UI behavior without requiring complete product orchestration.

Examples include:

- focus and focus restoration;
- keyboard navigation;
- pointer/touch interaction;
- drag behavior;
- scrolling and geometry-dependent interaction;
- overlays and actionability;
- responsive interaction;
- public motion lifecycle;
- browser-observable accessibility interaction.

Accessibility and keyboard navigation are subtypes of behavior, not separate top-level verification types.

Behavior specs are colocated with their truthful UI owner. One file is preferred when small; several files may live in one owner-local test directory when the suite is genuinely larger. There is no repository-wide dumping ground for ordinary owner-local behavior proof.

Storybook may provide the deterministic isolated fixture, but the behavior spec owns assertions and real user input. Stories do not become merge-proof scripts.

## Visual

Visual tests verify bounded accepted rendering and visual regressions.

Visual specs are colocated with the UI owner they render. Baselines are colocated with the owning spec using a deterministic owner-local convention.

Visual specs contain screenshot preparation and screenshot assertions only. They do not own behavioral success criteria, computed token tables, keyboard behavior, or complete product flows.

Theme, fonts, renderer configuration, shared visual infrastructure, or another change with broad unknown rendering impact may widen to the complete visual type.

## Browser integration

Browser integration verifies a browser-specific runtime contract without exercising a complete user flow.

Possible owners include concrete services, workers, entities, runtime modules, or other boundaries that own:

- browser storage;
- workers;
- browser APIs;
- service-worker lifecycle;
- cache behavior;
- installation/update/runtime mechanisms;
- provider/runtime integration that requires a real browser.

Browser-integration specs are colocated with the concrete runtime owner and selected primarily by path/ownership.

PWA and release-runtime checks are not separate types. They belong here when the contract is an isolated browser/runtime boundary.

## Performance / stress

Performance is a separate verification type because its acceptance criterion is a measurable invariant.

A persistent performance spec must define an exact threshold, budget, or measurable invariant. A functional flow executed in a browser is not enough to classify a test as performance.

Local performance specs are colocated with their owner and selected by path/ownership.

Genuinely cross-system performance specs use the same primary/additional owner principle as cross-owner E2E; do not invent a separate ownership framework.

One-off task measurements remain implementation-preflight evidence and do not require permanent benchmark infrastructure.

## Mutation

Mutation is a separate verification type but not a test-file type.

Mutation testing mutates registered production targets and evaluates the existing owning tests. The project owns an explicit mutation target inventory because mutation applicability is intentional high-risk proof, not something inferred from file adjacency.

Default verification runs affected registered mutation targets. `pnpm verify --full` runs the complete registered mutation inventory.

Do not create `*.mutation.spec.ts` files merely to represent the mutation type.

## E2E

E2E verifies complete product/user scenarios crossing product composition and potentially routing, features, services, workers, persistence, permissions, providers, reload, import/export, or repository boundaries.

E2E stays in dedicated E2E territory; it is not colocated with lower-level production modules.

### Primary ownership from filesystem

The normal E2E case requires no manual source-to-spec mapping.

Primary ownership is structural:

```text
tests/e2e/pages/Settings/<scenario>.e2e.spec.ts
tests/e2e/pages/RepoExplorer/<scenario>.e2e.spec.ts
tests/e2e/widgets/RepositoryExplorerWidget/<scenario>.e2e.spec.ts
```

The directory deterministically yields a product owner such as `page:Settings` or `widget:RepositoryExplorerWidget`.

Only `pages`/panes and `widgets` are primary E2E product owners in this model. Lower FSD layers participate through dependency traversal, not by owning E2E directories.

A large production-path -> E2E-spec registry is forbidden in the target architecture.

### Additional owners

A complete scenario may exceptionally depend on more than one product owner.

The directory still defines one primary owner. Additional owners use minimal Playwright-native tag/annotation metadata with a machine-validated owner namespace, for example:

```text
@owner:page/Settings
@owner:widget/SettingsSections
```

Additional-owner metadata is exceptional. The common case must require no owner tags.

Validation rejects unknown owners, invalid owner kinds, malformed metadata, redundant declaration of the primary owner, and stale references after owner moves/removals.

Do not introduce a custom `e2eTest` wrapper, generic ownership DSL, or second E2E registry.

### Affected-owner discovery

Direct imports from E2E specs are insufficient because product scenarios cross modules that the test file does not import.

For production changes, `verify` uses `dependency-cruiser` to build the production dependency graph and traverses reverse dependency edges from the changed relevant source.

The graph is a mechanical dependency tool only. It does not infer business semantics of scenarios.

Traversal rules:

1. include the changed file's own widget/page owner when applicable;
2. traverse reverse dependencies through `shared`, `entities`, and `features`;
3. when a `widget` is reached, record that widget as affected and continue traversal upward;
4. when a `page`/pane is reached, record that page/pane as affected and stop that traversal branch;
5. select every E2E spec whose primary or additional owner contains any affected owner.

This deliberately selects both widget-owned and page-owned E2E where both are reachable.

`src/app` bootstrap/global routing impact, dependency-analysis failure, unresolved dynamic composition, or another relevant production change that cannot be reduced to trustworthy product owners widens to the complete E2E type.

Use `dependency-cruiser` directly or through one small concrete adapter. Do not build a custom TypeScript/Vue parser, persistent graph service, generic graph framework, or graph cache until a measured current requirement justifies it.

### E2E direct changes and support files

- added/modified E2E spec -> that spec;
- moved E2E spec -> preserve both previous and current ownership identity when deterministic;
- removed E2E spec -> validate the previous ownership identity;
- unresolved moved/removed ownership -> full E2E;
- shared E2E config/setup/global fixtures/common helpers -> full E2E unless the complete consumer set is explicit, small, stable, and validated.

### Browser project applicability

Desktop/mobile/browser project applicability is independent from source-impact selection.

Existing persistent applicability metadata may remain when it represents a real scenario platform contract. It must be validated against the discovered E2E inventory and must not silently omit an unclassified scenario.

Changing applicability requires an audited platform-risk decision; source impact does not rewrite it automatically.

## Affected-plan states

Each verification type resolves to one of:

- `skip` — deterministic evidence shows no impact for that type;
- `focused` — a non-empty exact set of type-specific execution inputs;
- `full` — the complete type is required because narrower scope cannot be proved safe;
- `invalid` — repository structure/metadata is inconsistent and verification must fail before execution.

Rules:

- `invalid` is not a fallback; it is a blocking structural error;
- `full` overrides focused inputs inside that type;
- overlapping relations union and deduplicate;
- every decision has inspectable reasons;
- unknown relevant impact uses `full`, never `skip`;
- uncertainty widens only the affected type unless the uncertainty itself spans multiple types.

## Fallback policy

Fallback is exceptional safety behavior, not the normal execution path.

For E2E the target order is:

1. a directly changed E2E spec -> that spec;
2. production change -> all E2E owned by affected product owner(s), including additional-owner relations;
3. relevant production change with unsafe/unresolved owner discovery -> all E2E;
4. `pnpm verify --full` -> complete project verification.

Do not invent an additional scenario-level mapping layer inside an owner merely to reduce test count.

Frequent full-type fallback is a diagnostics signal that the affected model needs correction.

## Structural invariants

`verify` validates the structure its narrowing depends on.

At minimum:

- every independently discovered spec uses the suffix of exactly one verification type;
- behavior, visual, browser-integration, and local performance specs are colocated with truthful owners;
- E2E specs exist only in the allowed E2E ownership structure;
- primary E2E ownership is structurally derivable;
- additional E2E/performance owners are minimal and machine validated;
- ambiguous/unclassifiable tests never silently bypass verification;
- moved/removed test ownership is handled status-aware;
- obsolete legacy mappings are removed when structural ownership replaces them.

Rules exist only where selection or proof correctness depends on them; do not turn these invariants into style policing.

## Release-sensitive proof

`release` is not a verification type.

Classify release-oriented checks by what they prove:

- deterministic build/config/version/artifact invariants -> static;
- isolated browser/PWA/runtime/update contracts -> browser-integration;
- isolated interactive UI behavior -> behavior;
- complete production/user flow -> e2e;
- measurable performance invariant -> performance.

The PR release-intent/version-policy decision is separate from affected implementation proof: develop PR CI validates it through the independent `release-version` merge gate. `release-version` remains a private `static` leaf for literal `pnpm verify --full`, but ordinary affected/default static planning does not select it.

`pnpm verify --full` is the complete release-grade verification entry point after migration. Legacy release labels or aliases are transitional implementation details recorded in the migration plan.

## Storybook

`docs/testing/storybook.md` owns Storybook workbench behavior, story authoring, fixture isolation, catalogue conventions, and visual sandbox rules.

This document owns the project-wide verification type taxonomy, suffixes, and affected-test ownership rules. Where older Storybook examples still show legacy `*.browser.spec.ts` naming, `docs/testing/migration-plan.md` determines current executable compatibility and this document defines the target `*.behavior.spec.ts` naming.

Complete product scenarios remain E2E. Storybook fixtures must not import product bootstrap, persistence, services, workers, product routing, or business orchestration merely to avoid E2E.

## Implementation preflight: TEST IMPACT

Before non-trivial implementation, record only task-relevant proof decisions:

```text
TEST IMPACT
- Contract/scenario:
  - Oracle source:
  - Must reject:
  - Primary proof owner:
  - Additional proof:
  - Existing proof:
  - New/updated proof:
  - Test author: required | not required — <reason>
  - Red phase: required | not applicable — <reason>
  - Risk or platform matrix:
  - Durable ownership/impact updates:
```

`Oracle source` is independent from the changed production implementation. `Must reject` is one plausible incorrect observable result the primary proof must catch. `Test author` records whether a separate assertion-authoring context is required; it does not change proof ownership. `Red phase` is required only when the pre-fix implementation can fail the focused proof for the contract-relevant reason. For intentional visual changes whose new baseline cannot exist before implementation, record the pre-implementation visible contract/spec intent and route baseline creation/acceptance to a post-implementation test-author visual pass.

`verify` never consumes agent prose or this preflight artifact.

## Coding-agent and CI ownership

Verification has three distinct execution purposes:

1. focused verifier-managed checks are coding-agent implementation and diagnostic feedback;
2. ordinary PR code work ends with one cumulative coding-agent branch handoff gate against the PR base, for example `pnpm verify --base origin/develop` for a `develop` PR;
3. GitHub CI on the exact published PR head is the authoritative automatic repository merge gate owned by the architect.

The branch handoff gate is diff-aware and uses the coding environment's normal local verifier profile. It is deliberately not `pnpm verify --full`; `--full` is full-project/release scope and cannot be combined with `--base`. The branch gate may be skipped only for explicitly diagnostic/read-only work with no tracked implementation result, or when the architect explicitly records the allowed non-code exception.

A clean branch handoff does not replace exact-head CI, and green CI does not replace the branch handoff, correct architecture, ownership, test placement, or required scenario coverage.

## Non-goals

This architecture does not require:

- the absolutely smallest possible test set;
- one universal affected-test algorithm;
- a universal dependency graph for every verification type;
- automatic inference of business semantics;
- one runner for all types;
- Nx/Turborepo solely for verification;
- a custom graph framework;
- a large source-to-test mapping registry;
- routine owner tags on every E2E;
- a separate test-author verification type or proof-ownership layer;
- perfect zero-fallback analysis.

## Review rejection criteria

Reject or revise verification changes when:

1. a cheaper proof is used when it cannot reproduce required semantics;
2. the same contract is fully duplicated across proof types;
3. tests follow implementation details instead of accepted contracts;
4. browser instability is hidden with sleeps, force, retries, or recovery loops;
5. visual specs contain behavior/token-table success criteria;
6. product E2E repeats lower-level deterministic logic matrices;
7. local ownership is replaced by unnecessary registry infrastructure;
8. E2E source-to-spec mappings remain after the owner/graph replacement is proven;
9. a structural violation is converted into broad fallback instead of failing validation;
10. uncertainty silently reduces coverage;
11. a custom graph/manager/DSL is introduced without a demonstrated current requirement;
12. migration state is ignored and code is placed where the current runner cannot execute it;
13. assertion-bearing proof derives its oracle from the implementation under test or production implementation rewrites accepted proof merely to make changed code pass.
