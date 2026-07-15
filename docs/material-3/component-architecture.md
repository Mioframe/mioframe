# Material 3 component architecture

This document defines the mandatory authoring architecture for public shared Material components under `src/shared/ui`.

The goal is deterministic implementation from official Material documentation with minimal redesign and review churn. A coding agent should be able to create a standard component independently by following this workflow. Architecture escalation is required only when the official source, repository ownership, or requested product behavior cannot be resolved by these rules.

## Scope

Use this architecture for:

- every new public shared `MD*` component backed by an official Material component family;
- every existing public shared `MD*` component explicitly migrated to `layered-v1`;
- every material change to a migrated component's public API, token contract, anatomy, state model, or rendering ownership.

Generic foundations such as state-layer, ripple, focus-indicator, elevation, and motion infrastructure are not component families. They keep generic contracts and must not acquire knowledge of a consuming family.

A strictly local fix to an unmigrated component may use `Architecture impact: none` only when it preserves public API, native semantics, token meanings, DOM anatomy, property owners, supported states, state resolution, and unrelated rendered output.

## Authoring modes

Record exactly one mode before production edits.

### `standard-authoring`

Use for a new component or a source-backed change when all decisions can be derived from:

1. the user's required scenarios;
2. official Material documentation;
3. existing repository rules and family contracts;
4. native platform semantics;
5. the deterministic rules in this document.

The implementation agent creates or updates the family blueprint and then implements it. A separate architect handoff is not required.

### `handoff-authoring`

Use when an existing ready architecture handoff supplies an exact family-contract delta. The implementation agent follows that delta and must not redesign unchanged sections.

### `blocked`

Use when any escalation condition in this document is present. Stop before production edits and report the exact unresolved decision and evidence.

The implementation agent must not choose a convenient approximation when the correct mode is `blocked`.

## Sources of truth

There are three levels of authority:

1. this document owns the repository-wide architecture and deterministic decision rules;
2. a migrated family's `README.md` owns the accepted durable contract for that family;
3. a task handoff, when present, owns only the exact proposed delta for the current task.

For a standard new component or first migration, the implementation agent creates the initial family README blueprint before editing production code.

For an existing migrated family, the implementation agent reads the current family README and changes only sections required by the request and verified source evidence.

Production code, verification, component registry, and family README must be updated atomically. After merge, the family README is the durable family source of truth. A mismatch between these surfaces means the architecture work is incomplete.

## Bounded discovery workflow

Use this order. Do not begin with a broad repository or web search.

1. Read the applicable `AGENTS.md`, `shared-ui-implementation`, `material3-guidelines`, and this document.
2. Check `docs/material-3/component-registry.md` and the existing family README, if present.
3. Inspect the requested consumers and the nearest already-aligned shared component only to learn repository integration patterns.
4. Check Material MCP cache status.
5. Read only the relevant official component overview/specs, accessibility, guidelines, and token pages.
6. Use `Vyachean/m3-docs-cache` only when MCP is unavailable or incomplete, and verify cache health.
7. Stop source discovery when the requested scenarios, public surface, anatomy, tokens, states, accessibility, and verification implications are resolved.

Do not read unrelated component families to seek a more generic design. Do not use Material Web, memory, generic web search, or another library as a source of Material behavior.

## Scope derivation

The default implementation scope is the minimum complete official surface required by the request and current repository consumers.

Apply these rules in order:

1. Start from explicit user scenarios and required final behavior.
2. Reuse an existing official Material component or documented composition when it covers the scenario.
3. Include one canonical Material default configuration.
4. Add another variant, size, shape, mode, anatomy option, or behavior only when required by a named scenario or existing consumer in the current change.
5. Include all states, semantics, and accessibility behavior reachable through the supported surface.
6. Record other documented Material capabilities as unsupported; do not implement them for theoretical completeness.
7. Do not add project extensions unless the request explicitly requires them.

A component is complete when its supported surface is coherent and fully verified. It does not need to implement every optional capability published for the Material family.

## Component blueprint

