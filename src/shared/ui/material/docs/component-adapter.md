# Material component adapter contract

This document defines the minimum accepted contract for a Mioframe Vue Material component backed privately by m3e.

## Unit of work

The target is one explicitly named official Material component and any official Material composition required to deliver its selected consumer scenarios.

```text
current product requirement
  → selected official Material and related-component contract
  → public Vue API
  → exact-version m3e mapping
  → wrapper or m3e gap implementation
  → consumer migration and verification
```

Do not start from the legacy API or the m3e API and infer the public `MD*` contract from them.

## Material-first scope

1. Inspect the official component overview, specs, guidelines, and accessibility pages.
2. Follow official references and search related component pages for documented cross-component composition.
3. Select only the subset required by current Mioframe consumers plus the minimum adjacent surface needed to keep the API coherent and forward-compatible.
4. Mark all other official Material capabilities `deferred`.
5. Classify a current requirement `not-material` only after no official selected-component or related-component source can be found.

A partial implementation is acceptable. A non-Material or renderer-shaped public API is not.

## Source evidence and negative claims

Official sources do not all prove the same thing:

- overview, specs, guidelines, accessibility prose, normative tables, captions, and diagrams may positively establish concepts and supported combinations;
- token tables establish token names, paths, and values, but are not a complete component capability matrix;
- absence from one page, one token family, m3e, legacy code, or tests is not evidence of prohibition.

Before recording a capability as unsupported, a combination as invalid, or a requirement as non-Material, require one of:

1. an explicit official prohibition;
2. a complete normative configuration matrix that excludes it by definition;
3. consistent unambiguous evidence across every relevant official page.

A missing token row is never sufficient negative evidence. When overview or guidelines positively show a capability while token coverage appears incomplete, retain the capability and record a source/token coverage gap.

If official sources conflict, record `source-conflict`, preserve the already supported observable scenario, and do not finalize the affected API until the conflict is resolved. Do not invent the narrower rule.

## Documented cross-component composition

Material guidance owned by another component page still belongs to the Material contract. Examples include a Loading indicator or circular Progress indicator placed inside a Button.

A documented composition may be represented as:

- a prop or state on the selected `MD*` component;
- a Material content slot;
- composition of canonical `MD*` components;
- narrow Material-owned internal composition using documented m3e family entry points.

Choose the smallest API that expresses the documented behavior and current need. Do not create a non-MD component only because the selected component page does not define a framework-specific prop.

## Required family artifact

Before production edits, update:

```text
src/shared/ui/material/components/<family>/README.md
```

It must contain a Material–m3e–Vue matrix:

| Material contract and exact source | Required now and evidence | Public Vue representation | m3e exact-version support | Owner | Decision | Verification |
| ---------------------------------- | ------------------------- | ------------------------- | ------------------------- | ----- | -------- | ------------ |

Each relevant row must identify:

- the exact Material concept and source;
- whether it is required now, deferred, not Material, or source-conflicted;
- the consumer or architecture evidence for current need;
- the public Vue prop, value, slot, emit, `v-model`, ref, native mapping, token, or composition;
- exact m3e property, event, slot, CSS input, family entry point, or missing capability;
- implementation owner;
- implementation, deferral, source-conflict, or blocker decision;
- required proof.

For every negative or restrictive decision, include the positive official evidence that establishes the restriction. “Not documented” and “no token route” are not sufficient.

The artifact must also include:

- exact m3e package range, resolved version, required family entry points, and exported type sources;
- a compact public Vue API summary;
- documented cross-component compositions;
- deferred Material surface;
- Material/m3e divergences and source gaps;
- true non-Material requirement decisions;
- operator visual and motion review status.

Do not reproduce the complete Material documentation. Group rows where the mapping and ownership are genuinely identical.

## Public Vue API

The API must use official Material terminology and semantics while following Vue mechanics.

Allowed Vue adaptation:

- props for Material options, states, and documented compositions;
- slots for Material content roles;
- emits or `v-model` for Material interaction intent;
- refs and focus methods;
- native HTML properties currently required to represent the Material web behavior correctly.

Forbidden by default:

