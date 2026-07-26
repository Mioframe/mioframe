# Material component adapter contract

This document defines the minimum accepted contract for a Mioframe Vue Material component backed privately by m3e.

## Unit of work

The target is one explicitly named official Material component.

```text
current product requirement
  → selected official Material contract
  → public Vue API
  → exact-version m3e mapping
  → wrapper or m3e gap implementation
  → consumer migration and verification
```

Do not start from the legacy API or the m3e API and infer the public `MD*` contract from them.

## Material-first scope

1. Inspect the official Material component model: names, variants, configurations, values, defaults, states, valid combinations, behavior, visuals, tokens, and accessibility.
2. Select only the subset required by current Mioframe consumers plus the minimum adjacent surface needed to keep the API coherent and forward-compatible.
3. Mark all other official Material capabilities `deferred`.
4. Classify every current requirement with no Material source as `not-material` and resolve it separately before finalizing the `MD*` API.

A partial implementation is acceptable. A non-Material or renderer-shaped public API is not.

## Required family artifact

Before production edits, update:

```text
src/shared/ui/material/components/<family>/README.md
```

It must contain a Material–m3e–Vue matrix:

| Material contract and source | Required now and evidence | Public Vue representation | m3e exact-version support | Owner | Decision | Verification |
| ---------------------------- | ------------------------- | ------------------------- | ------------------------- | ----- | -------- | ------------ |

Each relevant row must identify:

- the exact Material concept and source;
- whether it is required now, deferred, or not Material;
- the consumer or architecture evidence for current need;
- the public Vue prop, value, slot, emit, `v-model`, ref, native mapping, or token;
- exact m3e property, event, slot, CSS input, or missing capability;
- implementation owner;
- implementation or deferral decision;
- required proof.

The artifact must also include:

- exact m3e package range, resolved version, family entry point, and exported type sources;
- a compact public Vue API summary;
- deferred Material surface;
- Material/m3e divergences;
- non-Material requirement decisions;
- operator visual and motion review status.

Do not reproduce the complete Material documentation. Group rows where the mapping and ownership are genuinely identical.

## Public Vue API

The API must use official Material terminology and semantics while following Vue mechanics.

Allowed Vue adaptation:

- props for Material options and controlled state;
- slots for Material content roles;
- emits or `v-model` for Material interaction intent;
- refs and focus methods;
- native HTML properties required to represent the Material web component correctly.

Forbidden by default:

- raw m3e property, event, or slot names exposed only because they exist;
- legacy Mioframe names that conflict with Material terminology;
- public options or states with no Material source;
- silently retained project extensions.

Public types are authored from the selected Material contract. Private mapping results must satisfy package-exported m3e types.

## m3e coverage statuses

Use one status per matrix row:

- `direct` — documented m3e public API implements the selected Material capability;
- `partial` — m3e provides a usable base but does not complete the selected contract;
- `missing` — no documented m3e implementation exists;
- `divergent` — the documented or inspected result differs observably from Material;
- `not-applicable` — the capability belongs entirely to Vue/native integration.

Use m3e maximally for every `direct` part. Do not reimplement it in Vue.

## Gap ownership

### Wrapper correction

Use the Vue adapter for:

- Material-to-Vue naming and value normalization;
- explicit property, attribute, slot, and event mapping;
- controlled-state synchronization;
- native form, link, keyboard, and focus integration;
- narrow Mioframe-owned light DOM;
- composition that does not reconstruct private renderer systems.

### m3e fix

Assign the gap to m3e when it concerns:

- renderer geometry or internal layout;
- private DOM;
- state layer, ripple, focus treatment, elevation, or motion;
- private accessibility behavior;
- a renderer-owned Material state or visual transition.

Do not work around an m3e-owned gap by copying internals or building a second renderer in the wrapper.

### Blocker

Use `blocked` only when a selected Material requirement cannot be delivered safely by either owner. A missing deferred capability is not a blocker.

## Non-Material requirements

For every current requirement without an official Material contract, record one explicit decision:

- `consumer-composition`;
- `separate-non-md-component`;
- `approved-md-extension`;
- `remove-or-migrate`;
- `unresolved`.

`approved-md-extension` requires an architecture decision and must remain clearly documented as non-standard. The default is composition or a separate component without the `MD` prefix.

Do not complete migration while a current non-Material requirement is silently embedded in the `MD*` API.

## Renderer type boundary

- Import exact family element classes and value aliases with type-only imports.
- Derive Vue custom-element glue from exported package types or `HTMLElementTagNameMap`.
- Keep public Material Vue types independent.
- Require every mapper output to satisfy the exact m3e type.
- Do not publish m3e types or hand-copy renderer interfaces and literal unions.

## Tokens

Public component tokens are also selected Material API.

- Use verified official Material token paths and names.
- Expose only the subset required now.
- Map selected tokens to documented semantic m3e inputs.
- Do not create a public alias for every m3e variable.
- Non-Material styling extensions require the same explicit decision as non-Material props.

## Consumer migration

Migrate consumers to the selected Material Vue API, not merely to the new import path.

- Update legacy prop names and values where they conflict with Material.
- Move non-Material behavior to the decided owner.
- Remove the obsolete target owner only after all current scenarios have a valid new path.
- Leave unrelated components intact.

## Verification

Verification is selected-contract based:

- package-derived type-check for Vue-to-m3e mappings;
- component-contract tests for public Material names, values, defaults, invalid combinations, slots, events, controlled state, and wrapper-owned behavior;
- browser tests for current user/native scenarios affected by the migration;
- stable visual baselines for selected Material states with meaningful regression risk;
- final `pnpm verify`.

Do not duplicate m3e or Lit tests. Direct m3e delegation does not require one test per renderer field.

## Renderer-owned motion

- Inspect the exact installed source and record relevant state, interruption, and reduced-motion paths.
- Confirm the wrapper does not disable, replace, or duplicate the implementation.
- Use operator manual testing for visual quality and timing.
- Do not use `:active`, screenshots, or private DOM inspection as proof of internal animation.

## Completion gate

A target completes when:

- the Material–m3e–Vue matrix is accepted;
- the public API is a selected subset of official Material, expressed idiomatically in Vue;
- every public capability has a Material source or an explicitly approved extension decision;
- selected gaps are assigned to and completed by the correct owner;
- deferred Material surface and m3e divergences are recorded;
- consumers use the canonical API and obsolete ownership is removed;
- relevant verification passes;
- operator accepts the final visual and motion behavior.

Do not keep a target `migrating` because deferred Material surface is not implemented. Do not mark it complete while a non-Material extension decision remains unresolved.