Before the first production edit, create or update the family `README.md` with a compact blueprint. Do not paste or summarize full Material pages.

Use this structure:

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

Architecture profile per component: simple | configured | stateful
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

The blueprint may use concise tables instead of prose. It must contain only decisions relevant to the supported surface.

`Readiness: ready` is allowed when every field is either resolved or explicitly `none`. `TBD`, alternative approaches, speculative extension points, and decisions deferred to implementation are forbidden.

## Deterministic architecture profiles

Choose the smallest profile whose conditions are satisfied. This is a rule application, not an open architecture choice.

### `simple`

Use only when the component has:

- no configuration axis that selects different token values;
- no semantic state;
- no interaction-dependent rendered property;
- no generic state, focus, ripple, elevation, or motion bridge.

Required files:

```text
<Component>.vue
<Component>.tokens.css
<Component>.css
```

Style order:

```vue
<style scoped src="./Component.tokens.css"></style>
<style scoped src="./Component.css"></style>
```

### `configured`

Use when configuration such as variant, size, shape, width, density, or mode selects different token values, but no semantic or interaction state changes rendered properties.

Required files:

```text
<Component>.vue
<Component>.tokens.css
<Component>.routes.css
<Component>.css
```

Style order:

```vue
<style scoped src="./Component.tokens.css"></style>
<style scoped src="./Component.routes.css"></style>
<style scoped src="./Component.css"></style>
```

### `stateful`

Use when any semantic state, interaction state, disabled state, selected state, error state, gesture state, or generic foundation bridge changes a rendered property.

Required files:

```text
<Component>.vue
<Component>.tokens.css
<Component>.routes.css
<Component>.states.css
<Component>.css
```

Style order:

```vue
<style scoped src="./Component.tokens.css"></style>
<style scoped src="./Component.routes.css"></style>
<style scoped src="./Component.states.css"></style>
<style scoped src="./Component.css"></style>
```

Do not create empty route or state files merely for symmetry. Do not collapse a required layer into another file to reduce file count.

Each family also owns:

```text
README.md
index.ts
```

## Additional files

Additional production files are allowed only under these objective conditions.

### `<Family>.tokens.css`

Allowed only when the same exact official token path belongs to the family contract and is consumed by at least two public components in that family. The blueprint must name the token paths, CSS names, applicable roots, and loading components.

Equal values or similar usage do not justify family ownership.

### `<Family>Anatomy.css`

Allowed only when at least two public family components render the same owned anatomy contract and need the same layout or property-owner rules.

### `<Component>Behavior.ts`

Allowed only when one component owns non-trivial keyboard, pointer, gesture, timing, or cleanup behavior whose state transitions require focused unit testing outside Vue rendering.

### `use<Component>Behavior.ts`

Allowed only when the same production behavior is already required by at least two public components. Do not create a composable for hypothetical reuse.

### `<Family>Context.ts`

Allowed only when public parent and child components in the same family require runtime composition state that cannot be expressed through the existing public contract without prop forwarding through unrelated layers.

No other production file category is permitted without architecture escalation.

## Layer ownership

### `<Component>.vue`

Owns only:

- typed props, emits, and slots;
- small named computed values;
- acquisition of declared runtime facts;
- native element selection and explicit DOM-critical attributes;
- event wiring;
- DOM anatomy;
- declared generic foundation primitives;
- ordered external style blocks.

Forbidden:

- visual token declarations;
- visual token values computed in TypeScript;
- inline component CSS;
- CSS state precedence;
- synthetic activation where native semantics provide the behavior;
- generic topology, render-plan, or style-resolver objects;
- unqualified fallthrough of DOM-critical attributes.

### `<Component>.tokens.css` and `<Family>.tokens.css`

Own only canonical official `--md-comp-*` defaults.

Allowed selectors are the owning component root, or the exact family-member root list recorded in the blueprint.

Canonical tokens are declared independently of active configuration and state. All supported public tokens exist whenever the owning root is rendered.

Forbidden:

- configuration modifier selectors;
- semantic or interaction state selectors;
- pseudo-classes;
- private or app token declarations;
- normal rendering properties;
- invented, shortened, or normalized component tokens;
- duplicate canonical declarations.

