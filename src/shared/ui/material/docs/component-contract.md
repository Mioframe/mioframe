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

## `contract.ts` — public API contract

`contract.ts` owns only the renderer-independent Vue-facing structural API:

- public parameters/props;
- public slots for Material content roles;
- public events/emits;
- public value/state/variant/configuration types required by those inputs and events;
- defaults;
- valid/invalid combinations when TypeScript can express them clearly;
- concise TSDoc where the type alone is insufficient.

Use explicit family types such as `MD<Component>Props`, `MD<Component>Slots`, and `MD<Component>Emits` where applicable. The Vue implementation must consume these types directly through typed Vue APIs instead of restating a parallel public contract inside the SFC.

Derive public terminology from Material 3 MCP and idiomatic Vue mechanics. Do not derive it from m3e names, legacy props, DOM implementation details, or current Mioframe demand.

## `tokens.css` — public token contract

`tokens.css` owns the official Material component-token surface for the canonical family contract.

- Derive token semantics and defaults from Material 3 MCP.
- Public names use canonical `--md-comp-*` Material semantics, never renderer or legacy vocabulary.
- Preserve official system/reference aliases where Material specifies them.
- Cover the official variants, parts and states represented by the family contract even when Mioframe does not currently override them.
- Do not expose `--m3e-*`, `--md-private-*`, renderer defaults, or application `--app-*` tokens.
- Do not create a TypeScript token enum, registry, DSL, JSON mirror, second catalogue, or compatibility alias layer.

`tokens.css` is the executable public component-token catalogue. Private renderer bridges belong to implementation, not to this contract.

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
## Unresolved Material ambiguity
```

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
## Unresolved Material guidance
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
- none of those workers reports unresolved Material ambiguity or a blocker.

`README.md` is not part of this runtime gate.

### Migration-definition-ready

Consumer migration may start only when:

- standalone implementation is complete;
- guidance worker reports complete;
- `README.md` exists at the canonical family owner;
- guidance has no unresolved Material ambiguity or blocker.

If implementation or migration later proves one Material fact wrong or incomplete, route the exact finding back to the worker that owns that artifact. Do not repair it opportunistically in another stage.

## Legacy staged artifacts

Existing family `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files are legacy workflow evidence, not current authority.

Do not bulk-convert untouched families. When a family completes the current workflow, `contract.ts`, `tokens.css`, `BEHAVIOR.md`, and `README.md` replace old staged family documentation.
