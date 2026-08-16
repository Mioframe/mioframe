---
name: material-component-implementation
description: 'Use after the three Material technical contracts are ready to implement and prove one standalone canonical Vue component through the exact installed m3e renderer without inspecting consumers.'
---

# Material component implementation

Implement or resume one standalone canonical Material family from three fixed technical contracts.

## Input gate

Require completed:

```text
components/<family>/contract.ts
components/<family>/tokens.css
components/<family>/BEHAVIOR.md
```

Do not start while a current correction still targets one of these contracts.

Before production edits, perform only this local consistency check:

1. Every developer-selectable configuration in `contract.ts` has a coherent token/behavior owner when applicable.
2. Every public token group belongs to a reachable configuration or unconditional component behavior.
3. Every structural state/content role required by `BEHAVIOR.md` is representable by the public contract.
4. Every behavior rule requiring consumer-supplied accessibility/native information has an explicit public prop or narrow native/ARIA allow-list seam; do not silently drop required `aria-*`, native action, labeling or relationship inputs.
5. No simpler documented renderer seam already satisfies the contract.

If checks 1–3 prove a technical contract wrong, return its exact owner. Check 4 is implementation-owned when the contracts already require the semantic input and the missing piece is only the adapter allow-list/native seam.

Do not invoke generic `implementation-preflight` for this deterministic stage.

## Authority

Read applicable `AGENTS.md`, `component-adapter.md`, `component-tokens.md`, the three family contracts, exact lockfile-resolved `@m3e/web` documentation/examples/public artifacts, `vue-component-implementation`, and only the testing conventions needed for selected proof.

The contracts define what must be exposed and observably satisfied. m3e defines only the private implementation seam.

## Isolation

Run in a fresh context. Do not inspect application consumers, legacy call sites, migration code, README guidance, or current demand to shape the standalone component.

When resuming an interrupted implementation, inspect the current family runtime/proof first and preserve already-correct work. Do not rewrite contracts, restyle unrelated code, regenerate snapshots, or broaden proof merely because the previous worker context is unavailable.

## Vue implementation shape

Use modern Vue 3 `<script setup>` conventions already supported by the repository:

- consume imported `contract.ts` types directly in `defineProps`, `defineSlots`, and `defineEmits` only where an emit contract actually exists;
- prefer Vue 3.5 reactive props destructure for primitive/configuration defaults so implementation consumes the canonical defaults without creating a second defaults table;
- use `defineModel()` when the public contract is ordinary Vue `v-model` state and its semantics preserve the required single source of truth;
- keep an explicit controlled prop + intent emit instead when the renderer interaction contract requires canceling pre-mutation intent or otherwise proving that rejected intent cannot create a second local source of truth;
- use named handlers for non-trivial event logic;
- prefer declarative class/style binding and computed derivation over imperative DOM/class mutation;
- keep a stable component block class for library-owned styling;
- use `inheritAttrs: false` only for the documented transparent adapter boundary and explicitly forward the narrow native/ARIA contract.

Do not wrap a native event in a Vue emit solely because the root is interactive. If the public contract intentionally owns an emit, implement that exact emit; otherwise preserve the documented native/transparent listener seam.

## Implementation

1. Consume `contract.ts` directly through typed Vue APIs and canonical defaults.
2. Use documented exact-version m3e public inputs for props/content/events/state.
3. Keep renderer tags, types, variables and workarounds private to the family.
4. Keep token declarations, aliases and public-to-private custom-property bridges in CSS. Vue may select a configuration through an explicit renderer property or component class, but must not enumerate token names, compose custom-property names, or build a runtime token mapping engine.
5. Map every supported public token group to an actual renderer/result path. Prefer one static class-scoped CSS bridge when renderer token namespaces already distinguish configurations. Add explicit class modifiers only when configuration-dependent remapping is actually required.
6. Forward only explicit public/native/ARIA inputs needed by `contract.ts` and `BEHAVIOR.md`; adapter-owned renderer configuration must win over conflicting fallthrough.
7. Do not recreate renderer-owned state layer, ripple, focus, elevation, accessibility internals, geometry engines, or motion unless an explicit renderer defect requires the smallest documented family-local correction.
8. Add only proof required by the contracts and materially distinct renderer paths.
9. Run focused verifier-managed checks and return to the orchestrator.

## Decision examples

Examples illustrate implementation shape only; exact API/token/renderer names come from the current contracts and exact installed m3e documentation.

### Vue 3.5 contract consumption

GOOD:

```vue
<script setup lang="ts">
import {
  mdExampleActionDefaults,
  type MDExampleActionProps,
  type MDExampleActionSlots,
} from './contract';

const {
  appearance = mdExampleActionDefaults.appearance,
  size = mdExampleActionDefaults.size,
} = defineProps<MDExampleActionProps>();

defineSlots<MDExampleActionSlots>();
</script>
```

Why: imported contract types remain the public source of truth and Vue 3.5 owns runtime prop/default generation.

BAD:

```ts
const props = defineProps({
  appearance: { type: String, default: 'primary' },
  size: { type: String, default: 'small' },
});
```

when `contract.ts` already owns those types/defaults.

Why: runtime declaration duplicates the canonical contract and can drift.

### Stateful model mechanics follow the contract

GOOD for ordinary Vue model semantics:

```ts
const selected = defineModel<boolean>('selected', { required: true });
```

