# Material 3 component architecture

This document is the canonical production architecture and family-blueprint contract for public Material components under:

```text
src/shared/ui/material/components/<family>
```

It owns component-family boundaries, public contract decisions, state and DOM ownership, production layers, token routing, and the complete blueprint schema. Other Material documents explain foundation, testing, validation, and workflow rules but must not add mandatory blueprint fields outside this schema.

## Scope

Apply this architecture to:

- every new public official `MD*` component;
- every existing public `MD*` component migrated to the Material library;
- every material change to a migrated component's API, native semantics, anatomy, state model, token ownership, property routing, or verification surface.

A strict local repair to an unmigrated component may record `Architecture impact: none` only when it preserves location, public imports, API, native semantics, foundation dependencies, anatomy, state meaning, testing surface, behavior, and unrelated rendered output.

Generic state-layer, ripple, focus, elevation, motion, icon, overlay, and other cross-family foundations are not component families.

## Authoring modes

Record exactly one before production edits.

### `standard-authoring`

Use when every required decision can be derived from:

1. required user scenarios;
2. official Material sources;
3. repository rules and accepted family/foundation contracts;
4. native platform semantics;
5. this deterministic architecture.

The family README blueprint becomes the implementation contract. A separate architecture handoff is unnecessary.

### `handoff-authoring`

Use when a ready architecture handoff supplies an exact family-contract delta. Do not redesign unchanged sections.

### `blocked`

Use when source meaning, ownership, public compatibility, family boundary, required foundation capability, state coverage, or required browser verification cannot be resolved.

Do not replace a blocked decision with an approximation, compatibility alias, broad option, local foundation substitute, or generic abstraction.

## Sources of truth

1. This document owns component architecture and the complete blueprint schema.
2. A migrated family's `README.md` owns its accepted durable blueprint instance.
3. [Foundation architecture](./foundation-architecture.md) and the foundation registry own cross-family dependencies.
4. [Component testing architecture](./component-testing.md) owns proof-layer separation and state-matrix rules.
5. A task handoff, when present, owns only the approved delta.

Production code, family README, library map, public exports, registries, Storybook, tests, snapshots, and risk registration must agree.

## Bounded discovery

Use this order:

1. read applicable `AGENTS.md` and Material skills;
2. inspect the Material library map, component registry, current family README, and applicable foundation records;
3. inspect named consumers and only the nearest relevant integration patterns;
4. check Material MCP/cache health;
5. read only relevant component, foundation, accessibility, and usage pages;
6. use the official Material Design Kit only when published docs cannot resolve exact visual geometry or state composition;
7. stop when scenarios, ownership, supported surface, anatomy, states, tokens, accessibility, and verification are resolved.

Do not inspect unrelated families to seek a generic design.

## Minimum complete surface

Implement the smallest coherent official surface required by current scenarios and consumers.

Rules:

1. Start from explicit scenarios and final behavior.
2. Reuse an official Material component or documented composition when it covers the need.
3. Include one canonical Material default.
4. Add variants, sizes, shapes, modes, anatomy, or behavior only for a named scenario or current consumer.
5. Include every reachable state, accessibility requirement, and foundation dependency of the supported surface.
6. Record other official capabilities as unsupported.
7. Add no Mioframe extension without an explicit requirement and owner.

When the request names only a component, use canonical Material default usage. Do not implement optional completeness speculatively.

## Family ownership

A family is a durable ownership boundary, not a copy of the legacy directory tree.

A single public component may own its own family. Multiple public components share one family only when:

1. official Material guidance treats them as one family or explicit parent/child set;
2. at least one real shared production contract exists now, such as exact family tokens, shared anatomy, required runtime context, or shared component behavior; and
3. shared ownership keeps APIs and dependencies clearer than separate families.

Insufficient reasons:

- legacy directory proximity;
- similar names or appearance;
- repeated CSS syntax or values;
- fewer files;
- hypothetical future reuse.

