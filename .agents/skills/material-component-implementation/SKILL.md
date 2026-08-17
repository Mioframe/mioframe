---
name: material-component-implementation
description: 'Use after the three Material technical contracts are ready to implement and prove one standalone canonical Vue component through the exact installed m3e renderer without inspecting consumers.'
---

# Material component implementation

Implement or resume one standalone family from fixed:

```text
components/<family>/contract.ts
components/<family>/tokens.css
components/<family>/BEHAVIOR.md
```

Do not start while a correction targets a contract owner.

## Authority and isolation

Read applicable `AGENTS.md`, the three family contracts, `component-adapter.md`, `component-tokens.md`, exact lockfile-resolved `@m3e/web` public docs/artifacts, `vue-component-implementation`, and only testing/verification guidance needed for the required proof.

Contracts define required public/observable behavior. m3e is private implementation detail.

Do not inspect application consumers, legacy call sites, migration code, current demand, or old narrative review artifacts to shape standalone runtime.

On resume, preserve correct existing runtime/proof and fix only the actual incomplete/incorrect scope.

## Local consistency gate

Before production edits verify only:

1. every public configuration has coherent token/behavior ownership where applicable;
2. every public token group belongs to a reachable configuration or unconditional family behavior;
3. every structural state/content role required by `BEHAVIOR.md` is representable by the public contract;
4. behavior-required consumer accessibility/native information has an explicit public or narrow native/ARIA seam;
5. no simpler documented renderer seam already satisfies the contract.

If 1–3 prove a contract wrong, return to its owner instead of editing it. Check 4 is implementation-owned when only the adapter seam is missing. If faithful support requires private DOM coupling, duplicated renderer systems, new shared infrastructure, or weakening a correct contract, return `needs-architect`.

## Implementation rules

- Consume `contract.ts` types/defaults directly through modern Vue 3 `<script setup>` APIs.
- Prefer Vue 3.5 reactive props destructure for ordinary primitive/configuration defaults.
- Use `defineModel()` for ordinary Vue model semantics; keep explicit controlled prop + intent emit when pre-mutation cancellation or another proven ownership invariant requires it.
- Do not wrap native events in component emits unless the public contract intentionally owns that output.
- Use documented exact-version m3e public properties/events/content seams.
- Keep renderer tags/types/workarounds private and family-local.
- Keep token declarations, aliases, and `--md-comp-* → --m3e-*` bridges in CSS. Vue may select a renderer configuration or explicit modifier class; TypeScript must not enumerate token names, compose custom-property names, or build token maps.
- Prefer one static CSS bridge when renderer namespaces already distinguish configurations. Add modifier classes only for real configuration-dependent remapping.
- Use one stable family block class as root styling/token boundary. Do not introduce an alias class solely to attach `tokens.css`.
- Forward only native/ARIA inputs required by the contracts; adapter-owned renderer configuration wins over conflicting fallthrough.
- Do not recreate renderer-owned ripple/state-layer/focus/elevation/accessibility/geometry/motion unless an explicit renderer defect requires the smallest family-local correction.
- Keep production files cohesive. The repository's 500+ line review trigger still applies; extract a large private renderer bridge into a family-local stylesheet when that makes ownership/readability clearer, not merely to reduce line count.

## Decision examples

Examples illustrate decisions only; current contracts and exact renderer artifacts remain authoritative.

### Consume the contract, do not duplicate it

GOOD:

```ts
const {
  appearance = mdExampleDefaults.appearance,
  size = mdExampleDefaults.size,
} = defineProps<MDExampleProps>();

defineSlots<MDExampleSlots>();
```

BAD: a second runtime props/default table when `contract.ts` already owns those facts.

### State mechanics follow ownership

GOOD: `defineModel()` for an ordinary `v-model`.

GOOD: explicit prop + intent emit when renderer mutation must be cancelled before parent acceptance.

BAD: choosing either mechanism by habit rather than the state contract.

### CSS owns the token graph

GOOD:

```css
.md-example {
  --m3e-example-primary-container-color:
    var(--md-comp-example-primary-container-color);
}
```

with Vue selecting the documented renderer variant.

BAD:

```ts
const suffixes = ['container-color', 'icon-color'];
const styles = Object.fromEntries(
  suffixes.map((suffix) => [
    `--m3e-example-${suffix}`,
    `var(--md-comp-example-${appearance}-${suffix})`,
  ]),
);
```

Normal Vue `:style` remains valid for ordinary non-token dynamic styling.

### Prove rendered behavior, not source wiring

BAD: asserting only that one CSS custom-property string points at another.

GOOD: override the public token or trigger the real state in a browser and assert the affected rendered result at the lowest faithful level.

## Proof

Add only proof required by the contracts and materially distinct renderer paths.

Unit/component tests may prove public prop/slot/event/default mapping, host allow-lists, and deterministic adapter-owned state/event forwarding.

Browser/visual proof owns observable renderer results such as:

- accessible role/name/focus/keyboard behavior;
- required consumer accessibility labels/relationships;
- fixed geometry;
- RTL/layout;
- hover/focus/pressed appearance;
- public token overrides reaching rendered parts/states;
- required motion and reduced-motion behavior.

A screenshot alone is not proof of fixed numeric geometry or interaction semantics. Selector state alone is not proof of the required visual state. Coverage should be proportional: shared renderer paths may share proof; materially different state/configuration grammars need observable coverage.

## Verification and completion gate

Run the smallest faithful verifier-managed checks for edited runtime/proof.

If sandbox or Podman blocks canonical `pnpm verify ...`, follow the `verification` skill and use the runtime's narrowly scoped command approval/escalation mechanism. **Do not ask the operator to run verifier commands.** If that mechanism itself is unavailable or fails, return `blocked` with the exact execution-environment failure.

Implementation may return `complete` **only when all four are true**:

1. runtime satisfies all three fixed contracts;
2. every required observable contract has faithful proof;
3. every required focused verifier command for the edited runtime/proof actually completed and passed;
4. no known in-scope blocker remains.

Missing or unexecuted required browser/visual proof means `blocked`/`partial`, never `complete`. Broad local verification is not required merely to duplicate architect-owned exact-head CI.

## Return

If implementation evidence proves a technical contract wrong, do not edit it. Return exactly one of:

```text
return-to-api-contract
return-to-token-contract
return-to-behavior-contract
```

with the exact contradictory fact/scope.

Otherwise report:

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

- Inspecting consumers/legacy to shape standalone runtime.
- Migrating consumers.
- Changing correct contracts to fit m3e/current demand.
- Redeclaring public types/defaults inside the SFC.
- Adding/wrapping emits not owned by the public contract.
- Dropping behavior-required accessibility/native inputs because of `inheritAttrs: false`.
- Exposing raw m3e details outside the family.
- Creating TypeScript token maps/name arrays/generated custom-property names/registries.
- Adding alias styling classes solely to attach public tokens.
- Treating source CSS wiring or selector state as rendered proof.
- Asking the operator to run verifier/Podman commands.
- Claiming `complete` with required proof unrun or failing.
- Rewriting already-correct work on resume without an exact defect.
- Running broad local verification solely to duplicate architect-owned CI.