when the public state contract is exactly a normal `v-model:selected` binding and no renderer-specific rejected-intent invariant requires another mechanism.

GOOD for strict controlled pre-mutation intent:

```ts
const { selected } = defineProps<MDExampleToggleProps>();
const emit = defineEmits<MDExampleToggleEmits>();

const onBeforeinput = (event: Event) => {
  event.preventDefault();
  emit('update:selected', !selected);
};
```

when `BEHAVIOR.md`/renderer evidence requires canceling renderer mutation before emitting intent and the prop must remain the sole state source until the parent accepts the update.

BAD: choosing either `defineModel` or manual prop+emit by habit without checking the actual controlled-state contract.

### Static CSS token bridge first

GOOD when m3e exposes configuration-specific private token namespaces:

```css
.md-example-action {
  --m3e-example-action-primary-container-color: var(
    --md-comp-example-action-primary-container-color
  );
  --m3e-example-action-secondary-container-color: var(
    --md-comp-example-action-secondary-container-color
  );
}
```

```vue
<m3e-example-action
  class="md-example-action"
  :variant="appearance"
/>
```

Why: Vue selects the documented renderer configuration; CSS owns the token bridge; no extra styling state exists.

### Use class modifiers only when the renderer requires remapping

If m3e reuses one private token name for multiple public configurations, use an explicit class binding:

```vue
<m3e-example-action
  class="md-example-action"
  :class="{
    'md-example-action--primary': appearance === 'primary',
    'md-example-action--secondary': appearance === 'secondary',
  }"
  :variant="appearance"
/>
```

```css
.md-example-action--primary {
  --m3e-example-action-container-color: var(
    --md-comp-example-action-primary-container-color
  );
}

.md-example-action--secondary {
  --m3e-example-action-container-color: var(
    --md-comp-example-action-secondary-container-color
  );
}
```

Why: the class is an explicit library styling hook and token mapping remains readable CSS. Do not invent `data-*` attributes solely as styling hooks when a class or existing renderer property is the clearer owner.

BAD:

```ts
const suffixes = ['container-color', 'icon-color'];

const tokenStyles = Object.fromEntries(
  suffixes.map((suffix) => [
    `--m3e-example-action-${suffix}`,
    `var(--md-comp-example-action-${appearance}-${suffix})`,
  ]),
);
```

Why: runtime TypeScript has become an implicit token catalogue/mapping engine and can hide mismatched token grammars.

Normal Vue `:style` object binding remains valid for ordinary dynamic styling that is not the Material token catalogue/bridge. Do not ban an idiomatic Vue mechanism more broadly than the token-ownership problem requires.

## Contract corrections

Implementation never edits a technical contract because implementation evidence disagrees with it.

Return exactly one of:

```text
return-to-api-contract
return-to-token-contract
return-to-behavior-contract
```

with the exact contradictory fact and affected scope.

If faithful support would require private DOM coupling, duplicated renderer systems, new shared infrastructure, or weakening a correct contract, return `needs-architect`.

## Proof

Use the lowest faithful proof for each changed contract.

Unit/component tests may prove:

- public prop/slot/event/default mapping;
- host attribute allow-list/boundary;
- deterministic adapter-owned state or event forwarding.

Browser/visual proof owns observable renderer results such as:

- accessible role/name/focus/keyboard behavior;
- consumer-supplied accessibility labeling/relationships when allowed by the contract;
- fixed geometry;
- RTL/layout behavior;
- hover/focus/pressed appearance;
- public token overrides reaching actual rendered parts/states;
- required motion and reduced-motion behavior.

Do **not** add tests whose only assertion is that one CSS custom-property string was assigned to another string. Source mapping presence is not proof that the renderer consumes it correctly. A screenshot alone is not proof of fixed numeric geometry or state semantics.

Proof should be proportional: one test may cover several tokens that share a genuinely identical rendered mapping path, but materially different configuration/state grammars require independent observable coverage.

## Report

```text
MATERIAL IMPLEMENTATION RESULT
family: <canonical family>
standalone component: complete | blocked
focused verification: <commands/results>
contract correction owner: none | api-contract | token-contract | behavior-contract
contract finding: none | <exact finding>
architecture escalation: none | <exact decision>
remaining blocker: none | <exact blocker>
result: complete | blocked | return-to-api-contract | return-to-token-contract | return-to-behavior-contract | needs-architect
```

## Forbidden

- Inspecting consumers or legacy call sites to shape runtime implementation.
- Migrating consumers.
- Changing canonical contracts to fit m3e/current demand.
- Re-declaring public Props/Slots/Emits/value unions or canonical defaults inside the SFC.
- Adding/wrapping component emits not owned by the public contract.
- Choosing `defineModel` or manual prop+emit mechanically without preserving the required state ownership semantics.
- Dropping behavior-required accessibility/native inputs merely because renderer root uses `inheritAttrs: false`.
- Exposing raw m3e details outside the family.
- Creating TypeScript token maps, token-name/suffix arrays, generated custom-property names, or runtime token registries that duplicate CSS ownership.
- Inventing `data-*` attributes solely as styling hooks when a stable class or documented renderer configuration already owns the distinction.
- Adding speculative adapters or generic token frameworks solely to reduce line count.
- Treating source-level CSS wiring as rendered token proof.
- Rewriting already-correct family work during an interrupted-run resume without an exact defect.
- Running broad local verification solely to duplicate architect-owned exact-head CI.
