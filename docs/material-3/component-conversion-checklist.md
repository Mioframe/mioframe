# Material 3 component authoring checklist

Use for every new, migrated, or materially changed public shared Material component.

## 1. Authoring mode and source

- [ ] Recorded `standard-authoring`, `handoff-authoring`, `blocked`, or the strict local `Architecture impact: none` path.
- [ ] Checked the relevant official Material component and foundation pages through MCP.
- [ ] Used `m3-docs-cache` only when MCP was unavailable or incomplete and recorded cache health.
- [ ] Limited source lookup to the requested component surface and applicable foundation domains.
- [ ] Recorded exact sources and verified snapshot.
- [ ] Used `blocked` for unresolved official guidance instead of inventing behavior.

## 2. Required scope

- [ ] Started from named user scenarios and affected existing consumers.
- [ ] When no scenario was supplied, used only canonical Material default usage and kept optional capabilities unsupported.
- [ ] Chose an official Material component or documented composition.
- [ ] Included one canonical Material default.
- [ ] Added optional variants, sizes, shapes, modes, anatomy, or behavior only for named scenarios.
- [ ] Included every reachable state, semantic, accessibility, usage, and foundation requirement for the supported surface.
- [ ] Listed other official capabilities as unsupported rather than implementing them speculatively.
- [ ] Added no project extension without an explicit requirement.

## 3. Material usage and composition

- [ ] Recorded intended scenarios and when the component must not be used.
- [ ] Recorded component-choice evidence from official guidance.
- [ ] Recorded action/content hierarchy constraints.
- [ ] Recorded allowed Material compositions and placement constraints.
- [ ] Recorded adaptive behavior and its product/layout owner.
- [ ] For library-only work, used `Product integration in this PR: none` instead of inventing a consumer.
- [ ] For integrated work, product layers own information architecture, component choice, placement, and adaptive switching.

## 4. Foundation dependencies

- [ ] Added the dependency table from [Foundation architecture](./foundation-architecture.md).
- [ ] Checked every applicable domain against [Foundation registry](./foundation-registry.md).
- [ ] Named the accepted production owner and contract for each dependency.
- [ ] Confirmed that every partial or deviated dependency is sufficient for the exact supported surface.
- [ ] Used `blocked` when a required dependency or ownership decision is blocked.
- [ ] Classified every foundation delta as `none`, `additive`, `correction`, or `replacement`.
- [ ] Kept an additive delta in the component PR only when all same-PR conditions pass.
- [ ] Added no component-local substitute for a missing theme, token, typography, motion, state, focus, ripple, icon, overlay, unit, density, accessibility, or adaptive capability.
- [ ] Updated the foundation registry, owner contract, code, and tests atomically when a foundation contract changed.

## 5. Family blueprint

- [ ] Created or updated the family `README.md` before production code.
- [ ] Kept the blueprint compact and source-backed.
- [ ] Recorded scenarios, non-goals, usage contract, supported and unsupported surface, API, native semantics, invalid combinations, anatomy, states, foundation dependencies, token ownership, rendered-property matrix, files, verification, consumers, and deviations.
- [ ] Set `Unresolved: none` and `Readiness: ready` only after every required decision was resolved.
- [ ] For an existing family, changed only required README sections.
- [ ] The implementation introduced no decision absent from the blueprint or ready handoff.

## 6. Minimum architecture profile

- [ ] Selected exactly one smallest profile whose objective conditions apply.
- [ ] `simple` has neither configuration routes nor state resolution.
- [ ] `configured` has routes but no state resolution.
- [ ] `stateful` has state resolution but no configuration routes.
- [ ] `configured-stateful` has both routes and state resolution.
- [ ] Added `<Component>.tokens.css` only when the component owns at least one exact official token.
- [ ] Added `<Family>.tokens.css` only for exact shared official paths consumed by at least two public family components.
- [ ] No empty token, route, or state file exists for symmetry.
- [ ] No required layer was collapsed into another file.
- [ ] Optional family anatomy, behavior, composable, or context files satisfy exact extraction conditions.

## 7. Public contract and anatomy

