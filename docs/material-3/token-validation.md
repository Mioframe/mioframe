# Material 3 token and architecture validation

## Principle

Material token, layer, ownership, and family-contract policy should be mechanically checked where practical. Validation reads actual component files, the family README blueprint, verified Material token inventory, and component registry. Do not maintain a second handwritten runtime token map.

## Validation sources

Use:

1. actual CSS, Vue, and production files;
2. the migrated family `README.md` blueprint;
3. the verified Material MCP/cache token inventory;
4. documented missing-token gaps and deviations;
5. component registry status.

A task handoff is evidence for the current delta, not a durable validator source after merge.

A generated allowlist may cache verified token names for performance only when reproducible from a named source snapshot.

## Token vocabulary checks

Identify:

- public `--md-*` names that do not map to verified `md.ref`, `md.sys`, or `md.comp` vocabulary;
- invented, shortened, or normalized component-token names;
- project-specific values incorrectly placed under `--md-*`;
- missing official tokens required by the supported surface;
- raw Material values that bypass available tokens;
- deprecated or compatibility tokens.

## Canonical ownership checks

Identify:

- canonical tokens outside the owner file named by the family blueprint;
- duplicate canonical declarations;
- empty component or family token files;
- component token files whose component owns no official token;
- component-specific tokens incorrectly placed in a family token file;
- family token files without at least two declared public component consumers;
- family token selectors differing from the exact applicable root list;
- private family variables referenced outside the family;
- generic foundations reading family-specific tokens or private variables;
- direct system-token bypass when an official component token exists.

## Token-layer purity checks

In component and family token files, reject:

- configuration modifiers;
- semantic or interaction state selectors;
- pseudo-classes;
- rendering properties;
- private or app token declarations;
- tokens conditionally declared only for an active configuration or state.

Canonical tokens must exist on the owning root independently of active configuration and state.

## Architecture profile checks

Read the selected profile and token ownership from the family blueprint.

### `simple`

Require `.vue` and `.css`. Reject `.routes.css` and `.states.css`.

### `configured`

Require `.vue`, `.routes.css`, and `.css`. Reject `.states.css`.

### `stateful`

Require `.vue`, `.routes.css`, `.states.css`, and `.css`.

For every profile:

- require `<Component>.tokens.css` only when the component owns at least one official token;
- require `<Family>.tokens.css` only when approved shared official token ownership exists;
- reject empty token, route, or state files;
- verify exact applicable style order;
- reject additional production files not permitted by the blueprint and architecture rules.

## Layer checks

Identify:

- token declarations or inline component CSS in Vue;
- configuration route variables outside `.routes.css`;
- semantic-bank or property-state resolution outside `.states.css`;
- rendering properties outside `.css` or approved family anatomy CSS;
- configuration selectors in state or rendering layers;
- state selectors in token, route, or rendering layers;
- final rendered values assigned outside the state layer for stateful properties;
- actual CSS properties applied by a DOM owner different from the blueprint.

## Family blueprint consistency

Identify:

- migrated family without a README blueprint;
- missing authoring mode, architecture version, profile, sources, supported surface, API, anatomy, token ownership, property matrix, files, verification, or readiness;
- `Readiness: ready` with `TBD`, unresolved alternatives, or missing decisions;
- stateful rendered variable without a matrix row;
- matrix row without an implemented final value or actual owner;
- implemented winner or coexistence rule absent from the matrix;
- optional family token, anatomy, behavior, composable, or context file that does not satisfy its extraction condition;
- production, Storybook, registry, or verification disagreeing with the accepted blueprint.

## Source-backed scope checks

Where practical, report:

- public configuration not named by the supported surface;
- optional official capability implemented without a named scenario or current consumer;
- supported capability missing reachable states or accessibility behavior;
- project extension without explicit blueprint ownership;
- unsupported behavior presented as aligned.

These may require review evidence rather than syntax, but completion must still record them.

## Validation process

### Before implementation

1. run advisory inventory against the relevant family area;
2. classify tokens and private variables;
3. confirm exact official names and source snapshot;
4. validate the ready family blueprint;
5. verify the smallest applicable profile and token-layer presence.

### During implementation

1. enforce required files and exact style order;
2. enforce canonical token ownership and purity;
3. enforce route, state, and rendering boundaries;
4. enforce property-matrix coverage;
5. reject obsolete parallel routes, empty layers, and unapproved files.

### After implementation

1. make checks blocking for the new or migrated component;
2. keep unrelated legacy components advisory-only;
3. verify public token overrides and actual property owners in browser tests;
4. verify matrix winner and simultaneous-output cases;
5. reject completion when README, code, registry, Storybook, or tests disagree.

## Initial rollout

Start with `MDButton` and check:

- profile and exact applicable file set;
- style order and layer ownership;
- exact verified `--md-comp-button-*` names;
- token declarations independent of active configuration and state;
- duplicate ownership, empty layers, and private-variable escape;
- system-token bypass;
- unread or undeclared route/final variables;
- family README matrix coverage.

Then apply the same rules to `MDSwitch`. Generalize validator logic only when it works for both pilots without hidden component-specific exceptions.

## Enforcement levels

- `legacy advisory`: reports existing drift without blocking unrelated local repairs;
- `authoring blocking`: blocks a new component or active migration;
- `layered-v1 blocking`: blocks every later change to an accepted migrated component.

A component must not be reported architecture-complete while a required validator rule is missing unless that verification gap is explicitly recorded.

## Review expectation

A Material component PR should report:

- authoring mode and source snapshot;
- supported scenarios and non-goals;
- architecture profile and exact layers;
- token classification and ownership;
- property-state resolution summary;
- validator result and enforcement level;
- focused browser verification;
- unsupported features, deviations, and remaining verification gaps.
