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

Read applicable `AGENTS.md`, the three family contracts, `component-adapter.md`, `component-tokens.md`, exact lockfile-resolved `@m3e/web` public docs/artifacts, `vue-component-implementation`, and only testing/verification guidance needed for required proof.

Contracts define required public/observable behavior. m3e is private implementation detail.

Do not inspect application consumers, legacy call sites, migration code, current demand, or old narrative review artifacts to shape standalone runtime.

On resume, preserve correct existing runtime/proof and fix only the actual incomplete/incorrect scope.

## Local consistency gate

Before production edits verify only:

1. every public configuration has coherent token/behavior ownership where applicable;
2. every public token group belongs to a reachable configuration or unconditional family behavior;
3. family `tokens.css` owns public `--md-comp-*` defaults on `:root`, not the component host/local selector;
4. every structural state/content role required by `BEHAVIOR.md` is representable by the public contract;
5. behavior-required consumer accessibility/native information has an explicit public or narrow native/ARIA seam;
6. no simpler documented renderer seam already satisfies the contract.

If 1–4 prove a contract wrong, return to its owner instead of editing it. Check 5 is implementation-owned when only the adapter seam is missing. If faithful support requires private DOM coupling, duplicated renderer systems, new shared infrastructure, or weakening a correct contract, return `needs-architect`.

## Implementation rules

- Consume `contract.ts` types/defaults directly through modern Vue 3 `<script setup>` APIs.
- Prefer Vue 3.5 reactive props destructure for ordinary primitive/configuration defaults.
- Use `defineModel()` for ordinary Vue model semantics; keep explicit controlled prop + intent emit when pre-mutation cancellation or another proven ownership invariant requires it.
- Represent Material-defined consumer interactions through the contract's idiomatic typed Vue events; do not force dynamic `v-on`/cast workarounds.
- Use documented exact-version m3e public properties/events/content seams.
- Keep renderer tags/types/workarounds private and family-local.
- Keep token declarations, aliases, and `--md-comp-* → --m3e-*` bridges in CSS. Vue may select a renderer configuration or explicit modifier class; TypeScript must not enumerate token names, compose custom-property names, or build token maps.
- Treat family `tokens.css` `:root` declarations as the single Material default source. Component/renderer bridge CSS consumes `--md-comp-*`; it must not redeclare public defaults or copy Material defaults into `var()` fallbacks.
- Prefer one static CSS bridge when renderer namespaces already distinguish configurations. Add modifier classes only for real configuration-dependent remapping.
- Use one stable family block class as root styling/private-renderer bridge boundary. Do not introduce an alias class solely for token ownership.
- Forward only native/ARIA inputs required by contracts; adapter-owned renderer configuration wins over conflicting fallthrough.
- Do not recreate renderer-owned ripple/state-layer/focus/elevation/accessibility/geometry/motion unless an explicit renderer defect requires the smallest family-local correction.
- Do not solve token cascade/composition with specificity escalation, `!important`, inline Vue token wiring, or stylesheet/bundle order.
- Keep production files cohesive. The repository's 500+ line review trigger still applies; extract a large private renderer bridge into a family-local stylesheet when that makes ownership/readability clearer, not merely to reduce line count.

## Decision examples

### Consume the contract, do not duplicate it

GOOD:

```ts
const { appearance = mdExampleDefaults.appearance, size = mdExampleDefaults.size } =
  defineProps<MDExampleProps>();

defineSlots<MDExampleSlots>();
```

BAD: a second runtime props/default table when `contract.ts` already owns those facts.

### CSS owns token defaults and renderer mapping separately

Family contract:

```css
/* tokens.css */
:root {
  --md-comp-example-primary-container-color: var(--md-sys-color-primary);
}
```

Implementation bridge:

```css
.md-example {
  --m3e-example-primary-container-color: var(--md-comp-example-primary-container-color);
}
```

Why: `tokens.css` owns the one Material default while the component bridge owns only renderer adaptation. A closer contextual `--md-comp-*` declaration can inherit into the component without fighting a host default.

BAD:

```css
.md-example {
  --md-comp-example-primary-container-color: var(--md-sys-color-primary);
}
```

BAD:

```css
.md-example {
  --m3e-example-primary-container-color: var(
    --md-comp-example-primary-container-color,
    var(--md-sys-color-primary)
  );
}
```

Why: the first shadows inherited overrides; the second duplicates the token-contract default in implementation.

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

### Composition uses public inherited tokens

