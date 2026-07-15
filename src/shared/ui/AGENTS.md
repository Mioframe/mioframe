# src/shared/ui

Inherits `src/shared/AGENTS.md`. Applies to `src/shared/ui` and descendants until a deeper rule file refines it.

Use `shared-ui-implementation` and `material3-guidelines` for shared UI work. Public Material components also follow `docs/material-3/component-architecture.md` and `docs/material-3/foundation-architecture.md`. Use `material-foundation` when changing a cross-family foundation contract.

## Contains

- Shared presentation primitives, layout building blocks, overlay infrastructure, and interaction helpers.

## Patterns

- Drive components through explicit props, emits, slots, native semantics, and narrowly owned behavior.
- Accessibility, keyboard, pointer, touch, focus, usage, foundation dependencies, and property ownership are part of the component contract.
- Extend an existing primitive before adding a near-duplicate component.
- Keep scroll-aware, sticky, floating, and teleport behavior tied to the actual rendered hierarchy.
- Do not style or reposition neighboring parent-flow elements.
- For a new or materially changed public `MD*` component, use `standard-authoring`, `handoff-authoring`, or `blocked` before production edits.
- In `standard-authoring`, derive and write the compact family README blueprint from required scenarios, official Material sources, repository rules, accepted foundation contracts, and native semantics; a bespoke architect handoff is not required.
- Record the Material usage contract and applicable foundation-registry dependencies before production code.
- Select exactly one smallest objective profile: `simple`, `configured`, `stateful`, or `configured-stateful`.
- Add token, route, state, and private alias layers only when their documented condition applies; empty or convenience-only layers are forbidden.
- Canonical token files are independent of active configuration and state; routes and property-specific state resolution use their own layers.
- Consume existing foundation owners; do not recreate theme, typography, motion, state, focus, ripple, icon, overlay, unit, density, accessibility, or adaptive behavior locally.
- Family README, foundation/component registries, owner contracts, production code, Storybook, and verification must agree.
- Use `blocked` rather than inventing behavior when an escalation condition is present.

## Anti-patterns

- Do not import `entities`, `features`, `widgets`, or `pages` here.
- Do not couple shared UI to document, property, or view models.
- Do not hide unrelated behavior behind one broad options prop.
- Do not introduce a generic Material base, runtime token registry, token resolver, global property precedence, CSS DSL, cross-family state machine, second theme/overlay system, or family knowledge in generic foundations.
- Do not add optional Material capabilities, project extensions, compatibility aliases, foundation primitives, or abstractions without a named current scenario and documented owner.

## Constraints

- Base control, foundation, and layout changes have wide UI blast radius.
- Minimum verification: type-check plus focused verify-managed checks for changed API, semantics, foundation contract, state routing, property ownership, browser behavior, or appearance. Final completion requires repository verification.
- Standard component authoring must stay bounded to the relevant Material surface, applicable foundation domains, and named consumers.
