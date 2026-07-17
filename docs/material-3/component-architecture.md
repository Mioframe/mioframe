# Material 3 component architecture

This document defines the production ownership and adaptive family-contract model for official public Material components under:

```text
src/shared/ui/material/components/<family>
```

It owns family boundaries, public contracts, state and DOM ownership, token routing, implementation responsibilities, and the minimum contract required before production changes.

## Scope

Apply this architecture to:

- every new public official `MD*` component;
- every legacy public `MD*` family migrated into the Material library;
- every material change to a migrated family's API, semantics, anatomy, state, tokens, behavior, or visible contract.

A strict local repair to an unmigrated component may record `Architecture impact: none` only when location, imports, public API, native semantics, foundation dependencies, anatomy, states, tests, behavior, and unrelated output remain unchanged.

## Authoring modes

Record one mode before production edits:

- `standard-authoring` — applicable decisions follow from scenarios, official sources, repository contracts, and native semantics;
- `handoff-authoring` — a ready architecture handoff defines a specific unresolved delta;
- `blocked` — a required product, source, ownership, compatibility, foundation, or verification decision remains unresolved.

Do not replace a real blocker with a broad option, local substitute, compatibility alias, or speculative abstraction.

## Sources of truth

1. This document owns component architecture and contract shape.
2. The family `README.md` owns the accepted contract for that family.
3. `foundation-architecture.md` and the foundation registry own cross-family contracts.
4. `component-testing.md` owns proportional proof and visual evidence.
5. A task handoff owns only the approved current delta.

Code, public exports, family contract, tests, stories, migration map, and any directly affected registry or inventory record must agree.

## Bounded discovery

1. Read applicable `AGENTS.md` and Material skills.
2. Inspect the selected family, direct consumers, public exports, tests, stories, and known defects.
3. Inspect only the foundation domains required by the selected family.
4. Resolve current official Material 3 Expressive guidance for the required scenarios.
5. Use the official Design Kit only when published guidance cannot resolve an applicable visual decision.
6. Stop discovery when supported surface, ownership, semantics, states, dependencies, and proof needs are clear.

Do not inspect unrelated families to invent a generic design.

## Minimum complete surface

Implement the smallest coherent official surface required by current scenarios and consumers.

- Start from named scenarios and final behavior.
- Use the canonical Material default when no narrower scenario is supplied.
- Add variants, sizes, shapes, modes, anatomy, or behavior only for a current requirement.
- Include every reachable state, accessibility requirement, and dependency of the supported surface.
- Record unused official capabilities as unsupported.
- Add no Mioframe extension without an explicit requirement and owner.

Minimum scope does not mean an incomplete state model or inaccessible implementation.

## Family ownership

A family is a durable ownership boundary, not a copy of the legacy tree.

Multiple public components share one family only when:

1. official Material guidance treats them as one family or parent/child set;
2. a real current production contract is shared, such as tokens, anatomy, runtime context, or behavior;
3. shared ownership is clearer than separate ownership.

Similar appearance, adjacent legacy paths, repeated CSS, or hypothetical reuse are insufficient.

A family must not deep-import another family's private files. Shared cross-family concerns belong to a proven foundation owner.

## Change modes

Record one mode:

- `new-component` — creates a required official component directly in the canonical library;
- `end-to-end-migration` — migrates one legacy family and may include reviewable architecture and Expressive alignment work;
- `library-relocation-only` — moves an already acceptable family without intended API, behavior, token, rendered-output, or verification changes;
- `alignment-only` — corrects named Material deviations in an already canonical family.

`end-to-end-migration` is the default for sequential library population. Split relocation, foundation, or alignment work only when blast radius, reviewability, or a safer independently valid intermediate state justifies it.

Do not combine unrelated families, broad shared cleanup, or unrelated foundation corrections.

## Adaptive family contract

Create or update the family `README.md` before production edits. The contract contains a small mandatory core and only the conditional sections applicable to the supported surface.

### Mandatory core

```text
MATERIAL COMPONENT CONTRACT

Authoring mode: standard-authoring | handoff-authoring
Change mode: new-component | end-to-end-migration | library-relocation-only | alignment-only

Family:
Components:
Family ownership basis:

Current owner: none | <path>
Canonical owner: src/shared/ui/material/components/<family>
Migration status: legacy | migrating | migrated
Public export:
Affected consumers:

Required scenarios:
Non-goals:
Official sources and snapshot:
Supported Material surface:
Unsupported Material surface:
Public API:
Native semantics and accessibility:
Invalid combinations:

Applicable foundation dependencies:
Production and public files:
Applicable proof:
Extensions or deviations: none | <records>

Unresolved: none | <blocking decisions>
Readiness: ready | blocked
```

### Conditional sections

Add a section only when the family owns the corresponding concern:

- `Anatomy and DOM ownership` — for multiple semantic, interactive, or rendered parts;
- `State ownership and lifecycle` — when semantic, interaction, transient, or controlled state applies;
- `Token and property routing` — when official component tokens or varying rendered properties apply;
- `Configuration routes` — when configuration selects different property sources;
- `Browser behavior` — when the component constrains browser-owned interaction;
- `Visual evidence` — when visible output or multiple distinct visual routes require review;
- `Consumer migration` — when current consumers or compatibility paths change;
- `Foundation change` — when a cross-family owner changes.

Omit an inapplicable section instead of filling it with ceremonial `none` values.

`Readiness: ready` requires every applicable decision to be resolved. It does not require speculative decisions for capabilities outside the supported surface.

No other document may add hidden mandatory fields.

## State ownership

Every supported state has one source of truth and change path.

- Consumer semantic state exposed through a prop remains consumer-controlled.
- User interaction emits intent or a next value; the consumer updates controlled state.
- Browser facts such as hover, focus-visible, and ordinary pressed acquisition remain browser or foundation owned.
- Component-owned transient state is allowed only for owned gesture, overlay, animation, or unavoidable native coordination.

Transient state defines acquisition, release, cancellation, disabled behavior, failure behavior, and unmount cleanup when applicable.

Do not keep a hidden copy of controlled state or infer product state from visual interaction state.

## Anatomy and DOM ownership

For each applicable interactive or semantic part, identify:

- native element or role;
- focus and accessible-name owner;
- ARIA, disabled, and readonly owner;
- target-area owner;
- state-layer, ripple, and focus-indicator owner;
- consumer interactive-content policy;
- final rendered-property owner.

Each concern has one owner. Parent and child components must not implicitly split activation, focus, accessibility, interaction surface, or final rendering.

## Production responsibilities

Keep responsibilities clear, but do not require a fixed number of files.

### Vue component

Owns:

- typed props, emits, and slots;
- native element and DOM-critical attributes;
- runtime fact acquisition and event wiring;
- anatomy and component-owned behavior;
- explicit style imports.

Do not put canonical visual values in TypeScript or create hidden render-plan/state-resolver frameworks.

### Component tokens

Use a dedicated token file only when the supported surface owns exact verified official component tokens.

Token declarations must remain independent of active state and configuration. Do not invent, shorten, or duplicate official token names.

### Configuration and state routing

Configuration routing and state resolution are separate responsibilities, but they may remain in one readable component stylesheet when each is small and unambiguous.

Extract dedicated route or state files only when separation:

- materially improves ownership clarity;
- supports focused verification;
- prevents selector or precedence ambiguity;
- is justified by the current family rather than symmetry.

Do not create empty or trivial layers merely to satisfy a profile.

### Rendering stylesheet

Owns layout, geometry, typography application, transitions, target area, and final property application to actual DOM owners.

Do not deep-style another family's internals.

## Additional production files

Create a helper, composable, context, or family anatomy file only when a current contract requires it and extraction reduces total complexity.

Examples:

- non-trivial keyboard, pointer, timing, or cleanup behavior deserving focused tests;
- behavior shared by at least two current public family components;
- a required parent/child runtime context;
- anatomy genuinely shared by current components in the family.

Similar syntax, possible future reuse, file count, or test convenience are insufficient.

## Token and property routing

Map official component-token paths mechanically and use the shortest applicable route from official source to the actual DOM owner.

- Every public `--md-*` value must have an exact verified official meaning.
- Every canonical token has one owner.
- Static values should not pass through convenience aliases.
- Configuration selects sources; state resolves applicable output; rendering applies final values.
- Generic foundations consume component-agnostic bridges only.
- Family-private variables must not escape the family.

Use a rendered-property table only when multiple states or configurations make ownership or precedence non-obvious.

## Foundation dependencies

List only applicable foundation domains.

For each dependency:

- identify the accepted current owner and required capability;
- reuse it when sufficient;
- name the exact non-blocking gap when status is partial or deviated;
- treat missing or blocked required capability as a blocker;
- use the foundation workflow when the shared contract changes.

Do not create a component-local substitute.

## Migration completion

An end-to-end migration must:

- create the canonical family owner;
- migrate affected consumers and public exports;
- remove obsolete owners and paths;
- preserve existing product behavior unless a named accepted delta changes it;
- update applicable tests, stories, visual evidence, and owned documentation;
- update only registry, inventory, roadmap, map, or risk records whose facts changed;
- avoid permanent compatibility aliases.

## Rule refinement

When implementation exposes an inaccurate or needlessly complex rule, update the owning rule with the smallest evidence-backed correction. Do not preserve the rule through a family-specific exception.

Escalate only for a genuine product decision, materially unresolved official source, cross-project public-contract change, or unsafe scope expansion.

## Completion

A family is complete when:

- its supported surface and ownership are explicit;
- code and public API implement the accepted contract;
- applicable foundations have one accepted owner;
- proportional proof covers semantics, behavior, visible output, and changed consumers;
- agent evidence review passes;
- required operator visual acceptance is recorded;
- obsolete ownership and compatibility paths are removed;
- repository verification passes.
