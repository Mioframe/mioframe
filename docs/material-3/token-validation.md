# Material 3 token and architecture validation

## Principle

Material token, foundation, component layer, ownership, usage, and contract policy should be mechanically checked where practical. Validation reads actual production files, foundation and component registries, family README blueprints, verified Material inventories, and tests. Do not maintain a second handwritten runtime token or state map.

## Validation sources

Use:

1. actual CSS, Vue, TypeScript, build configuration, and public exports;
2. the family `README.md` blueprint;
3. [Foundation registry](./foundation-registry.md) and domain owner contracts;
4. the verified Material MCP/cache inventory and snapshot metadata;
5. component registry, deviations, Storybook, and verification status.

A task handoff is evidence for the current delta, not a durable validator source after merge.

A generated allowlist may cache verified token names for performance only when reproducible from a named source snapshot.

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
- a missing foundation dependency table;
- an applicable foundation domain omitted from the table;
- a dependency owner or status that disagrees with the registry;
- a `partial` or `deviated` dependency without confirmation that its exact required capability is sufficient;
- a `blocked` dependency while the component claims readiness;
- a foundation change not classified as `none`, `additive`, `correction`, or `replacement`;
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

- reference/system tokens outside their foundation owner;
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
- overlay foundation owns containment/lifecycle capabilities without component-specific anatomy or policy;
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
- missing authoring mode, architecture version, usage contract, foundation dependencies, profile, sources, supported surface, API, anatomy, token ownership, property matrix, files, verification, or readiness;
- `Readiness: ready` with `TBD`, unresolved alternatives, missing decisions, or blocked dependencies;
- varying property without a matrix row;
- matrix row without an implemented applied/final value or actual owner;
- implemented winner or coexistence rule absent from the matrix;
- grouped matrix row whose properties differ in owner, stages, state inputs, winner rule, simultaneous outputs, or bridge;
- optional family token, anatomy, behavior, composable, or context file that does not satisfy its extraction condition;
- production, foundation/component registries, Storybook, or verification disagreeing with the accepted blueprint.

## Source-backed usage and scope checks

Where practical, report:

- public configuration not named by the supported surface;
- optional official capability implemented without a named scenario or current consumer;
- integrated product usage without component-choice or composition evidence;
- product-specific placement/workflow behavior moved into a shared component;
- supported capability missing reachable states, accessibility, or foundation requirements;
- project extension without explicit blueprint ownership;
- unsupported behavior presented as aligned.

These may require review evidence rather than syntax, but completion must still record them.

## Validation process

### Before implementation

1. run advisory inventory against the relevant family and foundation domains;
2. classify tokens, private variables, utilities, and primitives;
3. confirm exact official names, meanings, and source snapshot;
4. validate the usage contract and foundation dependency table;
5. validate the ready family blueprint;
6. verify the smallest applicable profile, token-layer presence, and shortest property pipelines.

### During implementation

1. enforce foundation and component ownership;
2. enforce required files and exact style order;
3. enforce canonical token ownership and purity;
4. enforce route, state, rendering, and generic-bridge boundaries;
5. enforce property-matrix and dependency coverage;
6. reject local foundation substitutes, obsolete parallel routes, empty layers, unnecessary aliases, and unapproved files.

### After implementation

1. update affected foundation and component registries;
2. make checks blocking for accepted new/migrated component and changed foundation contracts;
3. keep unrelated legacy surfaces advisory-only;
4. verify public token overrides, foundation bridges, and actual property owners in browser tests;
5. verify matrix winner and simultaneous-output cases;
6. verify representative consumers for foundation corrections/replacements;
7. reject completion when README, registries, owner contracts, code, Storybook, or tests disagree.

## Initial rollout

Start with the foundation domains consumed by `MDButton`, then check:

- registry records and owner paths;
- exact system/component token ownership;
- state/ripple/focus and motion bridge boundaries;
- profile and exact applicable component file set;
- style order and layer ownership;
- token declarations independent of active configuration and state;
- duplicate ownership, local foundation substitutes, empty layers, unnecessary aliases, and private-variable escape;
- system-token bypass;
- unread or undeclared route/final variables;
- family README usage, dependency, and matrix coverage.

Then apply the same foundation/component rules to `MDSwitch`. Generalize validator logic only when it works for both pilots without hidden component-specific exceptions.

## Enforcement levels

- `legacy advisory`: reports existing drift without blocking unrelated local repairs;
- `foundation authoring blocking`: blocks an accepted foundation addition/correction/replacement;
- `component authoring blocking`: blocks a new component or active migration;
- `layered-v1 blocking`: blocks every later change to an accepted migrated component;
- `verified foundation blocking`: blocks every later change to a verified foundation contract.

A component or foundation domain must not be reported complete while a required validator rule is missing unless that verification gap is explicitly recorded.

## Review expectation

A Material PR should report:

- authoring/foundation change mode and source snapshot;
- supported scenarios, usage contract, and non-goals;
- foundation dependencies and affected registry records;
- architecture profile and exact layers;
- token classification and ownership;
- shortest property-pipeline and state-resolution summary;
- foundation/component validator result and enforcement level;
- focused browser and representative consumer verification;
- unsupported features, deviations, and remaining verification gaps.
