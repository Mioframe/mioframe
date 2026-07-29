---
name: material-component-adapter
description: 'Use for implementing, migrating, or materially changing one official Material component as a demand-driven Material-first Vue MD* API backed privately by @m3e/web.'
---

# Material component adapter

Implement one explicitly selected official Material component end to end through the Material → Vue → m3e boundary.

This is the single canonical implementation workflow for both newly selected families and existing families that require completion. `material-component` is the operator-facing name-only router. `material-component-completion` is a completion preflight for uncertain existing artifacts; neither defines a second implementation workflow.

## Input contract

The component artifact name is sufficient input.

Accept official names, public `MD*` names, or existing family names, for example `Loading indicator`, `MDLoadingIndicator`, or `loading-indicator`.

Resolve current scenarios, official contract, ownership, dependencies, renderer viability, tokens, proof, and verification scope from repository and official evidence. Do not require an implementation brief or ask the operator to restate available repository facts.

Ask for clarification only when the supplied name genuinely maps to multiple distinct official Material components and repository evidence cannot resolve the intended artifact. Escalate to `architect-handoff` only for a real unresolved architecture decision, not for incomplete implementation.

## Read first

- applicable parent `AGENTS.md` files;
- `src/shared/ui/material/AGENTS.md`;
- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/component-adapter.md`;
- `src/shared/ui/material/docs/component-tokens.md`;
- `src/shared/ui/material/docs/token-api.md`;
- `src/shared/ui/material/docs/m3e-defects.md`;
- `src/shared/ui/material/docs/roadmap.md`;
- the selected family README when it exists.

## Required result

Produce one complete family migration result:

1. accepted demand-scoped Material–m3e–Vue matrix in the family README;
2. canonical Vue adapter and every required official dependency completed independently as its own canonical adapter;
3. package-derived renderer typing and private mapping;
4. selected public token declarations/catalogue entries when required;
5. consumer migration and removal of replaced target-owned logic;
6. contract, browser, accessibility, visual, and risk-specific proof;
7. accurate defect and roadmap records;
8. final task-scope verification required by the root repository policy.

Do not split research, implementation, target consumer migration, and target-owner removal into permanent partial workflows when one focused task can safely complete them.

## Workflow

### 1. Resolve the official contract

Inspect official overview, specs, guidelines, accessibility, token sources, and related-component references. Record exact sources.

Inspect current consumers, legacy behavior, tests, and stories. Classify each relevant capability as:

- `implement-now`;
- `defer`;
- `not-material`;
- `source-conflict`.

Select only current demand plus the minimum adjacent surface needed for a coherent public API. Negative or restrictive decisions require positive official evidence.

### 2. Resolve dependencies and ownership

Identify every official Material component participating in the selected scenarios. Complete each required dependency as its own canonical `MD*` adapter before composing it.

#### Dependency closure gate

When a required official dependency is discovered:

1. add it to an explicit ordered dependency queue;
2. record only the parent demand and intended public handoff before dependency work starts;
3. make the dependency the current selected family and run this entire workflow for it independently;
4. when dependency artifacts already exist but their completion is uncertain, apply `material-component-completion` first;
5. resume parent composition only after the dependency family has an accepted matrix, public API, token ownership, renderer audit, defect decisions, independent proof, exports, and truthful status.

Use the discovered dependency name as sufficient input. Do not request a separate implementation brief or operator prompt for it.

A dependency must not be implemented incidentally inside the parent implementation, parent README, parent stories, or parent tests. Parent composition proof does not replace standalone dependency proof. A parent remains `migrating` while any required dependency remains `legacy`, `partial`, `blocked`, or otherwise incomplete.

Record parent/dependency ownership and exact public handoff. A parent must not render a dependency’s raw `m3e-*`, set its private renderer variables, or own its accessibility, geometry, defects, motion, or token mapping.

Visual loading/busy presentation and activation blocking are separate contracts. Do not make a loading state disable, suppress, or intercept activation unless the selected family matrix explicitly assigns that responsibility. Otherwise `disabled` and any consumer guard remain independent and consumer-owned.

### 3. Complete the family matrix

Before production edits, update the selected family README and dependency family READMEs using the canonical matrix format from `docs/component-adapter.md`.

Every production mapping, public prop/value/default, slot, emit, controlled state, native mapping, selected token, composition, relevant combination, dependency, renderer gap, and verification claim must have a matrix row.

### 4. Inspect the consumed renderer

Inspect the exact lockfile-resolved family entry point and installed package artifact:

- resolved version and exports;
- element class and value aliases;
- properties, attributes, events, slots, native behavior, accessibility, and CSS inputs;
- observable browser behavior for selected scenarios.

Use upstream source, demos, tags, and changelogs only as supporting evidence. Do not use prerelease behavior, another version, private shadow DOM, or private methods.

Classify renderer support as `direct`, `partial`, `missing`, `divergent`, or `not-applicable`.

A confirmed incorrect renderer contract uses `divergent`, references a stable `M3E-*` record, and follows the exact-version workaround gate in `docs/component-adapter.md`. Missing or deferred capability is not an upstream defect.

Do not compensate for unacceptable renderer-owned interaction timing, transient geometry, state layer, ripple, focus, or motion with host pseudo-classes such as `:active`, `:not(:active)`, `:hover`, or `:focus-visible`, or by switching renderer CSS inputs around those pseudo-classes. Classify the renderer behavior as `divergent`, `m3e-fix`, or `blocked`; do not create a parallel wrapper state or timing path.

### 5. Implement the minimum complete adapter

- Use official Material terminology and Vue mechanics in the public API.
- Keep public types independent from m3e.
- Constrain private mappings with package-exported types.
- Derive Vue custom-element glue from the exported element class or `HTMLElementTagNameMap`.
- Treat `config/vueCustomElements.ts` as the exact raw-tag allow-list.
- Do not represent that allow-list with `vue/no-undef-components.ignorePatterns`; the rule matches regular expressions against normalized names and cannot enforce exact raw tags.
- Use a described local lint exception only on an actual selected raw renderer tag when required; unselected, misspelled, prefixed/suffixed, and differently cased tags must remain errors.
- Put native, ARIA, focus, state, and interaction semantics on the actual owner.
- Preserve normal native event propagation unless the accepted contract requires interception.
- Use Mioframe-owned light DOM only where it completes the selected Material contract without recreating renderer internals.
- Keep exact-version workarounds local, documented, tested, and removable.
- Do not introduce Lit, a generic adapter framework, copied renderer internals, or hypothetical public surface.

### 6. Resolve tokens

Follow `docs/component-tokens.md`.

- Foundation owns supported `--md-ref-*` and `--md-sys-*` roles.
- The family owns only selected official `--md-comp-<family>-*` tokens and private renderer mappings.
- Every supported public token has one owner and one `token-api.md` entry.
- Unsupported official tokens remain `deferred` in the family matrix.
- Verify CSS grammar against every selected current consumer and use browser proof when representation affects rendering.
- Do not expose `--m3e-*`, publish `--md-private-*`, or recreate a mixed-owner/global component-token file.

### 7. Migrate consumers

Migrate current consumers to the canonical Vue and selected token APIs. Preserve their scenarios and interaction tier. Remove obsolete target-owned implementation, exports, stories, and tests after all current scenarios have a valid destination. Leave unrelated legacy components unchanged.

### 8. Verify

Use `implementation-preflight` and the applicable testing skills. Required proof is defined by `docs/component-adapter.md` and the family matrix.

At minimum, cover the changed contracts through their faithful owners:

- compile-time package-derived mapping;
- colocated Vue contract tests;
- browser native/accessibility behavior;
- observable browser or visual proof for selected renderer-owned appearance;
- independent dependency presentation proof;
- public token declaration/catalogue/mapping agreement;
- selected state combinations, transient-state restoration, and parent/dependency handoff;
- exact-version defect and reduced-motion assessment where applicable.

Do not inspect private renderer DOM in tests or claim appearance from host state, token presence, or event receipt alone.

Run focused feedback during implementation. The top-level task then runs one final read-only verification using the exact branch/task scope required by the root `AGENTS.md`. Do not substitute plain `pnpm verify` when the root policy requires `--base` or another scope.

### 9. Update status truthfully

- Family README owns component-specific facts and matrix state.
- `docs/m3e-defects.md` owns confirmed renderer-defect lifecycle.
- `docs/roadmap.md` alone owns the current milestone, remaining blockers, and next action.
- Durable architecture documents must not contain PR-specific completion history.

Keep the component `migrating` while any selected implementation, dependency, root export, token ownership, defect record, consumer migration, required proof, current-head verification, or reported operator issue remains unresolved.

## Forbidden

- Requiring an operator-authored implementation brief when the artifact name and repository evidence resolve the work.
- Public API derived from legacy Mioframe or m3e vocabulary.
- Raw dependency renderer access from a parent.
- Private shadow DOM or method access.
- Parallel state-layer, ripple, focus, accessibility, geometry-engine, or motion implementation in the wrapper.
- Host pseudo-class or renderer-CSS overrides that change renderer-owned interaction timing or transient geometry.
- Coupling loading presentation to disabled state or activation suppression without an explicit selected family contract.
- Regex or normalized-name lint ignores presented as an exact renderer raw-tag allow-list.
- Handwritten `new () => HTMLElement` renderer glue.
- Duplicate token owners, token DSLs, TypeScript token registries, or exhaustive copies of Material/m3e defaults.
- Completion claims based only on green CI, source inspection, stories without visual-runner proof, or unscoped verification.

## Report

```text
MATERIAL ADAPTER RESULT
Input artifact:
Resolved Material component:
Migration target:
Official sources:
Selected Material surface:
Deferred or source-conflict surface:
Dependency adapters and statuses:
Public Vue API:
Supported public tokens and owners:
Renderer version and installed artifacts inspected:
Renderer coverage:
Wrapper corrections:
Temporary renderer workarounds and removal triggers:
Confirmed m3e defects and statuses:
Consumers migrated:
Removed legacy ownership:
Automated verification:
Exact final verification command:
Reported operator issues: none | <issues>
Implementation ownership: legacy | migrating | migrated
Status: complete | partial (<exact remainder>) | blocked (<exact reason>)
```
