# Material 3 token and architecture validation

## Principle

Material token and component-layer policy must be mechanically checkable where practical. A name or file that looks compliant but does not map to official guidance or declared ownership creates long-term drift.

Validation reads actual component CSS, the family `README.md`, and the component registry. Do not maintain a second handwritten runtime token map as another source of truth.

## Validation scopes

### Token vocabulary

Identify:

- public `--md-*` tokens that do not map to verified `md.ref`, `md.sys`, or `md.comp` vocabulary;
- project-specific values incorrectly placed under `--md-*`;
- exact official component-token paths missing from a migrated component;
- invented, shortened, or normalized `--md-comp-*` names;
- raw Material values that bypass available tokens;
- deprecated or compatibility tokens.

### Canonical ownership

Identify:

- canonical `--md-comp-*` declarations outside the component or family owner file named by the family contract;
- component-specific tokens incorrectly moved to a family token file;
- family token files without at least two declared public component consumers;
- family token selectors that do not match the exact applicable root list from the family contract;
- duplicate canonical component-token declarations;
- family-private variables referenced outside the owning family;
- generic state, ripple, focus, elevation, or motion primitives reading family-specific variables;
- component internals bypassing an available `--md-comp-*` route with direct `--md-sys-*` values.

### Canonical token-layer purity

Identify in `<Component>.tokens.css` and `<Family>.tokens.css`:

- configuration modifier selectors;
- semantic or interaction state selectors;
- pseudo-classes;
- normal rendering properties;
- private or app token declarations;
- tokens conditionally declared only for the currently active variant, size, shape, width, density, mode, or state.

Canonical token declarations must be available on the owning root independently of active configuration and state.

### `layered-v1` structure

Identify:

- missing required `.vue`, `.tokens.css`, `.routes.css`, `.states.css`, or `.css` files;
- missing handoff-declared family token, anatomy, behavior, or context files;
- style layers loaded in the wrong order;
- visual token declarations or inline component CSS in `.vue`;
- private route variables outside `.routes.css`;
- semantic-bank selection or property-state resolution outside `.states.css`;
- normal rendering properties outside `.css` or an explicitly approved family anatomy file;
- configuration selectors in state or rendering layers;
- state selectors in token, route, or rendering layers;
- additional production files not named by the ready component contract.

### Family-contract consistency

Identify:

- migrated family without `README.md`;
- family README missing canonical token ownership or rendered-property matrix sections;
- stateful rendered variable without a property-matrix row;
- matrix row without an implemented final rendered variable;
- implemented property winner order or simultaneous output absent from the README;
- task handoff changing family decisions without updating the README in the same PR;
- registry status or verification claims inconsistent with the README or implementation.

## Allowed public token namespaces

| Namespace     | Use                                             |
| ------------- | ----------------------------------------------- |
| `--md-ref-*`  | Material reference tokens.                      |
| `--md-sys-*`  | Material system tokens.                         |
| `--md-comp-*` | Verified Material component tokens.             |
| `--app-*`     | Project-specific tokens outside Material terms. |

Do not introduce another public token namespace without updating the foundation contract.

## Validation source

The validator should use:

1. actual CSS declarations and references in the repository;
2. the migrated family's `README.md` as the accepted family contract;
3. the verified Material MCP/cache token inventory;
4. documented deviations and missing-token gaps;
5. the component registry's migrated-component inventory.

A generated allowlist may cache verified names for tooling performance, but it must be reproducible from a named source snapshot and must not become a separately edited contract.

The task handoff is input for reviewing the current delta, not a durable validator source after merge.

## Validation process

Before migrating a component:

1. collect custom properties from the component and direct generic foundations;
2. classify each property as reference, system, official component, app-specific, family-private route, family-private rendered value, generic foundation bridge, compatibility alias, or obsolete;
3. compare official names and meanings through MCP or fallback cache;
4. assign every official token to one component or family owner file;
5. complete the rendered-property matrix with property-specific interaction resolution;
6. document missing official paths and deliberate deviations;
7. run the validator in advisory mode against the legacy implementation.

During migration:

1. enforce fixed component layer files and handoff-declared family files;
2. move canonical component tokens to the named token owner files;
3. remove configuration and state selectors from canonical token layers;
4. move configuration routes to `.routes.css`;
5. move semantic-bank selection and property-specific interaction resolution to `.states.css`;
6. apply rendered values only in `.css` or approved family anatomy CSS;
7. update the family README from the exact handoff delta;
8. remove obsolete declarations and bypasses rather than retaining parallel routes.

After migration:

1. make architecture and token checks blocking for that component;
2. keep unmigrated components advisory-only;
3. verify component-token overrides and actual property owners in browser tests;
4. verify each property winner order and simultaneous output from the family matrix;
5. update the registry and family README with remaining gaps;
6. reject completion when README, implementation, verification, or registry disagree.

## Initial implementation order

The first validator implementation should target `MDButton` only and check:

- required file names and style order;
- allowed declarations and selectors per layer;
- exact `--md-comp-button-*` names against the verified source inventory;
- canonical tokens declared independently of active configuration and state;
- duplicate canonical declarations;
- family-private variable escape;
- direct system-token bypass where an official component token exists;
- undeclared or unread route and rendered variables;
- README matrix coverage for stateful rendered properties.

After `MDButton` passes, apply the same validator to `MDSwitch`, including any handoff-declared family token ownership. Generalize a rule only when it remains valid for both pilots without component-specific exceptions hidden in the validator.

## Enforcement levels

- `legacy advisory`: reports drift without blocking unrelated legacy fixes;
- `migration blocking`: blocks completion of an active architecture migration;
- `layered-v1 blocking`: blocks every later change to a migrated component.

A component must not be marked architecture-complete while a required rule remains manual without being explicitly recorded as missing verification.

## Review expectation

A Material token or architecture PR should include:

- checked Material token docs or component specs;
- token classification and canonical ownership summary;
- architecture impact and family-contract delta;
- property-specific state-resolution summary;
- validator result and enforcement level;
- focused browser verification for public overrides, state combinations, and actual property owners;
- explicit remaining gaps rather than an unsupported alignment claim.
