# Material family definition

## Decision

A canonical Mioframe Material family is defined by exactly three technical contracts:

```text
contract.ts
  → public parameters/props, slots, events and public value/configuration types

tokens.css
  → public official Material component tokens

BEHAVIOR.md
  → normative observable Material behavior
```

Official Material facts come from the repository-configured `material3` MCP server in `.mcp.json`.

The contracts have separate owners, but they are not symmetric: `contract.ts` is established first because it defines the current structural surface. `tokens.css` and `BEHAVIOR.md` may read `contract.ts` only for that already-selected configuration/content-role boundary and terminology; they still derive their own facts independently from Material 3 MCP.

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

Framework event mechanics are not invented merely because Vue supports them. Expose an event only when the Material interaction model plus the project public boundary require a consumer-observable output; keep naming idiomatic to Vue without adding semantics Material does not define.

## `tokens.css` — public token contract

`tokens.css` owns the current official Material component-token surface for the canonical family.

- Derive token semantics/defaults from Material 3 MCP.
- Use `contract.ts` only to know which current developer-selectable configurations/content terminology the family exposes.
- Separate current Expressive rows/groups from baseline/legacy/deprecated rows/groups before serializing the catalogue; do not assume an entire table is current merely because its heading is current.
- Public names use canonical `--md-comp-*` Material semantics.
- Preserve official system/reference aliases when Material specifies them.
- Cover official current configurations, parts and states even when Mioframe does not currently override them.
- Do not expose `--m3e-*`, `--md-private-*`, renderer defaults, or application `--app-*` tokens.
- Do not create token enums, registries, DSLs, JSON mirrors, second catalogues, or compatibility aliases.

If token-source evidence proves a configuration in `contract.ts` is historical/non-current or reveals a current developer-selectable configuration missing from `contract.ts`, return to the API owner instead of compensating inside `tokens.css`.

`tokens.css` is the executable public component-token catalogue. A historical token present on the Material page is not current public API merely because the page still documents it.

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

Use `contract.ts` only as the current structural vocabulary/boundary. If behavior-source evidence proves that boundary wrong or incomplete, return to the API owner rather than rewriting the structure inside `BEHAVIOR.md`.

Record geometry, state transitions, accessibility, content ownership and motion only when Material 3 MCP defines them for the family. Do not include Vue strategy, m3e lifecycle/workarounds, test plans, product behavior, migration instructions, or general usage prose.

## Cross-contract reachability

The three contracts must describe one coherent current Material family:

```text
Material configuration
  → contract.ts public configuration
  → applicable tokens.css / BEHAVIOR.md requirements
  → private renderer mapping
  → observable result / proof
```

No public token group may describe a configuration the canonical component can never reach. No current selectable Material configuration may disappear because different docs sections use different terminology.

Implementation checks this reachability before renderer work. The orchestrator does not synthesize Material facts.

## Isolation

API contract runs first in its own fresh context.

After API completes, token and behavior workers run in separate fresh contexts and may run in parallel. They may read only:

- applicable `AGENTS.md` and their own skill;
- this document and the narrow token/adapter conventions required for their artifact;
- completed `contract.ts` for structural scope/terminology only;
- the Material 3 MCP documentation required for their single factual scope.

No contract worker may inspect:

- `@m3e/web` documentation or implementation;
- legacy component implementation;
- application consumers/current call-site demand;
- another worker's narrative reasoning.

## Atomic contract output

A contract file is a durable completed-stage artifact only after its worker completion check passes.

For a new/missing contract, finish source inspection and validation before writing the owned artifact. A blocked worker must not leave a new partial contract file.

When an architect correction reopens an existing contract, that correction remains authoritative until the worker returns `complete`; interruption does not make the old file valid again. Repeat the same correction handoff when resuming an interrupted correction.

## Gate

Standalone implementation may start when:

- API contract is complete;
- token contract is complete;
- behavior contract is complete;
- `contract.ts`, `tokens.css`, and `BEHAVIOR.md` exist as completed artifacts;
- no current correction still targets one of them;
- token/behavior workers have not reported an API-boundary contradiction.

A repeated `material-component` invocation does not rerun an existing complete contract unless an exact correction handoff reopens that owner.

If implementation later proves one contract wrong, route the exact finding back to that owner and rerun only downstream invalidated stages.

## Legacy staged artifacts

Existing family `DESIGN.md`, `ARCHITECTURE.md`, `IMPLEMENTATION.md`, `MIGRATION.md`, and `REVIEW.md` files are legacy workflow evidence, not current authority.

Do not bulk-convert untouched families. When a family completes the current workflow, the three technical contracts plus canonical runtime/proof replace old staged technical records. Ordinary README documentation may remain where useful but is not a workflow-state artifact.
