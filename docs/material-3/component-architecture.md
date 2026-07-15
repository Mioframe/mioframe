# Material 3 component architecture

This document defines the mandatory authoring architecture for public shared Material components under `src/shared/ui`.

The goal is deterministic implementation from official Material documentation with minimal discovery, minimal structure, and minimal correction churn. A coding agent should be able to create a standard component independently. Architecture escalation is required only when official sources, repository ownership, or requested behavior cannot be resolved by these rules.

## Scope

Use this architecture for:

- every new public shared `MD*` component backed by an official Material component family;
- every existing public shared `MD*` component explicitly migrated to `layered-v1`;
- every material change to a migrated component's public API, token contract, anatomy, state model, or rendering ownership.

Generic state-layer, ripple, focus, elevation, and motion foundations are not component families. They keep generic contracts and must not acquire knowledge of consuming families.

A local fix to an unmigrated component may use `Architecture impact: none` only when it preserves public API, native semantics, token meanings, anatomy, property owners, supported states, state resolution, and unrelated output.

## Authoring modes

Record one mode before production edits.

### `standard-authoring`

Use when all decisions can be derived from:

1. required user scenarios;
2. official Material documentation;
3. repository rules and accepted family contracts;
4. native platform semantics;
5. the deterministic rules below.

The implementation agent creates or updates the family blueprint and implements it. A separate architect handoff is not required.

### `handoff-authoring`

Use when a ready architecture handoff supplies an exact family-contract delta. Do not redesign unchanged sections.

### `blocked`

Use when an escalation condition is present. Stop before production edits and report the exact unresolved decision and evidence.

Do not replace a blocked decision with a convenient approximation.

## Sources of truth

1. This document owns repository-wide component architecture.
2. A migrated family's `README.md` owns its accepted durable blueprint.
3. A task handoff, when present, owns only the current delta.

For a new family or first migration, create the initial README blueprint before production code. For an existing family, update only sections required by the request and source evidence.

Production code, verification, registry, Storybook, and family README must be updated atomically. A mismatch means the architecture work is incomplete.

## Bounded discovery

Use this order:

1. Read applicable `AGENTS.md`, `shared-ui-implementation`, `material3-guidelines`, and the relevant sections of this document.
2. Check the component registry and existing family README.
3. Inspect named consumers and the nearest relevant shared component only for repository integration patterns.
4. Check Material MCP cache status.
5. Read only relevant component overview/specs, accessibility, guidelines, and token pages.
6. Use `Vyachean/m3-docs-cache` only when MCP is unavailable or incomplete, after checking cache health.
7. Stop when scenarios, surface, anatomy, tokens, states, accessibility, and verification are resolved.

Do not inspect unrelated families to seek a more generic design. Do not use Material Web, memory, generic web search, or another library as Material behavior evidence.

## Minimum complete surface

The default scope is the smallest coherent official surface required by the request and current consumers.

Apply these rules:

1. Start from explicit scenarios and required final behavior.
2. Reuse an official Material component or documented composition when it covers the scenario.
3. Include one canonical Material default.
4. Add another variant, size, shape, mode, anatomy option, or behavior only for a named scenario or existing consumer in the current change.
5. Include every state, semantic, and accessibility requirement reachable through the supported surface.
6. Record other official capabilities as unsupported instead of implementing them for completeness.
7. Add no project extension without an explicit requirement.

When the request only names a component and supplies no product scenario, use the canonical Material default usage as the required scenario. Implement its mandatory anatomy, native semantics, reachable states, accessibility, tokens, Storybook, and verification. Keep optional variants and capabilities unsupported. Do not block or ask the implementer to choose optional scope.

A component is complete when its supported surface is coherent and verified. It does not need every optional capability published for the family.

## Family blueprint

Before production code, create or update a compact family `README.md` blueprint:

```text
MATERIAL COMPONENT BLUEPRINT

Authoring mode: standard-authoring | handoff-authoring
Architecture version: layered-v1
Change mode: new-component | architecture-only | alignment-only | combined-approved
Family:
Components:
Existing family contract: none | <Family>/README.md
Contract delta: complete initial contract | <changed sections>

Required scenarios:
Non-goals:
Official sources:
Verified snapshot:

Supported Material surface:
Unsupported Material surface:
Public API:
Native semantics:
Invalid combinations:

Anatomy ownership:
Configuration axes:
Semantic states:
Interaction states:

Architecture profile per component:
Canonical token ownership:
Rendered property matrix:

Mioframe extensions:
Documented deviations:
Production files:
Verification files and cases:
Consumer blast radius:

Unresolved: none
Readiness: ready
```

Use concise tables where useful. Include only decisions relevant to the supported surface.

`Readiness: ready` requires every field to be resolved or explicitly `none`. `TBD`, alternatives, speculative extension points, and deferred implementation decisions are forbidden.

## Deterministic profiles

Configuration routing and state resolution are independent axes. Choose exactly one profile using the conditions below.

### `simple`

Use when no configuration axis selects different values and no semantic or interaction state changes a rendered property.

Required layers:

```text
<Component>.vue
<Component>.css
```

### `configured`

Use when configuration selects different values and no semantic or interaction state changes a rendered property.

Required layers:

```text
<Component>.vue
<Component>.routes.css
<Component>.css
```

### `stateful`

Use when semantic or interaction state changes a rendered property and no configuration axis selects different candidate values.

Required layers:

```text
<Component>.vue
<Component>.states.css
<Component>.css
```

### `configured-stateful`

Use when configuration selects different candidate values and semantic or interaction state selects among them.

Required layers:

```text
<Component>.vue
<Component>.routes.css
<Component>.states.css
<Component>.css
```

Semantic state includes selected, error, expanded, and similar component meaning. Interaction state includes disabled, hover, focus, pressed, dragged, gesture, and equivalent runtime state. A generic state, focus, ripple, elevation, or motion bridge makes the component stateful only when the value supplied to that bridge varies by state.

### Token layer rule

Add `<Component>.tokens.css` only when the component canonically owns at least one exact official `md.comp.*` token used by the supported surface.

Do not create an empty component token file. When all applicable tokens are family-owned, load only the family token file. When no exact official component token path exists, record `Canonical token ownership: none` and use documented private, system, or app sources according to ownership.

Each family also owns `README.md` and `index.ts`.

### Style order

Load only applicable layers in this exact order:

```text
<Family>.tokens.css      # when approved
<Component>.tokens.css   # when the component owns official tokens
<Component>.routes.css   # configured or configured-stateful
<Component>.states.css   # stateful or configured-stateful
<Family>Anatomy.css      # when approved
<Component>.css
```

Do not create empty layers for symmetry. Do not collapse a required layer into another file.

## Additional files

Additional production files are allowed only under these objective conditions.

### `<Family>.tokens.css`

The same exact official token path is consumed by at least two public family components. The blueprint names paths, CSS names, roots, and loading components.

Equal values or similar usage do not justify family ownership.

### `<Family>Anatomy.css`

At least two public family components render the same owned anatomy contract and need the same layout or property-owner rules.

### `<Component>Behavior.ts`

One component owns non-trivial keyboard, pointer, gesture, timing, or cleanup transitions requiring focused unit tests outside Vue rendering.

### `use<Component>Behavior.ts`

The same production behavior is required by at least two public components now. Hypothetical reuse is insufficient.

### `<Family>Context.ts`

Public parent and child components require runtime composition state that cannot be expressed through the existing public contract without forwarding through unrelated layers.

No other production file category is allowed without architecture escalation.

## Layer ownership

### `<Component>.vue`

Owns:

- typed props, emits, and slots;
- small named computed values;
- runtime fact acquisition;
- native element choice and explicit DOM-critical attributes;
- event wiring;
- anatomy;
- declared generic foundation primitives;
- ordered external style blocks.

Forbidden:

- visual token declarations or token values computed in TypeScript;
- inline component CSS;
- CSS state resolution;
- synthetic activation where native semantics provide behavior;
- topology, render-plan, or style-resolver objects;
- hidden ownership of DOM-critical attributes.

### Token files

`<Component>.tokens.css` and `<Family>.tokens.css` own only canonical official `--md-comp-*` defaults.

Allowed selectors are the component root or exact family root list recorded in the blueprint. All supported tokens exist independently of active configuration and state.

Forbidden:

- configuration modifiers;
- semantic or interaction selectors;
- pseudo-classes;
- private or app token declarations;
- rendering properties;
- invented, shortened, normalized, or duplicate component tokens.

### `<Component>.routes.css`

Owns only configuration routing from public component tokens or documented private, system, or app sources into private route variables.

Allowed selectors are the component root and blueprint-declared configuration classes.

Forbidden:

- semantic or interaction selectors;
- rendering properties;
- state-resolved variables;
- public token declarations;
- layout, positioning, transitions, or DOM-owner styling.

### `<Component>.states.css`

Owns only:

- semantic-state selection;
- property-specific interaction resolution;
- generic foundation bridges whose supplied value varies by state.

It implements the stateful rows of the rendered-property matrix. There is no global state precedence for all properties.

Forbidden:

- rendering properties;
- public token declarations;
- configuration routing;
- layout or anatomy styling;
- state behavior absent from the blueprint;
- undocumented reliance on selector order.

### `<Component>.css`

Owns rendering and actual property application:

- layout and display;
- geometry, spacing, border, and outline;
- background, color, opacity, and elevation;
- transition and motion application;
- target area, positioning, pointer, and cursor presentation;
- final values applied to actual DOM owners.

Forbidden:

- component-token declarations;
- configuration routing;
- semantic or interaction resolution;
- state-specific source selection;
- styling another component's internals through `:deep()`.

## Value pipeline

Map official paths mechanically:

```text
md.comp.<component>.[variant-or-style].<part>.<property>
--md-comp-<component>-[variant-or-style]-<part>-<property>
```

Do not create public component tokens without exact verified official paths.

Each official token has one component or qualifying family owner. Reference and system tokens remain in the foundation. Public project extensions use `--app-*`; internal extension sources remain family-private.

Each property uses the shortest applicable path:

```text
source token or documented private/system/app value
→ optional configuration route
→ optional property-specific state resolver
→ optional rendered private value
→ optional generic foundation bridge
→ actual DOM property owner
```

Use no private alias for a static property when the rendering layer can apply its canonical token or documented source directly. A configured property may apply its route variable directly. A rendered private value is required only when state resolution produces the final value or a generic bridge needs a stable final input.

Never bypass an available official component token with a direct system token.

## Rendered-property matrix

Create one row for each property varying by configuration, semantic state, interaction state, or project mode. Static properties are recorded through anatomy ownership and do not need matrix rows.

| Property | DOM owner | Applied/final value | Configuration source | State inputs | Winner rule | Simultaneous outputs | Foundation bridge |
| --- | --- | --- | --- | --- | --- | --- | --- |

Rules:

- use `none` when a column does not apply;
- list only reachable states;
- define winner rules per property;
- model focus indicator, state layer, shape, elevation, color, opacity, and motion separately when they coexist;
- apply final values to actual owners;
- do not rely on inheritance when a more specific owner exists;
- use a public token directly for a simple property, a route variable for a configured property, and a rendered private variable only for state-resolved output;
- rows may be grouped only when every listed property has the same DOM owner, routing stages, state inputs, winner rule, simultaneous outputs, and bridge; list each property and applied/final value explicitly.

## Public API derivation

### Props

Add a prop only for:

- supported Material configuration required by a scenario;
- supported semantic state;
- native behavior not expressible through normal attributes;
- an explicit required Mioframe extension.

Use official vocabulary. Do not expose internal anatomy, private routes, test controls, or speculative flexibility.

