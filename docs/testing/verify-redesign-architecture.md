# ADR: Unified `pnpm verify` architecture

- **Status:** Accepted; implemented on `architecture/verify-redesign` / PR #218
- **Project:** Mioframe
- **Date:** 2026-08-24
- **Scope:** Accepted verification architecture. The canonical project policy in `docs/testing/architecture.md` is synchronized with this decision; `docs/testing/migration-plan.md` records the executable state and merge-readiness gate.

## Context

Mioframe needs one project-wide verification entry point that is safe for coding agents and cheap enough for normal development.

The main constraints are:

- `pnpm verify` must be the normal verification entry point;
- default verification compares the current workspace against `develop`;
- expensive tests, especially E2E, should be narrowed when that can be proven safe;
- ambiguity must widen coverage, never silently reduce it;
- structural mistakes that make affected-test selection unreliable must fail verification;
- normal test ownership should come from repository structure rather than manually maintained mappings;
- the design must remain small and explicit rather than becoming a generic verification framework.

The goal is not the mathematically smallest test set. The goal is the **smallest test set that can be proven safe to run**.

## Public command contract

### Default

```bash
pnpm verify
```

Default verification:

1. computes changed paths and statuses relative to `develop`;
2. determines which verification types have relevant impact;
3. narrows tests inside each relevant type using that type's own impact mechanism;
4. widens only the affected type when safe narrowing cannot be proven;
5. validates the structural invariants that make narrowing trustworthy.

Skipping an entire verification type requires deterministic evidence that the change is irrelevant to that type. For ordinary production changes, several types may remain applicable; the main optimization is normally **inside a type**, not aggressive elimination of types.

### Type filter

```bash
pnpm verify --only <type>
```

`--only` exposes verification **types**, not low-level runner/check labels.

Examples of internal checks such as format, Oxlint, ESLint, type-check, Storybook build, browser setup, or individual release-runtime checks remain verifier implementation details.

`--only` uses the selected type's normal affected-test model; it does not imply a full run of that type.

### Explicit file scope

```bash
pnpm verify --files <paths...>
pnpm verify --only <type> --files <paths...>
```

`--files` is a focused scope override for readable existing paths, primarily for implementation feedback and diagnosis. Automatic default planning remains status-aware for added, modified, removed, and moved paths; `--files` is not a replacement for historical path identity.

### Full mode

```bash
pnpm verify --full
```

`--full` means complete project verification:

- every verification type;
- every test/spec in those types;
- every registered mutation and performance target;
- no affected-test narrowing;
- no dependency-graph optimization.

`--full` and `--only` are mutually exclusive.

This is the release-grade verification mode for the `develop` → `main` path. There is no separate top-level `release` verification type.

Release-oriented proof is classified by what it verifies:

- source/build/config invariants → static;
- isolated browser/runtime/PWA contracts → browser integration;
- isolated interactive UI contracts → behavior;
- complete production/user flows → E2E;
- measurable performance invariants → performance.

## Verification types

The public taxonomy is based on **what contract is being verified**, not on runner, cost, or whether a browser is used.

### 1. Static

Static verification includes deterministic source/workspace checks such as formatting, linting, type-checking, instruction compatibility, configuration validation, and other repository-owned static checks.

Static checks use file capability and configuration ownership rather than test ownership.

### 2. Unit

Unit tests use Vitest and the suffix:

```text
*.test.ts
```

Affected selection should use Vitest's native related/affected dependency analysis wherever static imports provide the required relation.

Mioframe must not maintain a second persistent unit dependency graph unless a concrete verified limitation makes Vitest insufficient.

If a relevant unit relationship cannot be safely resolved, widen to the complete unit type.

### 3. Behavior

Behavior tests verify isolated interactive UI behavior without requiring a complete product flow.

Examples include focus, keyboard interaction, pointer/touch behavior, overlay interaction, scrolling, responsive interaction, and accessibility interaction contracts.

Accessibility and keyboard navigation are subtypes of behavior, not separate top-level types.

Behavior specs use:

```text
*.behavior.spec.ts
```

They are colocated with their real UI owner. One file is preferred when small; a dedicated local directory next to that owner is allowed when several behavior specs are genuinely needed. There is no repository-wide behavior dumping ground.

Existing behavior specs using legacy browser-oriented naming were migrated to the new suffix as part of this redesign.

### 4. Visual

Visual tests verify bounded rendering and visual regression contracts.

Visual specs use:

```text
*.visual.spec.ts
```

