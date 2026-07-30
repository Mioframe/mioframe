# Material token architecture

## Decision

`src/shared/ui/material` owns the Material token contract consumed by the application and canonical `MD*` adapters.

```text
application theme selection and overrides
  → Material foundation and theme tokens
  → selected component-family tokens
  → private m3e renderer mappings
```

The physical declaration owner must match the semantic owner.

| Contract                                                | Canonical runtime owner          | Public status                                      |
| ------------------------------------------------------- | -------------------------------- | -------------------------------------------------- |
| Material reference/system foundations                   | `foundation/tokens.css`          | public when declared and catalogued                |
| Default palette and light/dark system-color assignments | `foundation/theme.css`           | public theme contract when declared and catalogued |
| Selected official component tokens                      | `components/<family>/tokens.css` | public for that family                             |
| Owner-local renderer mappings and bridges               | owning foundation/family         | private                                            |
| Approved application tokens (`--app-*`)                 | outside `src/shared/ui/material` | application API, not Material API                  |
| Public token catalogue                                  | `docs/token-api.md`              | consumer-facing documentation                      |

`--m3e-*` variables are private renderer inputs. `--md-private-*` variables are owner-local implementation details. Neither namespace belongs in the public catalogue.

## Availability states

An official Material token is:

- `supported` — declared by its canonical owner, catalogued, mapped where required, and verified;
- `deferred` — official but not selected now; recorded only in the relevant family matrix;
- `private` — renderer or implementation detail;
- `not-material` — project customization requiring an application or explicitly approved extension owner.

Existence in Material documentation or m3e does not make a token part of Mioframe public API.

## Foundation and theme ownership

`foundation/tokens.css` owns intentionally supported renderer-independent reference/system roles, including applicable shape, typography, motion, elevation, state, and other shared foundations.

`foundation/theme.css` owns the standard theme:

- reference palette values used by that theme;
- default light system-color assignments;
- dark system-color assignments;
- explicitly selected theme overrides of foundation roles when the public catalogue records both the canonical base owner and the theme override.

A public token has one canonical base owner. A theme override is allowed only inside `theme.css`, must be explicit in `token-api.md`, and must be covered by the same runtime/visual contract. This does not permit an independent second default or an undocumented duplicate declaration.

Application theme selection, persistence, and product-specific tokens remain outside Material.

## Component-family ownership

Each family owns only the selected official `--md-comp-<family>-*` subset required by current scenarios.

```text
components/button/tokens.css
  → selected --md-comp-button-* declarations
  → private mapping to documented --m3e-button-* inputs
```

A family must not:

- define another family’s tokens;
- mirror the complete Material component-token catalogue;
- mirror all renderer variables;
- use a global component-token file as a second owner;
- expose renderer token names to consumers.

A parent uses a dependency’s public props, slots, inherited color, or supported official component tokens. It must not set dependency-private renderer inputs.

## Effect of using m3e

Using m3e removes the need to reproduce every Material component default in Mioframe CSS.

Mioframe still owns:

1. supported foundation and theme contracts;
2. selected public component-token API;
3. explicit Material-to-m3e mappings where the renderer does not already consume the correct role;
4. removable, documented workarounds for confirmed renderer divergences.

Do not copy m3e defaults merely to present a complete-looking public API.

## Selecting a public component token

A public `--md-comp-*` token must satisfy all conditions:

1. its exact official Material token path and semantics are verified;
2. its public CSS name is derived from that official path, not from legacy Mioframe or renderer vocabulary;
3. a current consumer, theme, or selected component scenario requires the rendered part and state;
4. it has one family owner and meaningful runtime default/fallback;
5. its complete renderer input and fallback path is known for the selected state;
6. its mapping to the rendered result is implemented and verified;
7. it is listed in `token-api.md`.

Current need selects an official token; it does not invent one. A renderer input with similar meaning does not authorize a public token name.

Demand must be recorded as an observable result rather than a broad component customization. For example:

```text
Snackbar action label remains inverse-primary in
resting, hovered, focused, and pressed states.
```