One family must not deep-import another family's private files. Every family-private entry point, token owner, anatomy contract, context, or behavior shared by public family members is named in the blueprint.

Use `single-component family` when no multi-component boundary is justified. Unresolved family ownership is blocking.

## Canonical family blueprint

Before production code, create or update the family `README.md` using this complete schema.

```text
MATERIAL COMPONENT BLUEPRINT

Authoring mode: standard-authoring | handoff-authoring
Architecture version: layered-v1
Change mode: new-component | library-relocation-only | architecture-only | alignment-only | combined-approved

Family:
Components:
Family ownership basis:
Existing family contract: none | <family README path>
Contract delta: complete initial contract | <changed sections>

Library ownership:
- Current path: none | <legacy path>
- Canonical path: src/shared/ui/material/components/<family>
- Migration status: legacy | migrating | migrated
- Public library export: <export name/path>
- Consumer import migration scope: none | <named consumers>

Required scenarios:
Non-goals:
Official sources:
Verified documentation snapshot:
Official Design Kit evidence: not required | <file/version and component-set reference>

Material usage contract:
- Intended scenarios:
- Do not use for:
- Component-choice evidence:
- Action/content hierarchy:
- Allowed Material compositions:
- Placement constraints:
- Adaptive behavior and owner:
- Product integration in this PR: none | <named consumers>

Supported Material surface:
Unsupported Material surface:
Public API:
Native semantics:
Invalid combinations:

Anatomy ownership:
Configuration axes:
Semantic states:
Interaction states:
State ownership:

Foundation dependencies:
| Domain | Required capability | Accepted owner/contract | Registry status | Change in this PR |
| --- | --- | --- | --- | --- |

Architecture profile per component:
Canonical token ownership:
Rendered-property matrix:

Mioframe extensions:
Documented deviations:

Production files:
Public/export files:
Storybook files:
Verification files and cases:
Consumer blast radius:

Standard test profile:
- Component contract: <path and cases>
- StateMatrix: <story id and root anchor>
- State-matrix coverage: <table below>
- Visual regression: <path and screenshot sections>
- Browser behavior: <path/cases> | not applicable (<reason>)
- Pure behavior: <path/cases> | not applicable (<reason>)
- Consumer preservation: none | <paths/cases>

State matrix coverage:
| Visible route/group | Supported state/configuration | Distinct visible output | Matrix section/row/column |
| --- | --- | --- | --- |

Human visual review:
- Required: yes | no (<reason>)
- Last accepted review: none | <PR/date>
- Source snapshot: none | <documentation/Design Kit snapshot>

Unresolved: none
Readiness: ready
```

Use concise tables where useful. Include only decisions applicable to the supported surface.

`Readiness: ready` requires every field to be resolved or explicitly `none`/`not applicable`. `TBD`, unresolved alternatives, speculative extension points, missing or blocked foundation dependencies, and incomplete visible-state coverage are forbidden.

No other document may define additional mandatory blueprint fields. Workflow documents may summarize or reference this schema only.

## State ownership

Every supported state has one source of truth and one change path.

Defaults:

- consumer/product semantic state exposed through a public prop is controlled by the consumer;
- user interaction emits intent or a next value; the consumer updates the prop;
- browser facts such as hover, focus-visible, and ordinary pressed acquisition are browser/foundation-owned;
- the component maps browser facts to component-specific property routes;
- component-owned transient state is allowed only for owned gesture sessions, overlay lifecycle, animation coordination, or unavoidable native-platform coordination.

A component must not keep a hidden parallel copy of controlled state or infer product state from visual interaction state.

Component-owned transient state defines acquisition, release, cancellation, disabled behavior, failure behavior, and unmount cleanup where applicable.

Use `State ownership: none` when no state applies.

## Anatomy and DOM ownership

`Anatomy ownership` is the authoritative map from Material anatomy to DOM and accessibility owners.

For every interactive or semantic anatomy part, record applicable owners:

