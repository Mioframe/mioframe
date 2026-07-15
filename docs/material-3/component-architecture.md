# Material 3 component architecture

This document defines the mandatory implementation architecture for public shared Material components under `src/shared/ui`.

The architecture is intentionally strict. The architect resolves component design and ownership before implementation. The implementation agent follows the resolved contract and must not invent missing architecture while editing production code.

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
- supported states and state precedence;
- rendered visual output outside the named defect.

If any item changes, the handoff must either migrate the component to `layered-v1` or report the work as blocked. The implementation agent does not choose between these outcomes.

Generic foundations such as state-layer, ripple, focus-indicator, elevation, and motion infrastructure are not component families. They keep generic contracts and must not acquire knowledge of a consuming family.

## Authority and stop condition

The architecture handoff is authoritative for component structure. Before the first production edit it must have `Readiness: ready` and no unresolved decisions.

The architect owns:

- official Material family and supported surface;
- public API and native semantics;
- valid and invalid combinations;
- DOM anatomy and property ownership;
- configuration axes;
- semantic and interaction states;
- state precedence;
- official token inventory and documented gaps;
- Mioframe extensions and deviations;
- exact production and verification files;
- acceptance and verification matrices;
- change mode and migration decision.

The implementation agent may:

- implement the exact contract;
- copy verified official token paths and values;
- connect the declared states and DOM owners;
- add the required tests and Storybook surfaces;
- report a contradiction, missing source, or impossible requirement.

The implementation agent must not decide:

- which Material features to support;
- which public API is preferable;
- which invalid combination to normalize;
- which component owns an anatomy part;
- which state wins;
- whether to introduce a helper, composable, base component, context, or shared anatomy file;
- which required verification may be omitted;
- whether a component is aligned.

When the contract is incomplete or contradicted by the repository, stop and return the handoff for resolution. Do not hide the same unresolved design in a helper, options object, selector order, fallback token, or test fixture.

## Required architecture contract

Every new or migrated component family must have the following completed handoff before implementation:

```text
MATERIAL COMPONENT CONTRACT

Architecture version: layered-v1
Change mode: architecture-only | alignment-only | combined-approved
Family:
Public components:

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
State precedence:

Rendered property routes:
- property:
  owner:
  resting source:
  semantic sources:
  interaction sources:

Official component tokens:
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

`TBD`, alternative implementations, and decisions deferred to implementation are not permitted in a ready contract.

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

The four CSS layers are mandatory. If a layer is not applicable, the file remains present and contains one explanatory architecture comment. This avoids making file structure an implementation-time decision.

Additional production files are forbidden unless the ready handoff names the exact file and owner. The only recognized additional categories are:

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

Do not create one of these files to reduce line count, remove superficial duplication, or prepare for hypothetical reuse.

## Style loading order

`<Component>.vue` loads the layers in this exact order:

```vue
<style scoped src="./Component.tokens.css"></style>
<style scoped src="./Component.routes.css"></style>
<style scoped src="./Component.states.css"></style>
<style scoped src="./Component.css"></style>
```

A handoff-approved family anatomy file is loaded after component states and before component rendering, or at another exact position named by the handoff. The implementation agent must not choose its cascade position.

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
- state precedence;
- synthetic activation where native semantics provide the behavior;
- generic topology, render-plan, or style-resolver objects;
- unapproved helpers, contexts, behavior modules, or base components.

### `<Component>.tokens.css`

Owns only canonical official component-token defaults:

```text
--md-comp-*
```

Allowed:

- exact mechanically derived names from verified official `md.comp.*` paths;
- defaults resolved through `--md-sys-*` tokens;
- direct measurements or values explicitly defined by the verified Material source;
- component root and handoff-declared configuration selectors needed to scope official token families.

Forbidden:

- `--md-private-*` and `--app-*` declarations;
- normal rendering properties;
- semantic or interaction state selectors;
- rendered values;
- invented component tokens;
- duplicate canonical definitions across files or family members.

### `<Component>.routes.css`

Owns only configuration routing from public component tokens into family-private route banks.

Configuration includes only axes named by the handoff, such as:

- variant;
- size;
- shape;
- width;
- density;
- mode.

Route variables use this form:

```text
--md-private-<component>-<semantic>-<interaction>-<part>-<property>
```

Allowed:

- component root selector;
- handoff-declared configuration classes;
- assignment from `--md-comp-*` or documented gap values into route variables.

Forbidden:

- semantic state selectors;
- interaction state selectors;
- normal rendering properties;
- rendered variables;
- public token declarations;
- layout, positioning, transitions, or DOM-owner styling.

This layer fills route banks. It does not select the active bank.

### `<Component>.states.css`

Owns only state resolution and generic foundation bridges.

Resolution has two required stages.

#### Semantic bank selection

The component maps the current semantic state into current interaction slots:

```text
--md-private-<component>-current-<interaction>-<part>-<property>
```

#### Interaction resolution

The component maps the active interaction state into final rendered values:

```text
--md-private-<component>-rendered-<part>-<property>
```

Allowed:

- component semantic state classes declared by the handoff;
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
- an unrecorded precedence change through selector specificity or file order.

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

A property must be applied by its declared DOM owner. Do not rely on accidental inheritance when the anatomy contract names a more specific owner.

## Universal token pipeline

Every visual property follows one directed path:

```text
official md.comp token
→ family-owned --md-comp-* token
→ configuration route bank
→ current semantic bank
→ rendered family-private value
→ optional generic foundation bridge
→ actual DOM property owner
```

The pipeline may skip a private stage only when the handoff declares that the property does not vary across that stage. It must never bypass an available official component token with a direct system-token value.

Rules:

- a Material family owns its official component tokens;
- generic foundations read generic private contracts only;
- family-private variables remain inside the owning family;
- Mioframe extensions use `--app-*` or family-private variables, never invented `--md-comp-*` tokens;
- each official token has one canonical definition owner;
- each rendered property has one declared DOM owner.

## Universal state model

State resolution order is:

```text
configuration
→ semantic state
→ interaction state
→ rendered property
```

The default interaction precedence is:

```text
disabled > dragged > pressed > focused > hovered > resting
```

A component uses only interaction states listed in its ready contract. The architect may define another precedence only when the official Material source or an explicit documented project deviation requires it.

Examples of semantic state axes include:

- unselected / selected;
- off / on;
- valid / error;
- collapsed / expanded.

Project modes such as loading or presentation are not automatically Material states. Their activation, anatomy effect, token ownership, and interaction suppression must be explicitly resolved in the contract.

## Naming

Use these names consistently.

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
## Anatomy ownership
## Configuration axes
## Semantic states
## Interaction states
## State precedence
## Component token ownership
## Mioframe extensions
## Deviations
## Verification
```

