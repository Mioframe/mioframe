# Material 3 adoption plan

## Principle

Adopt Material 3 incrementally through source-backed component-family work. Architecture, token ownership, public API, anatomy, property-specific state resolution, Storybook, verification, and deviations must be resolved before implementation.

Do not perform broad visual rewrites or let implementation agents invent missing component architecture while editing code.

## Phase 1: Foundation policies

The policy set establishes:

- official Material source of truth;
- `dp` and `sp` authoring units;
- reference, system, component, and app token namespaces;
- baseline light and dark themes;
- interaction-state and accessibility rules;
- shared UI public API conventions;
- Storybook and verification expectations;
- component registry and deviation tracking;
- strict public Material component architecture.

This phase changes policy only. It does not reorganize production components or change component behavior.

Resolved foundation decisions:

- `sp` is the target Material typography authoring unit;
- `dp` is the target Material measurement authoring unit;
- `--app-*` is the namespace for project-specific CSS custom properties outside Material vocabulary;
- every canonical `--md-comp-*` token has one component or family owner file at the Material family definition boundary;
- canonical component tokens are declared independently of active configuration and state;
- generic state, ripple, focus, elevation, and motion primitives read generic private contracts only;
- public shared UI APIs are migrated together with in-repository consumers rather than preserved through compatibility-only aliases by default;
- existing overlay containment ownership is reused instead of introducing a numeric z-index ownership model;
- a ready `MATERIAL COMPONENT CONTRACT` is required before new or migrated public `MD*` implementation;
- a migrated family `README.md` is the durable accepted family contract after merge.

## Phase 2: Architecture enforcement

Establish and enforce [Component architecture](./component-architecture.md).

Required outcomes:

- `Architecture impact: none`, `layered-v1`, or `blocked` is recorded before public Material component edits;
- every `layered-v1` component has fixed Vue, token, route, state, and rendering layers;
- family README files hold durable architecture contracts and later handoffs define exact deltas;
- canonical component and family token ownership is explicit;
- every stateful rendered property has its own state-resolution matrix row and actual DOM owner;
- independent outputs such as shape, elevation, state layer, and focus indicator can coexist as declared;
- component-token ownership and private-variable boundaries are mechanically checked;
- implementation agents stop when a required architecture decision is absent.

Add verify-managed static validation incrementally:

1. implement checks against the first pilot;
2. keep legacy components advisory-only;
3. make checks blocking for each component after migration;
4. expand the validator only after the rule is proven on an independent second pilot.

Do not build a runtime token registry, generic component base, CSS-generation DSL, global property precedence, or cross-family state machine.

## Phase 3: `MDButton` architecture pilot

Use `MDButton` as the first `layered-v1` migration because its current implementation exposes the failure mode this architecture must solve: public API, official token inventory, private routing, property-specific state resolution, property ownership, geometry, and motion are concentrated in one large component file.

The architecture-only PR must:

- keep public API unchanged;
- keep token names and values unchanged;
- keep state behavior unchanged;
- keep rendered output unchanged;
- introduce the family README and mandatory style layers;
- assign each official token to one canonical owner file;
- declare canonical tokens independently of active configuration and state;
- route each stateful property through its declared matrix and actual DOM owner;
- preserve existing consumers and verification;
- enable blocking architecture validation for `MDButton`.

Do not correct Material deviations in the architecture-only PR. `MDButton` is not a `combined-approved` exception.

## Phase 4: `MDButton` alignment

After architecture migration is stable, complete a separate focused Material alignment PR.

The alignment PR must address only documented remaining gaps, including as applicable:

- exact official component-token routes;
- label and icon property ownership;
- content-color motion ownership;
- disabled, selected, focused, and forced-state property resolution;
- simultaneous focus-indicator and pressed-state behavior;
- override verification;
- Storybook and browser evidence;
- honest component-registry status.

Use [Component conversion checklist](./component-conversion-checklist.md) as the completion gate.

## Phase 5: independent `MDSwitch` pilot

Validate `layered-v1` on `MDSwitch` before declaring the architecture universal across the library.

`MDSwitch` is the independent pilot because it combines:

- selected and unselected semantic states;
- disabled selected and disabled unselected routes;
- keyboard activation;
- pointer drag behavior;
- presentation mode;
- multiple anatomy owners;
- potential family-level token ownership shared by related selection-control surfaces.

The pilot must determine whether fixed layers, canonical token ownership, property-specific state resolution, behavior ownership, and validator rules remain clear without Button-specific exceptions.

If the architecture requires repeated exceptions, hidden routing, or new generic infrastructure to fit `MDSwitch`, stop and revise the architecture before migrating further families.

## Phase 6: library migration

After both pilots are accepted, migrate component families one at a time in dependency and usage order.

Each migration must:

- start from a ready component contract;
- use architecture-only and alignment-only PRs for large or stateful legacy components;
- update the component registry and family README atomically with production and verification;
- add blocking validation for the migrated family;
- preserve consumer scenarios and verify the declared blast radius;
- remove replaced token routes and obsolete logic completely.

Suggested order after the pilots:

1. remaining Button-directory components, each according to its own official Material surface;
2. Lists;
3. Cards and Dialogs;
4. Text fields and selection controls;
5. Chips and Menus;
6. Navigation, App bars, Toolbars, and Sheets;
7. Progress indicators, Tooltips, Dividers, and other smaller surfaces.

The order may change only through an architecture decision based on dependencies, active product work, or risk. It must not change because several unrelated families happen to share similar CSS.

## Token structure constraint

Reference and system tokens remain in the Material foundation.

Component tokens do not move into a global `src/shared/lib/md/tokens/comp` catalog. A component-specific canonical token belongs to `<Component>.tokens.css`. An exact official family token may belong to `<Family>.tokens.css` only when the ready contract names at least two consuming public components and their applicable roots.

Shared low-level primitives expose generic private bridges and never read component-family token names directly.

A later tooling change may generate reports or allowlists from family-owned CSS and family README contracts, but it must not create a second runtime source of truth.