- actual DOM/native element;
- native semantics or explicit role;
- focus owner;
- accessible-name source;
- semantic `aria-*` state owner;
- disabled or readonly owner;
- target-area owner;
- state-layer and ripple owner;
- focus-indicator geometry target;
- whether consumer-provided interactive content is allowed, prohibited, or isolated;
- final rendered-property owner.

Non-interactive anatomy records applicable DOM, content, and rendered-property owners only.

Each concern has one owner. Parent and child components must not implicitly split native action, focus, accessible naming, target area, state layer, ripple, or final rendering. A parent may provide an explicit public input or family context; the component rendering the anatomy applies its semantics and styling.

## Deterministic profiles

Configuration routing and state resolution are independent axes. Select exactly one profile per component.

### `simple`

No configuration axis selects different values and no semantic/interaction state changes a rendered property.

```text
<Component>.vue
<Component>.css
```

### `configured`

Configuration selects different values and state does not change rendered properties.

```text
<Component>.vue
<Component>.routes.css
<Component>.css
```

### `stateful`

State changes rendered properties and no configuration axis selects different candidate values.

```text
<Component>.vue
<Component>.states.css
<Component>.css
```

### `configured-stateful`

Configuration selects candidates and state selects among them.

```text
<Component>.vue
<Component>.routes.css
<Component>.states.css
<Component>.css
```

Add `<Component>.tokens.css` only when the component owns at least one exact official component token used by the supported surface.

Each family owns `README.md` and `index.ts`. Do not create empty production layers for symmetry.

## Additional production files

Additional files are allowed only under these conditions.

### `<Family>.tokens.css`

The same exact official token path is consumed by at least two public family components. Equal values or similar usage are insufficient.

### `<Family>Anatomy.css`

At least two public family components render the same owned anatomy contract and require the same layout/property-owner rules.

### `<Component>Behavior.ts`

One component owns non-trivial keyboard, pointer, gesture, timing, or cleanup transitions requiring focused tests outside Vue rendering.

### `use<Component>Behavior.ts`

The same production behavior is required by at least two current public family components.

### `<Family>Context.ts`

Public parent and child components require runtime composition state that cannot be expressed through the public contract without unrelated prop forwarding.

No other production-file category is allowed without architecture escalation.

Storybook fixture components and test helpers are governed by component-testing architecture and are not production profile layers.

## Layer ownership

### `<Component>.vue`

Owns:

- typed props, emits, and slots;
- small named computed values;
- runtime fact acquisition;
- native element choice and explicit DOM-critical attributes;
- event wiring;
- anatomy;
- declared foundation primitives;
- ordered external style imports.

Forbidden:

- visual token declarations or values computed in TypeScript;
- inline component CSS;
- CSS state resolution;
- synthetic activation where native behavior exists;
- topology/render-plan/style-resolver objects;
- hidden DOM-critical attribute ownership.

### Token files

Own canonical official `--md-comp-*` defaults only.

Allowed selectors are the exact owning root or approved family-root list. Tokens exist independently of active configuration and state.

Forbidden:

- configuration modifiers;
- state selectors or pseudo-classes;
- private/app tokens;
- rendering properties;
- invented, shortened, normalized, or duplicate component tokens.

### `<Component>.routes.css`

Owns configuration routing into private route variables only.

Forbidden:

- semantic/interaction selectors;
- rendering properties;
- state-resolved values;
- public token declarations;
- anatomy/layout styling.

### `<Component>.states.css`

Owns property-specific semantic and interaction resolution and state-varying foundation bridges.

There is no universal state precedence for every property.

Forbidden:

- rendering properties;
- public token declarations;
- configuration routing;
- layout/anatomy styling;
- undocumented selector-order behavior.

### `<Component>.css`

Owns layout, geometry, typography application, presentation, transitions, target area, and final property application to actual DOM owners.

Forbidden:

- canonical token declarations;
- configuration routing;
- semantic/interaction source selection;
- styling another component's internals through `:deep()`.

