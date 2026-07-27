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
- `src/shared/ui/material/docs/token-api.md`;
- `src/shared/ui/material/docs/m3e-defects.md`;
- `src/shared/ui/material/docs/roadmap.md`;
- the selected family README;
- applicable parent `AGENTS.md` files.

If the resolved design creates or changes a separate non-Material component, also apply `.agents/skills/shared-ui-implementation/SKILL.md`.

A component name is sufficient input. Resolve the required current subset, dependencies, API, token ownership, and proof from official sources and the repository.

## Core rule

The public `MD*` API is a demand-driven subset of official Material expressed idiomatically in Vue. It is not copied from legacy Mioframe or m3e.

Every official Material component has one canonical Vue owner. If the selected component needs another official Material component, implement or complete that dependency as its own canonical `MD*` adapter before composing it.

## 1. Resolve the official Material contract

Inspect overview, specs, guidelines, and accessibility pages for:

- names, variants, configurations, sizes, shapes, content roles, and states;
- defaults and valid or invalid combinations;
- behavior, controlled state, native semantics, and accessibility;
- tokens, visuals, geometry, and motion;
- cross-component placement and composition.

Follow related-component references. Do not classify a requirement `not-material` merely because it is absent from the selected component page.

## 2. Apply evidence discipline

- Official prose, normative tables, captions, and diagrams may establish supported concepts and combinations.
- Token tables establish token paths and values, not the complete capability matrix.
- Absence from one page, token family, m3e, legacy code, or tests is not proof of prohibition.
- Negative and restrictive decisions require positive official evidence.
- If official sources conflict, record `source-conflict`; do not invent a narrower rule.
- Do not equate a parent component token with a dependency component contract unless an official source establishes that equivalence.

## 3. Select the required subset

Inspect current consumers, product scenarios, legacy API, tokens, tests, and stories.

Classify each Material capability:

- `implement-now`;
- `defer`;
- `not-material`;
- `source-conflict`.

Implement only current demand plus the minimum adjacent surface required for a coherent API. Do not expose optional renderer, native, or token surface for hypothetical completeness.

If the public API permits states simultaneously, treat the combination as valid until positive Material evidence and an explicit public/runtime contract establish otherwise.

## 4. Create the Material–m3e–Vue matrices

Before production edits, update the selected family README and every required dependency family README.

| Material contract and exact source | Required now and evidence | Public Vue representation | m3e exact-version support | Owner | Decision | Verification |
| --- | --- | --- | --- | --- | --- | --- |

Cover every selected public prop, value, default, slot, emit, controlled state, native mapping, token, relevant combination, cross-component composition, dependency, divergence, and proof.

Renderer statuses:

- `direct`;
- `partial`;
- `missing`;
- `divergent`;
- `not-applicable`.

Implementation decisions:

- `implement-now`;
- `defer`;
- `wrapper-correction`;
- `temporary-renderer-workaround`;
- `m3e-fix`;
- `blocked`;
- `source-conflict`.

For each dependency row record its canonical adapter, root export, status, public API used by the parent, state/slot/token/accessibility handoff, and exact proof required before the parent may complete.

For every confirmed incorrect m3e implementation or documentation mismatch, the matrix row must use `divergent` and reference the applicable stable `M3E-*` ID from `docs/m3e-defects.md`.

No production mapping, token exposure, or composition may exist without a matrix row.

## 5. Resolve official dependencies

For every composed official Material participant:

1. resolve its official contract separately;
2. implement or complete its demand-scoped canonical `MD*` adapter;
3. give it its own public API, root export, package-derived renderer glue, accessibility contract, token/presentation boundary, divergence record, tests, stories, visual proof, and operator review where applicable;
4. compose it from the parent through its public Vue boundary;
5. verify the dependency independently and the parent handoff separately.

A parent may directly use raw m3e only for its own renderer family or non-catalog renderer-internal primitives. A parent must not render a dependency's raw `m3e-*`, set dependency-private `--m3e-*`, or type against dependency renderer classes.

## 6. Inspect the exact m3e contract

For each owning adapter inspect the exact lockfile-resolved stable entry point:

- package range and resolved version;
- exports, registration entry, element class, aliases, and tag map;
- documented properties, attributes, events, slots, native behavior, accessibility, and CSS inputs;
- the installed package artifact actually consumed by the build, including relevant exported JavaScript and CSS where geometry, accessibility, motion, token grammar, or a confirmed divergence must be assessed.

