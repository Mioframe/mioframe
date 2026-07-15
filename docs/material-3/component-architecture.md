# Material 3 component architecture

This document defines the mandatory implementation architecture for public shared Material components under `src/shared/ui`.

The architecture is intentionally strict. The architect resolves component design, ownership, state routing, and verification before implementation. The implementation agent follows the resolved contract and must not invent missing architecture while editing production code.

## Scope

Use this architecture for:

- every new public shared `MD*` component backed by an official Material component family;
- every existing public shared `MD*` component explicitly migrated to `layered-v1`;
- every material change to a migrated component's public API, token contract, anatomy, state model, or rendering ownership.

A strictly local fix to a legacy component may use `Architecture impact: none` only when it preserves all of the following:

- public props, emits, and slots;
- native semantics;
- official and private token names and meanings;
- DOM anatomy and property owners;
- supported states and per-property state resolution;
- rendered visual output outside the named defect.

If any item changes, the handoff must either migrate the component to `layered-v1` or report the work as blocked. The implementation agent does not choose between these outcomes.

Generic foundations such as state-layer, ripple, focus-indicator, elevation, and motion infrastructure are not component families. They keep generic contracts and must not acquire knowledge of a consuming family.

## Sources of truth and change lifecycle

There are three distinct contracts:

1. this document owns the repository-wide `layered-v1` architecture;
2. a migrated family's `README.md` owns the accepted durable contract for that family;
3. the architecture handoff owns only the exact proposed delta for the current task.

For an existing migrated family, the handoff must name the current family `README.md` and list every contract section that changes. Unchanged sections remain authoritative and must not be restated or redesigned.

For a new family or first migration, the handoff contains the complete initial family contract. The implementation PR creates the family `README.md` from that contract.

The implementation PR must update production code, verification, registry state, and family `README.md` atomically. After merge, the family `README.md` supersedes the task handoff as the durable family source of truth.

A mismatch between the merged family `README.md`, production implementation, verification, or component registry is an incomplete architecture migration. The implementation agent must not silently update the family contract beyond the exact handoff delta.

## Authority and stop condition

Before the first production edit, the architecture handoff must have `Readiness: ready` and no unresolved decisions.

The architect owns:

- official Material family and supported surface;
- public API and native semantics;
- valid and invalid combinations;
- DOM anatomy and property ownership;
- configuration axes;
- semantic and interaction states;
- per-property state resolution and coexistence;
- official token inventory and canonical owner files;
- missing official token paths;
- Mioframe extensions and deviations;
- exact production and verification files;
- acceptance and verification matrices;
- consumer blast radius;
- change mode and migration decision.

The implementation agent may:

- implement the exact contract delta;
- copy verified official token paths and values;
- connect the declared states and DOM owners;
- add the required tests and Storybook surfaces;
- report a contradiction, missing source, or impossible requirement.

The implementation agent must not decide:

- which Material features to support;
- which public API is preferable;
- which invalid combination to normalize;
- which component owns an anatomy part;
- which token file owns a canonical declaration;
- which state wins for a rendered property;
- which states coexist for different rendered properties;
- whether to introduce a helper, composable, base component, context, shared token file, or shared anatomy file;
- which required verification may be omitted;
- whether a component is aligned.

When the contract is incomplete or contradicted by the repository, stop and return the handoff for resolution. Do not hide unresolved design in a helper, options object, selector order, fallback token, or test fixture.

## Required architecture contract

Every new or migrated component family must have the following completed handoff before implementation:

```text
MATERIAL COMPONENT CONTRACT

Architecture version: layered-v1
Change mode: architecture-only | alignment-only | combined-approved
Family:
Public components:

Existing family contract: none | <Family>/README.md
Contract delta:

Official sources:
Verified snapshot:

Supported Material surface:
Unsupported Material surface:

Public API:
Native semantics:
Invalid combinations:

Anatomy ownership:
- container:
- label:
- leading icon:
- trailing icon:
- outline:
- elevation:
- state layer:
- focus indicator:
- progress:
- other parts:

Configuration axes:
Semantic states:
Interaction states:

Canonical token ownership:
- owner file:
  official token paths:
  public CSS tokens:
  applicable component roots:

Rendered property matrix:
- property:
  DOM owner:
  final rendered variable:
  configuration route source:
  semantic bank sources:
  interaction inputs:
  winner order for this property:
  simultaneous independent outputs:
  generic foundation bridge:

Missing official token paths:
Mioframe extensions:
Documented deviations:

Exact production files:
Exact verification files:

Acceptance matrix:
Verification matrix:
Consumer blast radius:

Unresolved: none
Readiness: ready
```

