# Material token architecture

## Decision

Official Material component tokens are one of the three canonical family contracts, not a demand-scoped customization layer.

```text
Material 3 MCP token contract
        ↓
family tokens.css
        ↓
:root public --md-comp-* defaults
        ↓
inherited/scoped --md-comp-* overrides
        ↓
family-local CSS renderer bridge
        ↓
rendered observable result
```

`@m3e/web` token names, legacy CSS and current application overrides do not define the public token API.

Token declarations, aliases and public-to-private custom-property bridges are CSS ownership. TypeScript/Vue may select a public component configuration or renderer property/class, but it must not become a token catalogue or token mapping engine.

## Cascade model

`--md-comp-*` has two roles only:

1. the family-owned public Material component-token name and default;
2. an inheritable override input that a consumer or composing Material component may set closer to a rendered instance.

Family `tokens.css` declares the official defaults on `:root`, even though the file remains owned by that component family:

```css
/* components/exampleAction/tokens.css */
:root {
  --md-comp-example-action-primary-container-color: var(--md-sys-color-primary);
  --md-comp-example-action-small-container-height: 56dp;
}
```

The selector controls cascade scope; it does not change repository ownership. The family directory remains the single owner of those public names/defaults.

Do **not** redeclare those defaults on `.md-<component>`:

```css
/* BAD */
.md-example-action {
  --md-comp-example-action-primary-container-color: var(--md-sys-color-primary);
}
```

A host declaration would shadow inherited contextual overrides and can make composition depend on specificity or stylesheet order.

A composing component may intentionally override another family's public token in its own styling context:

```css
.md-button {
  --md-comp-loading-indicator-color: currentColor;
}
```

A nested Loading Indicator then inherits that override naturally. Removing the contextual declaration falls back to the family-owned `:root` default.

Never repair token composition with specificity escalation, `!important`, inline Vue token wiring, or bundle-order assumptions.

## Theme model

Material reference/system tokens (`--md-ref-*`, `--md-sys-*`) are application-wide document theme inputs owned by the Material foundation/theme layer. Future user theme settings may replace those root-level system assignments globally.

Component-token defaults may reference system/reference tokens from `:root`:

```css
:root {
  --md-comp-example-action-primary-container-color: var(--md-sys-color-primary);
}
```

Mioframe does not currently guarantee multiple independent Material system themes in different DOM subtrees. If simultaneous subtree Material themes become a real product requirement, revisit the component-default resolution model explicitly rather than adding local specificity workarounds.

Contextual **component-token** overrides remain supported and are the normal composition mechanism.

## Owners

| Contract | Owner |
| --- | --- |
| Material reference/system foundations | `foundation/tokens.css` |
| Default/user-selected document theme assignments | `foundation/theme.css` |
| Family public `--md-comp-*` names and defaults | `components/<family>/tokens.css` on `:root` |
| Contextual component-token overrides | composing component / consumer CSS |
| Private renderer token bridges/workarounds | owning component CSS / family-local private stylesheet |
| Application tokens | outside Material as `--app-*` |

`--m3e-*` and `--md-private-*` are never public Material API.

There is no second central component-token catalogue. Executable family CSS is the source of truth and repository verification owns cross-file public-token invariants.

## Family `tokens.css`

The dedicated `material-component-token-contract` worker derives this artifact only from the repository-configured `material3` MCP plus the completed structural `contract.ts` boundary and minimum repository token naming/foundation conventions needed to serialize CSS.

- Preserve official current family/configuration/variant/state/part/property semantics.
- Use canonical `--md-comp-*` names derived from Material rather than legacy or renderer vocabulary.
- Preserve official system/reference aliases and defaults when defined.
- Declare family-owned public token defaults on `:root`.
- Include official tokens for current canonical family configurations, variants, parts and states even when Mioframe does not currently override them.
- Material pages may retain baseline, legacy, deprecated or no-longer-recommended token tables. Exclude a group explicitly scoped to such a historical configuration unless that configuration is intentionally part of the current canonical public family.
- Use repository Material CSS authoring conventions. `dp` and `sp` are supported authoring units transformed by the project PostCSS pipeline.
- Do not expose renderer variables, copy renderer defaults, or add convenience aliases.
- Do not create a TypeScript token enum, registry, DSL, JSON mirror, generated token-name list, runtime token map, or second catalogue.

