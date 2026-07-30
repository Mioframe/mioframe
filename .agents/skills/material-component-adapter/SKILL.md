---
name: material-component-adapter
description: 'Use after a current complete family DESIGN.md exists to implement, migrate, or materially change one official Material component as a demand-scoped Material-first Vue MD* API backed privately by @m3e/web.'
---

# Material component adapter

Implement one explicitly selected official Material component end to end through the accepted design → Vue → m3e boundary.

`material-component-design` owns the complete official design artifact. This skill owns demand selection, adapter architecture, implementation, migration, and proof. It must not recreate or shorten the official design contract.

## Input contract

The component artifact name is sufficient input only when the canonical family `DESIGN.md` already exists and is `current`.

Accept official names, public `MD*` names, or existing family names, for example `Loading indicator`, `MDLoadingIndicator`, or `loading-indicator`.

Ask for clarification only when the supplied name genuinely maps to multiple distinct official Material components and repository evidence cannot resolve the intended artifact. Escalate to `architect-handoff` only for a real unresolved architecture decision, not for incomplete implementation.

## Design gate

Before any demand analysis, renderer inspection, README update, or production edit, read:

```text
src/shared/ui/material/components/<family>/DESIGN.md
```

Validate it against `src/shared/ui/material/docs/design-document.md`.

Stop and invoke `material-component-design` when the artifact is missing, stale, blocked, incomplete, demand-scoped, or contains renderer/implementation decisions.

Do not continue until the design status is `current`.

The design artifact is the only local authority for complete official variants, configurations, states, guidance, accessibility, measurements, related components, and component-token paths. Do not reconstruct those facts from current code, README, stories, tests, consumers, or m3e.

## Read first

- applicable parent `AGENTS.md` files;
- `src/shared/ui/material/AGENTS.md`;
- `src/shared/ui/material/docs/design-document.md`;
- the selected family `DESIGN.md`;
- `src/shared/ui/material/docs/architecture.md`;
- `src/shared/ui/material/docs/component-adapter.md`;
- `src/shared/ui/material/docs/component-tokens.md`;
- `src/shared/ui/material/docs/token-api.md`;
- `src/shared/ui/material/docs/m3e-defects.md`;
- `src/shared/ui/material/docs/roadmap.md`;
- the selected family README when it exists.

## Required result

Produce one complete family migration result:

1. current complete family `DESIGN.md` retained unchanged unless official sources changed;
2. accepted demand-scoped Material–m3e–Vue matrix in the family README with exact design references;
3. canonical Vue adapter and every required official dependency completed independently as its own canonical family;
4. package-derived renderer typing and private mapping;
5. selected public token declarations/catalogue entries when required;
6. complete design-token-to-renderer state/part/fallback trace for contextual tokens;
7. consumer migration and removal of replaced target-owned logic;
8. contract, browser, accessibility, visual, and risk-specific proof;
9. accurate defect and roadmap records;
10. final task-scope verification required by the root repository policy.

Do not split design extraction, adapter implementation, target consumer migration, and target-owner removal into one mixed artifact. `DESIGN.md` remains a separate first-stage output even when the router runs the stages sequentially.

## Workflow

### 1. Select demand from the complete design

Read the full family `DESIGN.md`, then inspect current consumers, legacy behavior, tests, and stories.

Classify relevant official capability as:

- `implement-now`;
- `defer`;
- `not-material`;
- `source-conflict`.

Every classification references an exact `DESIGN.md` section or token path.

Select only current demand plus the minimum adjacent surface needed for a coherent public API. Deferred capability remains fully documented in `DESIGN.md`; do not delete or shorten the design artifact.

State demand as an observable result. For contextual appearance, identify the rendered part and every relevant state rather than saying only that a consumer “customizes” the component.

### 2. Resolve dependencies and ownership

Identify every official Material component participating in the selected scenarios from the family design artifact and current composition.

When a required official dependency is discovered:

1. add it to an explicit ordered dependency queue;
2. process its name through `material-component`;
3. require its complete current `DESIGN.md` first;
4. complete or verify its canonical adapter independently;
5. resume parent composition only after both design and adapter closure pass.

Do not request a separate implementation brief or operator prompt.

A dependency must not be implemented incidentally inside the parent implementation, README, stories, or tests. Parent composition proof does not replace standalone dependency proof.

Record parent/dependency ownership and exact public handoff. A parent must not render a dependency’s raw `m3e-*`, set its private renderer variables, or own its design document, accessibility, geometry, defects, motion, or token mapping.

Visual loading/busy presentation and activation blocking are separate contracts. Do not make a loading state disable, suppress, or intercept activation unless the selected family matrix explicitly assigns that responsibility.

### 3. Complete the family README matrix

Before production edits, update the selected family README and dependency family READMEs using `docs/component-adapter.md`.

Every row includes an exact `DESIGN.md` reference.

Every production mapping, public prop/value/default, slot, emit, controlled state, native mapping, selected token, composition, relevant combination, dependency, renderer gap, and verification claim must have a matrix row.

For every contextual token scenario, add:

| State | Rendered part | DESIGN.md token path | Public Mioframe token | Renderer input and fallback | Current consumer result | Proof |
| ----- | ------------- | -------------------- | --------------------- | --------------------------- | ----------------------- | ----- |

Include resting and every selected transient or disabled state that can choose a different renderer value. Do not collapse distinct renderer state inputs into one broad row when that would hide a fallback change.

### 4. Inspect the consumed renderer

Inspect the exact lockfile-resolved family entry point and installed package artifact:

- resolved version and exports;
- element class and value aliases;
- properties, attributes, events, slots, native behavior, accessibility, and CSS inputs;
- direct family inputs and fallback chains for every selected state and rendered part;
- observable browser behavior for selected scenarios.

Use upstream source, demos, tags, and changelogs only as supporting renderer evidence. Do not use prerelease behavior, another version, private shadow DOM, or private methods.

Classify renderer support as `direct`, `partial`, `missing`, `divergent`, or `not-applicable` against the selected official contract from `DESIGN.md`.

Do not compensate for unacceptable renderer-owned interaction timing, transient geometry, state layer, ripple, focus, or motion with host pseudo-classes or renderer-CSS switching. Route it to `m3e-fix` or `blocked` unless it passes the exact workaround gate.

### 5. Implement the minimum complete adapter

- Use official Material terminology from `DESIGN.md` and Vue mechanics in the public API.
- Keep public types independent from m3e.
- Constrain private mappings with package-exported types.
- Derive Vue custom-element glue from the exported element class or `HTMLElementTagNameMap`.
- Treat `config/vueCustomElements.ts` as the exact raw-tag allow-list.
- Put native, ARIA, focus, state, and interaction semantics on the actual owner.
- Preserve normal native event propagation unless the accepted contract requires interception.
- Use Mioframe-owned light DOM only where it completes the selected Material contract without recreating renderer internals.
- Keep exact-version workarounds local, documented, tested, and removable.
- Do not introduce Lit, a generic adapter framework, copied renderer internals, or hypothetical public surface.

### 6. Resolve tokens

Follow `docs/component-tokens.md`.

- Use the complete official token catalogue in `DESIGN.md` as the selection source.
- Foundation owns supported `--md-ref-*` and `--md-sys-*` roles.
- The family owns only selected official `--md-comp-<family>-*` runtime tokens and private renderer mappings.
- Derive each public token name from the exact official path; never derive it from an m3e input name.
- Every supported public token has one owner and one `token-api.md` entry.
- Unsupported official tokens remain in `DESIGN.md` and are recorded as `defer` only where relevant in the family README.
- Select the complete minimum runtime set required by the current rendered parts and states; exclude parts with no current consumer.
- Trace `DESIGN path → public token → renderer input → renderer fallback → consumer result → proof` for every selected token.
- Verify CSS grammar against every selected current consumer and use browser proof when representation affects rendering.
- Do not expose `--m3e-*`, publish `--md-private-*`, or recreate a mixed-owner/global component-token file.