The installed artifact and observable browser behavior are the runtime source of truth. Upstream repository source, tags, demos, changelogs, and unreleased fixes are supporting evidence only.

Do not use prerelease behavior, another version, private shadow DOM, copied internals, or private methods.

```text
Material capability absent from m3e
  → matrix `missing`

m3e public contract or implementation observably incorrect
  → matrix `divergent` + stable `M3E-*`
  → complete or update `docs/m3e-defects.md`
```

Do not create an `M3E-*` entry for deferred optional surface, Material `source-conflict`, Mioframe-specific behavior, equivalent internal implementation, or an unverified suspicion.

For each confirmed defect, assign the next stable ID or reuse the existing entry, then record affected and last-revalidated versions, upstream and Mioframe statuses, installed-artifact and browser evidence, affected family matrices, current mitigation or blocker, correct upstream result, removal trigger, and revalidation history.

## 7. Assign ownership

### Material foundation

Owns supported `--md-ref-*` and `--md-sys-*` declarations, standard theme roles, CSS value grammar, and foundation entries in `token-api.md`.

### Component family

Owns its selected official `--md-comp-<family>-*` declarations, family-local defaults, private m3e mappings, family matrix rows, and catalogue entries.

### Parent Vue adapter

Owns Material-to-Vue naming, composition state and placement, controlled parent state, slots/events, current native integration, and typed handoff to dependency public APIs.

### Canonical owning `MD*` adapter

Owns its renderer import and mapping, public accessibility and semantics, package-derived glue, presentation boundary, geometry normalization, wrapper-owned behavior, divergences, tests, stories, visual proof, and root export.

### m3e

Owns private DOM, internal renderer layout, private defaults, state layer, ripple, focus treatment, elevation, motion, private accessibility implementation, and renderer-owned visual transitions.

## 8. Resolve token ownership

Follow `docs/component-tokens.md`.

Canonical runtime owners:

```text
src/shared/ui/material/foundation/tokens.css
src/shared/ui/material/foundation/theme.css
src/shared/ui/material/components/<family>/tokens.css
```

Rules:

- `--md-ref-*` and `--md-sys-*` belong to Material foundation/theme;
- selected `--md-comp-*` belongs to the corresponding family;
- `--app-*` belongs outside the Material library;
- `--m3e-*` and `--md-private-*` remain private;
- every supported public token is listed in `docs/token-api.md`;
- official but unsupported tokens remain `deferred` in the family matrix;
- do not mirror the complete Material component-token catalogue or m3e defaults;
- verify CSS value grammar against every selected current consumer;
- prefer one canonical foundation representation only when it preserves Material semantics and works for all selected consumers.

If the task touches `src/shared/lib/md/tokens.css`, treat it as the legacy mixed-owner source. Inventory and split retained declarations, update the single global import, populate `token-api.md`, remove the legacy file, and leave no compatibility alias or duplicate public owner. Do not add new public tokens there.

Do not create a TypeScript token registry, generic token DSL, or global component-token file.

## 9. Controlled exact-version renderer workaround

Prefer documented m3e APIs and Mioframe-owned light DOM.

A temporary exact-version renderer workaround is allowed only when all conditions hold:

1. a selected current Material scenario requires the behavior;
2. documented m3e API is missing, broken, or observably divergent;
3. the installed lockfile-resolved implementation confirms an effective host-level property, attribute, CSS custom property, or host dimension;
4. the workaround is implemented only inside the canonical owning `MD*` adapter;
5. it does not access private DOM/methods, copy internals, recreate interaction/accessibility/state/motion systems, or build a parallel renderer;
6. it is absent from public Vue API, parents, consumers, and the public token catalogue;
7. the matrix records `divergent`, `temporary-renderer-workaround`, future owner `m3e-fix`, exact version, risk, removal trigger, and applicable stable `M3E-*` ID;
8. the linked `m3e-defects.md` record contains current statuses, exact evidence, mitigation, correct upstream result, and revalidation history;
9. focused tests prove the required observable result;
10. every m3e update revalidates all non-resolved entries against the newly consumed package and owned proof.

A gated workaround is technical debt but not a blocker. An undocumented renderer input without this complete record is not accepted.

