# Material 3 component authoring checklist

Use for every new, migrated, or materially changed public shared Material component.

## 1. Authoring mode and source

- [ ] Recorded `standard-authoring`, `handoff-authoring`, `blocked`, or the strict local `Architecture impact: none` path.
- [ ] Checked the relevant official Material pages through MCP.
- [ ] Used `m3-docs-cache` only when MCP was unavailable or incomplete and recorded cache health.
- [ ] Limited source lookup to the requested component surface.
- [ ] Recorded exact sources and verified snapshot.
- [ ] Used `blocked` for unresolved official guidance instead of inventing behavior.

## 2. Required scope

- [ ] Started from named user scenarios and affected existing consumers.
- [ ] When no scenario was supplied, used only canonical Material default usage and kept optional capabilities unsupported.
- [ ] Chose an official Material component or documented composition.
- [ ] Included one canonical Material default.
- [ ] Added optional variants, sizes, shapes, modes, anatomy, or behavior only for named scenarios.
- [ ] Included every reachable state, semantic, and accessibility requirement for the supported surface.
- [ ] Listed other official capabilities as unsupported rather than implementing them speculatively.
- [ ] Added no project extension without an explicit requirement.

## 3. Family blueprint

- [ ] Created or updated the family `README.md` before production code.
- [ ] Kept the blueprint compact and source-backed.
- [ ] Recorded scenarios, non-goals, supported and unsupported surface, API, native semantics, invalid combinations, anatomy, states, token ownership, rendered-property matrix, files, verification, consumers, and deviations.
- [ ] Set `Unresolved: none` and `Readiness: ready` only after every required decision was resolved.
- [ ] For an existing family, changed only required README sections.
- [ ] The implementation introduced no decision absent from the blueprint or ready handoff.

## 4. Minimum architecture profile

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

## 5. Public contract and anatomy

- [ ] Public props are limited to supported configuration, semantic state, required native behavior, and explicit extensions.
- [ ] API names and values use Material vocabulary where applicable.
- [ ] Native elements and `href`, `type`, `disabled`, `tabindex`, `role`, and `aria-*` ownership are explicit.
- [ ] Slots represent only supported consumer-provided anatomy.
- [ ] Emits represent component-owned state changes or actions.
- [ ] Invalid combinations follow official guidance or are blocked for resolution.
- [ ] Each anatomy part and CSS property has one owner.
- [ ] Parent components do not style child internals through `:deep()`.

## 6. Tokens and routing

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

## 7. State and rendering

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

## 8. Simplicity

- [ ] Reused existing native semantics and generic foundations.
- [ ] Added no generic base component, runtime token registry, generic resolver, CSS DSL, cross-family state machine, or broad options object.
- [ ] Extracted behavior only for non-trivial testable lifecycle or gesture transitions.
- [ ] Added a composable only for behavior required by at least two production components now.
- [ ] Added no compatibility alias without an existing consumer requirement.
- [ ] Removed replaced and obsolete logic instead of retaining parallel paths.

## 9. Verification

- [ ] Contract tests cover supported API, native semantics, ARIA, invalid combinations, states, and extensions.
- [ ] Static validation covers the selected profile, exact applicable layers, token names/owners, selectors, private boundaries, alias necessity, and README consistency.
- [ ] Browser tests cover focus, keyboard, pointer, gestures, computed CSS, public overrides, and actual property owners as applicable.
- [ ] Every reachable property-matrix route and simultaneous-output case is verified.
- [ ] Storybook documents supported and unsupported surface, extensions, and deviations.
- [ ] Visual coverage is representative rather than a full Cartesian matrix.
- [ ] Every changed existing consumer has a preservation check.
- [ ] Tests do not verify framework, browser, or generic foundation internals the component does not own.
- [ ] Final verify follows repository rules.

## 10. Completion

- [ ] Family README, production code, registry, Storybook, and verification agree.
- [ ] Unsupported features and deviations are explicit.
- [ ] No escalation condition was hidden as a local workaround.
- [ ] No unrequested abstraction or flexibility remains.
- [ ] No empty layer or unnecessary private alias remains.
- [ ] The supported surface is complete even if optional Material capabilities remain unsupported.

Do not mark a component `aligned` or architecture-complete until every applicable item passes or the missing item is explicitly recorded as unsupported, deviated, blocked, or follow-up verification.
