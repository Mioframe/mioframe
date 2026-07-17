# Testing architecture migration plan

`docs/testing/architecture.md` defines the target and durable ownership model. This plan records known repository mismatches and the order in which to correct them. It is not permission to expand unrelated product work into test-suite cleanup.

## Migration rules

- Migrate incrementally in focused PRs.
- Preserve required regression protection before removing or relocating a test.
- Keep production behavior unchanged unless a migration exposes a real product defect that receives its own resolved scope.
- Do not add generic dependency graphs, DSLs, validators, registries, or test abstractions without repeated demonstrated need.
- Prefer deleting duplicate or invalid assertions over translating every assertion to another lane.
- A broad conservative resolver fallback may remain temporarily, but known ownership should progressively receive explicit focused mapping.
- Final `pnpm verify` remains mandatory throughout migration even when the current verifier executes broader legacy scope than the architecture requires.

## Current known mismatches

### Test ownership

- Some visual specs contain click, drag, focus, keyboard, geometry, state-layer, ripple, or other browser-behavior assertions.
- Some visual specs reproduce large component token and geometry tables through computed-style assertions instead of relying on bounded canonical visual evidence.
- Generic Material foundation behavior is repeated across multiple component-family browser tests instead of being owned once by foundation with narrow family wiring checks.
- Some broad component tests reconstruct page or product behavior through many global stubs, creating pseudo-integration coverage that is less faithful than focused pure tests plus app e2e.
- Some test helpers silently recover from missing expected state or use fallback actions that can hide product defects.

### Verification selection

- Default mutation selection currently infers applicability from changed source files and sibling tests rather than the explicit high-risk activation conditions.
- Focused unit selection primarily resolves changed tests and colocated sibling tests; it does not always include affected tests owned by consumers or shared public contracts.
- Visual selection currently treats broad shared UI and foundation areas as requiring the whole visual lane rather than focused canonical visual scenarios.
- App e2e uses conservative full-suite fallback for broad shared, app, service, and unmapped source areas.
- App e2e currently duplicates every selected scenario across desktop and mobile projects even when no platform-specific risk exists.

These mismatches describe migration work; they do not invalidate current required CI gates before their replacements are implemented and verified.

## Phase 1: correct invalid ownership and hidden failures

Goal: stop tests from proving contracts in the wrong lane or hiding defects.

### 1. Reclassify behavior from visual specs

- Identify behavior assertions under `tests/e2e/visual/`.
- Preserve only bounded screenshot preparation and capture in visual specs.
- Move reusable component behavior to focused `tests/e2e/storybook/` specs.
- Move complete product scenarios to app e2e only when product composition is the actual owner.
- Delete duplicate behavior assertions already owned elsewhere.

Acceptance:

- visual specs contain no behavioral success criteria;
- screenshots remain deterministic and preserve material visual regressions;
- relocated behavior uses real public browser input.

### 2. Make action helpers strict

- Separate strict action/assertion helpers from optional cleanup helpers.
- Remove silent returns, repeated fallback delivery, and fixed-delay recovery that can turn a product failure into a passing test.
- Make required preconditions and outcomes fail with clear diagnostics.

Acceptance:

- a required action cannot silently become a no-op;
- cleanup helpers are clearly named and never used as behavioral evidence;
- existing product defects are reported rather than masked.

### 3. Align mutation execution with explicit applicability

- Stop default changed-file inference from treating every source file with sibling tests as mutation-applicable.
- Keep `pnpm verify --only mutation --files ...` as the supported narrow audit.
- Preserve any explicitly documented high-risk merge gate only when its scope and ownership are stable.
- Add resolver tests proving that ordinary UI, refactor, documentation, and low-risk source changes do not schedule mutation.

Acceptance:

- mutation is required only after the skill activation check passes;
- explicit narrow mutation remains available and fail-closed;
- final development verification does not spend mutation time on unrelated ordinary changes.

## Phase 2: make impact selection proportional

