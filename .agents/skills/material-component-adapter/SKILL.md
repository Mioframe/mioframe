---
name: material-component-adapter
description: 'Use for implementing, migrating, or materially changing one official Material component as a demand-driven Material-first Vue MD* API backed privately by @m3e/web.'
---

# Material component adapter

Implement one explicitly selected official Material component end to end through the Material → Vue → m3e boundary.

## Read first

- `src/shared/ui/material/AGENTS.md`;
- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/component-adapter.md`;
- `src/shared/ui/material/docs/component-tokens.md`;
- `src/shared/ui/material/docs/roadmap.md`;
- the selected family README;
- applicable parent `AGENTS.md` files.

When the resolved design creates or changes a separate non-Material component under `src/shared/ui`, also read and apply `.agents/skills/shared-ui-implementation/SKILL.md` before production edits to that component.

A component name is sufficient input. For M1, work on `MDButton` only.

## Core rule

The public `MD*` API is a demand-driven subset of official Material, expressed idiomatically in Vue. It is not derived from the legacy Mioframe API or copied from m3e.

Current consumers determine what is required now. Official Material determines how that requirement is named, modeled, constrained, composed, and expected to behave. m3e determines only how much of the selected Material contract can be delegated to the private renderer.

## 1. Resolve the official Material contract

Inspect the selected component's official overview, specs, guidelines, and accessibility pages for:

- component and family naming;
- variants, configurations, sizes, shapes, content roles, and states;
- option values and defaults;
- valid and invalid combinations;
- interaction and controlled-state behavior;
- native and accessibility semantics;
- relevant tokens, visuals, and motion.

Also follow official cross-component references and search related Material component pages when a current requirement composes another Material primitive. A concept is not `not-material` merely because it is absent from the selected component page. For example, an indicator placed inside a button may be specified by Loading indicator or Progress indicator guidance rather than by the Button page.

Do not copy the entire documentation. Capture enough exact source-backed structure to define the current public API without future naming drift.

## 2. Apply source-evidence discipline

Treat official sources by what they can prove:

- explicit overview/spec/guideline/accessibility prose, normative tables, captions, and diagrams can positively establish a supported concept or combination;
- token tables describe available token routes and values; they are not a complete capability or validity inventory;
- absence from one page, one token family, one screenshot, m3e, legacy code, or current tests is not proof that a Material capability is unsupported;
- prior Mioframe documentation or historical architecture decisions must be corrected when the current official source contradicts them.

Before declaring a combination invalid, a capability non-Material, or m3e more permissive than Material, require one of:

1. an explicit official prohibition;
2. a complete normative configuration matrix that excludes the combination by definition;
3. consistent positive evidence across the relevant official pages that leaves no competing supported interpretation.

A missing token row is never sufficient negative evidence. If overview/guidelines positively show a combination but token coverage appears incomplete, keep the Material capability supported, record a source/token coverage gap, and do not restrict the public API.

If official sources materially conflict and the conflict cannot be resolved from the available captured source, mark `source-conflict`, preserve the already supported observable scenario, and stop only the affected API decision. Do not invent a prohibition or silently choose the narrower interpretation.

## 3. Select the required subset

Inspect current consumers, legacy API, stories, tests, and product scenarios.

For each Material capability classify:

- `implement-now` — needed by a current consumer or necessary for a coherent selected API;
- `defer` — official Material capability not needed now;
- `not-material` — current requirement with no official source after the selected component pages, related component pages, and cross-component guidance have all been checked;
- `source-conflict` — official sources conflict and the selected contract cannot yet be finalized safely.

Legacy source and m3e capabilities are evidence, not public API authority.

Do not expose optional native or renderer surface merely because it makes a theoretically complete API. Native adaptation beyond current demand requires a current consumer, an explicit architecture decision, or a minimal requirement for correct web semantics.

## 4. Create the Material–m3e–Vue matrix

Before production edits, update the family README with:

| Material contract and exact source | Required now and evidence | Public Vue representation | m3e exact-version support | Owner | Decision | Verification |
| ---------------------------------- | ------------------------- | ------------------------- | ------------------------- | ----- | -------- | ------------ |

Cover every public prop, value, default, slot, event, `v-model`, native mapping, selected token, cross-component composition, and materially relevant state included in the target scope.

For negative or restrictive decisions, record the positive official evidence that establishes the restriction. Do not write “not documented” or “no token route” as a prohibition.

Use m3e support statuses:

- `direct`;
- `partial`;
- `missing`;
- `divergent`;
- `not-applicable`.

Use decisions:

- `implement-now`;
- `defer`;
- `wrapper-correction`;
- `m3e-fix`;
- `blocked`;
- `source-conflict`.

No production API mapping may exist without a matrix row.

## 5. Resolve documented compositions and non-Material requirements

An official Material composition remains Material even when it combines multiple component families. Decide whether it belongs as:

- a prop/state on the selected `MD*` adapter;
- a Material content slot;
- composition of two canonical `MD*` components;
- a small Material-owned internal composition using documented m3e family entry points.

Choose the minimum API that expresses the documented composition and current consumer need. Do not create a non-MD wrapper merely because the selected component page does not define a framework prop for the composition.

Only after the cross-component search may a requirement be classified `not-material`. For every true `not-material` requirement record one decision:

- `consumer-composition`;
- `separate-non-md-component`;
- `approved-md-extension`;
- `remove-or-migrate`;
- `unresolved`.

Do not silently preserve a legacy extension in `MD*`. `approved-md-extension` requires an explicit architecture decision. The default for a true non-Material requirement is consumer composition or a separate shared component without the `MD` prefix.

If `separate-non-md-component` is selected, apply `shared-ui-implementation` and complete its preflight, DOM/accessibility, story ownership, consumer blast-radius, and verification rules. The Material skill does not waive those rules.

If a current consumer depends on an unresolved requirement, stop only that API finalization and report the exact decision required. Continue all unrelated repository-local analysis and corrections that remain valid.

## 6. Inspect the exact m3e contract

Inspect the exact lockfile-resolved stable family entry points needed by the selected Material contract and documented compositions:

- package range and resolved version;
- exports and family registration entries;
- element classes and value types;
- declarations, tag map, manifest, documented properties, attributes, events, slots, native behavior, accessibility, and CSS inputs;
- implementation source only where renderer-owned behavior such as geometry, accessibility, or motion must be assessed.

Do not use another version, prerelease behavior, private shadow DOM, copied internals, or undocumented APIs.

## 7. Assign implementation ownership

Use m3e maximally for every selected Material capability it supports directly.

### Vue adapter ownership

- Material-to-Vue names and values;
- typed property and attribute mapping;
- slots and event normalization;
- controlled-state synchronization;
- currently required native form, link, keyboard, and focus integration;
- narrow light-DOM and cross-component composition;
- selected public Material token mapping.

### m3e ownership

- renderer geometry and internal layout;
- private DOM;
- state layer, ripple, focus treatment, elevation, and motion;
- private accessibility behavior;
- renderer-owned Material states and visual transitions.

Use `wrapper-correction` only when the missing selected Material behavior can be added through documented m3e APIs or Mioframe-owned light DOM without recreating renderer internals.

Use `m3e-fix` when the gap belongs inside the renderer. Do not build a parallel renderer in Vue.

Use `blocked` only when the selected Material capability cannot be delivered safely by either owner. Deferred capabilities and source-coverage gaps are never blockers.

## 8. Define the public Vue API

- Use official Material terminology and semantics.
- Use Vue props, slots, emits, `v-model`, refs, and native mappings idiomatically.
- Keep public types authored from the selected Material contract.
- Keep defaults and invalid combinations aligned with positive Material evidence.
- Do not expose raw m3e vocabulary or types.
- Do not retain legacy names that conflict with Material.
- Do not add true non-Material options without the resolved extension decision.
- A Vue convenience prop may represent a documented Material composition only when its meaning, states, owner, and rendering rules are recorded in the matrix.
- Do not add unused link/form/native fields for hypothetical completeness.

## 9. Implement the adapter

- Import only the required m3e family entry points.
- Derive private renderer types from package exports.
- Require mapper outputs to satisfy exact m3e types.
- Keep Vue ambient declarations to package-derived framework glue.
- Implement only matrix-approved public API and corrections.
- Keep m3e implementation details private.
- Preserve normal native event propagation unless an accepted contract explicitly requires interception.
- Put `aria-*`, native state, focus, and interaction semantics on the actual interactive owner.
- Avoid an extra wrapper when the canonical component root can own the required semantics and layout.
- Prefer inherited public presentation such as `currentColor` over duplicating renderer color/state matrices in a wrapper.

Do not add Lit directly, access private shadow DOM, copy internals, duplicate renderer interaction systems, or create a generic adapter framework.

## 10. Tokens and composed presentation

- Public token names and semantics must follow verified official Material paths.
- Expose only the selected token subset required now.
- Map selected Material tokens to documented semantic m3e inputs.
- Do not mirror all m3e variables.
- For composed indicators or icons, follow official contrast and placement guidance and inherit the rendered label/icon color where Material specifies that relationship.
- Non-Material styling hooks require the same extension decision as non-Material props.

## 11. Migrate consumers

Migrate consumers to the selected Material Vue API, not merely to a new import path.

- Rename or normalize legacy props and values that conflict with Material.
- Move true non-Material behavior to its decided owner.
- Keep documented Material compositions in the Material boundary unless a separate architecture decision chooses otherwise.
- Remove obsolete target ownership only after every current scenario has a valid destination.
- Leave unrelated components unchanged.

## 12. Verify

Required baseline:

- package-derived type-check;
- component-contract tests for Material public names, values, defaults, positively evidenced valid/invalid combinations, slots, events, controlled state, native bubbling, ARIA owner, and wrapper-owned behavior;
- focused browser tests for current user/native scenarios affected by the adapter;
- meaningful visual baselines for selected stable Material states and documented compositions;
- focused consumer checks for disabled/loading, selected, form, and other combinations used in production;
- final `pnpm verify`.

When a separate non-MD component is created, give it its own colocated stories, tests, and public documentation. Do not document it as part of the `MD*` family.

Do not duplicate m3e or Lit tests. Direct delegation does not require one test per renderer capability.

### Renderer-owned animation

- Inspect exact installed source and record relevant state, interruption, and reduced-motion paths.
- Confirm the adapter does not disable, replace, or duplicate it.
- Require operator manual testing for visual quality and timing.
- Do not use `:active`, screenshots, or private DOM tests as proof of internal animation.

## 13. Completion

A target may be `migrated` when:

- the Material–m3e–Vue matrix is accepted;
- public API is a selected official Material subset expressed in Vue;
- every public capability has an official Material source, documented cross-component source, or explicitly approved extension;
- negative and restrictive decisions pass the source-evidence gate;
- selected gaps are implemented by the correct owner;
- deferred Material surface, source gaps, and m3e divergences are recorded;
- consumers use the canonical API and obsolete ownership is removed;
- relevant verification passes;
- operator accepts final visual and motion behavior.

Complete all repository-local work inside the resolved scope. `partial` is valid only for an explicit architecture decision, unresolved official source conflict, required m3e change, operator acceptance, or genuine external blocker.

## Report

```text
MATERIAL ADAPTER RESULT
Material component:
Migration target:
Material sources, including related component sources:
Selected Material surface:
Documented cross-component compositions:
Deferred Material surface:
True non-Material requirements and decisions:
Source conflicts or coverage gaps:
Public Vue API:
Renderer package, resolved version, entry points, and type sources:
Material–m3e–Vue matrix status:
m3e direct coverage:
Wrapper corrections:
m3e fixes required:
Confirmed divergences:
Consumers migrated:
Automated verification:
Operator visual and motion acceptance: accepted | required | blocked
Implementation ownership: legacy | migrating | migrated
Status: complete | partial (<exact decision/source/external remainder>) | blocked (<exact selected Material capability>)
```
