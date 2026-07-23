# Material component architecture

This document defines the production ownership and approved family-contract model for official public Material components under:

```text
src/shared/ui/material/components/<family>
```

It owns family boundaries, public contracts, state and DOM ownership, token routing, and the minimum contract required before production edits.

## Scope

Apply this architecture to:

- every new public official `MD*` component;
- every legacy public `MD*` family migrated into the Material library;
- every material change to a canonical family's API, semantics, anatomy, state, tokens, behavior, or visible contract.

A strict local repair to an unmigrated component may record `Architecture impact: none` only when ownership, imports, public API, native semantics, foundation dependencies, anatomy, states, proof surface, behavior, and unrelated output remain unchanged.

## Sources of truth

1. `workflow.md` owns stage and role separation.
2. This document owns component architecture and family-contract shape.
3. The family `README.md` owns the approved contract for that family.
4. `foundation-architecture.md` and `foundation-registry.md` own cross-family contracts.
5. `component-testing.md` owns proportional proof and visual evidence.
6. The explicit implementation task owns the approved current delta and Forbidden.

Code, public exports, family contract, consumers, tests, stories, migration map, and directly affected records must agree.

## Architect-owned discovery

Before marking a contract ready, the architect:

1. inspects the selected family, direct consumers, public exports, tests, stories, and known defects;
2. resolves current official Material 3 Expressive guidance for required scenarios;
3. inspects only the foundation domains required by the family;
4. selects the smallest cohesive family boundary;
5. defines the minimum complete supported surface;
6. resolves public API, native semantics, state source of truth, compatibility, acceptance criteria, and proof ownership;
7. records unsupported official capabilities and intentional deviations;
8. stops when every implementation-affecting decision is explicit.

Do not inspect unrelated families to invent a generic design.

## Minimum complete surface

Implement the smallest coherent official surface required by current scenarios and consumers.

- Start from named scenarios and final behavior.
- Use the current applicable Expressive default only when no narrower scenario is supplied.
- Add variants, sizes, shapes, modes, anatomy, or behavior only for a current requirement.
- Include every reachable state, accessibility requirement, and dependency of the supported surface.
- Record unused official capabilities as unsupported.
- Add no Mioframe extension without an explicit requirement, owner, and deviation record.

Minimum scope does not mean incomplete behavior or inaccessible implementation.

## Family ownership

Multiple public components share one family only when:

1. official Material guidance treats them as one family or parent/child set;
2. a real current production contract is shared, such as tokens, anatomy, runtime context, or behavior;
3. shared ownership is clearer than separate ownership.

Similar appearance, adjacent legacy paths, repeated CSS, or hypothetical reuse are insufficient.

A family must not deep-import another family's private files. Proven cross-family concerns belong to an approved foundation owner.

## Change modes

Record one mode:

- `new-component`;
- `end-to-end-migration`;
- `library-relocation-only`;
- `alignment-only`.

Use one cohesive end-to-end family migration by default. Split work only when foundation blast radius, compatibility, reviewability, or a safer independently valid intermediate state justifies it.

## Approved family contract

Create or update the family `README.md` before production edits.

The mandatory core is:

```text
MATERIAL COMPONENT CONTRACT

Change mode: new-component | end-to-end-migration | library-relocation-only | alignment-only

Family:
Components:
Family ownership basis:

Current owner: none | <path>
Canonical owner: src/shared/ui/material/components/<family>
Migration status: legacy | migrating | migrated
Public export:
Affected consumers:

Goal:
Required scenarios:
Non-goals:
What must not change:

Official sources and snapshot:
Supported Material surface:
Unsupported Material surface:
Public API:
Native semantics and accessibility:
State source of truth and change path:
Invalid combinations:

Applicable foundation dependencies:
Compatibility decision:
Production and public files:
Acceptance criteria:
Applicable proof owners:
Extensions or deviations: none | <records>

Unresolved: none | <blocking decisions>
Readiness: ready | blocked
```

Add conditional sections only when applicable:

- anatomy and DOM ownership;
- transient state and lifecycle;
- token and property routing;
- configuration/state precedence;
- browser behavior;
- visual evidence;
- consumer migration;
- foundation change.

Omit inapplicable sections instead of adding ceremonial fields.

`Readiness: ready` means every decision that can change architecture, ownership, public API, supported surface, compatibility, acceptance criteria, or verification ownership is resolved and approved.

The coding agent must not create or approve `Readiness: ready` for its own implementation task.

## State ownership

Every supported state has one source of truth and one change path.

- Consumer semantic state exposed through a prop remains consumer-controlled.
- User interaction emits intent or a next value; the consumer updates controlled state.
- Browser facts such as hover, focus-visible, and ordinary pressed acquisition remain browser or foundation owned.
- Component transient state is allowed only for owned gesture, overlay, animation, or unavoidable native coordination.
- Transient state defines acquisition, release, cancellation, disabled behavior, failure behavior, and unmount cleanup when applicable.

Do not keep a hidden copy of controlled state or infer product state from visual interaction state.

## Anatomy and DOM ownership

For each interactive or semantic part, identify:

- native element or role;
- focus and accessible-name owner;
- ARIA, disabled, and readonly owner;
- target-area owner;
- state-layer, ripple, and focus-indicator owner;
- consumer interactive-content policy;
- final rendered-property owner.

Each concern has one owner. Parent and child components must not implicitly split activation, focus, accessibility, interaction surface, or final rendering.

## Production responsibilities

Keep responsibilities explicit without requiring a fixed file profile.

- Vue components own typed props, emits, slots, native elements, DOM-critical attributes, runtime fact acquisition, events, anatomy, and explicit style imports.
- Token files exist only when the supported surface owns exact verified official component tokens.
- Configuration selects sources; state resolves applicable outputs; rendering applies final values to actual DOM owners.
- Helpers, composables, contexts, or shared anatomy files require a current contract and must reduce total complexity.

Do not create hidden render plans, universal bases, runtime registries, generic resolvers, CSS DSLs, cross-family state machines, or speculative extension points.

## Foundation dependencies

For each applicable dependency:

- identify the accepted current owner and required capability;
- reuse it when sufficient;
- name exact non-blocking gaps honestly;
- treat missing required capability as a contract blocker;
- approve a focused foundation change before implementation when the shared contract must change.

Do not create a family-local substitute.

## Migration completion

An end-to-end migration must:

- create the canonical family owner;
- migrate affected consumers and public exports;
- preserve accepted product behavior except for named approved deltas;
- remove obsolete owners and paths;
- update applicable tests, stories, visual evidence, and owned records;
- avoid permanent compatibility aliases.

## Contract invalidation

When implementation evidence invalidates the approved contract, the coding agent stops the affected work and returns the `CONTRACT BLOCKER` defined by `workflow.md` and `material-component-implementation`.

Repository rules are changed only through an explicit architecture decision. Do not silently rewrite policy or preserve a wrong rule through a family-specific exception.

## Completion

A family is technically complete only when:

- implementation matches the approved ready contract;
- ownership and public API are stable;
- required scenarios and consumers are complete;
- applicable foundations have one accepted owner;
- proportional proof covers owned semantics, behavior, visible output, and consumer changes;
- obsolete ownership and unapproved compatibility are removed;
- final repository verification passes;
- independent `material-component-review` passes;
- required operator visual acceptance is recorded.