## Style order

Load only applicable files in this order:

```text
<Family>.tokens.css
<Component>.tokens.css
<Component>.routes.css
<Component>.states.css
<Family>Anatomy.css
<Component>.css
```

Omit inapplicable layers. Do not collapse a required layer into another file.

## Value pipeline

Map official component-token paths mechanically:

```text
md.comp.<component>.[variant-or-style].<part>.<property>
--md-comp-<component>-[variant-or-style]-<part>-<property>
```

Do not create public component tokens without an exact verified official path.

Each property uses the shortest applicable path:

```text
canonical token or documented private/system/app source
→ optional configuration route
→ optional property-specific state resolver
→ optional rendered private value
→ optional generic foundation bridge
→ actual DOM property owner
```

Rules:

- a static property applies its canonical source directly when possible;
- a configured non-stateful property may apply its route directly;
- a rendered private value exists only for state-resolved output or a stable foundation bridge input;
- a private alias must not exist only for readability;
- do not bypass an available official component token with a system token;
- private family variables do not escape the family;
- generic foundation primitives do not read family tokens or private variables.

## Rendered-property matrix

Create one row for every property varying by configuration, semantic state, interaction state, or supported project mode.

Static properties remain documented through anatomy ownership.

Required columns:

| Property | DOM owner | Applied/final value | Configuration source | State inputs | Winner/coexistence rule | Foundation bridge |
| -------- | --------- | ------------------- | -------------------- | ------------ | ----------------------- | ----------------- |

Group rows only when owner, pipeline stages, state inputs, winner/coexistence rule, and bridge are identical. List every grouped property and final applied value explicitly.

The matrix defines implementation routing. The `StateMatrix` story covers only routes that produce distinct component-owned visible output; non-visual state behavior is verified by contract or browser tests.

## Public API

Expose only:

- supported Material configuration;
- supported semantic state;
- required native behavior;
- supported consumer-provided anatomy;
- explicit Mioframe extensions.

Use Material vocabulary when applicable. Keep DOM-critical attributes explicit on their owner.

Invalid combinations:

1. prevent them through readable TypeScript contracts where practical;
2. validate dynamic runtime inputs when needed;
3. normalize only when official guidance defines a deterministic fallback;
4. allow development warnings only for documented deterministic behavior;
5. otherwise use `blocked` rather than partial or invented behavior.

## Compatibility and migration

A family migration updates atomically:

- source location and imports;
- complete family blueprint;
- public library exports;
- all repository consumers;
- Storybook titles/imports;
- contract, browser, visual, and pure tests;
- snapshots and risk registrations;
- component/foundation registries and library map;
- obsolete paths and exports.

Permanent legacy re-exports are forbidden. A temporary compatibility export requires an explicit consumer list, no new usage, and a removal target.

Physical relocation must not hide API, token, behavior, or visual alignment changes.

## Architecture review gates

### Enforceable static checks

Automation may block:

- wrong location or dependency direction;
- missing/extra profile files;
- invalid style order;
- deep imports or stale exports;
- token vocabulary/ownership violations;
- missing required blueprint sections;
- missing test artifacts and story identity;
- migration-map and registry reference inconsistency.

### Human/architect review

Review must confirm:

- family ownership basis;
- scenario and supported-surface sufficiency;
- Material source interpretation;
- state and anatomy ownership correctness;
- rendered-property route equivalence;
- intentional deviations;
- simplicity and absence of speculative abstractions.

Automation must not claim to prove these semantic decisions from free-form Markdown or screenshots.

## Completion

A component is architecture-complete only when:

- the full canonical blueprint is ready;
- the smallest correct profile is implemented;
- state, DOM, token, and property ownership are explicit;
- foundation dependencies are accepted and non-blocking;
- public exports and consumers use the canonical contract;
- production and test artifacts agree with the blueprint;
- replaced logic and legacy paths are removed;
- required review gates are passed or explicitly remain merge blockers.