The selected subset must contain every official token needed to preserve that result across the required states and rendered parts. It must exclude parts with no current consumer. A label-only scenario does not justify publishing icon tokens, while a resting label token is insufficient when the renderer uses separate hovered, focused, or pressed label inputs.

When no official token exists, choose one explicit result:

- use a supported system role;
- keep renderer configuration private;
- use an approved application token outside Material;
- assign a confirmed renderer defect to m3e;
- leave the customization unsupported.

## State, part, and fallback trace

Before implementing a contextual component-token override, the family README must trace every required rendered state and part:

| State | Rendered part | Official Material token path | Public Mioframe token | Renderer input and fallback | Current consumer result | Proof |
| ----- | ------------- | ---------------------------- | --------------------- | --------------------------- | ----------------------- | ----- |

The trace is required for resting and every selected transient or disabled state that can choose a different renderer value. Inspect the exact lockfile-resolved artifact rather than assuming that a resting token continues to apply during hover, focus, press, selection, or disablement.

The renderer fallback column must identify both the direct family input and the fallback that becomes effective when the direct input is absent. If that fallback would violate the current consumer result, the corresponding official token is part of the minimum complete public subset.

Do not add tokens merely because adjacent renderer inputs exist. Add only the states and parts required by the confirmed scenario.

## Mapping and CSS grammar

```text
exact official Material token path
  → canonical public --md-ref-* / --md-sys-* / --md-comp-* declaration
  → documented semantically equivalent renderer input
  → renderer fallback chain
  → rendered current-consumer result
```

For every selected token:

- preserve official family/variant/state/part/property semantics and ordering;
- keep one canonical base declaration owner;
- prefer direct system-role consumption when m3e already uses the correct role;
- keep component mappings inside the owning family;
- prefer documented renderer inputs;
- treat an undocumented effective input as an exact-version workaround under `component-adapter.md`;
- do not expose m3e names through props, exports, examples, or consumer CSS.

Semantic equality is not sufficient when consumers accept different CSS grammars. Verify the chosen representation against every selected current consumer. Prefer one shared foundation representation when it preserves meaning and works everywhere; otherwise keep conversion private to the owning adapter. Visible grammar changes require browser proof.

## Public catalogue

`docs/token-api.md` is the complete human-facing index of supported tokens. Each entry records:

- exact name and semantic purpose;
- CSS grammar;
- canonical default or source;
- scope and owner;
- exact official Material token path or role source;
- renderer input and relevant fallback when applicable;
- representative verification;
- any selected theme override of a foundation-owned role.

Executable CSS remains the runtime source. Catalogue and declaration change together. Absence from `token-api.md` means the token is not a supported Mioframe public API.

Do not create a TypeScript token enum, token DSL, or duplicate runtime registry.

## Legacy migration invariant

The former mixed-owner token file must not be recreated. Any legacy migration must inventory declarations and consumers, move retained tokens to semantic owners, remove invalid/unused/application-owned entries from Material, update the single global import, populate `token-api.md`, delete the legacy source without an alias, and leave no undocumented duplicate public declaration owner.

## Verification

Verify only the selected supported public surface:

- the exact official source, token path, state, part, and semantic property are recorded;
- the public name is derived from the official path rather than the renderer input;
- canonical base declaration exists;
- `token-api.md` matches runtime declarations and selected theme overrides;
- CSS grammar works for every selected consumer;
- the family matrix contains the complete state/part/input/fallback trace;
- family mappings use documented semantic inputs or a fully gated workaround;
- browser proof checks the rendered part’s computed result in every selected state;
- checking only a custom-property value, host state, source mapping, or screenshot does not prove the rendered token result;
- visual proof may supplement but not replace the rendered browser assertion;
- no unconsumed public token is included merely for symmetry or renderer completeness;
- no `--m3e-*` leaks outside the Material boundary;
- no undocumented duplicate public owner remains.

Do not require one test per renderer variable, copy complete third-party catalogues, or create infrastructure solely to enumerate renderer internals. The trace and proof are limited to the states and parts selected by current demand.
