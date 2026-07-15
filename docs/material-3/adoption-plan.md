# Material 3 adoption plan

## Principle

Adopt Material 3 incrementally through source-backed component work. Standard components should be authored independently by the coding agent from required scenarios, official Material documentation, repository rules, native semantics, and the deterministic architecture workflow.

Use architecture escalation only for genuine ambiguity, project extensions, ownership conflicts, new generic infrastructure, compatibility decisions, or unverifiable required behavior.

## Phase 1: authoring policy

Maintain:

- official Material source-of-truth workflow;
- units and token namespaces;
- baseline theme;
- four deterministic profiles separating configuration routing from state resolution;
- conditional token layers and shortest property pipelines;
- public API and anatomy rules;
- property-specific state resolution;
- accessibility and native semantics;
- Storybook, registry, deviation, and verification rules.

The policy must enable normal component creation without a bespoke architect-prepared specification.

## Phase 2: architecture and token enforcement

Implement verify-managed checks for:

- selected architecture profile and exact file set;
- layer declaration and selector ownership;
- exact official component-token names;
- canonical token ownership and root selectors;
- private-variable boundaries and alias necessity;
- family README blueprint consistency;
- rendered-property matrix coverage;
- obsolete parallel routes.

Keep unrelated legacy components advisory-only. Make checks blocking for each new or migrated component.

Do not build a runtime token registry, generic Material base, CSS-generation DSL, global state precedence, or cross-family state machine.

## Phase 3: `MDButton` pilot

Use `MDButton` as the first architecture migration because it concentrates API, token inventory, configuration routing, state resolution, property ownership, geometry, and motion in one large component.

The architecture-only migration must:

- preserve public API and behavior;
- preserve token names and values;
- preserve rendered output;
- create the family README blueprint;
- select the smallest applicable profile and shortest property pipelines;
- separate token, route, state, and rendering ownership;
- enable blocking validation;
- preserve named consumers and existing verification.

Do not mix remaining Material alignment corrections into the architecture-only migration.

## Phase 4: `MDButton` alignment

After migration, address only documented remaining deviations:

- exact official routes;
- label and icon property ownership;
- content-color motion;
- disabled, selected, focus, pressed, and forced-state property resolution;
- public override verification;
- Storybook and registry accuracy.

## Phase 5: `MDSwitch` independent pilot

Validate the same authoring and validator rules on `MDSwitch`, which exercises:

- selected and unselected semantic states;
- disabled state routes;
- keyboard activation;
- pointer drag behavior;
- presentation mode;
- multiple anatomy owners;
- independent property outputs;
- stateful behavior that may not require configuration routing.

If the architecture needs repeated exceptions or Button-specific validator logic, revise it before migrating further families.

## Phase 6: autonomous new-component proof

Before declaring the workflow complete, use it for one genuinely new or previously missing Material component requested by a product scenario.

The coding agent must be able to:

1. perform bounded Material source lookup;
2. derive the minimum complete supported surface, including canonical-default fallback for a concise request;
3. create a ready compact family blueprint;
4. select the correct smallest profile without empty layers;
5. implement shortest property pipelines without convenience aliases;
6. implement API, semantics, tokens, states, Storybook, and tests;
7. pass blocking validation;
8. complete the component without architecture correction rounds.

A successful legacy migration alone does not prove autonomous authoring.

## Phase 7: library migration

After both legacy pilots and the new-component proof are accepted, migrate families one at a time.

Each migration:

- starts from required scenarios and official sources;
- updates the family README blueprint, code, registry, Storybook, and verification atomically;
- uses architecture-only and alignment-only PRs for large legacy components;
- makes validation blocking for accepted components;
- removes replaced logic completely;
- does not broaden into unrelated family work.

Suggested order may follow active product need and dependency risk. Similar CSS alone is not a reason to combine families.

## Success criteria

The workflow is successful when:

- an agent can create a standard Material component from a concise request without a bespoke architecture task;
- unsupported optional features remain explicit instead of becoming speculative API;
- simple components stay simple and complex components use only required layers;
- validator failures catch structural drift before review;
- architecture review finds no hidden ownership, scope, state, or alias decisions;
- one implementation round plus focused correction is normally sufficient;
- family contracts remain compact and current;
- implementation and review token usage stays bounded to the relevant component surface.