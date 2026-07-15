# Material 3 adoption plan

## Principle

Adopt Material 3 incrementally through source-backed component-family work. Architecture, token ownership, public API, anatomy, state precedence, Storybook, verification, and deviations must be resolved before implementation.

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
- canonical `--md-comp-*` tokens are owned by the component family and remain at its definition boundary;
- generic state, ripple, focus, elevation, and motion primitives read generic private contracts only;
- public shared UI APIs are migrated together with in-repository consumers rather than preserved through compatibility-only aliases by default;
- existing overlay containment ownership is reused instead of introducing a numeric z-index ownership model;
- a ready `MATERIAL COMPONENT CONTRACT` is required before new or migrated public `MD*` implementation.

## Phase 2: Architecture enforcement

Establish and enforce [Component architecture](./component-architecture.md).

Required outcomes:

- `Architecture impact: none`, `layered-v1`, or `blocked` is recorded before public Material component edits;
- every `layered-v1` component has fixed Vue, token, route, state, and rendering layers;
- family README files hold durable architecture contracts;
- state precedence and actual DOM property owners are explicit;
- component-token ownership and private-variable boundaries are mechanically checked;
- implementation agents stop when a required architecture decision is absent.

Add verify-managed static validation incrementally:

1. implement checks against the first pilot;
2. keep legacy components advisory-only;
3. make checks blocking for each component after migration;
4. expand the validator only after the rule is proven on an independent second pilot.

Do not build a runtime token registry, generic component base, CSS-generation DSL, or cross-family state machine.

## Phase 3: `MDButton` architecture pilot

Use `MDButton` as the first `layered-v1` migration because its current implementation exposes the failure mode this architecture must solve: public API, official token inventory, private routing, state precedence, property ownership, geometry, and motion are concentrated in one large component file.

The architecture-only PR must:

- keep public API unchanged;
- keep token names and values unchanged;
- keep state behavior unchanged;
- keep rendered output unchanged;
- introduce the family README and mandatory style layers;
- route each stateful property through the declared pipeline;
- preserve existing consumers and verification;
- enable blocking architecture validation for `MDButton`.

Do not correct Material deviations in the architecture-only PR unless the architecture handoff explicitly classifies the component as a small `combined-approved` exception. `MDButton` is not such an exception.

## Phase 4: `MDButton` alignment

After architecture migration is stable, complete a separate focused Material alignment PR.

The alignment PR must address only documented remaining gaps, including as applicable:

- exact official component-token routes;
- label and icon property ownership;
- content-color motion ownership;
- disabled, selected, and forced-state precedence;
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
- multiple anatomy owners.

The pilot must determine whether the fixed layers, state model, behavior ownership, and validator remain clear without introducing Button-specific exceptions.

If the architecture requires repeated exceptions, hidden routing, or new generic infrastructure to fit `MDSwitch`, stop and revise the architecture before migrating further families.

## Phase 6: library migration

After both pilots are accepted, migrate component families one at a time in dependency and usage order.

Each migration must:

- start from a ready component contract;
- use architecture-only and alignment-only PRs for large or stateful legacy components;
- update the component registry and family README;
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

Component tokens do not move into a global `src/shared/lib/md/tokens/comp` catalog. Each migrated component owns canonical `--md-comp-*` declarations in its `<Component>.tokens.css` file. Shared low-level primitives expose generic private bridges and never read component-family token names directly.

A later tooling change may generate reports or allowlists from family-owned CSS, but it must not create a second runtime source of truth.
