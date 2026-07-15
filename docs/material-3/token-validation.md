# Material 3 token and architecture validation

## Principle

Material library location, dependency direction, token, foundation, component layer, ownership, usage, migration, testing, and contract policy should be mechanically checked where practical.

Validation reads actual production files, public exports, the Material library map, foundation and component registries, family README blueprints, verified Material inventories, Storybook stories, test files, risk registrations, visual specs, and snapshots. Do not maintain a second handwritten runtime token or state map.

## Validation sources

Use:

1. actual CSS, Vue, TypeScript, build configuration, paths, imports, and public exports;
2. [Library architecture](./library-architecture.md) and `src/shared/ui/material/README.md`;
3. [Component architecture](./component-architecture.md) and [Component testing architecture](./component-testing.md);
4. the family `README.md` blueprint and its state-matrix coverage table;
5. [Foundation registry](./foundation-registry.md) and domain owner contracts;
6. the verified Material MCP/cache inventory and snapshot metadata;
7. component registry, deviations, Storybook stories, contract/browser/visual specs, snapshots, risk registration, and verification status.

A task handoff is evidence for the current delta, not a durable validator source after merge.

A generated allowlist may cache verified token names for performance only when reproducible from a named source snapshot.

## Material library boundary checks

For new and migrated artifacts, identify:

- a public official `MD*` component outside `src/shared/ui/material/components/<family>`;
- a Material-specific foundation runtime owner outside `src/shared/ui/material/foundation/<domain>`;
- a Material pattern outside `src/shared/ui/material/patterns/<pattern>`;
- a project-specific component placed or exported as an official Material component;
- a product-layer import inside the Material library;
- a `foundation` import from `components` or `patterns`;
- a cross-family private import;
- a Material library module importing the root `@shared/ui/material` barrel internally;
- an external deep import into `.vue`, `.css`, private helpers, or another family;
- generic `shared/lib` infrastructure importing the Material library or gaining hidden `MD*`/Material-token ownership;
- a new Material artifact added to a legacy `src/shared/ui/<LegacyFamily>`, `src/shared/lib/md`, `src/shared/ui/State`, `src/shared/ui/Icon`, or `src/shared/ui/Overlay` owner;
- an empty namespace directory, placeholder layer, or speculative pattern;
- a public library export without one accepted owner, TSDoc, README contract, or registry status.

Legacy owners remain advisory until their family/domain migration starts. New artifacts and active migrations are blocking immediately.

## Physical migration checks

For every `library-relocation-only`, architecture migration, or foundation relocation, identify:

- a migration-map entry inconsistent with actual current/canonical paths;
- an incomplete consumer import inventory;
- a legacy export retained without an approved temporary compatibility contract and removal target;
- new usage of a temporary compatibility export;
- old files, tests, Storybook paths, visual snapshots, risk registrations, or imports remaining after migration;
- behavior, token, API, rendered-output, or verification-surface changes hidden inside a relocation-only claim;
- unrelated families or foundation domains moved in the same PR;
- a root Material barrel created before any production artifact can be exported honestly;
- a moved artifact omitted from family/domain README, registries, public exports, library migration map, or testing profile.

A migrated artifact is not complete until old paths are removed and every in-repository consumer uses the accepted public library API.

## Foundation registry checks

Identify:

- a public foundation token, utility, primitive, verification adapter, or bridge without a registry/owner contract;
- a registry owner path that does not exist;
- a registry record whose public/private contract disagrees with production exports or code;
- a `verified` record without exact source snapshot or required verification;
- stale status, known gaps, consumer lists, verification, or last-reviewed metadata after a foundation change;
- historical audit text used as current status instead of the registry;
- component-family names or variables inside generic foundation owners;
- duplicate theme, unit, state, ripple, focus, typography, motion, icon, overlay, or adaptive mechanisms;
- family-local forced-state infrastructure duplicating an accepted foundation testing surface.

## Component foundation-dependency checks

For every new, migrated, or materially changed component family, identify:

- a missing Material usage contract;
- missing library ownership/current path/public export fields;
- a missing foundation dependency table;
- an applicable foundation domain omitted from the table;
- a dependency owner or status that disagrees with the registry or library map;
- a `partial` or `deviated` dependency without confirmation that its exact required capability is sufficient;
- a `blocked` dependency while the component claims readiness;
- a foundation change not classified as `none`, `additive`, `correction`, `replacement`, or behavior-preserving relocation;
- a component-local substitute for an accepted or missing foundation capability;
- an additive foundation change kept in the component PR without satisfying every same-PR condition;
- a correction/replacement without consumer inventory and representative verification.

## Component test-profile checks

For every new or migrated public Material component, identify:

- a missing standard test-profile section in the family README;
- a missing colocated `<Component>.test.ts` contract test;
- contract tests implemented without `@vue/test-utils` or asserting browser appearance/layout;
- a missing or duplicate canonical Storybook export named `StateMatrix`;
- a state-matrix root without `data-testid="visual-<component-kebab>-state-matrix"`;
- a state-matrix fixture without the canonical checkerboard outer backdrop;
- a supported semantic, interaction, disabled, extension, deviation, or simultaneous state route missing from the README state-matrix coverage table;
- a coverage-table entry without a visible matrix row/column/section;
- a visible matrix route that is absent from the accepted supported surface or rendered-property matrix;
- grouped state routes whose properties, owners, sources, winner rules, coexistence results, or foundation bridges are not equivalent;
- matrix cases identifiable only through hidden accessible names, tooltips, test IDs, CSS classes, or source order;
- a full Cartesian matrix containing equivalent sizes/content/configurations without a distinct state route;
- one visual snapshot per matrix cell instead of a bounded matrix/section snapshot;
- a canonical `StateMatrix` story without a Playwright visual assertion;
- a visual assertion outside the visual Playwright suite;
- browser behavior asserted only by forced state or visual screenshot;
- behavior requiring real focus, keyboard, pointer/touch, drag, overlay, responsive, or browser semantics without a Storybook behavior spec or an explicit `not applicable` reason;
- pure helper/composable behavior without focused tests when such logic exists;
- test-only public props, events, CSS classes, or production branches;
- a family-local forced-state provider rather than an accepted foundation verification adapter;
- missing visual/storybook risk registration after migration;
- an intentional baseline update without recorded inspection;
- an automated agent claiming that human Material visual review passed.

For materially changed migrated components, apply the same checks to the affected component and state routes. Unrelated legacy components remain advisory until migration.

## Token vocabulary checks

Identify:

- public `--md-*` names that do not map to verified `md.ref`, `md.sys`, or `md.comp` vocabulary;
- invented, shortened, or normalized component-token names;
- project-specific values incorrectly placed under `--md-*`;
- missing official tokens required by the supported surface;
- raw Material values that bypass available tokens;
- deprecated or compatibility tokens used by new code.

## Canonical ownership checks

Identify:

- reference/system tokens outside their accepted foundation owner;
- component tokens outside the owner file named by the family blueprint;
- duplicate canonical declarations;
- empty component or family token files;
- component token files whose component owns no official token;
- component-specific tokens incorrectly placed in a family or foundation token file;
- family token files without at least two declared public component consumers;
- family token selectors differing from the exact applicable root list;
- private family variables referenced outside the family;
- generic foundations reading family-specific tokens or private variables;
- direct system-token bypass when an official component token exists;
- theme-context behavior implemented in component CSS instead of system-role overrides.

## Token-layer purity checks

In component and family token files, reject:

- configuration modifiers;
- semantic or interaction state selectors;
- pseudo-classes;
- rendering properties;
- private or app token declarations;
- tokens conditionally declared only for an active configuration or state.

Canonical tokens must exist on the owning root independently of active configuration and state.

In reference/system foundation token owners, reject component-family tokens and component selectors.

## Foundation boundary checks

Where practical, verify:

- unit conversion is centralized in the accepted build/base owner;
- typography components use accepted system roles/utilities instead of local type-scale declarations;
- generic state/ripple/focus primitives expose only generic inputs and do not own host semantics;
- generic verification adapters expose deterministic test state without becoming public component APIs;
- generic elevation/motion adaptations are documented and do not expose invented public Material names;
- icon foundation owns symbol rendering rather than product icon choice or component anatomy;
- overlay foundation owns Material-facing containment/lifecycle capabilities without component-specific anatomy or policy;
- generic teleport, event, DOM, or geometry helpers remain outside the Material library unless specifically migrated as Material owners;
- accessibility, density, target-area, and adaptivity policies are not replaced by speculative runtime managers;
- deprecated foundation contracts name their replacement and are unused by new code.

## Architecture profile checks

Read the selected profile and token ownership from the family blueprint.

### `simple`

Require `.vue` and `.css`. Reject `.routes.css` and `.states.css`.

### `configured`

Require `.vue`, `.routes.css`, and `.css`. Reject `.states.css`.

### `stateful`

Require `.vue`, `.states.css`, and `.css`. Reject `.routes.css`.

### `configured-stateful`

Require `.vue`, `.routes.css`, `.states.css`, and `.css`.

For every profile:

- require `<Component>.tokens.css` only when the component owns at least one official token;
- require `<Family>.tokens.css` only when approved shared official token ownership exists;
- reject empty token, route, or state files;
- verify exact applicable style order;
- reject additional production files not permitted by the blueprint and architecture rules.

Storybook fixture files and tests are governed by component-testing architecture, not production profile layers.

## Layer and alias checks

Identify:

- token declarations or inline component CSS in Vue;
- configuration route variables outside `.routes.css`;
- semantic or property-state resolution outside `.states.css`;
- rendering properties outside `.css` or approved family anatomy CSS;
- configuration selectors in state or rendering layers;
- state selectors in token, route, or rendering layers;
- actual CSS properties applied by a DOM owner different from the blueprint;
- a route variable when no configuration selection exists;
- a rendered private variable that is not produced by state resolution and is not needed as a stable generic bridge input;
- a private alias whose only purpose is renaming a directly usable canonical token or route variable;
- a stateful final value assigned outside `.states.css`.

## Family blueprint consistency

Identify:

- migrated family without a README blueprint;
- missing authoring mode, architecture version, library ownership/current path/public export, usage contract, foundation dependencies, profile, sources, supported surface, API, anatomy, token ownership, rendered-property matrix, test profile, state-matrix coverage, files, verification, or readiness;
- `Readiness: ready` with `TBD`, unresolved alternatives, missing decisions, blocked dependencies, or incomplete state coverage;
- varying property without a rendered-property matrix row;
- a rendered-property matrix row without an implemented applied/final value or actual owner;
- implemented winner or coexistence rule absent from the rendered-property matrix;
- grouped rendered-property rows whose properties differ in owner, stages, state inputs, winner rule, simultaneous outputs, or bridge;
- supported visual state routes not represented by the state-matrix coverage map;
- optional family token, anatomy, behavior, composable, context, Storybook helper, or Material pattern file that does not satisfy its extraction condition;
- production, library map, foundation/component registries, public exports, Storybook, tests, snapshots, or verification disagreeing with the accepted blueprint.

## Source-backed usage and scope checks

Where practical, report:

- public configuration not named by the supported surface;
- optional official capability implemented without a named scenario or current consumer;
- integrated product usage without component-choice or composition evidence;
- product-specific placement/workflow behavior moved into a shared component or Material pattern;
- project-specific shared UI presented as an official Material component;
- supported capability missing reachable states, accessibility, foundation, or testing requirements;
- project extension without explicit blueprint ownership;
- unsupported behavior presented as aligned;
- a state matrix presenting unsupported cases as accepted component surface.

These may require review evidence rather than syntax, but completion must still record them.

## Validation process

### Before implementation

