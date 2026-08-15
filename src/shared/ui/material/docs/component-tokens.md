# Material token architecture

## Decision

Official Material component tokens are one of the three canonical family contracts, not a demand-scoped customization layer.

```text
Material 3 MCP token contract
        ↓
family tokens.css
        ↓
private renderer mapping
        ↓
rendered observable result
```

`@m3e/web` token names, legacy CSS and current application overrides do not define the public token API.

## Owners

| Contract                                         | Owner                                               |
| ------------------------------------------------ | --------------------------------------------------- |
| Material reference/system foundations            | `foundation/tokens.css`                             |
| Default light/dark system assignments            | `foundation/theme.css`                              |
| Family public component-token contract/catalogue | `components/<family>/tokens.css`                    |
| Private renderer bridges/workarounds             | owning component implementation/private stylesheet |
| Application tokens                               | outside Material as `--app-*`                       |

`--m3e-*` and `--md-private-*` are never public Material API.

There is no second central component-token catalogue. Executable CSS is the source of truth and repository verification owns cross-file public-token ownership invariants.

## Family `tokens.css`

The dedicated `material-component-token-contract` worker derives this artifact only from the repository-configured `material3` MCP plus the minimum repository token naming/foundation conventions needed to serialize it.

- Preserve official family/variant/state/part/property semantics.
- Use canonical `--md-comp-*` names derived from Material rather than legacy or renderer vocabulary.
- Preserve official system/reference aliases and defaults when defined.
- Include official tokens for the canonical family variants, parts and states even when Mioframe does not currently override them.
- Do not expose renderer variables, copy renderer defaults, or add convenience aliases.
- Do not create a TypeScript token enum, registry, DSL, JSON mirror, or second catalogue.

If required token data is unavailable or contradictory in Material 3 MCP, the token worker reports `blocked`; do not guess or fall back to m3e/current code/current demand.

## Foundation and theme

Foundation owns intentionally supported `--md-ref-*` and `--md-sys-*` roles. `theme.css` owns canonical light/dark assignments.

A family token may reference those foundation roles but must not duplicate their ownership.

Product theme selection/persistence and `--app-*` customization remain outside Material.

## Private renderer mapping

Only the later standalone implementation worker maps each public token through documented exact-version renderer inputs/fallbacks while keeping those details private.

For every mapping that affects a rendered part or state, implementation must be able to trace:

```text
Material 3 token
  → public --md-comp-* token
  → private m3e input/fallback
  → rendered part/state
  → observable result
```

If the renderer fallback produces the correct result, do not duplicate it merely to create more CSS. If a public token override cannot reach the correct rendered result, that is an implementation/renderer gap rather than a reason to remove the token from the canonical contract.

## Legacy transition

Existing pre-contract families may temporarily keep private `--m3e-*` bridges in their historical `tokens.css` files. Do not bulk-rewrite them solely for file-shape consistency.

When such a family is next converted through the current workflow:

- the token contract worker establishes the canonical public `--md-comp-*` contract without consulting legacy CSS;
- standalone implementation moves required private renderer bridges to implementation/private styling;
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

Do not require one test per token when several tokens share one faithfully proven mapping path. Proof should be proportional while still covering materially distinct parts, states, grammars, fallbacks, and renderer gaps.

Repository token-ownership verification should derive from executable foundation/family CSS rather than from a manually duplicated catalogue.

## Renderer upgrades

Every consumed `@m3e/web` update must revalidate affected private token mappings and known renderer defects. Public Material token names do not change merely because m3e renames or reorganizes its private inputs.
