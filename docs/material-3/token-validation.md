# Material 3 token and architecture validation

## Principle

Material token and component-layer policy must be mechanically checkable where practical. A name or file that looks compliant but does not map to official guidance or declared ownership creates long-term drift.

Validation reads the actual component CSS and architecture files. Do not maintain a second handwritten runtime token map as another source of truth.

## Validation scopes

### Token vocabulary

Identify:

- public `--md-*` tokens that do not map to verified `md.ref`, `md.sys`, or `md.comp` vocabulary;
- project-specific values incorrectly placed under `--md-*`;
- exact official component-token paths missing from a migrated component;
- invented, shortened, or normalized `--md-comp-*` names;
- raw Material values that bypass available tokens;
- deprecated or compatibility tokens.

### Ownership

Identify:

- canonical `--md-comp-*` declarations outside the owning `<Component>.tokens.css`;
- duplicate canonical component-token declarations;
- family-private variables referenced outside the owning family;
- generic state, ripple, focus, elevation, or motion primitives reading family-specific variables;
- component internals bypassing an available `--md-comp-*` route with direct `--md-sys-*` values.

### `layered-v1` structure

Identify:

- missing required `.vue`, `.tokens.css`, `.routes.css`, `.states.css`, or `.css` files;
- style layers loaded in the wrong order;
- visual token declarations or inline component CSS in `.vue`;
- private route variables outside `.routes.css`;
- semantic or interaction state resolution outside `.states.css`;
- normal rendering properties outside `.css` or an explicitly approved family anatomy file;
- configuration selectors in state or rendering layers;
- state selectors in token, route, or rendering layers;
- additional production files not named by the ready component contract.

## Allowed public token namespaces

| Namespace     | Use                                              |
| ------------- | ------------------------------------------------ |
| `--md-ref-*`  | Material reference tokens.                       |
| `--md-sys-*`  | Material system tokens.                          |
| `--md-comp-*` | Verified Material component tokens.              |
| `--app-*`     | Project-specific tokens outside Material terms.  |

Do not introduce another public token namespace without updating the foundation contract.

## Validation source

The validator should use:

1. actual CSS declarations and references in the repository;
2. the verified Material MCP/cache token inventory;
3. documented deviations and missing-token gaps;
4. the exact migrated-component inventory from the component registry or family contracts.

A generated allowlist may cache verified names for tooling performance, but it must be reproducible from a named source snapshot and must not become a separately edited contract.

## Validation process

Before migrating a component:

1. collect custom properties from the component and direct generic foundations;
2. classify each property as reference, system, official component, app-specific, family-private route, family-private rendered value, generic foundation bridge, compatibility alias, or obsolete;
3. compare official names and meanings through MCP or fallback cache;
4. complete the ready rendered-property route table;
5. document missing official paths and deliberate deviations;
6. run the validator in advisory mode against the legacy implementation.

During migration:

1. enforce the fixed `layered-v1` files and style order;
2. move canonical component tokens to `.tokens.css`;
3. move configuration routes to `.routes.css`;
4. move semantic and interaction resolution to `.states.css`;
5. apply rendered values only in `.css` or approved family anatomy CSS;
6. remove obsolete declarations and bypasses rather than retaining parallel routes.

After migration:

1. make architecture and token checks blocking for that component;
2. keep unmigrated components advisory-only;
3. verify component-token overrides and actual property owners in browser tests;
4. update the registry and family README with any remaining gaps.

## Initial implementation order

The first validator implementation should target `MDButton` only and check:

- required file names and style order;
- allowed declarations and selectors per layer;
- exact `--md-comp-button-*` names against the verified source inventory;
- duplicate canonical declarations;
- family-private variable escape;
- direct system-token bypass where an official component token exists;
- undeclared or unread route and rendered variables.

After `MDButton` passes, apply the same validator to `MDSwitch`. Generalize a rule only when it remains valid for both pilots without component-specific exceptions hidden in the validator.

## Enforcement levels

- `legacy advisory`: reports drift without blocking unrelated legacy fixes;
- `migration blocking`: blocks completion of an active architecture migration;
- `layered-v1 blocking`: blocks every later change to a migrated component.

A component must not be marked architecture-complete while a required rule remains manual without being explicitly recorded as missing verification.

## Review expectation

A Material token or architecture PR should include:

- checked Material token docs or component specs;
- token classification and ownership summary;
- architecture impact and component-contract status;
- validator result and enforcement level;
- focused browser verification for public overrides and actual property owners;
- explicit remaining gaps rather than an unsupported alignment claim.
