# Material component adapter contract

This document defines durable implementation rules for translating the three canonical Mioframe Material family contracts to the private renderer.

The public contracts are owned by [`component-contract.md`](./component-contract.md). Workflow order is owned by [`component-workflow.md`](./component-workflow.md).

## Direction of dependency

```text
Material 3 MCP
      ↓
contract.ts + tokens.css + BEHAVIOR.md
      ↓
Vue MD* component
      ↓
private @m3e/web mapping
```

Never derive public API, tokens, or behavior from m3e, legacy Mioframe components, or current consumer demand.

## Renderer mapping

Before implementing a renderer-backed prop, slot, event, state, or content role, inspect the documentation/examples and public artifacts shipped with the exact lockfile-resolved `@m3e/web` version.

A renderer mapping is acceptable only when its observable result satisfies the canonical Material contracts.

Use this order:

1. documented direct renderer support;
2. small family-local adapter mapping/correction;
3. documented exact-version workaround for a confirmed renderer defect;
4. architecture/upstream escalation when faithful implementation would require private DOM coupling, duplicated renderer systems, new shared infrastructure, or weakening a canonical contract.

Do not recreate renderer-owned state layer, ripple, focus system, elevation, internal geometry engine, accessibility internals, or motion when m3e already owns them correctly.

## Slots and composition

A slot name or permissive DOM position is not proof that arbitrary Vue content is a correct Material composition.

For every public content role:

- verify the exact m3e documented child/slot contract;
- inspect inherited/custom-property handoff that affects size, color, alignment, accessibility, or interaction;
- compose through another canonical Mioframe Material family when that family owns the role;
- otherwise prove the chosen content produces the required observable Material result.

Do not render another family’s raw `m3e-*` element from a parent adapter.

When a parent/composer intentionally customizes a nested canonical Material component, prefer that child's public `--md-comp-*` override API over renderer-private coupling. The nested component must inherit the contextual override naturally; do not repair composition with selector specificity or source-order assumptions.

## Controlled state

For every controlled public state, keep one source of truth.

Inspect the exact renderer transition lifecycle and prove which public prop owns state, which renderer property reflects it, what event represents user intent, whether the renderer mutates optimistically, how accepted/rejected intent is reconciled, and how disabled/presentation modes affect the path.

Prefer a documented cancelable pre-mutation event when available. Do not repair drift with duplicate wrapper state, delayed watchers, or private renderer mutation unless an explicit architecture decision proves no cleaner seam exists.

Proof must include rejected intent when the renderer can otherwise become a second source of truth.

## Host attribute boundary

When a raw `m3e-*` element is the Vue component root:

- set `inheritAttrs: false`;
- explicitly forward only the public/native/ARIA allow-list required by `contract.ts` and `BEHAVIOR.md`;
- merge consumer `class` and `style` with adapter-owned values;
- do not forward undeclared listeners or renderer-private attributes;
- ensure adapter bindings win over conflicting fallthrough;
- keep filtering local to the family rather than creating a generic registry/framework.

Required semantics should be represented by explicit props/events or an explicit allow-list, never unrestricted `$attrs` fallthrough or consumer typing workarounds.

## Renderer typing

Private glue should be derived from package-exported element classes/types or `HTMLElementTagNameMap` where available.

Public Material types remain renderer-independent. Exact renderer drift should fail type checking inside the family rather than leak through the public API.

## Tokens

Public token names/defaults and tokenized visual values are defined by family `tokens.css` from Material 3 MCP. m3e variables remain private implementation inputs.

The cascade contract is:

```text
family tokens.css :root --md-comp-* default
  → optional inherited/contextual --md-comp-* override
  → family block/modifier private renderer bridge
  → rendered observable result
```

A component adapter must **consume** public tokens; it must not redeclare their Material defaults on the component host and must not duplicate those defaults as renderer fallbacks.

GOOD:

```css
.md-example-action {
  --m3e-example-action-container-color: var(--md-comp-example-action-primary-container-color);
}
```

BAD:

```css
.md-example-action {
  --md-comp-example-action-primary-container-color: var(--md-sys-color-primary);
  --m3e-example-action-container-color: var(--md-comp-example-action-primary-container-color);
}
```

Why: the host-level public declaration shadows inherited contextual overrides and creates a second cascade owner.

Also forbidden as fixes: stronger selectors, `!important`, inline Vue token wiring, or relying on stylesheet order.

Do not mirror all m3e variables or copy renderer defaults for completeness. A public token is implemented only when its runtime mapping and rendered result satisfy `tokens.css`.

## Geometry, appearance and motion

Tokenized appearance and geometry are owned by `tokens.css`, not repeated in `BEHAVIOR.md`. Proof of a token default or override must exercise the public token and assert the rendered result at the lowest faithful level; numeric geometry uses browser measurement when a screenshot is not a reliable oracle.

`BEHAVIOR.md` may still define layout relationships or exact intrinsic constraints that have no current component-token representation. Prove those directly from the public rendered boundary.

Renderer-owned appearance and motion require faithful browser/visual evidence where the contracts depend on them. Do not add host overrides that fight renderer-owned transient timing or geometry merely to match a screenshot.

## Accessibility and native behavior

Put semantics on the actual interaction owner and satisfy `BEHAVIOR.md`.

- Browser proof must resolve roles, accessible names/states and focus/keyboard behavior from rendered semantics.
- Attribute presence alone is insufficient.
- Preserve normal event propagation unless the canonical behavior requires interception.
- Presentation/decorative child composition must prove both that the child does not become a competing owner and that real input reaches the actual owning action.

## Exact-version renderer defects

A family-local temporary workaround is allowed only when one of the three canonical contracts requires the result, the installed m3e version is confirmed divergent, the correction uses a documented/public host seam, it stays private to the family, it does not recreate renderer internals, focused proof covers the result, and `docs/m3e-defects.md` records evidence/removal trigger.

If these conditions are not met, escalate instead of accumulating workaround logic.

## Test-environment seams

Renderer-specific test shims belong to the narrowest truthful test owner.

Do not add global browser/custom-element/polyfill behavior solely for one family unless multiple independent owners require the same faithful seam and shared ownership is explicit.

A shim may enable construction or deterministic wiring; it is not proof of real browser accessibility, layout, focus, form participation, or capability behavior.

## Standalone implementation sequence

The implementation worker follows this order:

1. consume `contract.ts`, `tokens.css`, and `BEHAVIOR.md` without redesigning them;
2. inspect exact-version m3e documentation/public artifacts;
3. implement renderer mapping and standalone component;
4. add component/browser/visual/token proof as required, including contextual-override/fallback proof when composition depends on inherited public tokens;
5. establish standalone correctness;
6. run focused verifier-managed checks;
7. return to the orchestrator without inspecting or migrating application consumers.

Consumer inventory, legacy adaptation, product behavior preservation, legacy-owner removal, and old staged-artifact cleanup belong to the later `material-component-migration` worker.

When implementation evidence shows one canonical contract is incorrect, return the exact owner (`api-contract`, `token-contract`, or `behavior-contract`). Do not silently rewrite the contract while coding.
