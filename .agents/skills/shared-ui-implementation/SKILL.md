---
name: shared-ui-implementation
description: 'Use for project-specific or generic src/shared/ui primitives outside official Material component families. Enforces owner boundaries, explicit DOM/native contracts, minimal Vue structure, public API discipline, consumer blast-radius review, and focused verification.'
paths:
  - 'src/shared/ui/**'
  - 'tests/e2e/visual/**'
  - 'tests/e2e/storybook/**'
---

# Shared UI implementation

Use for project-specific presentation primitives, wrappers, layout primitives, and generic shared UI infrastructure outside official Material component families.

For a new, migrated, aligned, or materially changed official public Material component family, use `material-component-authoring` instead. Do not assemble that workflow from this generic skill.

## Scope

This skill owns general Vue/shared-UI implementation discipline:

- explicit public contracts;
- narrow state and behavior ownership;
- native DOM and accessibility semantics;
- parent/child styling boundaries;
- generic browser and lifecycle behavior;
- consumer blast-radius review;
- focused contract, browser, and visual verification.

It does not own Material family blueprints, component profiles, foundation dependencies, token routing, canonical `StateMatrix`, or Material migration.

## Before production edits

Record briefly:

1. public props, emits, slots, and entry point;
2. runtime, state, DOM, accessibility, and cleanup owners;
3. affected consumers and preserved scenarios;
4. existing primitives, helpers, and infrastructure to reuse;
5. minimum implementation and rejected broader alternatives;
6. applicable contract, browser, visual, and consumer verification.

Use `implementation-preflight` for non-trivial work. Stop when ownership, consumer impact, native semantics, final behavior, or required verification is unresolved.

## Ownership

Shared UI may own reusable presentation and interaction behavior that is independent of product/domain models.

Product layers retain:

- information architecture;
- workflow and domain state;
- product-specific component choice and placement;
- feature-specific recovery and navigation;
- product-level adaptive composition.

Do not move product behavior into shared UI merely to centralize files or reduce duplication.

## Vue and state

- Use typed props, emits, slots, small named computeds, and composables with one clear owner.
- Prefer several readable computed conditions over inline boolean algebra or a synthetic render-plan object.
- Keep controlled state consumer-owned and avoid hidden parallel copies.
- Keep transient state only when the component owns the lifecycle; define acquire, release, cancellation, disabled behavior, failure behavior, and unmount cleanup.
- Extract behavior only when complexity or current reuse justifies a separate helper/composable.
- Do not hide unrelated behavior behind a broad options object.

## DOM and accessibility

- Keep `href`, `type`, `disabled`, `readonly`, `tabindex`, `role`, and `aria-*` explicit on the actual DOM owner.
- Prefer native button, link, form, focus, and keyboard behavior.
- Do not synthesize native activation to compensate for an incorrect element choice.
- Use object `v-bind` only for controlled consumer-attribute forwarding, not as the sole owner of component-critical attributes.
- Define accessible names, focus owner, keyboard behavior, target area, and disabled/readonly semantics where applicable.

## Parent and child boundaries

- A parent must not use `:deep()` to style another component's private anatomy.
- Pass required facts through a narrow prop or context and let the child style its own root and internals.
- Internal classes, private CSS variables, DOM structure, and test adapters are not public APIs.
- Do not reposition or restyle neighboring elements in a consumer's parent flow.

## CSS and presentation

- Use standard CSS source; browser compatibility transforms belong to the build pipeline.
- Handwritten vendor-only properties are allowed only when no standardized equivalent exists and the behavior is explicitly required.
- Use accepted shared typography and token utilities rather than recreating their declarations locally.
- Keep layout, scrolling, sticky/floating behavior, teleport, and overlays tied to the actual rendered hierarchy.
- `!important` and cross-component private styling are forbidden.

## Public API and reuse

- Keep public contracts narrow, typed, and domain-agnostic.
- Reuse an existing correctly owned primitive before creating a near-duplicate.
- Update in-repository consumers when changing an internal shared API; do not keep compatibility aliases by default.
- Use public entry points and do not expose implementation or testing files.
- Similar syntax, file count, hypothetical reuse, or test convenience does not justify a new abstraction.

## Testing

Use the proof layer that owns the changed contract:

- Vue Test Utils for props, emits, slots, native owner, ARIA, and structural wiring;
- focused Vitest for extracted pure behavior;
- Playwright for focus, keyboard, pointer/touch, layout, scrolling, overlays, responsive behavior, and cleanup;
- visual regression for appearance and layout;
- focused consumer checks when a shared contract changes.

Do not use unit tests to claim browser behavior or visual correctness. Do not duplicate framework/browser behavior without a project-owned contract.

## Completion

Before completion confirm:

- public contract and ownership remain narrow;
- no product logic or domain dependency entered shared UI;
- consumers and preserved scenarios were reviewed;
- no obsolete path, alias, or parallel implementation remains without an explicit compatibility requirement;
- applicable focused checks and final repository verification pass.