When this component owns a nested canonical Material component and Material composition requires contextual styling, implementation may set the child's public token on the composing context:

```css
.md-button {
  --md-comp-loading-indicator-color: currentColor;
}
```

Do not couple to the child's `--m3e-*` token. Proof must show the nested child receives the contextual override and that removing it restores the child's family `:root` default.

### Prove rendered behavior, not source wiring

BAD: asserting only that one CSS custom-property string points at another.

GOOD: override the public token or trigger the real state in a browser and assert the affected rendered result at the lowest faithful level.

## Proof

Determine only proof required by the fixed contracts and materially distinct renderer/cascade paths. Repository proof remains component/family-owned under this implementation owner, but **acceptance-oracle authorship is separate from production implementation when the root testing architecture requires `test-authoring`**.

Before production edits, identify the required proof from the fixed contracts:

- if an existing proof already owns the contract with unchanged oracle/assertions, preserve it and use it normally;
- if a new assertion-bearing test/spec is required or an existing test/spec materially changes its oracle/expectations/assertions/failure semantics, delegate that proof to a fresh `test-authoring` context using the truthful proof-type skill; consume its accepted proof and RED evidence before production edits;
- if an intentional visual baseline must change and target pixels cannot exist yet, establish the visible contract/spec intent before production edits, implement rendering without creating/approving the baseline, then delegate baseline creation/inspection/acceptance to a fresh test-author context under `visual-regression-testing`;
- do not create a Material workflow owner/stage or `.material-correction.json` entry merely for delegated proof authorship.

The production implementation context must not edit test-author-accepted non-visual proof before its first GREEN result and must not create, regenerate, or approve an intentional changed visual baseline. A genuine proof/contract conflict returns to the test-author or architect rather than being resolved by weakening proof here.

Unit/component tests may prove public prop/slot/event/default mapping, host allow-lists, and deterministic adapter-owned state/event forwarding.

Browser/visual proof owns observable renderer results such as accessible role/name/focus/keyboard behavior, relationships, fixed geometry, RTL/layout, hover/focus/pressed appearance, public token overrides reaching rendered parts/states, contextual composition inheritance/fallback, and required motion/reduced-motion behavior.

A screenshot alone is not proof of fixed numeric geometry or interaction semantics. Selector state alone is not proof of required visual state. Coverage should be proportional: shared renderer paths may share proof; materially different state/configuration/token grammars need observable coverage.

## Verification and completion

Follow the root rules and `.agents/skills/verification/SKILL.md`.

Use focused `pnpm verify --only ...` commands only when useful as implementation/diagnostic feedback or when a concrete contract requires narrow risk-specific proof. Do not mechanically assemble a final checklist and do not run broad automatic repository verification solely for handoff.

Implementation may return `complete` only when all four are true:

1. runtime satisfies all three fixed contracts and the root-default token cascade model;
2. every required observable contract/cascade path has faithful proof in the repository, including any required independent test-author or visual-baseline acceptance subcontext;
3. any narrow implementation-specific verification needed to establish a concrete risk has been completed or its exact blocker is reported;
4. no known in-scope coding blocker remains.

Missing, failing, or not-yet-independently-accepted required browser/visual proof means `blocked`/`partial`, never `complete`. Exact-head GitHub CI is architect-owned and is the final automatic repository verification gate.

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
local feedback: none | <focused verifier-managed proof/diagnostics actually used>
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
- Dropping behavior-required accessibility/native inputs because of `inheritAttrs: false`.
- Exposing raw m3e details outside the family.
- Creating TypeScript token maps/name arrays/generated custom-property names/registries.
- Redeclaring family-owned public `--md-comp-*` defaults on component/local selectors.
- Duplicating Material defaults inside private renderer bridge fallbacks.
- Using specificity escalation, `!important`, inline token wiring, or bundle/source order as token-cascade fixes.
- Adding alias styling classes solely to attach public tokens.
- Treating source CSS wiring or selector state as rendered proof.
- Authoring or weakening a required acceptance oracle in the production implementation context when `test-authoring` is required.
- Creating/regenerating/approving an intentional changed visual baseline in the production implementation context.
- Treating delegated `test-authoring` as another Material owner/stage rather than a subcontext of implementation-owned proof work.
- Asking the operator to run verifier commands.
- Claiming `complete` with required task-specific proof unrun or failing.
- Rewriting already-correct work on resume without an exact defect.
- Running a final broad local verification gate solely to duplicate CI.
