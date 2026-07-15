# Material 3 adoption plan

## Principle

Adopt Material 3 incrementally through the standalone library at `src/shared/ui/material`.

Standard components should be authored independently by the coding agent from required scenarios, official Material documentation, accepted foundation contracts, repository rules, native semantics, and deterministic architecture workflows.

Use architecture escalation only for genuine ambiguity, project extensions, ownership conflicts, foundation corrections/replacements, new generic infrastructure, compatibility decisions, or unverifiable required behavior.

Foundation is improved from confirmed component and product needs. Do not build a complete design-system framework or move the complete legacy UI tree in advance.

## Phase 1: architecture and authoring policy

Maintain:

- official Material source-of-truth workflow;
- Material library boundary and migration rules;
- foundation architecture and current foundation registry;
- units, reference/system tokens, theme, typography, shape, elevation, motion, state/ripple/focus, icons, overlays, accessibility, density, and adaptivity contracts;
- component usage and composition contracts;
- four deterministic component profiles separating configuration routing from state resolution;
- conditional token layers and shortest property pipelines;
- public API and anatomy rules;
- property-specific state resolution;
- Storybook, registries, deviations, and verification rules.

The policy must enable normal component creation without a bespoke architect-prepared specification while preventing local substitutes, scattered new Material owners, and speculative abstractions.

## Phase 2: establish the library boundary

Treat `src/shared/ui/material` as the canonical location for all new Material implementation.

Add blocking checks for new work:

- new official public `MD*` components exist only under `material/components`;
- new Material foundation runtime owners exist only under `material/foundation`;
- Material patterns exist only under `material/patterns` after the pattern gate passes;
- the library imports no product layer;
- foundation imports no component or pattern;
- families do not deep-import other families;
- product consumers do not deep-import implementation files;
- project-specific UI is not presented as an official Material component;
- generic `shared/lib` infrastructure does not acquire hidden Material ownership.

Do not create empty namespace directories or a root production barrel before the first production migration.

Legacy Material paths remain advisory for strict local repairs. They are not templates for new components or foundation artifacts.

## Phase 3: foundation inventory and enforcement

Use `foundation-registry.md` as the current alignment/status source and `src/shared/ui/material/README.md` as the physical migration map. Historical audits remain evidence only.

Implement verify-managed checks for:

- registered public foundation tokens, utilities, primitives, and private bridges;
- exact current and canonical owner paths;
- public/private contracts;
- no component-family knowledge in generic owners;
- one canonical reference/system token owner;
- no duplicate theme, unit, state, ripple, focus, typography, motion, icon, overlay, or adaptive mechanism;
- source snapshot and status consistency;
- deprecated foundation contracts unused by new code;
- component blueprint dependency declarations.

Start with foundation domains required by the Button family rather than validating or relocating every historical domain at once.

Keep unclassified legacy owners advisory-only. Make checks blocking once a domain migration starts and after the canonical owner is accepted.

Do not build a runtime token registry, universal Material base, CSS-generation DSL, global state precedence, cross-family state machine, complete palette generator, or adaptive manager.

## Phase 4: component architecture enforcement

Implement verify-managed checks for:

- canonical `material/components/<family>` location for new and migrating families;
- Material usage and composition contract;
- foundation dependency table and registry status;
- selected architecture profile and exact file set;
- layer declaration and selector ownership;
- exact official component-token names;
- canonical token ownership and root selectors;
- private-variable boundaries and alias necessity;
- family README blueprint consistency;
- rendered-property matrix coverage;
- obsolete parallel routes, legacy exports, and local foundation substitutes.

Keep unrelated legacy components advisory-only. Make checks blocking for each new or migrated component.

## Phase 5: Button foundation preparation

Before moving `MDButton`, validate the minimum foundation contracts it consumes:

- reference/system tokens and theme;
- units and typography;
- shape and elevation;
- motion;
- state layer, ripple, and focus;
- target area and accessibility;
- icon foundation when applicable.

For each domain choose one:

- keep the current legacy owner temporarily and declare it as an accepted dependency;
- perform `library-relocation-only` when path movement is behavior-preserving;
- perform a focused foundation correction/replacement under its stricter change mode.

Do not split a monolithic owner or change token values merely to match the target directory diagram.

## Phase 6: `MDButton` library and architecture pilot

