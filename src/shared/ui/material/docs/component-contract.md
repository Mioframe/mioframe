# Material family contract

## Decision

A canonical Mioframe Material family is fixed by three independent contracts before implementation begins:

```text
contract.ts
  → public parameters/props, slots, events and public value types

tokens.css
  → public official Material component tokens

BEHAVIOR.md
  → normative observable Material behavior
```

These are the only mandatory durable contract artifacts for a family.

Official Material facts for all three contracts come from the repository-configured `material3` MCP server in `.mcp.json`. Do not substitute m3e documentation, legacy Mioframe code, current consumers, web search, or remembered Material behavior for this source.

Each contract is produced by a separate fresh worker with one narrow responsibility. Workers do not share implementation context and do not inspect m3e or application consumers.

Implementation may start only after all three workers complete successfully with no unresolved Material ambiguity.

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

Do not include Vue implementation strategy, m3e lifecycle details, renderer workarounds, tests, product behavior, migration instructions, or usage prose that is not part of normative component behavior.

## Isolation

The three contract workers may run in parallel when isolated workers are available because they own separate artifacts.

Each worker may read only:

- applicable `AGENTS.md` and its own contract skill;
- this document;
- the `material3` MCP documentation needed for its single artifact;
- the minimum repository naming/foundation convention needed to serialize that artifact correctly.

Contract workers must not inspect:

- `@m3e/web` documentation or implementation;
- legacy Material component implementation;
- application consumers or current call-site demand;
- another contract worker's narrative reasoning.

Existing contract artifacts may be read only when refreshing the same owned artifact.

## Contract-ready gate

The orchestrator performs a mechanical gate only. The family is contract-ready when:

- `contract.ts` worker reports complete;
- `tokens.css` worker reports complete;
- `BEHAVIOR.md` worker reports complete;
- none reports unresolved Material ambiguity or a blocker.

The orchestrator does not synthesize or redesign the three contracts.

If implementation later proves one contract fact wrong or incomplete, route the exact finding back to the worker that owns that artifact. Do not repair the contract opportunistically during implementation.

## Legacy staged artifacts

Existing family `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files are legacy workflow evidence, not current contract authority.

Do not bulk-convert untouched families. When a family completes the current workflow, the three canonical contract artifacts replace old staged contract records for that family.