Rules:

- `TBD`, alternative implementations, and decisions deferred to implementation are forbidden in a ready contract;
- every stateful rendered property has its own matrix row;
- `winner order for this property` must be explicit, including `none` when interaction states do not compete for that property;
- a global component-wide state precedence is not a substitute for property rows;
- focus indicator, state layer, elevation, shape, color, opacity, and motion are separate properties when they can resolve independently;
- every canonical official token has exactly one named owner file;
- `Contract delta` is `complete initial contract` only for a new family or first migration.

## Fixed production structure

A `layered-v1` component uses this structure:

```text
src/shared/ui/<Family>/
  README.md
  index.ts

  <Component>.vue
  <Component>.tokens.css
  <Component>.routes.css
  <Component>.states.css
  <Component>.css
```

The four component CSS layers are mandatory. If a layer is not applicable, the file remains present and contains one explanatory architecture comment.

A family may additionally own:

```text
<Family>.tokens.css
```

This file is permitted only when the ready contract assigns at least one exact official token path to the family because the same canonical token contract is consumed by at least two public components in that family. The contract must list the token paths, CSS names, applicable component roots, and every component that loads the file.

Do not use a family token file merely because values are equal, to reduce line count, or to prepare for hypothetical reuse. A component-specific official token remains in `<Component>.tokens.css`.

Other additional production files are forbidden unless the ready handoff names the exact file and owner. The only recognized additional categories are:

```text
<Component>Behavior.ts
use<Component>Behavior.ts
<Family>Anatomy.css
<Family>Context.ts
```

They require an explicit handoff decision:

- `Behavior` or `useBehavior`: interaction cannot be expressed by native semantics or small local component handlers;
- `FamilyAnatomy`: at least two public components in the same Material family own the same anatomy contract;
- `FamilyContext`: a parent must signal family-owned composition state to descendants without styling their internals.

Do not create additional files to reduce line count, remove superficial duplication, or prepare for hypothetical reuse.

## Style loading order

Without a family token file, `<Component>.vue` loads:

```vue
<style scoped src="./Component.tokens.css"></style>
<style scoped src="./Component.routes.css"></style>
<style scoped src="./Component.states.css"></style>
<style scoped src="./Component.css"></style>
```

When the ready contract assigns family-owned tokens, every named family member loads:

```vue
<style scoped src="./Family.tokens.css"></style>
<style scoped src="./Component.tokens.css"></style>
<style scoped src="./Component.routes.css"></style>
<style scoped src="./Component.states.css"></style>
<style scoped src="./Component.css"></style>
```

A handoff-approved family anatomy file is loaded after component states and before component rendering, unless the handoff names another exact position. The implementation agent must not choose cascade order.

## Layer responsibilities

### `<Component>.vue`

Owns only:

- typed public props, emits, and slots;
- small named computed values;
- acquisition of declared runtime states;
- native element and explicit DOM-critical attributes;
- event wiring;
- DOM anatomy;
- declared foundation primitives;
- ordered external style blocks.

Forbidden:

- `--md-comp-*` or `--md-private-*` declarations;
- visual token values computed in TypeScript;
- inline component CSS;
- visual state resolution;
- synthetic activation where native semantics provide the behavior;
- generic topology, render-plan, or style-resolver objects;
- unapproved helpers, contexts, behavior modules, or base components.

### `<Component>.tokens.css` and `<Family>.tokens.css`

These files own only canonical official component-token defaults:

```text
--md-comp-*
```

Allowed selectors are only:

- the owning component root in `<Component>.tokens.css`;
- the exact family-member root selector list named by the contract in `<Family>.tokens.css`.

Every official token is declared independently of the currently active configuration or state. All supported variant, size, shape, width, density, semantic-state, and interaction-state tokens therefore exist on the owning root whenever the component is rendered.

Allowed values:

- exact mechanically derived names from verified official `md.comp.*` paths;
- defaults resolved through `--md-sys-*` tokens;
- direct measurements or values explicitly defined by the verified Material source.

Forbidden:

- configuration modifier selectors;
- semantic or interaction state selectors;
- pseudo-classes;
- `--md-private-*` and `--app-*` declarations;
- normal rendering properties;
- rendered values;
- invented component tokens;
- duplicate canonical definitions across owner files.

The token layer defines the complete public override surface. It never selects the active configuration or state.

