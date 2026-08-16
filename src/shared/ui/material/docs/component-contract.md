# Material family definition

## Decision

A canonical Mioframe Material family is defined by three independent technical contracts plus one independent developer-guidance artifact:

```text
contract.ts
  → public parameters/props, slots, events and public value types

tokens.css
  → public official Material component tokens

BEHAVIOR.md
  → normative observable Material behavior

README.md
  → component description and correct Material usage
```

The three technical contracts define what the component must expose and observably do. `README.md` explains what the component is and how developers should apply it correctly; it is not a fourth runtime contract.

Official Material facts for all four artifacts come from the repository-configured `material3` MCP server in `.mcp.json`. Do not substitute m3e documentation, legacy Mioframe code, current consumers, web search, or remembered Material behavior/guidance for this source.

Each artifact is produced by a separate fresh worker with one narrow responsibility. Workers do not share implementation context and do not inspect m3e or application consumers.

The three technical contracts gate standalone implementation. Usage guidance is independent and may complete in parallel with contract extraction or standalone implementation, but it must be complete before consumer migration begins.

## Source completeness versus specification completeness

Definition workers must establish complete coverage of the applicable Material 3 MCP sources for their scope. They do not require Material to prescribe every Web/runtime detail.

After complete source coverage, a detail Material does not define is a boundary of the Material contract, not an unresolved ambiguity. Omit it or record it concisely as Material-unspecified when that prevents a later stage from inventing a Material requirement.

A definition worker blocks only when:

- applicable Material source coverage cannot be established;
- applicable official Material sources contradict one another; or
- an unavailable fact prevents deciding a requirement that Material owns for that artifact.

Material silence about generic Web/HTML/ARIA mechanics, browser event semantics, renderer internals, or other platform-owned details does not itself block the family definition.

## `contract.ts` — public API contract

`contract.ts` owns only the renderer-independent Vue-facing structural API:

- public parameters/props;
- public slots for Material content roles;
- public events/emits;
- public value/state/variant/configuration types required by those inputs and events;
- defaults;
- valid/invalid combinations when TypeScript can express them clearly;
- concise TSDoc where the type alone is insufficient.

A current Material component-owned choice belongs to this contract when Material presents it as developer-selectable and it changes the component configuration. Material may call such a choice a variant, style, color mapping, configuration, emphasis, or another term; documentation taxonomy does not determine whether the public API needs to express it.

Use explicit family types such as `MD<Component>Props`, `MD<Component>Slots`, and `MD<Component>Emits` where applicable. The Vue implementation must consume these types directly through typed Vue APIs instead of restating a parallel public contract inside the SFC.

Derive public terminology from Material 3 MCP and idiomatic Vue mechanics. Do not derive it from m3e names, legacy props, DOM implementation details, or current Mioframe demand.

Do not promote a configuration explicitly scoped by Material to a baseline/legacy family into the current Expressive public contract merely because historical documentation remains available.

## `tokens.css` — public token contract

`tokens.css` owns the official Material component-token surface for the current canonical family contract.

- Derive token semantics and defaults from Material 3 MCP.
- Public names use canonical `--md-comp-*` Material semantics, never renderer or legacy vocabulary.
- Preserve official system/reference aliases where Material specifies them.
- Cover the official current configurations, variants, parts and states represented by the family contract even when Mioframe does not currently override them.
- Exclude token groups explicitly scoped to baseline/legacy/deprecated configurations that are not part of the current Expressive public family.
- Do not expose `--m3e-*`, `--md-private-*`, renderer defaults, or application `--app-*` tokens.
- Do not create a TypeScript token enum, registry, DSL, JSON mirror, second catalogue, or compatibility alias layer.

`tokens.css` is the executable public component-token catalogue. Private renderer bridges belong to implementation, not to this contract.

## Cross-contract reachability

The three technical artifacts are independently authored but must describe one coherent current Material family before implementation is considered complete.

For every current developer-selectable Material configuration:

```text
Material configuration
  → contract.ts public configuration
  → applicable tokens.css groups / BEHAVIOR.md rules
  → private renderer mapping
  → observable rendered result / proof
```

Not every token is selected directly by a prop; unconditional component tokens and state/part tokens may apply automatically to a reachable configuration. But no public token group may describe a configuration that the canonical component can never reach, and no current selectable Material configuration may disappear because another worker used different terminology.

Implementation performs this consistency check before renderer work, and independent review repeats it from source. The orchestrator does not synthesize the artifacts.

## `BEHAVIOR.md` — behavior contract

`BEHAVIOR.md` owns only observable normative Material behavior derived from Material 3 MCP.

Keep the document focused on facts required to implement and verify the component:

```text
## Anatomy and content roles
## States and state precedence
## Interaction and input behavior
## Keyboard behavior
## Accessibility semantics
## Geometry and layout
## Motion
## Material-unspecified behavior
```

The last section is optional and records only relevant boundaries that Material leaves unspecified after complete source coverage. Such boundaries are not requirements and do not block implementation.

Record fixed geometry, spacing, touch targets, state transitions, accessible roles/states, content ownership and motion only when Material 3 MCP defines them for the component.

Do not include Vue implementation strategy, m3e lifecycle details, renderer workarounds, tests, product behavior, migration instructions, or general usage guidance.

## `README.md` — developer usage guidance

`README.md` is the canonical developer-facing description of the Material component and its correct application.

It may contain, when Material 3 MCP provides them:

```text
# <Official Material component name>
<short canonical description>

## Purpose
## When to use
## When not to use
## Choosing variants and configurations
## Content guidance
## Consumer accessibility responsibilities
## Related components and choosing alternatives
## Adaptive or platform guidance
```

The README owns semantic application guidance, not implementation mechanics. It must not duplicate prop/event/slot tables, token catalogues, normative interaction/geometry/motion contracts, m3e details, product-specific migration instructions, or workflow history.

Migration uses this README to decide how current product scenarios should apply the finished canonical component. Product demand does not feed back into the README.

## Isolation

The four definition workers may run in parallel when isolated workers are available because they own separate artifacts.

Each worker may read only:

- applicable `AGENTS.md` and its own skill;
- this document;
- the `material3` MCP documentation needed for its single artifact;
- the minimum repository naming/foundation convention needed to serialize that artifact correctly.

Definition workers must not inspect:

- `@m3e/web` documentation or implementation;
- legacy Material component implementation;
- application consumers or current call-site demand;
- another definition worker's narrative reasoning.

Existing canonical artifacts may be read only when refreshing the same owned artifact.

## Gates

The orchestrator performs mechanical gates only; it does not synthesize or redesign these artifacts.

### Technical-contract-ready

Standalone implementation may start when:

- API contract worker reports complete;
- token contract worker reports complete;
- behavior contract worker reports complete;
- `contract.ts`, `tokens.css`, and `BEHAVIOR.md` exist at the canonical family owner;
- none of those workers reports a blocking Material ambiguity or source-coverage blocker.

Material-unspecified details recorded after complete source coverage do not block this gate.

This gate means the three definition artifacts exist and passed their own source checks. The implementation worker must still perform the cross-contract reachability check above before renderer work; any inconsistency routes back to the earliest owning definition worker instead of being synthesized in implementation.

`README.md` is not part of this runtime gate.

### Migration-definition-ready

Consumer migration may start only when:

- standalone implementation is complete;
- guidance worker reports complete;
- `README.md` exists at the canonical family owner;
- guidance has no blocking Material ambiguity or source-coverage blocker.

If implementation or migration later proves one Material fact wrong or incomplete, route the exact finding back to the worker that owns that artifact. Do not repair it opportunistically in another stage.

## Legacy staged artifacts

Existing family `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files are legacy workflow evidence, not current authority.

Do not bulk-convert untouched families. When a family completes the current workflow, `contract.ts`, `tokens.css`, `BEHAVIOR.md`, and `README.md` replace old staged family documentation.
