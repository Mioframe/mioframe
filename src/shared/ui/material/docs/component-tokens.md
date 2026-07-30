# Material token architecture

## Decision

Material component tokens have three separate records:

```text
family DESIGN.md
  → complete official component-token catalogue

family ARCHITECTURE.md
  → selected demand-scoped runtime token contract
  → state/part/renderer-fallback trace

runtime CSS + token-api.md
  → executable supported Mioframe token API
  → private m3e mappings
```

The complete official catalogue, selected architecture contract, and executable runtime subset must not be conflated.

## Contract owners

| Contract | Canonical owner | Status |
| -------- | --------------- | ------ |
| Complete official component-token catalogue | `components/<family>/DESIGN.md` | source-backed official record |
| Selected component-token surface and state/part trace | `components/<family>/ARCHITECTURE.md` | ready implementation contract |
| Material reference/system foundations | `foundation/tokens.css` | public when declared and catalogued |
| Default palette and light/dark system-color assignments | `foundation/theme.css` | public theme contract |
| Executable selected component tokens | `components/<family>/tokens.css` | public for that family |
| Owner-local renderer mappings and bridges | owning foundation/family | private |
| Approved application tokens (`--app-*`) | outside `src/shared/ui/material` | application API, not Material API |
| Supported public token catalogue | `docs/token-api.md` | consumer-facing runtime documentation |

`--m3e-*` variables are private renderer inputs. `--md-private-*` variables are owner-local implementation details. Neither namespace belongs in the public catalogue or `DESIGN.md`.

## Complete official catalogue

Every family `DESIGN.md` contains every official component token published for that component, including all variants, configurations, sizes, states, parts, selected/unselected modes, disabled values, motion, shape, elevation, typography, spacing, and contrast modes.

For every official token preserve:

- exact official path;
- official display name;
- system/reference aliases;
- documented light, dark, high-contrast, or other values;
- unresolved or absent values explicitly.

This catalogue is complete regardless of current Mioframe demand or renderer support. It is not a list of supported CSS custom properties.

## Architecture selection

After a current complete design exists, `ARCHITECTURE.md` classifies official tokens as:

- `implement-now` — required by a confirmed scenario and selected runtime surface;
- `defer` — official but not required now;
- `source-conflict` — official sources do not support one reliable decision;
- `not-material` — project customization requiring another owner.

Renderer-private inputs are not Material token availability states.

Existence in Material or m3e does not make a token part of Mioframe public runtime API. Lack of current demand does not remove it from `DESIGN.md`.

## Foundation and theme ownership

`foundation/tokens.css` owns intentionally supported renderer-independent reference/system roles.

`foundation/theme.css` owns:

- reference palette values used by the standard theme;
- default light system-color assignments;
- dark system-color assignments;
- explicitly catalogued theme overrides of foundation roles.

A public token has one canonical base owner. A theme override is allowed only inside `theme.css`, must be explicit in `token-api.md`, and must be covered by the same runtime/visual contract.

Application theme selection, persistence, and product-specific tokens remain outside Material.

## Component-family runtime ownership

Each family runtime owns only the official `--md-comp-<family>-*` subset selected by its ready architecture.

```text
components/button/DESIGN.md
  → complete official Button token catalogue

components/button/ARCHITECTURE.md
  → selected Button runtime tokens and complete state/part trace

components/button/tokens.css
  → executable selected --md-comp-button-* declarations
  → private mapping to documented --m3e-* inputs
```

A family runtime must not:

- define another family’s tokens;
- expose the complete design catalogue as supported CSS;
- mirror all renderer variables;
- use a global component-token file as a second owner;
- expose renderer token names to consumers.

A parent uses a dependency’s public props, slots, inherited color, or supported official tokens. It must not set dependency-private renderer inputs.

## Effect of using m3e

Using m3e removes the need to reproduce every Material component default in Mioframe CSS.

Mioframe still owns:

1. complete source-backed design documents;
2. selected architecture token contracts;
3. supported foundation/theme contracts;
4. executable selected public component tokens;
5. explicit Material-to-m3e mappings where required;
6. removable, documented workarounds for confirmed renderer divergences.

Do not copy m3e defaults to create a complete-looking API. Do not omit official tokens from `DESIGN.md` because m3e lacks or renames them.

