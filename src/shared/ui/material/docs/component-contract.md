# Material family definition

## Decision

A canonical Mioframe Material family is defined by exactly three technical contracts:

```text
contract.ts
  → public parameters/props, slots, events and public value/configuration types

tokens.css
  → public official Material component-token names and defaults

BEHAVIOR.md
  → normative observable Material behavior
```

Official Material facts come from the repository-configured Material3 MCP.

The contracts have separate owners, but they are not symmetric: `contract.ts` is established first because it defines the current structural surface. `tokens.css` and `BEHAVIOR.md` may read `contract.ts` only for that already-selected configuration/content-role boundary and terminology; they still derive their own facts independently from Material3 MCP.

A family `README.md` may document developer usage as ordinary maintained documentation, but it is not a mandatory definition artifact, worker stage, implementation input, or migration gate.

## Source completeness versus specification completeness

Contract workers establish complete coverage of the applicable Material3 MCP sources for their scope. Material does not need to prescribe every Web/runtime detail.

After complete source coverage, a detail Material does not define is a boundary of the Material contract, not an unresolved ambiguity. Omit it or record it concisely as Material-unspecified when later stages could otherwise invent a requirement.

A contract worker blocks only when applicable Material source coverage cannot be established, applicable official Material sources contradict one another, or an unavailable fact prevents deciding a Material-owned requirement for that contract.

## `contract.ts` — public Vue API contract

`contract.ts` owns only the renderer-independent Vue-facing structural API:

- public parameters/props;
- public slots for Material content roles;
- public events/emits for Material-defined consumer interactions represented through the Vue boundary;
- public value/state/variant/configuration types required by those inputs/events;
- defaults;
- valid/invalid combinations when TypeScript can express them clearly;
- concise TSDoc where the type alone is insufficient.

A developer-selectable Material configuration remains API scope even when Material documentation calls it a color mapping, style, emphasis, or another term rather than `variant`.

Do not derive public terminology from m3e names, legacy props, DOM mechanics, or current Mioframe demand.

## `tokens.css` — public token contract

`tokens.css` owns the current official Material component-token names, defaults, aliases, and current family/configuration/part/state coverage.

The full cascade, theme, ownership, composition, migration, and verification model is defined only in [`component-tokens.md`](./component-tokens.md). In particular, family repository ownership and CSS cascade scope are separate concerns: the family owns its public defaults even though those defaults are root-scoped for inheritance.

Do not duplicate renderer/application token ownership or create a second token catalogue here.

If token evidence proves a configuration in `contract.ts` is historical/non-current or reveals a current developer-selectable configuration missing from `contract.ts`, return to the API owner instead of compensating inside CSS.

## `BEHAVIOR.md` — behavior contract

`BEHAVIOR.md` owns only observable normative Material behavior derived from Material3 MCP.

Use only applicable sections for anatomy/content, states/precedence, interaction/input, keyboard, accessibility, geometry/layout, motion, and Material-unspecified behavior.

Use `contract.ts` only as the current structural vocabulary/boundary. If behavior-source evidence proves that boundary wrong or incomplete, return to the API owner rather than rewriting the structure inside `BEHAVIOR.md`.

Do not include Vue strategy, m3e lifecycle/workarounds, test plans, product behavior, migration instructions, or general usage prose.

## Cross-contract reachability

The three contracts must describe one coherent current Material family:

```text
Material configuration
  → contract.ts public configuration
  → tokens.css / BEHAVIOR.md requirements
  → private renderer mapping
  → observable result / proof
```

Token cascade/default/override reachability follows `component-tokens.md`; do not duplicate that model here.

No public token group may describe a configuration the canonical component can never reach. No current selectable Material configuration may disappear because different docs sections use different terminology.

Implementation checks this reachability before renderer work. The orchestrator does not synthesize Material facts.

## Isolation

API contract runs first in its own fresh context.

After API completes, token and behavior workers run in separate fresh contexts and may read only applicable project rules/their skill, this document and narrow token/adapter conventions, completed `contract.ts` for structural scope/terminology, and Material3 MCP documentation required for their factual scope.

No contract worker may inspect `@m3e/web` implementation/docs, legacy component implementation, application consumers/current demand, or another worker's narrative reasoning.

## Atomic contract output and gate

A contract file is durable completed-stage work only after its worker completion check passes.

For a new/missing contract, finish source inspection and validation before writing the owned artifact. A blocked worker must not leave a new partial contract file.

When an architect correction reopens an existing contract, that correction remains authoritative until the worker returns `complete`; interruption does not make the old file valid again.

Standalone implementation may start only when all three contracts exist as completed artifacts, no current correction targets them, and token/behavior workers have not reported an API-boundary contradiction.

A repeated `material-component` invocation does not rerun a compatible completed current-workflow contract merely because chat history is unavailable. Owners reopen through the mechanical resolver or an exact semantic correction marker. The one transition exception is a legacy staged family interrupted after current token derivation but before its new `BEHAVIOR.md` exists: token derivation may repeat once so the workflow cannot mistake an old demand-scoped `tokens.css` for a completed current contract. `component-workflow.md` owns that transition rationale.

If implementation later proves one contract wrong, route the exact finding back to that owner and rerun only downstream invalidated stages.
