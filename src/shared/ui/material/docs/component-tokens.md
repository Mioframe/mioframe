# Material token architecture

## Decision

Official Material component tokens are one of the three canonical family contracts. `components/<family>/tokens.css` is the single repository owner of that family's public `--md-comp-*` names and Material defaults.

```text
Material 3 MCP token contract
        ↓
family tokens.css
        ↓
:root public --md-comp-* defaults
        ↓
optional inherited/contextual --md-comp-* override
        ↓
family-local CSS renderer bridge
        ↓
rendered observable result
```

`@m3e/web`, legacy CSS, and current application overrides do not define the public token API.

Token declarations, aliases, and public-to-private custom-property bridges are CSS ownership. Runtime TypeScript/Vue may select component configuration, but it must not become a token catalogue or token mapping engine.

## Cascade model

Family defaults are declared on `:root` in the owning family's `tokens.css`:

```css
/* components/exampleAction/tokens.css */
:root {
  --md-comp-example-action-primary-container-color: var(--md-sys-color-primary);
  --md-comp-example-action-small-container-height: 56dp;
}
```

The selector controls cascade scope; it does not change repository ownership. The family directory remains the owner of those names/defaults.

Do not redeclare those defaults on `.md-<component>` or another local selector:

```css
/* BAD */
.md-example-action {
  --md-comp-example-action-primary-container-color: var(--md-sys-color-primary);
}
```

A host declaration shadows inherited contextual overrides and can make composition depend on specificity or stylesheet order.

A composing component or consumer may intentionally override another family's public token closer to a nested instance:

```css
.md-button {
  --md-comp-loading-indicator-color: currentColor;
}
```

The nested component inherits that value. Removing the contextual declaration restores the owning family's `:root` default.

Never repair token composition with specificity escalation, `!important`, inline Vue token wiring, or bundle/source-order assumptions.

## Theme model

Material reference/system tokens (`--md-ref-*`, `--md-sys-*`) are document-wide theme inputs owned by the Material foundation/theme layer. Future user theme settings may replace those root-level assignments globally.

Component defaults may reference them from `:root`:

```css
:root {
  --md-comp-example-action-primary-container-color: var(--md-sys-color-primary);
}
```

Mioframe does not currently guarantee multiple independent Material system themes in different DOM subtrees. If that becomes a real product requirement, revisit component-default resolution explicitly rather than adding local cascade workarounds.

Contextual **component-token** overrides remain supported and are the normal composition mechanism.

## Ownership

| Contract | Owner |
| --- | --- |
| Material reference/system foundations | `foundation/tokens.css` |
| Default/user-selected document theme assignments | `foundation/theme.css` |
| Family public `--md-comp-*` names and defaults | `components/<family>/tokens.css` on `:root` |
| Contextual component-token overrides | composing component / consumer CSS |
| Private renderer token bridges/workarounds | owning component CSS / family-local private stylesheet |
| Application tokens | outside Material as `--app-*` |

`--m3e-*` and `--md-private-*` are never public Material API.

There is no second central component-token catalogue. Executable family CSS is the source of truth.

### Single default ownership

Across `components/*/tokens.css`, one public `--md-comp-*` name may have exactly one family-default declaration. That declaration must be on `:root` in its owning family contract.

Repository mechanical verification must detect duplicate default declarations across family `tokens.css` files. This check applies only to family token contracts; declarations in implementation/consumer CSS are allowed when they are contextual overrides rather than default ownership.

Do not make correctness depend on which family's stylesheet is bundled last.

## Family `tokens.css`

The `material-component-token-contract` worker derives this artifact from the repository-configured Material3 MCP plus completed `contract.ts` structural scope.

The artifact must:

- use canonical `--md-comp-*` names derived from Material semantics;
- preserve official current defaults and official system/reference aliases;
- include current reachable configurations, variants, parts, and states;
- distinguish current Expressive rows/groups from baseline/legacy/deprecated material;
- declare family-owned defaults on `:root`;
- use repository Material CSS authoring conventions (`dp`/`sp` are supported by the project pipeline);
- contain no renderer/application token vocabulary or compatibility aliases;
- remain the only public token catalogue for that family.

If Material evidence is unavailable/contradictory, the token contract is blocked. If token evidence proves the structural API boundary wrong, return to the API owner rather than compensating in CSS.

## Private renderer mapping

Standalone implementation consumes the already-defined public token. It owns only renderer adaptation:

```css
.md-example-action {
  --m3e-example-action-primary-container-color: var(
    --md-comp-example-action-primary-container-color
  );
}
```

The bridge must not repeat the Material default. `tokens.css` already owns it.

Use a static bridge when renderer namespaces already distinguish configurations. Use an explicit family modifier class only when the renderer genuinely requires configuration-dependent remapping. Do not build token names/maps in TypeScript.

For each required token path, implementation must be able to trace:

```text
Material configuration/state/part
  → public contract reachability
  → family-owned :root --md-comp-* default
  → optional inherited/contextual override
  → family-local private renderer input
  → rendered result
```

A valid public override that cannot reach the rendered result is an implementation/renderer defect, not a reason to weaken the token contract.

## Composition proof

When one Material component contextually customizes a nested Material component, proof must cover both sides of the cascade:

```text
family :root default
        ↓
ancestor/composer override
        ↓
nested component inherits override
        ↓
renderer consumes it
```

The proof must also show that removing the contextual override restores the family default. This catches host-level redeclarations, specificity conflicts, and accidental bundle-order dependence.

## Architecture migration

Existing converted families that declare their own `--md-comp-*` defaults on `.md-<component>` use the superseded cascade model and must be migrated to one repository-wide model.

When the public token names, values, aliases, and Material semantics are already known and unchanged, moving those existing declarations from the family host selector to `:root` is a **mechanical repository architecture migration**, not a reason to rerun Material3 MCP derivation for every family.

Perform that selector-only transition as one scoped repository correction:

- move unchanged family defaults to `:root` in their existing owning `tokens.css`;
- preserve private renderer bridges and intentional contextual overrides;
- update repository compatibility verification and its tests;
- add/retain observable composition override/fallback proof;
- do not create compatibility support for the old host-default model.

If the migration uncovers uncertainty about a token's name, default, alias, current status, or ownership, stop treating that family as mechanical and route that exact semantic question to `token-contract`.

Normal `material-component <name>` runs after this repository migration use the root-default model directly; the normal workflow does not gain a new migration stage or special mode.

## Verification

Repository mechanical verification must enforce at least:

- family `tokens.css` contains no private `--m3e-*` tokens;
- family-owned `--md-comp-*` defaults are declared on `:root`, not a component/local selector;
- the same public default is not declared by more than one family `tokens.css`;
- runtime TypeScript/Vue does not become a token catalogue/mapping engine.

Observable verification remains proportional to risk: rendered colors, typography, shape, dimensions, state values, composition inheritance/fallback, and global theme resolution use the lowest faithful browser/visual proof required by the contract.