## Selecting a public component token

A public `--md-comp-*` token must satisfy all conditions:

1. exact official path and semantics exist in current `DESIGN.md`;
2. public CSS name derives from that path, not legacy or renderer vocabulary;
3. a confirmed current scenario requires the rendered part and state;
4. ready `ARCHITECTURE.md` selects it and records one family owner;
5. runtime default/fallback is meaningful;
6. complete renderer input and fallback path is known;
7. mapping to the rendered result is implemented and verified;
8. it is listed in `token-api.md`.

Demand is recorded as an observable result, for example:

```text
Snackbar action label remains inverse-primary in
resting, hovered, focused, and pressed states.
```

The selected runtime subset contains every official token required to preserve that result across relevant states and parts. It excludes parts with no current consumer.

A label-only scenario does not justify icon tokens. A resting label token is insufficient when the renderer uses separate hovered, focused, or pressed inputs.

When no official token exists, architecture chooses one result:

- use a supported system role;
- keep renderer configuration private;
- use an approved application token outside Material;
- assign a confirmed renderer defect to m3e;
- leave the customization unsupported.

## State, part, and fallback trace

Before implementation, `ARCHITECTURE.md` traces every required state and part:

| State | Rendered part | DESIGN.md token path | Public Mioframe token | Renderer input and fallback | Expected consumer result | Proof owner |
| ----- | ------------- | -------------------- | --------------------- | --------------------------- | ------------------------ | ----------- |

The trace covers resting and every selected transient, selected, or disabled state that can choose another renderer value.

The renderer column identifies both direct input and effective fallback. If fallback violates the expected result, the corresponding official token belongs to the minimum complete selected subset.

Do not add tokens because adjacent renderer inputs exist. Adjacent official tokens remain documented in `DESIGN.md`.

## Mapping and CSS grammar

```text
exact official path in DESIGN.md
  → selected public token in ARCHITECTURE.md
  → canonical runtime declaration
  → documented renderer input
  → renderer fallback
  → rendered consumer result
```

For every selected token:

- preserve official family/variant/state/part/property semantics and order;
- keep one canonical base declaration owner;
- prefer direct system-role consumption when correct;
- keep mappings inside the owning family;
- prefer documented renderer inputs;
- treat undocumented effective inputs as exact-version workarounds;
- do not expose m3e names through props, exports, examples, or consumer CSS.

Semantic equality is insufficient when consumers accept different CSS grammars. Verify representation against every selected consumer. Visible grammar changes require browser proof.

## Supported public catalogue

`docs/token-api.md` is the complete index of supported runtime tokens, not the complete official Material catalogue.

Each entry records:

- exact supported CSS name and purpose;
- grammar and default/source;
- scope and owner;
- exact official source from `DESIGN.md`;
- architecture selection reference;
- renderer input and fallback when applicable;
- representative verification;
- selected theme override when applicable.

Executable CSS is the runtime source. Catalogue and declaration change together. Absence from `token-api.md` means the token is not supported at runtime, though it may remain official in `DESIGN.md`.

Do not create a TypeScript token enum, token DSL, or duplicate runtime registry.

## Legacy migration invariant

The former mixed-owner token file must not be recreated.

Migration must inventory declarations and consumers, use ready family architectures to select retained tokens, move them to semantic owners, remove invalid/unused/application-owned runtime entries from Material, update imports and catalogue, delete legacy sources without aliases unless architecture requires one, and leave no duplicate public owner.

## Verification

Verify both official completeness and selected runtime correctness:

- `DESIGN.md` contains the complete official catalogue;
- `ARCHITECTURE.md` selects exact official paths and contains complete state/part/input/fallback traces;
- public names derive from official paths;
- canonical runtime declarations exist;
- `token-api.md` matches declarations and theme overrides;
- CSS grammar works for every selected consumer;
- family mappings use documented inputs or gated workarounds;
- browser proof checks computed rendered results in every selected state;
- custom-property values, host state, source mapping, or screenshots alone are insufficient;
- no unconsumed public token is included for symmetry;
- no `--m3e-*` leaks outside Material;
- no duplicate public owner remains.

Do not require one runtime test per official or renderer token. Runtime proof is limited to architecture-selected states and parts; complete official enumeration belongs to `DESIGN.md`.