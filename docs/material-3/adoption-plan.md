# Material 3 adoption plan

## Principle

Adopt Material incrementally through `src/shared/ui/material`.

Standard components should be authored from required scenarios, official sources, accepted foundation contracts, native semantics, the complete canonical family blueprint, and the standard testing contract.

Use architecture escalation only for genuine ambiguity, public extensions, ownership conflicts, foundation corrections/replacements, compatibility decisions, new generic infrastructure, unresolved visual routes, or unverifiable required behavior.

Do not build a complete design-system framework, generic test DSL, or mass source-tree migration in advance.

## Phase 1: keep one coherent policy system

Maintain:

- source authority including official Design Kit use for unresolved exact visual decisions;
- Material library boundary and migration rules;
- foundation architecture and current registry;
- one complete canonical family blueprint schema;
- deterministic component profiles and property routing;
- standard component testing and canonical visual matrix;
- static/structured validation separated from review blocking;
- component/foundation registries, deviations, and review metadata.

Architecture documents own durable schemas. Scoped `AGENTS.md` route work. Skills define execution order. The checklist defines operational completion. Validation does not add parallel architecture.

## Phase 2: establish the library boundary

Treat `src/shared/ui/material` as the canonical location for all new Material implementation.

Implement static blocking checks for:

- new official components outside `material/components`;
- new foundation owners outside `material/foundation`;
- patterns outside `material/patterns` or without the pattern gate;
- product imports inside the library;
- foundation imports from higher Material layers;
- private cross-family imports;
- product deep imports into implementation/testing files;
- project UI presented as official Material;
- generic infrastructure acquiring hidden Material ownership;
- empty namespaces and premature root barrel creation.

Legacy paths remain advisory for strict local repairs and are not templates for new work.

## Phase 3: establish validation classes

Implement validation in this order:

### Static blocking

Paths, imports, exports, profile files, token syntax, style order, required test artifacts, story identity, snapshots, and obsolete paths.

### Structured consistency

Required blueprint/registry sections, enum values, real file/story/export references, migration-map consistency, and exact snapshots for `verified` foundation records.

### Review blocking

Family ownership, scenario sufficiency, Material source interpretation, property-route correctness, visual-route equivalence, matrix readability, deviations, and human visual comparison.

Do not implement a semantic Markdown DSL that claims to prove review decisions.

## Phase 4: standard component testing enforcement

For every new or migrated public component require:

- static and structured architecture checks;
- colocated Vue Test Utils component-contract tests;
- exactly one canonical `StateMatrix`;
- visible labels and complete distinct component-owned visual-route coverage;
- Playwright visual regression of the bounded matrix/sections;
- Storybook Playwright behavior tests for real browser behavior when applicable;
- focused pure tests when helpers/composables exist;
- changed-consumer preservation;
- explicit architecture, Material, and human visual review status.

Non-visual states remain in contract/browser tests. Forced state proves appearance only. Do not create a production matrix component or generic test DSL.

## Phase 5: foundation inventory and enforcement

Use `foundation-registry.md` as the correctness/status source and the Material library README as the physical migration map.

Before promoting a domain to `verified`, require:

- exact official documentation/Design Kit snapshot;
- current and canonical owner;
- valid migration status;
- public/private/testing contracts;
- named gaps and consumers;
- focused owner verification.

Implement static/structured checks for registered exports/tokens/bridges/adapters, no family knowledge, no duplicate owners, current/canonical path consistency, and deprecated contracts unused by new code.

Start with domains required by `MDButton` rather than validating every legacy owner at once.

### Legacy additive rule

An existing legacy owner may receive an additive extension only when it remains the single active owner. A new standalone runtime/testing artifact requires relocating the cohesive owner first or in the same explicit migration. Do not split a domain into parallel legacy/canonical production owners.

## Phase 6: component architecture enforcement

Implement static/structured checks for:

- canonical family location and exports;
- complete canonical blueprint headings/enums/references;
- foundation dependency rows and statuses;
- selected profile and exact file set;
- token names/owners and style order;
- private-variable boundaries;
- required test artifacts and story identity;
- visual spec/snapshot/risk-registration consistency;
- obsolete parallel routes and legacy exports.

