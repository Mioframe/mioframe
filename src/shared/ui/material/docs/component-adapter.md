# Material component adapter contract

This document defines the minimum accepted result for a Mioframe Vue Material component backed privately by m3e.

## Unit of work

The target is one explicitly named official Material component plus directly required official Material dependency adapters needed by the selected current scenarios.

```text
current product scenario
  → selected official Material contracts
  → independently owned dependency MD* adapters
  → parent Vue API, tokens, and composition
  → private installed-version m3e mappings
  → consumer migration and proof
```

Do not derive public API from legacy Mioframe or m3e vocabulary.

## Required family matrix

Before production edits, the parent and every required dependency README contain:

| Material contract | Demand and evidence | Public Vue representation | Renderer status and mapping | Owner and decision | Verification |
| ----------------- | ------------------- | ------------------------- | --------------------------- | ------------------ | ------------ |

The family-level `Official sources` section records the exact official pages used for the component. A matrix row must include an exact source reference when it records a restrictive or disputed conclusion, including `defer`, `source-conflict`, `divergent`, a temporary renderer workaround, or another negative decision whose evidence is not obvious from the family-level source list.

`Demand and evidence` identifies the current consumer, scenario, dependency, accessibility requirement, or other concrete reason for selecting or deferring the contract. Do not use a bare `yes` or `no` when the reason materially affects implementation.

`Renderer status and mapping` begins with exactly one status:

- `direct` — documented renderer API implements the selected contract;
- `partial` — renderer supplies a base completed by another correct owner;
- `missing` — no documented renderer implementation exists;
- `divergent` — documented or consumed behavior is incorrect;
- `not-applicable` — no renderer mapping is required.

`Owner and decision` records the semantic owner and one decision:

- `implement-now`;
- `defer`;
- `wrapper-correction`;
- `temporary-renderer-workaround`;
- `m3e-fix`;
- `blocked`;
- `source-conflict`.

The matrix covers every selected public prop, value, default, slot, emit, controlled state, native mapping, accessibility behavior, token, relevant state combination, dependency, renderer gap, and proof claim. No production mapping, supported token, composition, or completion claim exists without a matrix row.

For a contextual token scenario, the README also contains a state/part trace:

| State | Rendered part | Official Material token path | Public Mioframe token | Renderer input and fallback | Current consumer result | Proof |
| ----- | ------------- | ---------------------------- | ---------------------- | --------------------------- | ----------------------- | ----- |

The trace includes resting and every selected transient or disabled state whose renderer value can differ. It must not infer public names from renderer inputs or assume a resting token remains effective in another state.

## Public Vue API

The public API uses official Material terminology and Vue mechanics.

Allowed:

- props for selected Material options and states;
- slots for Material content roles;
- emits or `v-model` for controlled intent;
- refs and required native mappings;
- explicit composition of independently owned Material dependencies.

Forbidden by default:

- renderer vocabulary exposed because m3e supports it;
- conflicting legacy naming;
- unused native/link/form/token surface for hypothetical completeness;
- public dependency on renderer classes, events, tags, or CSS inputs.

If public states may coexist, define and verify precedence and restoration.

Visual loading/busy presentation and activation blocking are independent public contracts. A loading state must not imply disabled state, click suppression, or event interception unless the selected family matrix explicitly assigns that responsibility. Otherwise activation blocking remains with `disabled` and the consumer that owns the operation.

## Dependency contract

An official Material dependency remains independently owned even when used only inside a parent.

Required sequence:

1. identify it in the parent matrix;
2. complete its canonical demand-scoped `MD*` adapter;
3. provide its own public API, root export, package-derived typing, accessibility, geometry/presentation boundary, tokens, defect records, tests, stories, and visual proof;
4. compose it through the public Vue API;
5. prove the dependency independently and the parent handoff separately.

The parent owns composition meaning, placement, and state handoff. It must not render the dependency’s raw m3e element, set dependency-private variables, or own dependency accessibility, geometry, defects, or motion.

## Token contract

Follow `component-tokens.md` and `token-api.md`.

| Token layer                                             | Owner                            |
| ------------------------------------------------------- | -------------------------------- |
| supported reference/system foundations                  | `foundation/tokens.css`          |
| default palette and light/dark system-color assignments | `foundation/theme.css`           |
| selected component tokens and private mappings          | `components/<family>/tokens.css` |
| application extensions                                  | outside `src/shared/ui/material` |

Every supported public token has one semantic owner and one catalogue entry. Official but unsupported tokens remain `deferred` in the family matrix. Private renderer and owner-local variables do not appear in public API.

A public component token name is derived only from its exact official Material path. For every contextual token, record and verify:

```text
exact official path
  → public Mioframe token
  → direct renderer input
  → renderer fallback
  → rendered current-consumer result
```

The selected subset must be complete for the current rendered parts and states, but must not include unconsumed parts merely for symmetry. A resting token does not prove hover, focus, press, selected, or disabled behavior when the renderer selects separate state inputs.