They are colocated with the UI owner they render. A local owner-specific directory is allowed only when several visual specs are required.

There is no global visual directory containing unrelated owners in the implemented architecture.

### 5. Browser integration

Browser integration tests verify browser-specific runtime contracts of a concrete module, service, worker, entity boundary, or runtime mechanism without exercising a complete user flow.

Examples include browser storage, workers, browser APIs, service-worker lifecycle, cache/update behavior, installation/runtime mechanisms, and similar browser boundaries.

Browser integration specs use:

```text
*.browser-integration.spec.ts
```

They are colocated with their concrete runtime owner and selected primarily from path/ownership.

PWA and release-runtime contracts are not separate verification types. They belong here when the tested contract is an isolated browser/runtime boundary.

### 6. Performance / stress

Performance is a separate type because its acceptance criterion is a measurable performance invariant rather than functional correctness.

Performance specs use:

```text
*.performance.spec.ts
```

A performance spec must define a measurable threshold, budget, or invariant.

For local performance risks, the spec is colocated with the owner and selected by path/ownership.

For genuinely cross-system performance contracts, ownership follows the same primary/additional owner model as cross-owner E2E.

### 7. Mutation

Mutation is a separate verification type.

Mutation does **not** introduce a `*.mutation.spec.ts` test-file type. Mutation testing mutates registered production targets and evaluates existing owning tests.

Default affected selection runs registered mutation targets impacted by the change. `pnpm verify --full` runs the complete registered mutation inventory.

Mutation registration remains explicit because not every production file is automatically a meaningful mutation target.

### 8. E2E

E2E verifies complete product/user scenarios crossing product composition and potentially services, workers, persistence, routing, permissions, or other boundaries.

E2E specs use:

```text
*.e2e.spec.ts
```

E2E remains in a dedicated test territory rather than being colocated with lower-level production modules.

## E2E ownership

### Primary owner from filesystem

The common E2E case requires no manual source-to-test mapping.

The primary owner is encoded by directory structure, for example:

```text
tests/e2e/pages/Settings/<scenario>.e2e.spec.ts
tests/e2e/pages/RepoExplorer/<scenario>.e2e.spec.ts
tests/e2e/widgets/RepositoryExplorerWidget/<scenario>.e2e.spec.ts
```

The path deterministically yields an owner such as:

```text
page:Settings
widget:RepositoryExplorerWidget
```

A large global production-path → E2E-spec registry is not part of the architecture and was removed during migration.

### Additional owners

A complete product scenario may exceptionally belong to more than one product owner.

The directory still defines one primary owner. Additional owners are declared with minimal Playwright-native tag/annotation metadata, using a machine-validated owner namespace.

Additional-owner metadata is exceptional, not required for the common case.

Validation must reject:

- unknown owners;
- invalid owner kinds;
- malformed owner metadata;
- redundant declaration of the primary owner;
- ownership references that no longer exist after moves/removals.

Do not introduce a custom E2E DSL, wrapper API, or second ownership registry for this purpose.

## E2E affected-owner discovery

Direct static imports from an E2E spec are insufficient because user scenarios may traverse many layers that the spec does not import.

For production changes, `verify` builds a production dependency graph with `dependency-cruiser` and uses its reverse edges to discover affected product owners.

The graph is only a mechanical source-dependency tool. It does not infer business semantics or scenario meaning.

### Traversal boundary

Starting from each changed relevant production file:

1. traverse reverse dependencies through `shared`, `entities`, and `features`;
2. when a `widget` is reached, record it as an affected product owner but continue traversal upward;
3. when a `page/pane` is reached, record it as an affected product owner and stop that traversal branch;
4. select all E2E specs whose primary or additional ownership contains any affected owner.

This deliberately collects both widget-owned and page/pane-owned scenarios when both are reachable.

`src/app` bootstrap/global routing impact or any relevant production impact that cannot be reduced to trustworthy product owners widens to the complete E2E type.

### Dependency graph implementation constraint

Use `dependency-cruiser` as the concrete dependency-analysis mechanism for this redesign.

Do not build a custom TypeScript/Vue import parser, persistent graph registry, graph database, generic graph service, or speculative cache layer unless implementation evidence later proves the selected tool insufficient.

The verifier needs only the concrete operation required here: production dependencies → reverse traversal → affected owners.

## Affected selection by type

Default `pnpm verify` uses different mechanisms for different dependency models:

| Type                     | Primary affected-selection mechanism                               |
| ------------------------ | ------------------------------------------------------------------ |
| static                   | changed-file capability/config ownership                           |
| unit                     | Vitest related/affected resolution                                 |
| behavior                 | colocated owner + suffix                                           |
| visual                   | colocated owner + suffix                                           |
| browser integration      | colocated runtime owner + suffix                                   |
| local performance        | colocated owner + suffix                                           |
| cross-system performance | primary/additional product ownership                               |
| mutation                 | affected registered mutation targets                               |
| E2E                      | reverse dependency graph → product owners → owner-structured specs |

There is no universal affected-test algorithm across all verification types.

## Status-aware planning

Changed path identity and status are first-class inputs.

Automatic planning must preserve added, modified, removed, and moved paths, including old and new identities for moves.

General rules:

- directly added/modified test specs may select themselves;
- production changes use the owning type's normal resolver;
- moved tests validate both previous and current ownership identity;
- removed tests use their previous ownership identity;
- when a previous relation required for safe narrowing cannot be reconstructed, widen to the complete owning type;
- removed files are never passed as current formatter/linter targets.

A narrow run with no selected tests is not evidence that the verification type is unnecessary; planner diagnostics must make that state explicit.

## Fallback policy

Fallback is a safety mechanism, not the normal execution path.

The core rule is:

> `verify` narrows only when the narrower scope can be proven safe.

Uncertainty widens the **owning verification type**, not the whole project.

For E2E:

1. a directly changed E2E spec selects that spec;
2. a relevant production change with safely discovered owner(s) selects all E2E specs for those primary/additional owners;
3. if relevant production impact exists but owners cannot be safely established, run all E2E;
4. only explicit `--full` means complete project verification.

The same principle applies to other types: unresolved relevant impact widens to the complete owning type.

### Invalid structure is not fallback

Uncertainty and invalid architecture are different states.

If ownership is unknown because dependency information is incomplete, coverage widens.

If the repository violates a structural rule that the planner depends on, verification fails instead of hiding the defect behind a broader run.

Examples of blocking structural errors include:

- a spec with an unrecognized or wrong type suffix;
- a behavior/visual/browser-integration/local-performance spec outside its valid owner location;
- an E2E spec outside the allowed E2E owner structure;
- invalid or stale additional-owner metadata;
- ambiguous classification that prevents deterministic ownership.

Frequent fallback is a diagnostics signal. If ordinary changes repeatedly widen to full types, the ownership/impact model should be corrected rather than normalizing the broad execution.

## Naming contract

Every verification type represented by standalone test-spec files has a unique deterministic suffix:

| Type                | Suffix                          |
| ------------------- | ------------------------------- |
| unit                | `*.test.ts`                     |
| behavior            | `*.behavior.spec.ts`            |
| visual              | `*.visual.spec.ts`              |
| browser integration | `*.browser-integration.spec.ts` |
| E2E                 | `*.e2e.spec.ts`                 |
| performance/stress  | `*.performance.spec.ts`         |

Static and mutation are verification types but are not standalone test-spec file types and therefore have no spec suffix.

Legacy test names and locations were migrated to this contract; removed compatibility naming is not part of the current executable model.

## Structural invariants

`verify` validates the minimum structural rules required for safe automatic selection.

At minimum:

- spec suffix uniquely determines its test type;
- unit tests follow the unit convention;
- behavior, visual, browser-integration, and local-performance specs are colocated with their real owner;
- E2E specs are under the allowed page/widget ownership structure;
- the E2E primary owner is derivable from the path;
- additional E2E/cross-system-performance owners are valid and machine-validated;
- ambiguous or unclassifiable specs fail verification;
- removed/moved ownership facts cannot silently disappear.

These invariants exist because impact selection depends on them, not for stylistic policing.

## FSD ownership boundary

Verification follows Mioframe ownership:

- **feature**: user-triggered actions, flows, feature state, business behavior;
- **entity**: domain model/data/entity operations;
- **widget**: product-block composition;
- **page/pane**: routing, navigation, composition, pane layout state;
- **shared**: reusable lower-level primitives and infrastructure;
- **service/worker**: persistence, IO, providers, worker/background/browser-runtime boundaries.

Local tests stay with the narrowest truthful owner.

E2E product ownership is intentionally at widget/page/pane composition level; lower FSD layers are traversed to discover those product owners rather than becoming E2E owners themselves.

## Simplicity constraints

The implementation must remain smaller than the problem it solves.

Therefore:

- do not maintain a large manual production-path → E2E-test table;
- do not require ownership tags on ordinary E2E specs;
- do not build a second unit dependency graph;
- do not build a universal graph-based verification framework;
- do not add Nx/Turborepo solely for affected verification;
- do not introduce a manager/service/registry abstraction only for genericity or hypothetical reuse;
- do not build custom dependency parsing while `dependency-cruiser` satisfies the required graph operation;
- do not optimize for the smallest possible test set when a broader simple run is safely sufficient;
- do not preserve replaced planner/mapping mechanisms after the new ownership mechanism is complete.

## Agent-safety requirements

The architecture must be difficult for coding agents to misuse.

Required properties:

- ordinary test placement establishes ownership automatically;
- suffix establishes test type automatically;
- exceptional metadata is minimal and validated;
- invalid structure fails loudly with actionable diagnostics;
- uncertainty always expands coverage;
- the verifier explains why a type is skipped, focused, full, or invalid;
- normal implementation does not require agents to remember a separate mapping document.

## Migration record

Implementing this ADR required a coordinated migration rather than retaining old and new ownership models indefinitely in parallel.

The migration included:

- public `--only` type names replacing low-level labels as the public CLI surface;
- unique spec suffixes and corresponding test discovery configuration;
- migration of legacy behavior/visual/E2E/browser-related names and locations;
- owner-structured E2E directories;
- removal of the previous manual E2E source-to-scenario registry after equivalent owner-based selection became active;
- `dependency-cruiser` integration for E2E affected-owner discovery;
- status-aware validation for add/remove/move cases;
- mutation participation in `--full`;
- reclassification of release-oriented checks into static, behavior, browser-integration, E2E, or performance according to the contract they prove;
- synchronization of testing documentation, verification skills, verifier tests, and CI with the public contract.

The migration preserved verifier orchestration outside the redesign, including process execution, locks, timeouts, diagnostics, and CI ownership except where the accepted architecture required wiring changes.

## Non-goals

This ADR does not require:

- the absolutely minimal possible test set;
- automatic inference of business semantics from source code;
- one runner for all test types;
- a separate `release` verification category;
- an ownership tag on every E2E test;
- a generic verification DSL;
- custom graph infrastructure;
- perfect zero-fallback affected analysis;
- speculative caching or parallelism architecture.

## Acceptance criteria

The implemented redesign is expected to preserve all of the following architectural criteria:

1. `pnpm verify` is the normal project verification entry point.
2. Default verification is status-aware relative to `develop`.
3. `--only <type>` exposes verification types rather than internal runner labels.
4. `--full` executes every verification type, every test/spec, and every registered mutation/performance target without narrowing.
5. There is no top-level release type; release-oriented checks are owned by the contract they prove.
6. Every standalone spec type has one deterministic suffix.
7. Unit impact delegates to Vitest related/affected resolution where possible.
8. Behavior, visual, browser-integration, and local-performance ownership is derived from colocation.
9. E2E primary ownership is derived from page/widget directory structure.
10. The common E2E case requires no manual source-to-test mapping or owner metadata.
11. Exceptional multi-owner E2E/performance uses only minimal validated additional-owner metadata.
12. E2E production impact uses `dependency-cruiser` reverse dependencies to collect affected widgets and pages/panes.
13. Widget traversal continues upward so page/pane-owned scenarios are not lost; page/pane is the terminal product-composition boundary.
14. Unknown relevant E2E impact widens to all E2E, not the whole project.
15. Structural violations fail instead of silently widening or skipping.
16. Added, modified, removed, and moved paths are handled explicitly.
17. The previous large manual E2E mapping registry remains removed.
18. The implementation does not create a generic graph framework or parallel ownership system.

## Implementation details resolved during migration

The architecture intentionally left several mechanism-level choices to repository-aware implementation preflight. Those choices are now represented by the executable code, tests, migration plan, and implementation records rather than being open architecture questions:

- local directory shape when one colocated owner requires several specs of the same type;
- Playwright annotation syntax for exceptional additional owners;
- `dependency-cruiser` configuration/API wiring and Vue/TypeScript resolution settings;
- static subchecks grouped under `static`;
- mutation target registration representation;
- cross-system performance directory convention if such a test is introduced;
- migration pass order and temporary compatibility boundaries;
- CI job wiring and private internal labels behind the public type-based CLI.

Any future change to these implementation details that would alter ownership, public semantics, fallback safety, or the verification taxonomy requires revisiting this ADR before implementation proceeds.
