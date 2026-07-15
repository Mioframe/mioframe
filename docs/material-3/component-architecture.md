# Material 3 component architecture

This document is the canonical production architecture and complete family-blueprint contract for public Material components under:

```text
src/shared/ui/material/components/<family>
```

It owns family boundaries, public contracts, state and DOM ownership, production layers, token routing, and the blueprint schema. Other documents may explain foundation, testing, validation, or workflow rules but must not add mandatory blueprint fields.

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

Use when every required decision follows from required scenarios, official Material sources, repository rules, accepted contracts, native semantics, and this architecture. The family README blueprint becomes the implementation contract; a separate architecture handoff is unnecessary.

### `handoff-authoring`

Use when a ready architecture handoff supplies an exact family-contract delta. Do not redesign unchanged sections.

### `blocked`

Use when source meaning, ownership, public compatibility, family boundary, required foundation capability, visual-route coverage, or required browser verification cannot be resolved.

Do not replace a blocked decision with an approximation, compatibility alias, broad option, local foundation substitute, or generic abstraction.

## Sources of truth

1. This document owns component architecture and the complete blueprint schema.
2. A family's `README.md` owns its accepted blueprint instance.
3. `foundation-architecture.md` and the foundation registry own cross-family dependencies.
4. `component-testing.md` owns proof-layer separation and canonical visual-matrix rules.
5. A task handoff owns only the approved current delta.

Production code, family README, library map, public exports, registries, Storybook, tests, snapshots, and risk registration must agree.

## Bounded discovery

1. Read applicable `AGENTS.md` and Material skills.
2. Inspect the library map, component registry, current family README, and applicable foundation records.
3. Inspect named consumers and only the nearest relevant integration patterns.
4. Check Material MCP/cache health.
5. Read only relevant component, foundation, accessibility, and usage pages.
6. Use the official Material Design Kit only when published docs cannot resolve exact visual geometry or state composition.
7. Stop when scenarios, ownership, supported surface, anatomy, states, tokens, accessibility, and verification are resolved.

Do not inspect unrelated families to seek a generic design.

## Minimum complete surface

Implement the smallest coherent official surface required by current scenarios and consumers.

1. Start from explicit scenarios and final behavior.
2. Reuse an official component or documented composition when it covers the need.
3. Include one canonical Material default.
4. Add variants, sizes, shapes, modes, anatomy, or behavior only for a named scenario or current consumer.
5. Include every reachable state, accessibility requirement, and foundation dependency of the supported surface.
6. Record other official capabilities as unsupported.
7. Add no Mioframe extension without an explicit requirement and owner.

When a request only names a component, use canonical Material default usage. Do not implement optional completeness speculatively.

## Family ownership

A family is a durable ownership boundary, not a copy of the legacy directory tree.

A single public component may own its own family. Multiple public components share one family only when:

1. official Material guidance treats them as one family or explicit parent/child set;
2. at least one real shared production contract exists now, such as exact family tokens, shared anatomy, required runtime context, or shared behavior; and
3. shared ownership keeps APIs and dependencies clearer than separate families.

Legacy proximity, similar names/appearance, repeated CSS, fewer files, or hypothetical reuse are insufficient.

One family must not deep-import another family's private files. Every shared family-private entry point, token owner, anatomy contract, context, or behavior is named in the blueprint.

Use `single-component family` when no multi-component boundary is justified. Unresolved family ownership is blocking.

## Change modes

Record one:

- `new-component`: creates a new official component directly in the canonical library and completes its supported Material contract;
- `library-relocation-only`: moves an accepted family without intended API, token, behavior, architecture, or rendered-output change;
- `architecture-only`: may combine focused relocation with first `layered-v1` conversion while preserving API, behavior, tokens, and rendered output;
- `alignment-only`: corrects named Material deviations after the canonical architecture is accepted.

Do not combine unrelated relocation, foundation correction, broad cleanup, and visual alignment. A change that does not fit one mode requires a ready architecture handoff and an explicitly revised mode rather than a generic combined category.