- [ ] Public props are limited to supported configuration, semantic state, required native behavior, and explicit extensions.
- [ ] API names and values use Material vocabulary where applicable.
- [ ] Native elements and `href`, `type`, `disabled`, `tabindex`, `role`, and `aria-*` ownership are explicit.
- [ ] Slots represent only supported consumer-provided anatomy.
- [ ] Emits represent component-owned state changes or actions.
- [ ] Invalid combinations follow official guidance or are blocked for resolution.
- [ ] Each anatomy part and CSS property has one owner.
- [ ] Parent components do not style child internals through `:deep()`.

## 8. Tokens and routing

- [ ] Every public `--md-comp-*` maps mechanically to an exact verified official path.
- [ ] Every canonical token has one component or family owner file.
- [ ] Components with no owned official tokens have no empty component token file.
- [ ] Token files declare the complete supported override surface independently of active configuration and state.
- [ ] Token files contain no configuration modifiers, state selectors, pseudo-classes, private/app declarations, or rendering properties.
- [ ] Routes exist only when configuration selects different values.
- [ ] Missing official paths use documented private, system, or app-owned sources rather than invented component tokens.
- [ ] Available component tokens are not bypassed by direct system-token values.
- [ ] Family-private variables do not escape the family.
- [ ] Generic foundations read only generic private contracts.

## 9. State and rendering

- [ ] Created matrix rows only for properties that vary.
- [ ] Each row names DOM owner, applied/final value, route source, state inputs, winner rule, simultaneous outputs, and bridge.
- [ ] Grouped rows only when all routing and ownership columns are identical, while listing every property and applied/final value.
- [ ] State resolution is property-specific; no global precedence is applied to every property.
- [ ] Independent outputs coexist as documented.
- [ ] Static properties apply canonical/documented sources directly without private aliases.
- [ ] Configured non-stateful properties may apply route variables directly.
- [ ] Rendered private variables exist only for state-resolved output or a stable generic bridge input.
- [ ] Final values are applied to actual DOM property owners.
- [ ] Vue acquires runtime facts while CSS resolves visual state.
- [ ] Rendering CSS owns layout, geometry, presentation, transitions, and final property application only.

## 10. Simplicity

- [ ] Reused existing native semantics and accepted foundation contracts.
- [ ] Added no generic base component, runtime token registry, generic resolver, CSS DSL, cross-family state machine, second theme system, or broad options object.
- [ ] Extracted component behavior only for non-trivial testable lifecycle or gesture transitions.
- [ ] Added a component composable only for behavior required by at least two production components now.
- [ ] Added a foundation primitive only when the objective expansion rules are satisfied.
- [ ] Added no compatibility alias without an existing consumer requirement.
- [ ] Removed replaced and obsolete logic instead of retaining parallel paths.

## 11. Verification

- [ ] Product integration verifies component choice and composition when applicable.
- [ ] Contract tests cover supported API, native semantics, ARIA, invalid combinations, states, and extensions.
- [ ] Static validation covers foundation dependencies, selected profile, exact applicable layers, token names/owners, selectors, private boundaries, alias necessity, and README consistency.
- [ ] Browser tests cover focus, keyboard, pointer, gestures, overlays, adaptivity, computed CSS, public overrides, and actual property owners as applicable.
- [ ] Every reachable property-matrix route and simultaneous-output case is verified.
- [ ] Storybook documents supported and unsupported surface, usage, extensions, foundation dependencies, and deviations.
- [ ] Visual coverage is representative rather than a full Cartesian matrix.
- [ ] Every changed existing consumer has a preservation check.
- [ ] Every foundation correction or replacement has representative checks for distinct consumer paths.
- [ ] Tests do not verify framework, browser, or generic foundation internals the component does not own.
- [ ] Final verify follows repository rules.

## 12. Completion

- [ ] Family README, foundation/component registries, owner contracts, production code, Storybook, and verification agree.
- [ ] Unsupported features and deviations are explicit.
- [ ] No escalation condition was hidden as a local workaround.
- [ ] No unrequested abstraction or flexibility remains.
- [ ] No empty layer, unnecessary private alias, or local foundation substitute remains.
- [ ] The supported surface is complete even if optional Material capabilities remain unsupported.

Do not mark a component `aligned` or architecture-complete until every applicable item passes or the missing item is explicitly recorded as unsupported, deviated, blocked, or follow-up verification.