An upstream fix remains `awaiting-upgrade` until Mioframe consumes the fixed version, removes the workaround or blocked path, and passes owned verification. Upstream source or changelog evidence alone must not advance the Mioframe lifecycle status.

## 10. Define and implement the public Vue API

- Use official Material terminology and semantics.
- Keep public types authored from Material, not m3e.
- Derive custom-element glue from the exported element class or `HTMLElementTagNameMap`.
- Handwritten `new () => HTMLElement` glue is not package-derived.
- Require private mapper outputs to satisfy exact exported renderer types.
- Preserve native event bubbling unless the accepted contract requires interception.
- Put ARIA/native state/focus/interaction semantics on the actual owner.
- Do not introduce Lit directly, inspect shadow DOM, copy renderer internals, or create a generic adapter framework.

A parent action label is not automatically an adequate accessible purpose label for a composed progress component. The matrix must explicitly justify that semantic handoff or expose the smallest demand-scoped separate loading-purpose API.

## 11. Migrate consumers

Migrate consumers to the selected Material Vue and token APIs, not merely new paths. Remove obsolete ownership only after every current scenario has a valid destination. Leave unrelated components unchanged.

## 12. Verify

For the selected adapter and each dependency adapter require:

- package-derived type-check;
- colocated contract tests for public API and adapter-owned mappings;
- browser tests for current native and accessibility scenarios;
- browser role/name proof for custom-element accessibility;
- observable browser or visual proof for selected renderer-owned interaction feedback; host `:active`, event receipt, token presence, or source inspection alone is insufficient;
- meaningful independent stories for selected presentation states;
- executable visual-regression proof through the repository visual runner when the adapter owns stable visible geometry or presentation;
- public token declaration, catalogue, mapping, and CSS-grammar agreement;
- representative non-default token override proof where observable;
- exact-version divergence and reduced-motion assessment;
- complete linked `M3E-*` records for confirmed renderer defects;
- operator visual/motion review where applicable.

A Storybook story, a `visual` tag, or a behavior/accessibility test is not visual-regression proof. Accepted automated visual proof requires a visual-runner test with a committed baseline for every claimed stable case.

For each composition prove:

- parent uses the dependency `MD*` adapter;
- state, label, accessibility, size, color/token, disabled, and slot handoff;
- every production-representable interaction of selected public states;
- restoration after temporary composition states;
- native event bubbling;
- final `pnpm verify`.

A parent screenshot does not replace independent visual-regression proof for a dependency that owns visible geometry or presentation. Do not duplicate m3e or Lit internals in tests.

## 13. Completion

A target may be `migrated` only when:

- its matrix is accepted;
- its selected Material Vue API is implemented;
- all selected combinations and handoffs are explicitly resolved;
- every required dependency has an accepted canonical adapter and root export;
- package-derived glue is real;
- accessibility is proven through actual browser semantics where required;
- required visual-regression specs and baselines exist;
- supported public tokens have canonical owners and `token-api.md` entries;
- no legacy or duplicate public token owner remains in the target scope;
- divergences and temporary workarounds are fully recorded with removal triggers;
- every confirmed incorrect m3e implementation has a linked complete `M3E-*` record;
- consumers use canonical APIs and obsolete ownership is removed;
- final verification passes;
- operator accepts required visual and motion behavior.

README, token catalogue, and roadmap claims must map to exact existing code, tests, stories, baselines, or defect records. Green CI alone is not architecture approval.

Keep the target `migrating` while required verification, token ownership/catalogue migration, visual baselines, operator review, source conflict, dependency work, root export, workaround documentation, or defect registry work remains incomplete.

## Report

```text
MATERIAL ADAPTER RESULT
Material component:
Migration target:
Official Material sources and related-component sources:
Selected Material surface:
Dependency adapters and statuses:
Public Vue API:
Supported public tokens and owners:
Deferred official tokens:
Renderer version and installed artifacts inspected:
Matrix status:
m3e direct coverage:
Wrapper corrections:
Temporary exact-version renderer workarounds and removal triggers:
Confirmed m3e defects and lifecycle statuses:
Consumers migrated:
Automated verification:
Operator visual and motion acceptance: accepted | required | blocked
Implementation ownership: legacy | migrating | migrated
Status: complete | partial (<exact remainder>) | blocked (<exact capability or dependency>)
```