### `<Component>.routes.css`

Owns only configuration routing from public component tokens or documented gap/extension values into private route variables.

Allowed selectors are the component root and blueprint-declared configuration classes.

Forbidden:

- semantic or interaction state selectors;
- normal rendering properties;
- final rendered variables;
- public token declarations;
- layout, positioning, transitions, or DOM-owner styling.

### `<Component>.states.css`

Owns only:

- semantic-bank selection;
- property-specific interaction resolution;
- generic foundation bridges.

It must implement the exact rendered-property matrix. It must not use one global state precedence for all properties.

Forbidden:

- normal rendering properties;
- public token declarations;
- configuration routing;
- layout or anatomy styling;
- state behavior absent from the blueprint;
- incidental selector order as an undocumented resolution rule.

### `<Component>.css`

Owns only rendering and actual DOM property application:

- display and layout;
- geometry, padding, and gap;
- border and outline;
- background and color;
- opacity and elevation;
- transitions and motion application;
- target area;
- positioning;
- pointer and cursor presentation;
- application of final rendered values.

Forbidden:

- component-token declarations;
- configuration routing;
- semantic or interaction state resolution;
- state-specific token selection;
- styling another component's internals through `:deep()`.

## Token ownership and pipeline

Map official component token paths mechanically:

```text
md.comp.<component>.[variant-or-style].<part>.<property>
--md-comp-<component>-[variant-or-style]-<part>-<property>
```

Do not create a public `--md-comp-*` token without an exact verified official path.

Every canonical official token has one component or family owner file. Reference and system tokens remain in the Material foundation. App-specific public extensions use `--app-*`; internal extension routes remain family-private.

Each supported visual property follows the smallest applicable directed path:

```text
official md.comp token
→ canonical --md-comp-* declaration
→ optional configuration route
→ optional semantic bank
→ optional property-specific interaction resolver
→ rendered family-private value
→ optional generic foundation bridge
→ actual DOM property owner
```

A stage may be omitted only when the blueprint states that the property does not vary across that stage. An available official component token must not be bypassed by a direct system token.

## Rendered property matrix

Create one row for each property that varies by configuration, semantic state, interaction state, or project mode.

Use these columns:

| Property | DOM owner | Final value | Configuration source | Semantic source | Interaction inputs | Winner rule | Simultaneous outputs | Foundation bridge |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

Rules:

- use `none` when a column does not apply;
- list only reachable states;
- define winner order per property, not per component;
- model focus indicator, state layer, shape, elevation, color, opacity, and motion separately when they can coexist;
- apply each final value on its actual declared DOM owner;
- do not rely on inheritance when a more specific anatomy owner exists.

## Public API derivation

Derive the smallest coherent API using these rules.

### Props

Add a prop only when it controls:

- a supported Material configuration required by a named scenario;
- a supported semantic state;
- a native behavior that cannot be expressed through normal attributes;
- an explicit Mioframe extension required by the request.

Use official Material vocabulary and value names. Do not expose internal anatomy, private routes, test controls, or speculative flexibility.

### Native attributes

Keep `href`, `type`, `disabled`, `tabindex`, `role`, and `aria-*` explicit at the actual native owner. Preserve native button, link, input, and form behavior rather than recreating it.

### Slots

Add slots only for supported consumer-provided anatomy parts. Fixed Material-owned decoration remains internal.

### Emits

Emit only component-owned state changes or actions. Do not wrap every native event in a custom emit without a public contract need.

### Invalid combinations

Prevent, normalize, or document invalid combinations according to official guidance. When official guidance does not choose one behavior, escalation is required; the implementation agent must not invent a normalization policy.

## Behavior ownership

Prefer native semantics and existing generic foundations.

Use Vue only to acquire runtime facts and coordinate component-owned behavior. Use CSS to resolve visual states.

Do not introduce:

- a component state machine for static render conditions;
- a broad options object;
- a base component shared by unrelated Material families;
- a runtime token registry;
- a generic token resolver;
- a CSS-generation DSL;
- a cross-family state resolver;
- a compatibility API without an existing consumer requirement.

The same value appearing twice is not sufficient reason to abstract it. Shared ownership requires the objective conditions defined above.

## Standard verification

The blueprint names exact files and cases, using the smallest proof set that covers the supported surface.

### Contract tests

Verify applicable public behavior:

- defaults;
- props, emits, and slots;
- native elements and explicit attributes;
- ARIA and accessible name;
- invalid combinations;
- disabled and semantic-state behavior;
- project extensions.

### Architecture validation

For the selected profile verify:

- required files exist and unnecessary profile layers do not;
- style order is correct;
- each declaration and selector is in its owning layer;
- canonical tokens have one owner and valid names;
- token files contain only approved root selectors;
- private variables do not escape the family;
- generic foundations do not read family-specific variables;
- every stateful rendered variable has a blueprint matrix row.

### Browser verification

Use browser tests for focus, keyboard, pointer, gesture, state classes, computed CSS, public token overrides, and actual property owners.

Verify each reachable matrix row and each declared simultaneous-output case. Do not produce a full Cartesian matrix when exact property assertions prove the route.

### Storybook and visual verification

Document the supported public surface, unsupported features, extensions, and deviations. Use representative visual stories only for materially different geometry or appearance.

### Consumer verification

For every changed existing consumer, record one preservation check and any allowed visual change.

Do not test Vue, browser, or generic foundation internals that the component does not own.

## Escalation conditions

Use `blocked` and request architecture resolution only when at least one condition is present:

- official Material guidance is missing, contradictory, or unavailable for a required behavior;
- the requested behavior conflicts with Material guidance or native semantics;
- the request requires a project-specific public extension not already defined by repository policy;
- a public API compatibility decision affects existing consumers and is not determined by current rules;
- anatomy or token ownership crosses Material families or existing owner boundaries;
- a new generic foundation primitive, shared context, base abstraction, or dependency appears necessary;
- two official components appear to require shared behavior but the ownership is not explicit;
- the minimum supported surface cannot satisfy the required scenario;
- required browser behavior cannot be verified with the existing test infrastructure;
- repository code contradicts the accepted family README or official source in a way that changes the requested design.

Do not escalate merely because the component is large, contains many official tokens, or needs several matrix rows. Those are implementation volume, not unresolved architecture.

## Change modes

### `new-component`

Use for a new public component. Source-backed architecture and Material alignment are implemented together because there is no existing behavior to preserve.

### `architecture-only`

Use for behavior-preserving migration of a large or stateful legacy component:

- no public API change;
- no token-name or token-value change;
- no state behavior change;
- no intended rendered-output change.

### `alignment-only`

Use after migration to correct named Material deviations while preserving accepted ownership and file structure, except for an explicit family-contract delta.

### `combined-approved`

Use for a small legacy component only when architecture extraction and the required alignment correction cannot be usefully reviewed separately. Standard-authoring agents must not select this mode; it requires an explicit handoff.

## Limit and churn control

To reduce implementation cost and rework:

- keep the blueprint compact and write it in the repository instead of repeating it in chat;
- quote no Material documentation unless a short exact phrase is needed to resolve ambiguity;
- inspect only named consumers and the nearest relevant shared component;
- implement one component or tightly owned family surface per PR;
- perform source/blueprint, DOM/API, styles, and verification as separate passes;
- run focused verify-managed checks after the riskiest pass;
- remove replaced logic instead of retaining parallel compatibility paths;
- stop after the supported scenarios and required proof are complete.

## Completion

A component is complete only when:

- the family README blueprint is `ready` and matches production code;
- all requested scenarios work;
- the supported Material surface is source-backed;
- layer and ownership rules are satisfied;
- required verification passes;
- registry and Storybook status are honest;
- unsupported features and deviations are explicit;
- no unrequested abstraction or compatibility path remains.

Green checks alone do not prove Material or architecture correctness, but architecture review must not reopen decisions already deterministically resolved by these rules without contrary evidence.