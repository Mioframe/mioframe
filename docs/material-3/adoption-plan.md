# Material 3 adoption plan

## Principle

Adopt Material 3 incrementally through source-backed foundation and component work. Standard components should be authored independently by the coding agent from required scenarios, official Material documentation, accepted foundation contracts, repository rules, native semantics, and deterministic architecture workflows.

Use architecture escalation only for genuine ambiguity, project extensions, ownership conflicts, foundation corrections/replacements, new generic infrastructure, compatibility decisions, or unverifiable required behavior.

Foundation is improved from confirmed component and product needs. Do not build a complete design-system framework in advance.

## Phase 1: architecture and authoring policy

Maintain:

- official Material source-of-truth workflow;
- foundation architecture and current foundation registry;
- units, reference/system tokens, theme, typography, shape, elevation, motion, state/ripple/focus, icons, overlays, accessibility, density, and adaptivity contracts;
- component usage and composition contracts;
- four deterministic component profiles separating configuration routing from state resolution;
- conditional token layers and shortest property pipelines;
- public API and anatomy rules;
- property-specific state resolution;
- Storybook, registries, deviations, and verification rules.

The policy must enable normal component creation without a bespoke architect-prepared specification while preventing local substitutes for missing foundation capabilities.

## Phase 2: foundation inventory and enforcement

Use `foundation-registry.md` as the current status source. Historical audits remain evidence only.

Implement verify-managed checks for:

- registered public foundation tokens, utilities, primitives, and private bridges;
- exact owner paths and public/private contracts;
- no component-family knowledge in generic owners;
- one canonical reference/system token owner;
- no duplicate theme, unit, state, ripple, focus, typography, motion, icon, overlay, or adaptive mechanism;
- source snapshot and status consistency;
- deprecated foundation contracts unused by new code;
- component blueprint dependency declarations.

Start with foundation domains required by the Button family rather than validating every historical domain at once.

Keep unclassified legacy foundation paths advisory-only. Make checks blocking for each accepted or verified foundation contract.

Do not build a runtime token registry, generic Material base, CSS-generation DSL, global state precedence, cross-family state machine, complete palette generator, or adaptive manager.

## Phase 3: component architecture enforcement

Implement verify-managed checks for:

- Material usage and composition contract;
- foundation dependency table and registry status;
- selected architecture profile and exact file set;
- layer declaration and selector ownership;
- exact official component-token names;
- canonical token ownership and root selectors;
- private-variable boundaries and alias necessity;
- family README blueprint consistency;
- rendered-property matrix coverage;
- obsolete parallel routes and local foundation substitutes.

Keep unrelated legacy components advisory-only. Make checks blocking for each new or migrated component.

## Phase 4: `MDButton` foundation and architecture pilot

Use `MDButton` as the first migration because it concentrates API, token inventory, configuration routing, state resolution, property ownership, geometry, motion, focus, ripple, typography, shape, elevation, target area, and accessibility.

Before component migration:

- validate or explicitly scope the required foundation registry records;
- confirm exact accepted contracts for tokens/theme, units, typography, shape, elevation, motion, state/ripple/focus, target area, and accessibility;
- correct no foundation behavior inside the architecture-only component migration unless it qualifies as a small additive delta.

The architecture-only migration must:

- preserve public API and behavior;
- preserve token names and values;
- preserve rendered output;
- create the family README usage and dependency contract;
- select the smallest applicable profile and shortest property pipelines;
- separate token, route, state, and rendering ownership;
- consume accepted foundation owners without local copies;
- enable blocking foundation/component validation;
- preserve named consumers and existing verification.

Do not mix remaining Material alignment corrections or foundation corrections into this migration.

## Phase 5: `MDButton` alignment

After migration, address only documented remaining deviations:

- exact official routes;
- label and icon property ownership;
- content-color motion;
- disabled, selected, focus, pressed, and forced-state property resolution;
- public override and foundation-bridge verification;
- Storybook and registry accuracy.

A discovered foundation correction uses its own focused change mode and consumer review.

## Phase 6: `MDSwitch` independent pilot

Validate the same foundation, authoring, and validator rules on `MDSwitch`, which exercises:

- selected and unselected semantic states;
- disabled state routes;
- keyboard activation;
- pointer drag behavior;
- presentation mode;
- multiple anatomy owners;
- independent property outputs;
- stateful behavior that may not require configuration routing;
- state/ripple/focus, motion, shape, color, accessibility, and target-area foundation dependencies.

If the architecture needs repeated exceptions, Button-specific validator logic, or local foundation workarounds, revise it before migrating further families.

## Phase 7: autonomous new-component proof

Before declaring the workflow complete, use it for one genuinely new or previously missing Material component requested by a product scenario.

The coding agent must be able to:

1. perform bounded component and foundation source lookup;
2. derive the correct Material component choice and usage contract;
3. derive the minimum complete supported surface, including canonical-default fallback for a concise request;
4. declare and validate foundation dependencies;
5. close only qualifying additive foundation gaps without architecture churn;
6. create a ready compact family blueprint;
7. select the correct smallest profile without empty layers;
8. implement shortest property pipelines without convenience aliases;
9. implement API, semantics, tokens, states, Storybook, and tests;
10. pass blocking foundation/component validation;
11. complete the component without architecture correction rounds.

A successful legacy migration alone does not prove autonomous authoring.

## Phase 8: library migration and continuous foundation improvement

After both legacy pilots and the new-component proof are accepted, migrate families one at a time.

Each migration:

- starts from required scenarios, usage evidence, official sources, and current foundation registry records;
- updates family README, affected foundation records, code, component registry, Storybook, and verification atomically;
- uses architecture-only and alignment-only PRs for large legacy components;
- makes validation blocking for accepted component and foundation contracts;
- removes replaced logic completely;
- does not broaden into unrelated family or foundation work.

Foundation maintenance continues through:

- component-discovered additive gaps;
- focused corrections/replacements;
- explicit source-snapshot refreshes;
- registry updates and representative consumer verification.

Suggested component order may follow active product need and dependency risk. Similar CSS alone is not a reason to combine families or extract foundation code.

## Success criteria

The workflow is successful when:

- an agent can create a standard Material component from a concise request without a bespoke architecture task;
- the correct Material component and usage pattern are selected;
- components consume accepted foundation owners instead of recreating common behavior;
- real foundation gaps produce focused, reusable, source-backed contracts;
- unsupported optional features remain explicit instead of becoming speculative API;
- simple components stay simple and complex components use only required layers;
- validator failures catch foundation, usage, ownership, and component drift before review;
- architecture review finds no hidden scope, state, alias, dependency, or composition decisions;
- one implementation round plus focused correction is normally sufficient;
- foundation and family contracts remain compact, current, and honest;
- implementation and review token usage stays bounded to the relevant component and foundation domains.