Architecture review, not automation, confirms family rationale, supported surface, state/DOM ownership, rendered-property routes, and visual-route grouping.

## Phase 7: Button foundation preparation

Before moving `MDButton`, validate the minimum consumed domains:

- source evidence;
- reference/system tokens and theme;
- units and typography;
- shape and elevation;
- motion;
- state layer, ripple, focus, and verification adapters;
- target area and accessibility;
- icon foundation when applicable.

For each domain choose:

- accepted current legacy owner with explicit `partial` gap;
- `library-relocation-only` when movement is behavior-preserving;
- focused additive/correction/replacement/refresh under foundation rules.

Do not split a monolithic owner merely to match the target directory diagram.

## Phase 8: `MDButton` migration pilot

Use `MDButton` to prove:

- canonical family ownership;
- complete blueprint authoring;
- API/native semantics and consumer migration;
- token inventory and exact ownership;
- configuration/state profiles and shortest property pipelines;
- DOM/accessibility/property ownership;
- foundation dependencies without local copies;
- canonical matrix and separate real browser behavior tests;
- static/structured validation without Button-specific exceptions;
- required human visual review.

The migration must preserve API, behavior, token values, and rendered output unless an explicit alignment delta says otherwise. Remove old files/exports and update all consumers, stories, tests, snapshots, registries, risk registration, and migration map.

Do not mix remaining visual alignment or unrelated foundation corrections into the migration.

## Phase 9: `MDButton` alignment

After migration, address documented deviations only.

Every intentional visible change updates affected routes, matrix cells, baselines, review evidence, and registry status. A discovered foundation correction uses its own focused mode and consumer review.

## Phase 10: `MDSwitch` independent pilot

Migrate `MDSwitch` independently to validate:

- controlled selected/unselected state;
- disabled and presentation contracts;
- keyboard activation and pointer drag/cancellation;
- multiple anatomy/DOM owners;
- property-specific coexistence;
- focus/ripple/motion/shape/color/accessibility/target-area dependencies;
- separation of visual matrix from real drag/keyboard behavior.

Only after Button and Switch reveal the same concrete fixture/validator need may a shared helper be considered.

If the architecture requires repeated exceptions, component-specific validator logic, private cross-family imports, local foundation workarounds, or family-specific forced states, revise it before continuing.

## Phase 11: autonomous new-component proof

Create one genuinely required new Material component directly in the library.

The coding agent must be able to:

1. perform bounded official-source lookup;
2. choose correct component usage;
3. derive the minimum complete supported surface;
4. create the complete canonical blueprint;
5. declare accepted foundation dependencies;
6. close only qualifying additive gaps;
7. select the smallest profile;
8. implement shortest property routes and explicit owners;
9. expose the public API;
10. create the standard test profile;
11. cover distinct visible routes without meaningless cells;
12. pass static/structured validation;
13. leave review-only decisions truthfully pending until accepted;
14. finish without architecture correction rounds.

A successful legacy relocation alone does not prove autonomous authoring.

## Phase 12: incremental migration

After Button, Switch, and the new-component proof:

- migrate one cohesive family/domain at a time from product need;
- update blueprint/contracts, owners, exports, consumers, stories, tests, snapshots, risk registration, and maps atomically;
- use relocation, architecture, alignment, and foundation modes intentionally;
- remove old paths and avoid permanent compatibility exports;
- improve foundations only from confirmed needs;
- persist accepted visual-review metadata.

## Success criteria

The workflow succeeds when:

- one canonical location and owner exists for every new Material artifact;
- one complete family blueprint is sufficient for normal agent implementation;
- foundation, families, patterns, project UI, and generic infrastructure remain separate;
- components consume accepted foundation contracts;
- all new/migrated components use the same understandable proof profile;
- distinct supported visual routes are human-readable without multiplying non-visual/equivalent states;
- automation blocks deterministic drift without pretending to replace architecture/visual review;
- migrations remove legacy owners rather than accumulating compatibility layers;
- new components can be authored without bespoke architecture correction rounds.
