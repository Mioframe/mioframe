---
name: shared-ui-implementation
description: 'Use for project-specific or generic src/shared/ui primitives outside official Material component families. Enforces owner boundaries, explicit DOM/native contracts, minimal Vue structure, public API discipline, consumer blast-radius review, and focused verification.'
---

# Shared UI implementation

Use for project-specific presentation primitives, wrappers, layout primitives, and generic shared UI infrastructure outside official Material component families.

Do not use this skill as the primary workflow for an official Material family, Vue-to-m3e implementation, or Material family migration. Use `material-component <name>` and the scoped `src/shared/ui/material/AGENTS.md` staged workflow instead. When a ready Material architecture chooses a separate non-MD shared component, apply this skill only to that separately owned component.

## Scope

This skill owns general Vue/shared-UI implementation discipline:

- explicit public contracts;
- narrow state and behavior ownership;
- native DOM and accessibility semantics;
- parent/child styling boundaries;
- generic browser and lifecycle behavior;
- consumer blast-radius review;
- focused contract, browser, and visual verification.

It does not own official Material design documents, Material family architecture, m3e integration, Material token mapping, global theme ownership, Material consumer migration, or Material family review.

## Before production edits

Record briefly:

1. public props, emits, slots, and entry point;
2. runtime, state, DOM, accessibility, and cleanup owners;
3. affected consumers and preserved scenarios;
4. existing primitives, helpers, and infrastructure to reuse;
5. minimum implementation and rejected broader alternatives;
6. applicable contract, browser, visual, and consumer verification;
7. why a separate component is necessary instead of consumer composition or extending an existing correctly owned component.

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

## Vue, roots, and state

- Use typed props, emits, slots, small named computeds, and composables with one clear owner.
- Prefer several readable computed conditions over inline boolean algebra or a synthetic render-plan object.
- Keep controlled state consumer-owned and avoid hidden parallel copies.
- Keep transient state only when the component owns the lifecycle; define acquire, release, cancellation, disabled behavior, failure behavior, and unmount cleanup.
- Extract behavior only when complexity or current reuse justifies a separate helper/composable.
- Do not hide unrelated behavior behind a broad options object.
- Keep one stable meaningful root whose class matches the component name.
- Do not add a wrapper only to carry a class, ARIA attribute, color variable, or layout that the actual child owner can carry directly.
- When a composed child can be the root, prefer forwarding the component root class and required public attributes to that child over adding a neutral `<span>` or `<div>`.

## DOM and accessibility

- Keep `href`, `type`, `disabled`, `readonly`, `tabindex`, `role`, and `aria-*` explicit on the actual DOM or component owner.
- `aria-busy` belongs on the interactive control or region whose state is busy, not on a decorative wrapper.
- Prefer native button, link, form, focus, event bubbling, and keyboard behavior.
- Do not synthesize native activation or stop propagation to preserve incidental legacy behavior.
- Use object `v-bind` only for controlled consumer-attribute forwarding, not as the sole owner of component-critical attributes.
- Define accessible names, focus owner, keyboard behavior, target area, disabled/readonly semantics, and busy-state announcements where applicable.
- When composing another shared component, require an explicit public path for critical ARIA/native state instead of attaching semantics to a non-owning ancestor.

## Parent and child boundaries

- A parent must not use `:deep()` to style another component's private anatomy.
- Pass required facts through a narrow prop, slot, attribute, or context and let the child style its own root and internals.
- Internal classes, private CSS variables, DOM structure, and test adapters are not public APIs.
- Do not reposition or restyle neighboring elements in a consumer's parent flow.
- Do not duplicate a child's variant, disabled, selected, hover, focus, pressed, or theme color matrix in the wrapper.
- Prefer public inheritance such as `currentColor` or an explicit child-owned semantic hook when composed content must follow the child's rendered state.

## CSS and presentation

- Use standard CSS source; browser compatibility transforms belong to the build pipeline.
- Handwritten vendor-only properties are allowed only when no standardized equivalent exists and the behavior is explicitly required.
- Use accepted shared typography and token utilities rather than recreating their declarations locally.
- Keep layout, scrolling, sticky/floating behavior, teleport, and overlays tied to the actual rendered hierarchy.
- `!important` and cross-component private styling are forbidden.
- A wrapper must not recreate a Material or child component theme. Styling should derive from public semantic tokens, inherited color, or a narrow owned extension.

## Public API and reuse

- Keep public contracts narrow, typed, and domain-agnostic.
- Reuse an existing correctly owned primitive before creating a near-duplicate.
- Update in-repository consumers when changing an internal shared API; do not keep compatibility aliases by default.
- Use public entry points and do not expose implementation or testing files.
- Similar syntax, file count, hypothetical reuse, or test convenience does not justify a new abstraction.
- Do not mirror every prop of a composed child. Expose only the subset needed by current consumers and define how unsupported child capabilities are handled.

## Stories and documentation

Follow `docs/testing/storybook.md`.

- Colocate stories as `<Owner>.stories.ts` next to the truthful shared-UI owner.
- Use the deterministic `Shared/<Slice>/<Owner>` catalogue hierarchy for non-Material shared UI.
- Do not place project-specific components under `Material 3/...` or imply their APIs are official Material.
- Create stories only when the owner has meaningful isolated Playground, documentation, fixture, or visual value; do not add them mechanically.
- For a reusable component with meaningful configurable public inputs, provide or preserve an args-driven `Playground` story unless another story already gives the same interactive value.
- Let Vue metadata generate Controls by default. Add `argTypes` only for public options/inference gaps; do not mirror the component API manually or expose private implementation state.
- Keep stories deterministic and free of product stores, services, workers, persistence, product routing, network, diagnostics, and business behavior.
- Routing-aware reusable UI uses only the Storybook-owned router harness defined by `docs/testing/storybook.md`; application route workflows stay in E2E.
- Storybook `play` is not merge proof.
- Physical browser/visual Playwright spec placement follows the current executable state in `docs/testing/migration-plan.md`.

## Testing

Use the proof layer that owns the changed contract:

- Vue Test Utils for props, emits, slots, actual native/ARIA owner, root structure, attribute forwarding, bubbling, and structural wiring;
- focused Vitest for extracted pure behavior;
- Storybook browser behavior for reusable focus, keyboard, pointer/touch, event propagation, layout, scrolling, overlays, responsive behavior, routing, and cleanup when the isolated UI owner owns the contract;
- application E2E for complete cross-owner product scenarios;
- visual regression for stable appearance only;
- focused consumer checks when a shared public contract changes.

For wrappers/compositions, test production-used combinations rather than only the happy path. Include disabled plus busy/loading, restoration of replaced slot content, inherited color/state, native form behavior, and click bubbling when those scenarios exist.

Do not use unit tests to claim browser behavior or visual correctness. Do not put screenshots in browser-behavior specs or behavior assertions in visual specs. Do not duplicate framework/browser behavior without a project-owned contract.

## Completion

Before completion confirm:

- public contract and ownership remain narrow;
- no product logic or domain dependency entered shared UI;
- one meaningful root owns the component semantics;
- ARIA/native state is attached to the actual owner;
- child variant/state/color logic is not duplicated;
- applicable stories are colocated under the correct `Shared/...` hierarchy;
- configurable reusable UI has a useful Controls/Playground surface when applicable;
- routing-aware stories use isolated Storybook routing rather than product bootstrap;
- browser/visual proof follows current executable placement rather than unsupported target colocation;
- consumers and preserved scenarios were reviewed;
- no obsolete path, alias, wrapper, or parallel implementation remains without an explicit requirement;
- applicable focused checks and final repository verification pass.
