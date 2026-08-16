# Material token architecture

## Decision

Official Material component tokens are one of the three canonical family contracts, not a demand-scoped customization layer.

```text
Material 3 MCP token contract
        ↓
family tokens.css
        ↓
family-local CSS renderer bridge when needed
        ↓
rendered observable result
```

`@m3e/web` token names, legacy CSS and current application overrides do not define the public token API.

Token declarations, aliases and public-to-private custom-property bridges are CSS ownership. TypeScript may select a public component configuration or renderer property/class/attribute, but it must not become a token catalogue or token mapping engine.

## Owners

| Contract                                         | Owner                                                   |
| ------------------------------------------------ | ------------------------------------------------------- |
| Material reference/system foundations            | `foundation/tokens.css`                                 |
| Default light/dark system assignments            | `foundation/theme.css`                                  |
| Family public component-token contract/catalogue | `components/<family>/tokens.css`                        |
| Private renderer token bridges/workarounds       | owning component CSS / family-local private stylesheet  |
| Application tokens                               | outside Material as `--app-*`                           |

`--m3e-*` and `--md-private-*` are never public Material API.

There is no second central component-token catalogue. Executable CSS is the source of truth and repository verification owns cross-file public-token ownership invariants.

## Family `tokens.css`

The dedicated `material-component-token-contract` worker derives this artifact only from the repository-configured `material3` MCP plus the completed structural `contract.ts` boundary and minimum repository token naming/foundation conventions needed to serialize CSS.

- Preserve official current family/configuration/variant/state/part/property semantics.
- Use canonical `--md-comp-*` names derived from Material rather than legacy or renderer vocabulary.
- Preserve official system/reference aliases and defaults when defined.
- Include official tokens for current canonical family configurations, variants, parts and states even when Mioframe does not currently override them.
- Material pages may retain baseline, legacy, deprecated or no-longer-recommended token tables. Exclude a group explicitly scoped to such a historical configuration unless that configuration is intentionally part of the current canonical public family.
- Use repository Material CSS authoring conventions when serializing values. `dp` and `sp` are supported authoring units transformed by the project PostCSS pipeline.
- Do not expose renderer variables, copy renderer defaults, or add convenience aliases.
- Do not create a TypeScript token enum, registry, DSL, JSON mirror, generated token-name list, runtime token map, or second catalogue.

If required token data is unavailable or contradictory in Material 3 MCP, the token worker reports `blocked`; do not guess or fall back to m3e/current code/current demand.

## Foundation and theme

Foundation owns intentionally supported `--md-ref-*` and `--md-sys-*` roles. `theme.css` owns canonical light/dark assignments.

A family token may reference those foundation roles but must not duplicate their ownership.

Product theme selection/persistence and `--app-*` customization remain outside Material.

## Private renderer mapping

Only the later standalone implementation maps each public token through documented exact-version renderer inputs/fallbacks while keeping those details private.

When m3e requires private CSS custom properties, bridge them in CSS, not TypeScript. Keep the mapping explicit and family-local unless one identical CSS grammar is proven across all affected tokens.

GOOD:

```css
.md-example-action[data-appearance='primary'] {
  --m3e-example-action-container-color: var(--md-comp-example-action-primary-container-color);
  --m3e-example-action-icon-color: var(--md-comp-example-action-primary-icon-color);
}
```

TypeScript/Vue may select the configuration:

```html
<m3e-example-action :data-appearance="props.appearance" />
```

but it does not own the token graph.

BAD:

```ts
const tokenSuffixes = ['container-color', 'icon-color'];

const tokenStyles = Object.fromEntries(
  tokenSuffixes.map((suffix) => [
    `--m3e-example-action-${suffix}`,
    `var(--md-comp-example-action-${props.appearance}-${suffix})`,
  ]),
);
```

Why: this moves token names and mapping semantics into runtime TypeScript, creates a second implicit catalogue, hides grammar mismatches behind string composition, and makes CSS no longer the inspectable token source of truth.

A renderer property such as `variant`, `size`, or another documented non-token configuration input may still be bound from TypeScript when it is the correct renderer seam. The CSS-only rule applies to token declarations/aliases/custom-property mappings, not to all component configuration.

For every public token group that affects a reachable configuration, rendered part or state, implementation must be able to trace:

```text
current Material configuration/state/part
  → public contract reachability
  → public --md-comp-* token
  → family-local CSS/private renderer input
  → rendered part/state
  → observable result
```

A public token group with no path to a reachable component configuration and rendered result is not a completed contract. If the group belongs to a current Material configuration, this is an API/implementation gap; if it belongs only to a historical baseline configuration outside the current family, it should not be in current `tokens.css`.

If the renderer fallback produces the correct result, do not duplicate it merely to create more CSS. If a valid current public token override cannot reach the correct rendered result, that is an implementation/renderer gap rather than a reason to remove the token from the canonical contract.

## Legacy transition

Existing pre-contract families may temporarily keep private `--m3e-*` bridges in historical `tokens.css` files. Do not bulk-rewrite them solely for file-shape consistency.

When such a family is next converted through the current workflow:

- the token contract worker establishes canonical current public `--md-comp-*` contract without consulting legacy CSS;
- standalone implementation keeps required private renderer token bridges in component/family-local CSS rather than TypeScript;
- migration removes obsolete legacy ownership only after the canonical component is proven and consumers have moved;
- observable behavior and proof remain preserved.

The retired central `docs/token-api.md` catalogue is not replaced. Family/foundation CSS owners are the executable catalogue.

## Verification

Token verification proves observable behavior, not merely declaration presence.

Depending on the token, use faithful browser/visual proof for:

- computed/rendered colors;
- typography values;
- shapes/radii;
- elevation where observable;
- dimensions/spacing when token-controlled;
- state-specific values for hover/focus/pressed/disabled/selected states;
- light/dark theme resolution when the token delegates to system roles.

A custom-property value on the host, source inspection, renderer mapping line, story, or screenshot alone is insufficient when the public contract concerns a different rendered part or fixed numeric result.

Do not require one test per token when several tokens share one faithfully proven mapping path. Proof should be proportional while still covering every materially distinct configuration, part, state, grammar, fallback and renderer gap. A single default-configuration override cannot stand in for independently mapped public configuration groups.

Repository token-ownership verification should derive from executable foundation/family CSS rather than from a manually duplicated catalogue.

## Renderer upgrades

Every consumed `@m3e/web` update must revalidate affected private token mappings and known renderer defects. Public Material token names do not change merely because m3e renames or reorganizes private inputs.