### `<Component>.routes.css`

Owns only configuration routing from public component tokens or documented gap values into family-private route banks.

Configuration includes only axes named by the handoff, such as:

- variant;
- size;
- shape;
- width;
- density;
- mode.

Route variables use:

```text
--md-private-<component>-<semantic>-<interaction>-<part>-<property>
```

Allowed:

- component root selector;
- handoff-declared configuration classes;
- assignment from `--md-comp-*`, documented private gap values, or documented `--app-*` extension values into route variables.

Forbidden:

- semantic state selectors;
- interaction state selectors;
- normal rendering properties;
- rendered variables;
- public token declarations;
- layout, positioning, transitions, or DOM-owner styling.

This layer fills every required route bank. It does not select the active semantic or interaction result.

### `<Component>.states.css`

Owns only semantic-bank selection, per-property interaction resolution, and generic foundation bridges.

Resolution has two stages.

#### Semantic-bank selection

The component maps the active semantic state into current interaction candidates:

```text
--md-private-<component>-current-<interaction>-<part>-<property>
```

#### Per-property interaction resolution

Each rendered property independently resolves its candidates into:

```text
--md-private-<component>-rendered-<part>-<property>
```

The selector order and specificity must implement the exact `winner order for this property` from the ready matrix. There is no repository-wide or component-wide default precedence.

Independent properties may resolve simultaneously. For example, a pressed container shape may coexist with a focused focus indicator because shape and indicator are separate matrix rows.

Allowed:

- component semantic-state classes declared by the handoff;
- standard `md-state_*` interaction classes;
- native pseudo-classes only when named by the handoff as a required fallback;
- private variable assignments;
- mapping rendered family variables into generic foundation contracts such as `--md-private-state-layer-color`.

Forbidden:

- normal rendering properties;
- public token declarations;
- configuration token definitions;
- layout or anatomy styling;
- direct `--md-sys-*` use when the value has a declared component-token route;
- a precedence or coexistence rule absent from the rendered-property matrix;
- relying on incidental selector order to resolve an undocumented state combination.

### `<Component>.css`

Owns only rendering and actual DOM property owners:

- display and layout;
- geometry;
- padding and gap;
- border and outline;
- background and color;
- opacity;
- elevation;
- transitions;
- target area;
- positioning;
- pointer and cursor presentation;
- application of final rendered private values.

Forbidden:

- `--md-comp-*` declarations;
- configuration routing;
- semantic or interaction state resolution;
- variant, size, shape, or `md-state_*` selectors;
- direct state-specific token selection;
- styling another component's internal anatomy through `:deep()`.

A property must be applied by the DOM owner declared in the matrix. Do not rely on accidental inheritance when the contract names a more specific owner.

## Universal token pipeline

Every visual property follows one directed path:

```text
official md.comp token
→ canonical family-owned --md-comp-* declaration
→ configuration route bank
→ current semantic bank
→ per-property interaction resolver
→ rendered family-private value
→ optional generic foundation bridge
→ actual DOM property owner
```

The pipeline may skip a private stage only when the rendered-property matrix explicitly states that the property does not vary across that stage. It must never bypass an available official component token with a direct system-token value.

Rules:

- a Material family owns its official component tokens through the exact component or family token file named by the contract;
- generic foundations read generic private contracts only;
- family-private variables remain inside the owning family;
- Mioframe extensions use `--app-*` or family-private variables, never invented `--md-comp-*` tokens;
- each official token has one canonical declaration owner;
- each rendered property has one declared DOM owner.

## Universal state model

State resolution order is:

```text
configuration
→ semantic state
→ property-specific interaction resolution
→ rendered property
```

There is no universal interaction precedence. The architect defines the winner order separately for each stateful rendered property from verified Material guidance or an explicit documented project deviation.

A component uses only states listed in its ready contract. States not applicable to a property are omitted from that property's matrix row.

Examples of semantic-state axes include:

- unselected / selected;
- off / on;
- valid / error;
- collapsed / expanded.

Project modes such as loading or presentation are not automatically Material states. Their activation, anatomy effect, token ownership, interaction suppression, and per-property routes must be explicitly resolved in the contract.

## Naming

Root:

```text
.md-<component>
```

Anatomy:

```text
.md-<component>__<part>
```

Configuration:

```text
.md-<component>_<axis>_<value>
```

Material interaction states:

```text
.md-state_hover
.md-state_focused
.md-state_pressed
.md-state_dragged
.md-state_disabled
```

Component semantic or extension states:

```text
.md-<component>_selected
.md-<component>_error
.md-<component>_expanded
.md-<component>_loading
```

Route bank:

```text
--md-private-<component>-<semantic>-<interaction>-<part>-<property>
```

Current semantic bank:

```text
--md-private-<component>-current-<interaction>-<part>-<property>
```

Rendered value:

```text
--md-private-<component>-rendered-<part>-<property>
```

Do not add another alias level without a new architecture decision.

## Family README contract

Each migrated family owns `README.md` with these sections:

```text
# <Family>

## Architecture version
## Official Material sources
## Supported components
## Unsupported components
## Public API
## Native semantics and invalid combinations
## Anatomy ownership
## Configuration axes
## Semantic states
## Interaction states
## Canonical token ownership
## Rendered property matrix
## Mioframe extensions
## Deviations
## Verification
```

The README is the durable family source of truth after merge. It records accepted decisions, not task history or implementation notes.

For an existing migrated family, a later handoff must be expressed as a delta against this README. If implementation evidence requires another contract change, stop, update the handoff, and receive a new `ready` verdict before continuing.

## Verification contract

Every ready handoff names exact verification files and required cases.

### Component contract verification

Verify as applicable:

- defaults;
- props, emits, and slots;
- native element and explicit attributes;
- ARIA and accessible name;
- valid and invalid combinations;
- disabled behavior;
- project extensions.

### Static architecture verification

For migrated components, verification must enforce:

- required component layer files exist;
- handoff-declared family token, anatomy, behavior, and context files exist;
- style blocks use the required order;
- `.vue` does not own visual tokens or inline component CSS;
- canonical component tokens are declared only in the named component or family token owner file;
- token files use only approved root selectors and contain no configuration or state selectors;
- route variables are assigned only in `.routes.css`;
- semantic and interaction state resolution exists only in `.states.css`;
- normal rendering properties exist only in `.css` or a handoff-approved family anatomy file;
- canonical component tokens are not duplicated;
- family-private variables do not escape the family;
- generic foundations do not read family-specific variables;
- every stateful rendered property has a family README matrix row and an implemented resolver.

Until a verify-managed validator covers a rule, the PR review and conversion checklist must enforce it manually. A component must not be reported as architecture-complete when a required check was skipped.

### Browser property-owner verification

Assert each stateful visual property on the actual owner declared by the rendered-property matrix. Typical owners include:

| Property               | Owner                           |
| ---------------------- | ------------------------------- |
| container color        | root container                  |
| label color and motion | label element                   |
| icon color and motion  | icon wrapper or icon primitive  |
| outline                | root container                  |
| elevation              | root container                  |
| state layer            | state-layer element             |
| focus indicator        | declared focus-indicator target |

Do not assert a parent merely because the final value currently inherits to the real owner.

### State-resolution verification

Test every reachable row and state combination from the rendered-property matrix. Verify both winner selection and independent simultaneous outputs. Do not infer correctness from selector order or isolated state tests.

### Visual verification

Use representative screenshots for materially different geometry and visual states. Do not create a full Cartesian screenshot matrix when exact property assertions can prove routes more directly.

### Consumer blast-radius verification

For each affected existing consumer, record:

- preserved scenario;
- required check;
- allowed visual change;
- forbidden regression.

## Change modes

### `architecture-only`

Use for behavior-preserving migration:

- no public API change;
- no token-name or token-value change;
- no state behavior change;
- no intended rendered output change;
- no snapshot update unless the previous snapshot was invalid and that exception is named by the handoff.

### `alignment-only`

Use after migration to correct named Material deviations. Component structure and ownership remain stable except for an explicit contract delta.

### `combined-approved`

Allowed only when the architect explicitly determines that a small component cannot be usefully reviewed as separate architecture and alignment changes. The implementation agent must not choose this mode.

For large or stateful legacy components, keep architecture extraction separate from Material behavior changes.

## Forbidden architecture

Do not introduce:

- a universal `MDComponentBase`;
- a runtime Material token registry;
- a generic token resolver;
- a shared state machine for unrelated component families;
- a global interaction precedence applied to every property;
- a CSS-generation DSL;
- a global file containing all component-family tokens;
- family-specific token knowledge in generic foundations;
- production token maps reused as test expectations;
- unapproved helpers or extension points;
- a broad migration of unrelated Material families in one PR;
- alignment claims based only on green unit tests or screenshots.

The purpose of this architecture is deterministic ownership and reviewability, not maximum reuse or minimum file count.