Use `MDButton` as the first family migration because it concentrates API, token inventory, configuration routing, state resolution, property ownership, geometry, motion, focus, ripple, typography, shape, elevation, target area, and accessibility.

The architecture migration should combine physical relocation only when the complete result remains one family, behavior-preserving, and reviewable.

It must:

- move the family to `src/shared/ui/material/components/button`;
- preserve public API and behavior;
- preserve token names and values;
- preserve rendered output;
- create the family README usage and dependency contract;
- select the smallest applicable profile and shortest property pipelines;
- separate token, route, state, and rendering ownership;
- consume accepted foundation owners without local copies;
- add the curated Material library export;
- migrate every in-repository consumer import;
- update Storybook, tests, registries, and the library migration map;
- remove old Button files and exports;
- enable blocking library/foundation/component validation.

Do not mix remaining visual alignment or unrelated foundation corrections into this migration.

## Phase 7: `MDButton` alignment

After migration, address only documented remaining deviations:

- exact official routes;
- label and icon property ownership;
- content-color motion;
- disabled, selected, focus, pressed, and forced-state property resolution;
- public override and foundation-bridge verification;
- Storybook and registry accuracy.

A discovered foundation correction uses its own focused change mode and consumer review.

## Phase 8: `MDSwitch` independent pilot

Migrate `MDSwitch` to `material/components/switch` and validate the same library, foundation, authoring, and validator rules.

The pilot exercises:

- selected and unselected semantic states;
- disabled state routes;
- keyboard activation;
- pointer drag behavior;
- presentation mode;
- multiple anatomy owners;
- independent property outputs;
- stateful behavior that may not require configuration routing;
- state/ripple/focus, motion, shape, color, accessibility, and target-area dependencies.

If the architecture needs repeated exceptions, Button-specific validator logic, cross-family private imports, or local foundation workarounds, revise it before migrating further families.

## Phase 9: autonomous new-component proof

Create one genuinely new or previously missing Material component directly under `material/components/<family>` for a confirmed product scenario.

The coding agent must be able to:

1. perform bounded component and foundation source lookup;
2. derive the correct Material component choice and usage contract;
3. derive the minimum complete supported surface;
4. declare and validate foundation dependencies;
5. close only qualifying additive foundation gaps without architecture churn;
6. create a ready compact family blueprint;
7. select the correct smallest profile without empty layers;
8. implement shortest property pipelines without convenience aliases;
9. expose the component through the library public API;
10. implement semantics, tokens, states, Storybook, and tests;
11. pass blocking library/foundation/component validation;
12. complete the component without architecture correction rounds.

A successful legacy move alone does not prove autonomous authoring.

## Phase 10: incremental library migration

After both legacy pilots and the new-component proof are accepted, migrate families and foundation domains one at a time according to product need and dependency risk.

Each migration:

- starts from required scenarios, usage evidence, official sources, current registry records, and the physical migration map;
- changes one cohesive family or foundation owner;
- updates owner README, code, public exports, all consumers, registries, Storybook, tests, and migration status atomically;
- uses `library-relocation-only`, `architecture-only`, and `alignment-only` intentionally;
- makes validation blocking for accepted canonical owners;
- removes old files and exports;
- does not introduce permanent compatibility re-exports;
- does not broaden into unrelated family or foundation work.

Foundation maintenance continues through component-discovered additive gaps, focused corrections/replacements, explicit source-snapshot refreshes, and representative consumer verification.

Similar CSS or proximity in the legacy tree is not a reason to combine migrations or extract foundation code.

## Success criteria

The workflow is successful when:

- an agent knows one canonical location for every new Material artifact;
- an agent can create a standard Material component from a concise request without a bespoke architecture task;
- the correct Material component and usage pattern are selected;
- foundation, components, patterns, project UI, and generic infrastructure remain separate;
- components consume accepted foundation owners instead of recreating common behavior;
- real foundation gaps produce focused reusable contracts;
- new work no longer grows legacy Material directories;
- migrations update every consumer and remove old paths;
- unsupported optional features remain explicit instead of becoming speculative API;
- simple components stay simple and complex components use only required layers;
- validator failures catch location, dependency, foundation, usage, ownership, and component drift before review;
- one implementation round plus focused correction is normally sufficient;
- foundation, family, and migration contracts remain compact, current, and honest;
- implementation and review token usage stays bounded to the relevant family and foundation domains.