Goal: retain fail-closed safety while reducing permanently broad execution.

### 4. Add focused visual impact mapping

- Map canonical stories, visual specs, foundation surfaces, and stable shared consumers where ownership is known.
- Run the full visual lane only for visual infrastructure or genuinely unknown broad impact.
- Do not build a generic dependency graph; use a small readable registry only if current mappings demonstrate stable value.

Acceptance:

- a local component visual change selects its canonical visual proof;
- foundation changes select affected canonical families or the full lane only when blast radius is genuinely broad;
- registry integrity fails closed.

### 5. Improve focused unit impact without a generic dependency graph

Start with the simplest safe policy:

- changed tests and colocated siblings remain selected;
- changes to known shared public contracts or test utilities select explicit affected suites;
- broad full-unit fallback is used only where impact cannot be represented safely;
- add mappings only from observed real dependencies.

Acceptance:

- shared contract changes do not silently miss known consumers;
- local implementation changes remain focused;
- selection logic stays readable and testable.

### 6. Narrow app e2e fallback by ownership

- Keep full app e2e for bootstrap, cross-cutting service/worker protocols, e2e infrastructure, and genuinely unknown impact.
- Add scenario mappings for known shared UI, feature, entity, page, service-client, and helper ownership as changes occur.
- Resolve support helpers to known consumer specs when the relation is explicit.

Acceptance:

- mapped source changes run representative owning scenarios;
- unknown source impact still fails closed to a safe broad run;
- the registry does not become a second architecture model.

### 7. Introduce proportional desktop/mobile projects

- Define a small critical smoke set that runs on both desktop and mobile.
- Run both projects for touch, viewport, responsive, overlay, mobile-browser, and capability-specific risks.
- Run platform-independent product scenarios on one canonical project.
- Keep responsive reusable UI checks in focused Storybook tests with explicit viewports.

Acceptance:

- mobile-specific regressions retain direct coverage;
- platform-independent scenarios are not duplicated without reason;
- project selection is explicit and testable.

## Phase 3: reduce duplicated and pseudo-integration coverage

Goal: simplify the suite after ownership and selection are reliable.

### 8. Consolidate foundation behavior

- Identify generic focus, state-layer, ripple, elevation, motion, and transient-state behavior repeated across component families.
- Keep complete behavior and visual precedence at the foundation owner.
- Retain only family-specific wiring, anatomy, extension, deviation, and unique outcome checks.

Acceptance:

- foundation defects still fail focused tests;
- component families no longer repeat identical generic behavior matrices;
- Material canonical visual evidence remains complete.

### 9. Decompose large mocked component tests

For each touched pseudo-integration suite:

- identify pure decisions and their real owner;
- keep narrow component contracts only where public Vue wiring matters;
- preserve complete product outcomes in existing or focused app e2e;
- delete broad stubs and assertions that duplicate those owners.

Acceptance:

- tests become smaller and failures identify a contract;
- fewer global stubs are required;
- no user scenario loses meaningful regression protection.

### 10. Remove redundant resolver and infrastructure assertions

- Keep tests that prove resolver behavior, fail-closed integrity, and command planning.
- Remove manually enumerated assertions already guaranteed by a dynamic registry validation test.
- Avoid asserting implementation structure of the resolver when output planning is the contract.

Acceptance:

- broken registries and unsafe skips still fail;
- infrastructure tests do not duplicate the same inventory contract.

## Completion criteria

Migration is complete when:

- each existing test lane follows `docs/testing/architecture.md`;
- visual specs prove appearance only;
- reusable browser behavior and product e2e have distinct ownership;
- mutation is an explicit narrow high-risk audit;
- focused selection is safe and proportionate;
- desktop/mobile duplication maps to real platform risk;
- foundation behavior is not repeated by every consumer;
- broad mocked pseudo-integration suites no longer substitute for faithful owners;
- full release verification and focused development verification remain green and diagnostically useful.