A resting token is not proof of hover, focus, press, selected, or disabled behavior. If the renderer selects a separate input in a state, inspect its fallback and include the corresponding official token only when the confirmed scenario requires that rendered result.

### 7. Migrate consumers

Migrate current consumers to the canonical Vue and selected token APIs. Preserve their scenarios and interaction tier. Remove obsolete target-owned implementation, exports, stories, and tests after all current scenarios have a valid destination. Leave unrelated legacy components unchanged.

For contextual overrides, verify the complete user-visible state set at the real consumer. Do not stop after assigning tokens at the consumer boundary.

### 8. Verify

Use `implementation-preflight` and the applicable testing skills.

At minimum, cover:

- current complete `DESIGN.md` and exact README references;
- compile-time package-derived mapping;
- colocated Vue contract tests;
- browser native/accessibility behavior;
- observable browser or visual proof for selected renderer-owned appearance;
- independent dependency presentation proof;
- public token declaration/catalogue/mapping agreement;
- exact design-token/public-token/renderer-input/fallback trace;
- computed rendered-part result in every selected state;
- selected state combinations, transient-state restoration, and parent/dependency handoff;
- exact-version defect and reduced-motion assessment where applicable.

Do not inspect private renderer DOM in tests. Do not claim rendered token correctness from a host custom-property value, source mapping, state flag, or screenshot alone. Browser proof must assert the computed public result. Visual proof supplements that assertion and owns only pixel presentation, not keyboard or focus-movement success criteria.

Run focused feedback during implementation. The top-level task then runs one final read-only verification using the exact branch/task scope required by root `AGENTS.md`.

### 9. Update status truthfully

- `DESIGN.md` owns complete official facts and changes only with official source changes or extraction corrections.
- Family README owns demand-scoped mapping, selected implementation facts, and current family gaps.
- `docs/token-api.md` changes atomically with executable supported token declarations.
- `docs/m3e-defects.md` owns confirmed renderer-defect lifecycle.
- `docs/roadmap.md` alone owns the current milestone, remaining blockers, and next action.

Keep the component `migrating` while any design, selected implementation, dependency, root export, token ownership, defect record, consumer migration, required proof, current-head verification, or reported operator issue remains unresolved.

## Forbidden

- Beginning adapter work without a current complete `DESIGN.md`.
- Replacing `DESIGN.md` with a selected-surface README matrix or links to official pages.
- Editing `DESIGN.md` to remove unused official capability.
- Deriving official facts from current code, m3e, stories, tests, or consumers.
- Public API derived from legacy Mioframe or m3e vocabulary.
- Public token names derived from renderer input names instead of exact official Material paths.
- Declaring a contextual token subset without tracing every required state, rendered part, renderer input, and fallback.
- Publishing tokens for unconsumed parts merely for symmetry or renderer completeness.
- Raw dependency renderer access from a parent.
- Private shadow DOM or method access.
- Parallel state-layer, ripple, focus, accessibility, geometry-engine, or motion implementation in the wrapper.
- Host pseudo-class or renderer-CSS overrides that change renderer-owned interaction timing or transient geometry.
- Coupling loading presentation to disabled state or activation suppression without an explicit selected family contract.
- Regex or normalized-name lint ignores presented as an exact renderer raw-tag allow-list.
- Handwritten `new () => HTMLElement` renderer glue.
- Duplicate token owners, token DSLs, TypeScript token registries, or exhaustive runtime copies of Material/m3e defaults.
- Completion claims based only on green CI, source inspection, custom-property assertions, stories without visual-runner proof, or unscoped verification.

## Report

```text
MATERIAL ADAPTER RESULT
Input artifact:
Resolved Material component:
Migration target:
DESIGN.md path and status:
DESIGN.md sections used:
Selected Material surface:
Deferred or source-conflict surface:
Dependency design and adapter statuses:
Public Vue API:
Supported public tokens and owners:
Token state/part/fallback trace:
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