The README is a durable architecture contract, not implementation notes. If implementation evidence requires changing one of these decisions, stop, update the architecture handoff, and receive a new `ready` verdict before continuing.

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

- required layer files exist;
- style blocks use the required order;
- `.vue` does not own visual tokens or inline component CSS;
- component tokens are declared only in `.tokens.css`;
- route variables are assigned only in `.routes.css`;
- semantic and interaction state resolution exists only in `.states.css`;
- normal rendering properties exist only in `.css` or a handoff-approved family anatomy file;
- canonical component tokens are not duplicated;
- family-private variables do not escape the family;
- generic foundations do not read family-specific variables.

Until a verify-managed validator covers a rule, the PR review and conversion checklist must enforce it manually. A component must not be reported as architecture-complete when a required check was skipped.

### Browser property-owner verification

Assert each stateful visual property on the actual owner declared by the anatomy contract. Typical owners include:

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

### State precedence verification

Test every reachable row from the handoff state matrix. Do not infer correctness from selector order or from isolated state tests.

### Visual verification

Use representative screenshots for materially different geometry and visual states. Do not create a full Cartesian screenshot matrix when exact property assertions can prove the state routes more directly.

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

Use after migration to correct named Material deviations. The component structure and ownership remain stable.

### `combined-approved`

Allowed only when the architect explicitly determines that a small component cannot be usefully reviewed as separate architecture and alignment changes. The implementation agent must not choose this mode.

For large or stateful legacy components, keep architecture extraction separate from Material behavior changes.

## Forbidden architecture

Do not introduce:

- a universal `MDComponentBase`;
- a runtime Material token registry;
- a generic token resolver;
- a shared state machine for unrelated component families;
- a CSS-generation DSL;
- a global file containing all component-family tokens;
- family-specific token knowledge in generic foundations;
- production token maps reused as test expectations;
- unapproved helpers or extension points;
- a broad migration of unrelated Material families in one PR;
- alignment claims based only on green unit tests or screenshots.

The purpose of this architecture is deterministic ownership and reviewability, not maximum reuse or minimum file count.
