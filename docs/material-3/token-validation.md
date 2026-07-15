# Material 3 token and architecture validation

## Principle

Material library location, dependency direction, token, foundation, component layer, ownership, usage, migration, and contract policy should be mechanically checked where practical. Validation reads actual production files, public exports, the Material library map, foundation and component registries, family README blueprints, verified Material inventories, and tests. Do not maintain a second handwritten runtime token or state map.

## Validation sources

Use:

1. actual CSS, Vue, TypeScript, build configuration, paths, imports, and public exports;
2. [Library architecture](./library-architecture.md) and `src/shared/ui/material/README.md`;
3. the family `README.md` blueprint;
4. [Foundation registry](./foundation-registry.md) and domain owner contracts;
5. the verified Material MCP/cache inventory and snapshot metadata;
6. component registry, deviations, Storybook, and verification status.

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
- old files, tests, Storybook paths, risk registrations, or imports remaining after migration;
- behavior, token, API, or rendered-output changes hidden inside a relocation-only claim;
- unrelated families or foundation domains moved in the same PR;
- a root Material barrel created before any production artifact can be exported honestly;
- a moved artifact omitted from family/domain README, registries, public exports, or the library migration map.

A migrated artifact is not complete until old paths are removed and every in-repository consumer uses the accepted public library API.

## Foundation registry checks

Identify:

- a public foundation token, utility, primitive, or bridge without a registry record;
- a registry owner path that does not exist;
- a registry record whose public/private contract disagrees with production exports or code;
- a `verified` record without exact source snapshot or required verification;
- stale status, known gaps, consumer lists, verification, or last-reviewed metadata after a foundation change;
- historical audit text used as current status instead of the registry;
- component-family names or variables inside generic foundation owners;
- duplicate theme, unit, state, ripple, focus, typography, motion, icon, overlay, or adaptive mechanisms.

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
- missing authoring mode, architecture version, library ownership/current path/public export, usage contract, foundation dependencies, profile, sources, supported surface, API, anatomy, token ownership, property matrix, files, verification, or readiness;
- `Readiness: ready` with `TBD`, unresolved alternatives, missing decisions, or blocked dependencies;
- varying property without a matrix row;
- matrix row without an implemented applied/final value or actual owner;
- implemented winner or coexistence rule absent from the matrix;
- grouped matrix row whose properties differ in owner, stages, state inputs, winner rule, simultaneous outputs, or bridge;
- optional family token, anatomy, behavior, composable, context, or Material pattern file that does not satisfy its extraction condition;
- production, library map, foundation/component registries, public exports, Storybook, or verification disagreeing with the accepted blueprint.

## Source-backed usage and scope checks

Where practical, report:

- public configuration not named by the supported surface;
- optional official capability implemented without a named scenario or current consumer;
- integrated product usage without component-choice or composition evidence;
- product-specific placement/workflow behavior moved into a shared component or Material pattern;
- project-specific shared UI presented as an official Material component;
- supported capability missing reachable states, accessibility, or foundation requirements;
- project extension without explicit blueprint ownership;
- unsupported behavior presented as aligned.

These may require review evidence rather than syntax, but completion must still record them.

## Validation process

### Before implementation

1. inventory the relevant legacy/canonical family path and foundation domains;
2. classify tokens, private variables, utilities, primitives, public exports, and consumer imports;
3. confirm exact official names, meanings, and source snapshot;
4. validate library ownership, migration mode, usage contract, and foundation dependency table;
5. validate the ready family blueprint;
6. verify the smallest applicable profile, token-layer presence, and shortest property pipelines.

### During implementation

1. enforce library location and dependency direction;
2. enforce foundation and component ownership;
3. enforce required files and exact style order;
4. enforce canonical token ownership and purity;
5. enforce route, state, rendering, and generic-bridge boundaries;
6. enforce property-matrix, public export, consumer import, and dependency coverage;
7. reject local foundation substitutes, obsolete parallel routes, empty layers, unnecessary aliases, deep imports, and unapproved files.

### After implementation

1. update the library migration map and affected foundation/component registries;
2. make checks blocking for accepted new/migrated component and changed foundation contracts;
3. keep unrelated legacy surfaces advisory-only;
4. verify public token overrides, foundation bridges, public exports, and actual property owners in browser tests;
5. verify matrix winner and simultaneous-output cases;
6. verify all changed consumers and representative paths for foundation corrections/replacements;
7. verify obsolete legacy files/exports/imports are removed;
8. reject completion when README, library map, registries, owner contracts, code, exports, Storybook, or tests disagree.

## Initial rollout

First enforce the library boundary for new work and active migrations.

Then start with the foundation domains consumed by `MDButton` and check:

- current and canonical owner paths;
- registry records and public/private contracts;
- exact system/component token ownership;
- state/ripple/focus and motion bridge boundaries;
- profile and exact applicable component file set;
- style order and layer ownership;
- token declarations independent of active configuration and state;
- duplicate ownership, local foundation substitutes, empty layers, unnecessary aliases, and private-variable escape;
- system-token bypass;
- unread or undeclared route/final variables;
- family README library ownership, usage, dependency, and matrix coverage;
- complete consumer import migration and old-path removal.

Apply the same library/foundation/component rules to `MDSwitch`. Generalize validator logic only when it works for both pilots without hidden component-specific exceptions.

## Enforcement levels

- `legacy advisory`: reports existing drift without blocking unrelated local repairs;
- `library authoring blocking`: blocks new Material artifacts or active physical migrations;
- `foundation authoring blocking`: blocks an accepted foundation addition/correction/replacement;
- `component authoring blocking`: blocks a new component or active migration;
- `layered-v1 blocking`: blocks every later change to an accepted migrated component;
- `verified foundation blocking`: blocks every later change to a verified foundation contract.

A component or foundation domain must not be reported complete while a required validator rule is missing unless that verification gap is explicitly recorded.

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
- library/foundation/component validator result and enforcement level;
- focused browser and representative consumer verification;
- removed legacy paths, unsupported features, deviations, and remaining verification gaps.
