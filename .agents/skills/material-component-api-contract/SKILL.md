---
name: material-component-api-contract
description: 'Use for one official Material family to derive only its canonical Vue public parameters/props, slots, events, public value types and defaults from the material3 MCP before implementation.'
---

# Material component API contract

Own exactly one artifact:

```text
src/shared/ui/material/components/<family>/contract.ts
```

## Source

Material facts come from the repository-configured `material3` MCP server in `.mcp.json`.

Do not substitute m3e docs, legacy Mioframe code, application consumers, web search, or memory for Material 3 MCP.

After complete applicable source coverage, an API detail Material does not prescribe is not an ambiguity. Omit it rather than inventing a Material API.

Report `blocked` only when applicable Material source coverage cannot be established, official Material sources contradict one another, or an unavailable fact prevents defining a Material-owned public contract requirement.

## Isolation

Run in a fresh isolated context.

Read only applicable `AGENTS.md`, `src/shared/ui/material/docs/component-contract.md`, the Material 3 MCP pages needed for API/content roles/component configurations, and the minimum Vue/project type conventions needed to write `contract.ts`.

Do not inspect m3e, legacy component implementation, consumers, migration code, tokens, behavior artifacts, or another worker's reasoning.

## Output

Define only the canonical renderer-independent public structural contract:

- parameters/props;
- slots/content inputs;
- events/emits when a Material interaction produces consumer-observable output that the Vue boundary must expose;
- public value/state/variant/configuration types required by those inputs/events;
- defaults;
- valid combinations when TypeScript can express them clearly;
- concise TSDoc for touched public exports.

A Material configuration is not omitted merely because documentation calls it a style, color mapping, configuration, emphasis, or another term instead of `variant`. If Material presents a component-owned choice as developer-selectable and it changes the canonical rendered/behavioral configuration, represent it unless Material explicitly scopes it to a legacy/baseline surface outside the current Expressive family.

Prefer explicit `MD<Component>Props`, `MD<Component>Slots`, and, when applicable, `MD<Component>Emits` contracts so the Vue SFC can consume them directly through `<script setup>` macros. Slot contracts should use Vue-shaped slot method signatures; their return type is not used to invent slot semantics.

Framework mechanics are not additional Material semantics, but the public contract is still a Vue API. When Material defines an ordinary user activation/output, represent that existing interaction through the smallest idiomatic, type-safe Vue boundary. For an action component, a typed `click: [event: MouseEvent]` emit that forwards one unchanged native activation is valid framework adaptation when it lets consumers use normal `@click="handler"` with static template typing. Do not omit a typed event only to force consumers through dynamic `v-on` objects, casts, or other type-check bypasses. Conversely, do not add an event for an interaction/output Material does not define.

Defaults in `contract.ts` must be reusable by the Vue implementation without creating a parallel default source. Prefer a typed immutable defaults object for optional primitive/configuration props when the family has canonical defaults.

Do not add implementation helpers, renderer types, legacy aliases, speculative convenience API, or surface omitted from Material 3 MCP.

## Decision examples

These examples illustrate the decision rule and artifact shape only. They are not Material source evidence. If an example conflicts with current Material 3 MCP, current Material wins.

### Current Material surface, not current Mioframe demand

Suppose Material documents one current action family with three sizes, two developer-selectable appearances, an optional icon, visible label content, ordinary activation, and explicit defaults. Mioframe currently uses only one size and one appearance.

GOOD — canonical `contract.ts`:

```ts
export type MDExampleActionSize = 'small' | 'medium' | 'large';
export type MDExampleActionAppearance = 'primary' | 'secondary';

export interface MDExampleActionProps {
  size?: MDExampleActionSize;
  appearance?: MDExampleActionAppearance;
}

export interface MDExampleActionSlots {
  default(): unknown;
  icon?(): unknown;
}

export interface MDExampleActionEmits {
  click: [event: MouseEvent];
}

export const mdExampleActionDefaults = {
  appearance: 'primary',
  size: 'small',
} as const satisfies Required<Pick<MDExampleActionProps, 'appearance' | 'size'>>;
```

The later Vue 3.5 SFC should be able to consume that contract directly, for example:

```vue
<script setup lang="ts">
import {
  mdExampleActionDefaults,
  type MDExampleActionEmits,
  type MDExampleActionProps,
  type MDExampleActionSlots,
} from './contract';

const { appearance = mdExampleActionDefaults.appearance, size = mdExampleActionDefaults.size } =
  defineProps<MDExampleActionProps>();

const emit = defineEmits<MDExampleActionEmits>();
defineSlots<MDExampleActionSlots>();
</script>
```

Why: the contract represents the complete current Material-owned structural surface, maps an already-defined activation into an idiomatic typed Vue event without inventing a new behavior, provides one reusable default source, and fits Vue 3.5 type-based APIs without renderer-specific runtime declarations.

BAD:

```ts
export interface MDExampleActionProps {
  size?: 'small';
}
```

Why: this shrinks the canonical family to today's Mioframe usage.