## Canonical family blueprint

Before production code, create or update the family `README.md` using this complete schema.

```text
MATERIAL COMPONENT BLUEPRINT

Authoring mode: standard-authoring | handoff-authoring
Architecture version: layered-v1
Change mode: new-component | library-relocation-only | architecture-only | alignment-only

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

Use concise tables where useful and include only applicable decisions.

`Readiness: ready` requires every field to be resolved or explicitly `none`/`not applicable`. `TBD`, unresolved alternatives, speculative extension points, missing/blocked foundation dependencies, and incomplete distinct visual-route coverage are forbidden.

No other document may define additional mandatory blueprint fields.

## State ownership

Every supported state has one source of truth and change path.

- Consumer/product semantic state exposed through a prop is consumer-controlled.
- User interaction emits intent or a next value; the consumer updates the prop.
- Browser facts such as hover, focus-visible, and ordinary pressed acquisition are browser/foundation-owned.
- The component maps those facts to component-specific property routes.
- Component-owned transient state is allowed only for owned gesture sessions, overlay lifecycle, animation coordination, or unavoidable native-platform coordination.

A component must not keep a hidden parallel copy of controlled state or infer product state from visual interaction state.

Component-owned transient state defines acquisition, release, cancellation, disabled behavior, failure behavior, and unmount cleanup where applicable.

Use `State ownership: none` when no state applies.

## Anatomy and DOM ownership

`Anatomy ownership` maps Material anatomy to actual DOM and accessibility owners.

For every interactive or semantic part record applicable:

- DOM/native element and native semantics or explicit role;
- focus owner and accessible-name source;
- semantic `aria-*`, disabled, and readonly owner;
- target-area owner;
- state-layer and ripple owner;
- focus-indicator geometry target;
- whether consumer interactive content is allowed, prohibited, or isolated;
- final rendered-property owner.

Non-interactive anatomy records only applicable DOM, content, and rendered-property owners.

Each concern has one owner. Parent and child components must not implicitly split native action, focus, accessible naming, target area, state layer, ripple, or final rendering. A parent may provide an explicit public input or family context; the component rendering the anatomy applies its semantics and styling.

## Deterministic profiles

Configuration routing and state resolution are independent axes. Select exactly one profile per component.

### `simple`

No configuration route and no state-varying rendered property.

```text
<Component>.vue
<Component>.css
```

### `configured`

Configuration selects different values; state does not change rendered properties.

```text
<Component>.vue
<Component>.routes.css
<Component>.css
```

### `stateful`

State changes rendered properties; configuration does not select different candidates.

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

Add `<Component>.tokens.css` only when the component owns at least one exact official component token used by the supported surface. Every family owns `README.md` and `index.ts`. Do not create empty layers for symmetry.

## Additional production files

Allowed only under these objective conditions:

- `<Family>.tokens.css`: the same exact official token path is consumed by at least two public family components;
- `<Family>Anatomy.css`: at least two public family components render the same owned anatomy contract and require the same layout/property-owner rules;
- `<Component>Behavior.ts`: one component owns non-trivial keyboard, pointer, gesture, timing, or cleanup transitions requiring focused tests outside Vue;
- `use<Component>Behavior.ts`: the same production behavior is required by at least two current public family components;
- `<Family>Context.ts`: public parent/child components require runtime composition state that cannot be expressed without forwarding through unrelated layers.

Equal values, similar syntax, possible future reuse, file count, or test convenience are insufficient.

No other production-file category is allowed without architecture escalation. Storybook fixtures/tests are not production profile layers.

## Layer ownership

### `<Component>.vue`

Owns typed props/emits/slots, small named computeds, runtime fact acquisition, native element/attributes, event wiring, anatomy, foundation primitives, and ordered style imports.

Forbidden: visual token values in TypeScript, inline component CSS, CSS state resolution, synthetic native activation, topology/render-plan/style-resolver objects, or hidden DOM-critical attributes.

### Token files

Own exact canonical `--md-comp-*` defaults only. Tokens exist independently of active configuration/state on the exact declared root list.

Forbidden: configuration/state selectors, pseudo-classes, private/app declarations, rendering properties, or invented/shortened/duplicate tokens.

### `<Component>.routes.css`

Owns configuration routing into private route variables only.

Forbidden: semantic/interaction selectors, rendering properties, state-resolved values, public token declarations, or anatomy/layout styling.

### `<Component>.states.css`

Owns property-specific semantic/interaction resolution and state-varying foundation bridges. There is no universal precedence for every property.

Forbidden: rendering properties, public token declarations, configuration routing, anatomy/layout styling, or undocumented selector-order behavior.

### `<Component>.css`

Owns layout, geometry, typography application, presentation, transitions, target area, and final property application to actual DOM owners.

Forbidden: canonical token declarations, configuration routing, state source selection, or `:deep()` styling of another component's internals.

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

Use the shortest applicable pipeline:

```text
canonical token or documented private/system/app source
→ optional configuration route
→ optional property-specific state resolver
→ optional rendered private value
→ optional generic foundation bridge
→ actual DOM property owner
```

- Static properties apply canonical sources directly when possible.
- Configured non-stateful properties may apply route variables directly.
- Rendered private values exist only for state-resolved output or a stable foundation bridge input.
- Do not add private aliases only for readability.
- Do not bypass an available component token with a system token.
- Family-private variables do not escape the family.
- Generic foundations do not read family tokens/private variables.

## Rendered-property matrix

Create one row for every property varying by configuration, semantic state, interaction state, or supported project mode. Static properties remain in anatomy ownership.

| Property | DOM owner | Applied/final value | Configuration source | State inputs | Winner/coexistence rule | Foundation bridge |
| --- | --- | --- | --- | --- | --- | --- |

Group rows only when owner, pipeline stages, state inputs, winner/coexistence rule, and bridge are identical. List every grouped property/final value.

This matrix defines implementation routing. The Storybook `StateMatrix` covers only routes producing distinct component-owned visible output; non-visual behavior belongs in contract/browser tests.

## Public API

Expose only supported Material configuration, semantic state, required native behavior, supported consumer anatomy, and explicit Mioframe extensions. Use Material vocabulary and keep DOM-critical attributes explicit on their owner.

Invalid combinations:

1. prevent them with readable TypeScript contracts where practical;
2. validate dynamic runtime input when needed;
3. normalize only when official guidance defines a deterministic fallback;
4. allow development warnings only for documented deterministic behavior;
5. otherwise use `blocked` rather than partial or invented behavior.

## Compatibility and migration

A family migration updates atomically:

- source location/imports and complete blueprint;
- public exports and all consumers;
- Storybook titles/imports;
- contract, browser, visual, pure, and consumer tests;
- snapshots/risk registrations;
- component/foundation registries and library map;
- obsolete paths and exports.

Permanent legacy re-exports are forbidden. A temporary export requires exact consumers, no new usage, and a removal target.

Physical relocation must not hide API, token, behavior, architecture, or visual-alignment changes.

## Validation and review

### Static/structured automation

Automation may block wrong locations/dependencies, profile/file mismatch, style order, deep/stale imports/exports, token vocabulary/ownership, missing blueprint sections, invalid enums/references, missing test artifacts/story identity, and migration-map/registry inconsistency.

### Architecture/Material review

Review confirms family ownership, scenario/supported-surface sufficiency, source interpretation, state/anatomy/property ownership, rendered-route equivalence, deviations, simplicity, and absence of speculative abstractions.

Automation must not claim to prove these semantic decisions from free-form Markdown or screenshots.

## Completion

A component is architecture-complete only when:

- the complete blueprint is ready;
- the smallest correct profile is implemented;
- state, DOM, token, and property ownership are explicit;
- foundation dependencies are accepted and non-blocking;
- public exports and consumers use the canonical contract;
- production/test artifacts agree with the blueprint;
- replaced logic and legacy paths are removed;
- required architecture, Material, and visual review gates are passed or explicitly remain merge blockers.