If required token data is unavailable or contradictory in Material 3 MCP, the token worker reports `blocked`; do not guess or fall back to m3e/current code/current demand.

## Foundation and theme

Foundation owns intentionally supported `--md-ref-*` and `--md-sys-*` roles. `theme.css` owns canonical light/dark and future user-selected global assignments.

A family component token may reference those foundation roles but must not duplicate their ownership.

Product theme selection/persistence and `--app-*` customization remain outside Material.

## Private renderer mapping

Standalone implementation maps public tokens to exact-version renderer inputs while keeping renderer vocabulary private.

When the renderer exposes configuration-specific private namespaces, prefer one static CSS bridge:

```css
.md-example-action {
  --m3e-example-action-primary-container-color: var(
    --md-comp-example-action-primary-container-color
  );
  --m3e-example-action-primary-icon-color: var(
    --md-comp-example-action-primary-icon-color
  );
}
```

The bridge does not repeat the Material default. `tokens.css` already owns that default on `:root`.

Vue may select the documented renderer configuration:

```vue
<m3e-example-action
  class="md-example-action"
  :variant="appearance"
/>
```

If the renderer reuses one private token name across multiple configurations, use an explicit component-library modifier class only for that real remapping seam. Do not invent `data-*` styling protocols or runtime token maps.

BAD:

```ts
const tokenSuffixes = ['container-color', 'icon-color'];
const tokenStyles = Object.fromEntries(
  tokenSuffixes.map((suffix) => [
    `--m3e-example-action-${suffix}`,
    `var(--md-comp-example-action-${appearance}-${suffix})`,
  ]),
);
```

Why: this moves token names/mapping semantics into runtime TypeScript and creates a second implicit catalogue.

For every public token group that affects a reachable configuration, rendered part or state, implementation must be able to trace:

```text
current Material configuration/state/part
  → public contract reachability
  → family-owned :root --md-comp-* default
  → optional inherited/contextual --md-comp-* override
  → family-local CSS/private renderer input
  → rendered part/state
  → observable result
```

If a valid public override cannot reach the correct rendered result, that is an implementation/renderer gap rather than a reason to remove the public token.

## Composition invariant

Composition proof must cover both sides of the cascade when one Material component customizes a nested Material component:

```text
family :root default
        ↓
ancestor/composer override
        ↓
nested component inherits override
        ↓
renderer consumes it
```

The proof must also show that removing the contextual override restores the Material family default. This catches host-level redeclarations, specificity conflicts, and accidental bundle-order dependence.

## Legacy transition

Existing converted families that declare `--md-comp-*` defaults on their `.md-<component>` host use the superseded cascade model and must be migrated when this architecture change is applied. Do not preserve two cascade models across converted families.

Migration means:

- move family-owned public defaults to `:root` in the same family `tokens.css`;
- keep private renderer bridges on the stable family block/modifier classes;
- remove host-level public default declarations;
- preserve intentional contextual overrides owned by composers/consumers;
- add/retain observable override and fallback proof.

No TypeScript token machinery, specificity escalation, `!important`, inline token wiring, or bundle-order dependency is allowed as a compatibility layer.

## Verification

Token verification proves observable behavior, not merely declaration presence.

Depending on the token, use faithful browser/visual proof for computed/rendered colors, typography, shapes, elevation, dimensions/spacing, state-specific values, and global theme resolution.

Repository mechanical verification should enforce at least:

- family `tokens.css` contains no private `--m3e-*` tokens;
- family-owned `--md-comp-*` default declarations are rooted at `:root`, not `.md-<component>` or another local selector;
- runtime TypeScript/Vue does not become a token catalogue/mapping engine.

A custom-property value on the host, source inspection, mapping line, story, or screenshot alone is insufficient when the public contract concerns a different rendered part or fixed numeric result.

Do not require one test per token when several tokens share one faithfully proven mapping path. Proof should be proportional while covering every materially distinct configuration, part, state, grammar, fallback, composition path, and renderer gap.

## Renderer upgrades

Every consumed `@m3e/web` update must revalidate affected private token mappings and known renderer defects. Public Material token names/defaults do not change merely because m3e renames or reorganizes private inputs.