BAD — duplicating defaults in the SFC:

```ts
const { appearance = 'primary', size = 'small' } = defineProps<MDExampleActionProps>();
```

when the same defaults are already separately declared in `contract.ts`.

Why: two independently edited default sources can drift.

### Keep existing activation idiomatic and type-safe

Suppose Material defines ordinary activation for an action component and Mioframe exposes that action through a Vue wrapper.

GOOD:

```ts
export interface MDExampleActionEmits {
  click: [event: MouseEvent];
}
```

with implementation forwarding exactly one unchanged native activation and consumers using normal:

```vue
<MDExampleAction @click="onClick" />
```

Why: the emit is the typed Vue representation of an existing Material interaction, not a new semantic event.

BAD — removing the typed event and compensating at consumers:

```vue
<MDExampleAction v-on="{ click: onClick }" />
```

when that object form exists only to bypass static component-event typing.

BAD: inventing `activate`, `trigger`, or another event in addition to `click` when Material defines no separate output requiring it.

### Historical rows do not become current API

Suppose a Material page documents `small | medium | large` as the current Expressive sizes and also keeps a separately labelled baseline size for historical reference.

GOOD:

```ts
export type MDExampleActionSize = 'small' | 'medium' | 'large';
```

BAD:

```ts
export type MDExampleActionSize = 'baseline' | 'small' | 'medium' | 'large';
```

Why: mere presence on the page is not evidence that a baseline/deprecated configuration belongs to the current family.

### Renderer capability does not create public API

Suppose m3e supports `disabled`, `lowered`, and an extra renderer variant, but current Material documentation for the selected family does not expose those as current component-owned choices.

GOOD: omit them from `contract.ts`.

BAD:

```ts
export interface MDExampleActionProps {
  disabled?: boolean;
  lowered?: boolean;
  rendererVariant?: string;
}
```

Why: renderer capability is private implementation information, not Material API authority.

### Material silence does not create convenience API

Suppose Material defines an activatable control but does not define a loading mode or arbitrary `tone` customization for this family.

GOOD: expose neither unless another canonical Material requirement actually owns that surface.

BAD:

```ts
export interface MDExampleActionProps {
  loading?: boolean;
  tone?: 'brand' | 'danger';
}
```

Why: useful-looking application conveniences are not part of a canonical Material contract unless Material owns them.

## Completion check

Before writing the artifact and returning `complete`:

1. Query Material 3 MCP using the official family/component name and API/content-role/configuration scope.
2. Inspect every applicable MCP route/result surfaced for that scope, not only the first matching page. Include overview/guidelines/spec sections that define developer-selectable component configurations even when not labelled API/variant.
3. Verify no documented parameter, content role, consumer-observable interaction output, public value/configuration, default, selectable style/color mapping, or valid combination in this worker's scope is omitted or guessed.
4. Verify legacy/baseline/deprecated configurations are not promoted into the current Expressive public contract solely because historical Material tables remain on the page.
5. Verify no m3e, legacy, consumer-demand, token, or behavior implementation decision entered the contract.
6. Verify every Material-defined consumer-observable interaction is represented by the smallest idiomatic type-safe Vue surface; do not require dynamic `v-on`/casts merely to consume a normal action event.
7. Verify defaults have one canonical contract source and can be consumed directly by the Vue implementation without re-declaration.
8. Distinguish Material silence from a blocker: complete source coverage plus an unspecified detail may still return `complete`.
9. Only now write/replace `contract.ts` once with the completed result.

If blocked before step 9, do not create a new partial `contract.ts`. When correcting an existing contract, do not treat the old file as corrected unless this worker reaches step 9 and returns `complete`.

## Report

```text
MATERIAL API CONTRACT RESULT
family: <family>
artifact: <contract.ts path>
Material 3 MCP coverage: complete | blocked
unresolved blocking ambiguity: none | <exact ambiguity>
result: complete | blocked
```

## Forbidden

- Reading m3e or consumers to shape the API.
- Reading token/behavior artifacts to infer API semantics.
- Designing from current demand or legacy props.
- Treating Material taxonomy (`variant`, `style`, `mapping`, etc.) as a reason to omit an otherwise developer-selectable current configuration.
- Promoting a baseline/legacy-only configuration into the current Expressive API without current Material support.
- Treating Material silence as permission to invent public API.
- Treating an unspecified platform/runtime detail as a blocker after complete Material source coverage.
- Omitting a Material-defined consumer interaction from the typed Vue boundary when doing so would require dynamic `v-on`, casts, or another type-check bypass at normal consumers.
- Inventing additional event semantics beyond the Material interaction being represented.
- Duplicating canonical prop defaults in implementation instead of consuming the contract defaults.
- Editing `tokens.css`, `BEHAVIOR.md`, runtime code, tests, consumers, or migration.
- Leaving a new partial `contract.ts` on `blocked`.
- Guessing missing Material facts.
- Creating DESIGN/ARCHITECTURE workflow documents.