### Native attributes

Keep `href`, `type`, `disabled`, `tabindex`, `role`, and `aria-*` explicit at the native owner. Preserve native button, link, input, and form behavior.

### Slots

Add slots only for supported consumer-provided anatomy. Fixed Material-owned decoration stays internal.

### Emits

Emit only component-owned state changes or actions. Do not wrap every native event without a contract need.

### Invalid combinations

Follow official guidance. If it does not determine behavior, use `blocked`; do not invent normalization.

## Behavior and simplicity

Prefer native semantics and existing generic foundations. Vue acquires runtime facts and coordinates component-owned behavior; CSS resolves visual values.

Do not introduce:

- state machines for static render conditions;
- broad options objects;
- unrelated-family base components;
- runtime token registries;
- generic token or state resolvers;
- CSS-generation DSLs;
- compatibility APIs without current consumer need.

Repeated syntax or values alone do not justify abstraction. Shared ownership requires the objective conditions above.

## Verification

Use the smallest proof set covering the supported surface.

### Contract

Verify applicable defaults, props, emits, slots, native elements, explicit attributes, ARIA, invalid combinations, states, and extensions.

### Architecture

Verify:

- exact profile and applicable file set;
- style order and layer ownership;
- canonical token names and owners;
- absence of empty token, route, or state layers;
- absence of unnecessary private alias stages;
- approved token selectors;
- private-variable boundaries;
- generic foundation independence;
- matrix coverage for varying properties.

### Browser

Use browser tests for focus, keyboard, pointer, gesture, state classes, computed CSS, public overrides, and actual property owners.

Verify reachable matrix routes and simultaneous outputs. Avoid full Cartesian matrices when exact property assertions prove behavior.

### Storybook and visual

Document supported and unsupported surface, extensions, and deviations. Use representative visual cases only for materially different geometry or appearance.

### Consumers

Record one preservation check for every changed existing consumer.

Do not test Vue, browser, or generic foundation internals the component does not own.

## Escalation conditions

Use `blocked` only when:

- required official guidance is missing, contradictory, or unavailable;
- requested behavior conflicts with Material or native semantics;
- a new public project extension is required;
- existing public API compatibility is unresolved;
- anatomy or token ownership crosses families or established owners;
- new generic infrastructure, shared context, base abstraction, or dependency appears necessary;
- shared behavior ownership between official components is unclear;
- the minimum supported surface cannot satisfy the scenario;
- required browser behavior cannot be verified;
- repository code contradicts the accepted family README or official source in a design-changing way.

Size, token count, or matrix length are implementation volume, not escalation reasons.

## Change modes

### `new-component`

Implement source-backed architecture and Material alignment together because no legacy behavior exists.

### `architecture-only`

For behavior-preserving migration of large or stateful legacy components: no API, token-value, state-behavior, or intended output change.

### `alignment-only`

Correct named deviations after migration while preserving accepted structure except for an explicit blueprint delta.

### `combined-approved`

For a small legacy component only when extraction and alignment cannot be usefully reviewed separately. Requires explicit handoff approval.

## Limit and churn control

- Keep the blueprint compact and in the repository instead of chat.
- Quote Material docs only to resolve ambiguity.
- Inspect only named consumers and the nearest relevant shared component.
- Implement one component or tightly owned family surface per PR.
- Use source/blueprint, DOM/API, styles, and verification passes.
- Run focused verify-managed checks after risky passes.
- Remove replaced logic instead of keeping parallel paths.
- Stop after required scenarios and proof are complete.

## Completion

A component is complete only when:

- the family blueprint is ready and matches code;
- requested scenarios work;
- supported Material surface is source-backed;
- profile, layers, ownership, and verification pass;
- registry and Storybook are honest;
- unsupported features and deviations are explicit;
- no unrequested abstraction, compatibility path, empty layer, or unnecessary private alias remains.

Green checks alone do not prove Material correctness, but review must not reopen deterministically resolved decisions without contrary evidence.