# Material component architecture and implementation contract

This document defines durable rules shared by the architecture and implementation stages. Stage order and artifacts are owned by `component-workflow.md`.

## Unit of work

The unit is one explicitly named official Material component family plus independently owned official dependencies required by selected scenarios.

```text
current DESIGN.md
  → ready ARCHITECTURE.md
  → canonical component implementation
```

Do not derive public API from legacy Mioframe or m3e vocabulary.

## Architecture matrix

Before production edits, family `ARCHITECTURE.md` contains:

| Material contract | DESIGN.md evidence | Demand and scenario | Public Vue/token representation | Renderer status and mapping | Owner and decision | Proof |
| ----------------- | ------------------ | ------------------- | ------------------------------- | --------------------------- | ------------------ | ----- |

Every selected or deferred decision references an exact design section or token path.

`Demand and scenario` states observable behavior, not a bare yes/no.

Renderer status is exactly one of:

- `direct`;
- `partial`;
- `missing`;
- `divergent`;
- `not-applicable`.

Owner decision is exactly one of:

- `implement-now`;
- `defer`;
- `wrapper-correction`;
- `temporary-renderer-workaround`;
- `m3e-fix`;
- `blocked`;
- `source-conflict`.

No production mapping, public prop/value/default, slot, emit, state, native mapping, selected token, composition, dependency, gap, or proof claim exists without an architecture row.

## Contextual token trace

For every contextual token scenario, `ARCHITECTURE.md` contains:

| State | Rendered part | DESIGN.md official token path | Public Mioframe token | Renderer input and fallback | Expected consumer result | Proof owner |
| ----- | ------------- | ----------------------------- | --------------------- | --------------------------- | ------------------------ | ----------- |

Include resting and every selected transient, selected, or disabled state that can choose a different renderer value.

Do not infer public names from renderer inputs or assume a resting value remains effective in another state.

## Public Vue API

Allowed when selected by architecture:

- props for Material options and states;
- slots for Material content roles;
- emits or `v-model` for controlled intent;
- refs and required native mappings;
- explicit composition of independently owned Material dependencies.

Forbidden by default:

- renderer vocabulary exposed because m3e supports it;
- conflicting legacy naming;
- unused native/link/form/token surface for completeness;
- public dependency on renderer classes, events, tags, or CSS inputs.

If public states coexist, architecture defines precedence and restoration.

Visual loading/busy presentation and activation blocking are independent contracts unless architecture explicitly combines them.

## Host-attribute boundary

Applies to any canonical adapter whose single root is a raw `m3e-*` custom element with no wrapping element.

- Such an adapter MUST set `inheritAttrs: false` and explicitly forward only an architecture-approved allow-list of host-level attributes onto the renderer root. Vue's default automatic `$attrs`/listener fallthrough is not compatible with "Public Vue API" above: an undeclared attribute or listener that reaches `m3e-*` becomes private renderer vocabulary exposed to consumers, whether or not it is documented as a public prop.
- The allow-list is family-scoped and lives in that family's `ARCHITECTURE.md`. A minimum common allow-list applies to every family unless architecture explicitly narrows it further: `class`, `style`, `id`, `title`, `data-*`. Do not invent a broader HTML-global allow-list here; any attribute beyond what a family's `ARCHITECTURE.md` selects requires confirmed consumer demand and a separate explicit architecture update.
- Consumer-supplied `class` and `style` must be merged with adapter-owned internal classes/styles, never replace them.
- Any attribute or listener outside the explicit allow-list must be ignored by the renderer host: it must not reach the custom element as a property, attribute, or event handler.
- This is a local, per-adapter filtering responsibility, consistent with the renderer-boundary and no-generic-adapter-framework stance in `src/shared/ui/material/AGENTS.md`. Do not introduce a generic wrapper, adapter base class, registry, schema, directive, or composable framework to implement it.
- Proof ownership follows "Verification contract" below: component contract tests own the attrs-merge and unknown-attribute/listener-rejection behavior; browser proof (the lowest faithful Storybook behavior test) must additionally demonstrate that undeclared inputs cannot alter actual rendered custom-element state — not merely that they are absent from a snapshot or host attribute list. See "Accessibility and native behavior" above for how required ARIA/native state still reaches the renderer host through the allow-list or explicit props, not through unrestricted fallthrough.
- Tightening fallthrough to an explicit allow-list is a breaking change for any consumer currently relying on leaked renderer access through `$attrs`. `material-component-migration` must audit every current consumer against the new allow-list before the family can be marked migrated/complete.

## Dependency contract

An official dependency remains independently owned even when used only inside a parent.

Required closure:

1. current dependency `DESIGN.md`;
2. ready dependency `ARCHITECTURE.md`;
3. complete dependency implementation and standalone proof;
4. parent composition only through the public dependency API;
5. separate parent handoff proof;
6. dependency migration/review when it has direct consumers or legacy ownership.

The parent must not render the dependency’s raw m3e element, set private variables, or own dependency accessibility, geometry, defects, motion, or token mapping.

## Token contract

Follow `component-tokens.md` and `token-api.md`.

| Token layer                                     | Owner                            |
| ----------------------------------------------- | -------------------------------- |
| complete official component token catalogue     | family `DESIGN.md`               |
| selected runtime component token contract       | family `ARCHITECTURE.md`         |
| executable selected tokens and private mappings | `components/<family>/tokens.css` |
| supported public catalogue                      | `docs/token-api.md`              |

Every supported public token has one semantic owner and one catalogue entry.

A public component token name derives only from its exact official path in `DESIGN.md`.

The selected subset must be complete for confirmed rendered parts and states but exclude unconsumed parts.

Verify value grammar against every selected consumer. A visible mapping change requires browser proof.

## Ownership of gaps

### Foundation

Owns supported reference/system token declarations, standard theme roles, shared CSS grammar, and foundation catalogue entries.

### Parent adapter

Owns Material-to-Vue naming, composition state and placement, controlled parent state, slots/events, native integration, and public dependency handoff.

### Canonical component implementation

Owns renderer import and typed mapping, selected public semantics/accessibility, family tokens, static host-level normalization, approved wrapper corrections, defects, tests, stories, visual proof, and root export.

### m3e

Owns private DOM, internal rendering/layout, private defaults, transient interaction geometry, state layer, ripple, focus, elevation, motion, and private accessibility implementation.

## Exact-version renderer workaround

A `temporary-renderer-workaround` is accepted only when all conditions hold:

1. a selected current scenario requires the behavior;
2. consumed m3e behavior is confirmed incorrect;
3. the exact lockfile-resolved public artifact confirms an effective host-level property, attribute, CSS custom property, or host dimension;
4. the workaround remains inside the canonical component implementation;
5. it does not access private DOM/methods or recreate renderer interaction, accessibility, geometry engine, state, or motion;
6. it does not leak to public API, parents, or consumers;
7. `ARCHITECTURE.md` records exact version, risk, future owner, removal trigger, and stable `M3E-*` ID;
8. `m3e-defects.md` records evidence and lifecycle;
9. focused proof covers the required observable result;
10. every consumed renderer update revalidates or removes it.

Host pseudo-class overrides of renderer-owned timing or transient geometry do not pass this gate. Route them to `m3e-fix` or `blocked`.

## Renderer typing

- Import exact exported element classes and value aliases through the family entry point.
- Derive Vue custom-element glue from exported classes or `HTMLElementTagNameMap`.
- Handwritten `new () => HTMLElement` glue is not package-derived.
- Keep public Material types independent while constraining private mapping with exact renderer types.
- Renderer drift must fail type-check.

## Accessibility and native behavior

- Put ARIA, native state, focus, and interaction semantics on the actual owner.
- Preserve normal native event propagation unless architecture requires interception.
- Attribute assertions alone do not prove custom-element accessibility.
- Browser proof resolves roles and accessible names from rendered semantics.
- Parent and dependency semantic owners are proven separately.

## Implementation contract

The implementation stage consumes a ready `ARCHITECTURE.md` and must not:

- reselect demand;
- change public API, ownership, dependency direction, token subset, renderer strategy, proof ownership, or migration scope;
- implement an unresolved option;
- migrate application consumers.

When implementation evidence invalidates architecture, stop and return to the architecture stage.

## Verification contract

Architecture selects proof through `TEST IMPACT`. Implementation supplies component-owned proof:

- package-derived type-check;
- colocated Vue contract tests;
- browser native/accessibility behavior;
- observable browser or visual proof for selected renderer-owned appearance;
- independent dependency proof;
- token declaration/catalogue/mapping/grammar agreement;
- exact official-token/public-token/renderer-input/fallback trace;
- computed rendered-part result for each selected state;
- state combinations, restoration, and parent/dependency handoff;
- exact-version divergence assessment.

A story, host state, event receipt, token presence, custom-property value, source inspection, or screenshot alone does not prove rendered token correctness. Browser proof checks the public observable result. Visual specs own pixels, not keyboard or focus-movement success criteria.

## Stage completion

Architecture is ready only when no coding decision remains unresolved.

Implementation is complete only when every accepted pass is implemented, component-owned proof passes, no architecture deviation exists, and migration readiness is explicit.

Consumer migration and final independent review remain separate stages. Green CI alone is not component completion.