- raw m3e property, event, or slot names exposed only because they exist;
- legacy Mioframe names that conflict with Material terminology;
- public options or states with no selected-component, related-component, or approved extension source;
- optional native/link/form fields added for hypothetical completeness;
- silently retained project extensions.

A convenience prop may model an official Material composition when its meaning, states, owner, and rendering rules are explicit in the matrix.

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
- currently required native form, link, keyboard, and focus integration;
- narrow Mioframe-owned light DOM;
- documented cross-component composition that does not reconstruct private renderer systems.

Preserve normal native event propagation unless an accepted contract requires interception. Put ARIA, native state, focus, and interaction semantics on the actual interactive owner. Avoid an extra wrapper when the canonical root can own the required behavior. Prefer inherited `currentColor` or another public presentation path over duplicating renderer variant/state color rules.

### m3e fix

Assign the gap to m3e when it concerns:

- renderer geometry or internal layout;
- private DOM;
- state layer, ripple, focus treatment, elevation, or motion;
- private accessibility behavior;
- a renderer-owned Material state or visual transition.

Do not work around an m3e-owned gap by copying internals or building a second renderer in the wrapper.

### Blocker

Use `blocked` only when a selected Material requirement cannot be delivered safely by either owner. A deferred capability, source/token coverage gap, or unresolved optional surface is not a blocker.

## True non-Material requirements

Only after the cross-component source search may a requirement be classified non-Material.

For every true non-Material requirement, record one explicit decision:

- `consumer-composition`;
- `separate-non-md-component`;
- `approved-md-extension`;
- `remove-or-migrate`;
- `unresolved`.

`approved-md-extension` requires an architecture decision and must remain clearly documented as non-standard. The default is composition or a separate component without the `MD` prefix.

When `separate-non-md-component` is selected, apply `.agents/skills/shared-ui-implementation/SKILL.md`. The component requires its own preflight, meaningful root, actual ARIA/native owner, presentation ownership, colocated stories outside the Material family, consumer review, and verification.

Do not complete migration while a current true non-Material requirement is silently embedded in the `MD*` API.

## Renderer type boundary

- Import exact family element classes and value aliases with type-only imports.
- Derive Vue custom-element glue from exported package types or `HTMLElementTagNameMap`.
- Keep public Material Vue types independent.
- Require every mapper output to satisfy the exact m3e type.
- Do not publish m3e types or hand-copy renderer interfaces and literal unions.

## Tokens and composed presentation

Public component tokens are selected Material API.

- Use verified official Material token paths and names.
- Expose only the subset required now.
- Map selected tokens to documented semantic m3e inputs.
- Do not create a public alias for every m3e variable.
- Follow official placement and contrast rules for composed indicators; inherit the rendered label/icon color when Material specifies that relationship.
- Non-Material styling extensions require the same explicit decision as non-Material props.

## Consumer migration

Migrate consumers to the selected Material Vue API, not merely to the new import path.

- Update legacy prop names and values where they conflict with Material.
- Keep documented Material compositions in the Material owner unless a separate architecture decision says otherwise.
- Move true non-Material behavior to the decided owner.
- Remove the obsolete target owner only after all current scenarios have a valid new path.
- Leave unrelated components intact.

## Verification

Verification is selected-contract based:

- package-derived type-check for Vue-to-m3e mappings;
- component-contract tests for public Material names, values, defaults, positively evidenced valid/invalid combinations, slots, events, controlled state, native bubbling, ARIA owner, and wrapper-owned behavior;
- browser tests for current user/native scenarios affected by the migration;
- stable visual baselines for selected Material states and documented compositions with meaningful regression risk;
- focused consumer checks for production-used combinations such as disabled plus loading;
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
- every public capability has a selected-component source, related-component composition source, or explicitly approved extension decision;
- every negative and restrictive decision passes the source-evidence gate;
- selected gaps are assigned to and completed by the correct owner;
- deferred Material surface, source gaps, and m3e divergences are recorded;
- consumers use the canonical API and obsolete ownership is removed;
- relevant verification passes;
- operator accepts the final visual and motion behavior.

Do not keep a target `migrating` because deferred Material surface is not implemented. Do not mark it complete while a true non-Material extension or source conflict remains unresolved.
