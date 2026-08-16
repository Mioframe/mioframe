# Material family definition

## Decision

A canonical Mioframe Material family is defined by exactly three independent technical contracts:

```text
contract.ts
  → public parameters/props, slots, events and public value/configuration types

tokens.css
  → public official Material component tokens

BEHAVIOR.md
  → normative observable Material behavior
```

Official Material facts for these artifacts come from the repository-configured `material3` MCP server in `.mcp.json`.

Do not substitute m3e documentation, legacy Mioframe code, current consumers, web search, or remembered Material behavior for this source.

Each artifact is produced by a separate fresh worker with one narrow responsibility. These three contracts are the complete definition gate for standalone implementation.

A family `README.md` may document developer usage as ordinary maintained documentation, but it is not a mandatory definition artifact, worker stage, implementation input, or migration gate.

## Source completeness versus specification completeness

Contract workers establish complete coverage of the applicable Material 3 MCP sources for their scope. Material does not need to prescribe every Web/runtime detail.

After complete source coverage, a detail Material does not define is a boundary of the Material contract, not an unresolved ambiguity. Omit it or record it concisely as Material-unspecified when later stages could otherwise invent a requirement.

A contract worker blocks only when:

- applicable Material source coverage cannot be established;
- applicable official Material sources contradict one another; or
- an unavailable fact prevents deciding a Material-owned requirement for that contract.

## `contract.ts` — public API contract

`contract.ts` owns only the renderer-independent Vue-facing structural API:

- public parameters/props;
- public slots for Material content roles;
- public events/emits;
- public value/state/variant/configuration types required by those inputs/events;
- defaults;
- valid/invalid combinations when TypeScript can express them clearly;
- concise TSDoc where the type alone is insufficient.

A developer-selectable Material configuration remains API scope even when Material documentation calls it a color mapping, style, emphasis, or another term rather than `variant`.

Use explicit family types such as `MD<Component>Props`, `MD<Component>Slots`, and `MD<Component>Emits`. The Vue implementation consumes these types directly rather than maintaining a parallel public declaration.

Do not derive public terminology from m3e names, legacy props, DOM mechanics, or current Mioframe demand.

## `tokens.css` — public token contract

`tokens.css` owns the current official Material component-token surface for the canonical family.

- Derive token semantics/defaults from Material 3 MCP.
- Separate current Expressive groups from baseline/legacy/deprecated groups before serializing the catalogue.
- Public names use canonical `--md-comp-*` Material semantics.
- Preserve official system/reference aliases when Material specifies them.
- Cover official current configurations, parts and states even when Mioframe does not currently override them.
- Do not expose `--m3e-*`, `--md-private-*`, renderer defaults, or application `--app-*` tokens.
- Do not create token enums, registries, DSLs, JSON mirrors, second catalogues, or compatibility aliases.

`tokens.css` is the executable public component-token catalogue. A historical token present on the Material page is not current public API merely because the page still documents a baseline configuration.

## `BEHAVIOR.md` — behavior contract

`BEHAVIOR.md` owns only observable normative Material behavior derived from Material 3 MCP.

Use only the applicable sections:

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

Record geometry, state transitions, accessibility, content ownership and motion only when Material 3 MCP defines them for the family. Do not include Vue strategy, m3e lifecycle/workarounds, test plans, product behavior, migration instructions, or general usage prose.

## Cross-contract reachability

The three contracts are authored independently but must describe one coherent current Material family:

```text
Material configuration
  → contract.ts public configuration
  → applicable tokens.css / BEHAVIOR.md requirements
  → private renderer mapping
  → observable result / proof
```

No public token group may describe a configuration the canonical component can never reach. No current selectable Material configuration may disappear because another worker used different terminology.

Implementation checks this reachability before renderer work. The orchestrator does not synthesize the contracts.

## Isolation

The three contract workers may run in parallel when isolated writes are safe.

Each worker reads only:

- applicable `AGENTS.md` and its own skill;
- this document and the narrow token/contract conventions required for its artifact;
- the `material3` MCP documentation required for its single scope.

Contract workers must not inspect:

- `@m3e/web` documentation or implementation;
- legacy component implementation;
- application consumers/current call-site demand;
- another contract worker's reasoning.

Existing canonical artifacts may be read only when refreshing the same owned artifact because an exact correction handoff reopened that stage.

## Gate

Standalone implementation may start when:

- API contract is complete;
- token contract is complete;
- behavior contract is complete;
- `contract.ts`, `tokens.css`, and `BEHAVIOR.md` exist;
- no current correction still targets one of them.

A repeated `material-component` invocation does not rerun an existing contract worker unless an exact correction handoff reopens that owner.

If implementation later proves one contract wrong, route the exact finding back to that owner and rerun only downstream invalidated stages.

## Legacy staged artifacts

Existing family `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files are legacy workflow evidence, not current authority.

Do not bulk-convert untouched families. When a family completes the current workflow, the three technical contracts plus canonical runtime/proof replace old staged technical records. Ordinary README documentation may remain where useful but is not a workflow-state artifact.