Verify CSS value grammar against every selected consumer. A visible grammar or mapping change requires browser proof. Do not recreate a mixed-owner legacy file, global component-token owner, TypeScript token registry, token DSL, or complete renderer-token mirror.

## Ownership of gaps

### Foundation

Owns supported reference/system token declarations, standard theme roles, shared CSS grammar, and foundation catalogue entries.

### Parent adapter

Owns Material-to-Vue naming, composition state and placement, controlled parent state, slots/events, native integration, and public dependency handoff.

### Canonical owning adapter

Owns renderer import and typed mapping, public semantics/accessibility, family tokens, static host-level geometry normalization, wrapper-owned corrections, defects, tests, stories, visual proof, and root export.

### m3e

Owns private DOM, internal rendering/layout, private defaults, transient interaction geometry, state layer, ripple, focus, elevation, motion, and private accessibility implementation.

## Exact-version renderer workaround

Documented renderer APIs remain preferred. A `temporary-renderer-workaround` is accepted only when all conditions hold:

1. a selected current Material scenario requires the behavior;
2. documented or consumed m3e behavior is confirmed incorrect;
3. the installed lockfile-resolved artifact confirms an effective host-level property, attribute, CSS custom property, or host dimension;
4. the workaround exists only in the canonical owning adapter;
5. it does not access private DOM/methods or recreate renderer interaction, accessibility, geometry engine, state, or motion;
6. it does not leak to public API, parents, consumers, or token catalogue;
7. the family matrix records `divergent`, `temporary-renderer-workaround`, exact version, risk, future owner `m3e-fix`, removal trigger, and stable `M3E-*` ID;
8. `m3e-defects.md` records evidence, lifecycle status, mitigation, correct upstream result, and history;
9. focused proof covers the required observable result;
10. every consumed m3e update revalidates or removes it.

Host pseudo-class overrides of renderer-owned transient interaction state, timing, or geometry do not pass this gate. Do not use `:active`, `:not(:active)`, `:hover`, `:focus-visible`, or renderer CSS-input switching around those pseudo-classes to compensate for renderer behavior. Classify the behavior as `divergent` and route it to `m3e-fix` or `blocked` instead of creating a parallel wrapper state path.

A workaround satisfying this gate is tracked technical debt, not an automatic blocker.

## Renderer typing

- Import exact exported element classes and value aliases through the family entry point.
- Derive Vue custom-element glue from the exported element class or `HTMLElementTagNameMap`.
- Handwritten `new () => HTMLElement` glue is not package-derived.
- Keep public Material types independent while constraining private mapping with exact renderer types.
- Renderer drift must fail type-check.

## Accessibility and native behavior

- Put ARIA, native state, focus, and interaction semantics on the actual owner.
- Preserve normal native event propagation unless the accepted contract requires interception.
- Attribute assertions alone do not prove custom-element accessibility.
- Browser proof resolves required roles and accessible names from rendered semantics.
- For a progress component inside an interactive component, verify both semantic owners or record an explicit accepted alternative.

## Verification contract

For each parent and dependency adapter, require the proof selected by its matrix and repository testing policy:

- package-derived type-check;
- colocated Vue contract tests;
- browser native/accessibility behavior;
- observable browser or visual proof for selected renderer-owned appearance;
- meaningful independent stories;
- executable visual-regression baselines where stable presentation is owned;
- token declaration/catalogue/mapping/grammar agreement;
- exact official-token/public-token/renderer-input/fallback trace for contextual tokens;
- computed rendered-part result for each selected state;
- exact-version divergence and reduced-motion assessment;
- complete defect records for confirmed divergences;
- parent/dependency state, label, accessibility, size, color/token, disabled, slot, restoration, and event-bubbling handoff.

A Storybook story, host state, event receipt, token presence, custom-property value, or source inspection does not prove rendered appearance. Browser proof must check the rendered public result. A parent screenshot does not replace dependency-owned visual proof. Visual specs may prepare deterministic interaction states and capture pixels, but behavioral success criteria such as focus movement remain in behavior tests. Do not inspect private renderer DOM in tests.

The top-level task runs one final read-only verification using the exact branch/task scope required by root `AGENTS.md`. Material documents must not replace that policy with plain unscoped `pnpm verify`.

## Completion gate

A target completes only when:

- its matrix is accepted and its selected official public API is implemented;
- all selected state combinations and dependency handoffs are resolved;
- every contextual token has a complete official-path/input/fallback/result trace;
- every required dependency has a canonical adapter and root export;
- renderer glue is package-derived;
- required browser accessibility and visual evidence exists;
- supported public tokens have canonical owners and catalogue entries;
- no duplicate or legacy owner remains in target scope;
- gaps, divergences, and workarounds have correct owners, evidence, risk, and removal triggers;
- consumers use canonical APIs and obsolete target ownership is removed;
- current-head task-scope verification passes;
- no unresolved operator-reported visual or motion issue remains.

Family README statements must map to exact code and proof. `roadmap.md` alone owns current milestone status and next action. Green CI alone is not architecture approval.