1. inventory the relevant legacy/canonical family path and foundation domains;
2. classify tokens, private variables, utilities, primitives, public exports, consumer imports, stories, and current tests;
3. confirm exact official names, meanings, state surface, and source snapshot;
4. validate library ownership, migration mode, usage contract, and foundation dependency table;
5. validate the ready family blueprint, standard test profile, and state-matrix coverage plan;
6. verify the smallest applicable profile, token-layer presence, shortest property pipelines, and required test artifacts.

### During implementation

1. enforce library location and dependency direction;
2. enforce foundation and component ownership;
3. enforce required production files and exact style order;
4. enforce canonical token ownership and purity;
5. enforce route, state, rendering, and generic-bridge boundaries;
6. enforce rendered-property matrix, public export, consumer import, dependency, and state-matrix coverage;
7. enforce separation of contract, browser behavior, visual regression, and pure-behavior tests;
8. reject local foundation substitutes, obsolete parallel routes, empty layers, unnecessary aliases, deep imports, test-only production APIs, family-local forced states, and unapproved files.

### After implementation

1. update the library migration map and affected foundation/component registries;
2. make checks blocking for accepted new/migrated component and changed foundation contracts;
3. keep unrelated legacy surfaces advisory-only;
4. verify public token overrides, foundation bridges, public exports, and actual property owners at the owning test layer;
5. verify every rendered-property winner and simultaneous-output route has state-matrix and/or browser evidence;
6. verify the canonical state-matrix visual baseline and visible labels;
7. verify all changed consumers and representative paths for foundation corrections/replacements;
8. verify obsolete legacy files/exports/imports are removed;
9. require truthful human visual-review status;
10. reject completion when README, library map, registries, owner contracts, code, exports, Storybook, tests, snapshots, or risk registration disagree.

## Initial rollout

First enforce the library boundary and standard test profile for new work and active migrations.

Then start with the foundation domains consumed by `MDButton` and check:

- current and canonical owner paths;
- registry records and public/private contracts;
- exact system/component token ownership;
- state/ripple/focus, verification-adapter, and motion bridge boundaries;
- profile and exact applicable component file set;
- style order and layer ownership;
- token declarations independent of active configuration and state;
- duplicate ownership, local foundation substitutes, empty layers, unnecessary aliases, and private-variable escape;
- system-token bypass;
- unread or undeclared route/final variables;
- family README library ownership, usage, dependency, rendered-property matrix, test profile, and state-matrix coverage;
- one canonical Button `StateMatrix` visual surface rather than scattered visual-state galleries;
- real browser behavior tests remaining separate from forced visual state;
- complete consumer import migration and old-path removal.

Apply the same library/foundation/component/testing rules to `MDSwitch`. Generalize validator or Storybook fixture helpers only when they work for both pilots without hidden component-specific exceptions.

## Enforcement levels

- `legacy advisory`: reports existing drift without blocking unrelated local repairs;
- `library authoring blocking`: blocks new Material artifacts or active physical migrations;
- `foundation authoring blocking`: blocks an accepted foundation addition/correction/replacement;
- `component authoring blocking`: blocks a new component or active migration, including its standard test profile;
- `layered-v1 blocking`: blocks every later change to an accepted migrated component;
- `verified foundation blocking`: blocks every later change to a verified foundation contract.

A component or foundation domain must not be reported complete while a required validator rule is missing unless that verification gap is explicitly recorded. Missing human visual review remains a merge blocker when required; it is not a validator pass/fail that automation can self-approve.

## Review expectation

A Material PR should report:

- authoring/foundation/migration mode and source snapshot;
- current and canonical library owners;
- supported scenarios, usage contract, and non-goals;
- foundation dependencies and affected registry records;
- architecture profile and exact layers;
- token classification and ownership;
- public export and consumer import migration;
- shortest property-pipeline and state-resolution summary;
- standard test-profile artifacts and state-matrix coverage;
- contract, real-browser, visual, pure-behavior, and consumer verification;
- state-matrix story id, baseline result, and human visual-review status;
- library/foundation/component validator result and enforcement level;
- removed legacy paths, unsupported features, deviations, and remaining verification gaps.
