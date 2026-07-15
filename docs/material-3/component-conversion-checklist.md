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
- [ ] Included every reachable state, semantic, accessibility, usage, foundation, and verification requirement for the supported surface.
- [ ] Listed other official capabilities as unsupported rather than implementing them speculatively.
- [ ] Added no project extension without an explicit requirement.

## 3. Material library ownership

- [ ] Read [Library architecture](./library-architecture.md) and `src/shared/ui/material/README.md`.
- [ ] New official public components are created under `src/shared/ui/material/components/<family>`.
- [ ] The family blueprint records `Family ownership basis`.
- [ ] A multi-component family is backed by an official Material relationship and at least one current shared production contract.
- [ ] Legacy directory proximity, similar names, repeated CSS, fewer files, or hypothetical reuse were not used as family-ownership evidence.
- [ ] A migrated component records its current legacy path, canonical path, migration mode, and migration status.
- [ ] The family blueprint names the public `@shared/ui/material` export and complete consumer import scope.
- [ ] Internal library modules do not import the root library barrel.
- [ ] Product consumers do not deep-import `.vue`, `.css`, private helpers, or family internals.
- [ ] No component family deep-imports another family's private files or variables.
- [ ] Project-specific wrappers and product behavior remain outside official Material component families.
- [ ] Empty namespace directories and placeholder files were not created.
- [ ] A legacy path receives no new public Material surface.

## 4. Material usage and composition

- [ ] Recorded intended scenarios and when the component must not be used.
- [ ] Recorded component-choice evidence from official guidance.
- [ ] Recorded action/content hierarchy constraints.
- [ ] Recorded allowed Material compositions and placement constraints.
- [ ] Recorded adaptive behavior and its product/layout owner.
- [ ] For library-only work, used `Product integration in this PR: none` instead of inventing a consumer.
- [ ] For integrated work, product layers own information architecture, component choice, placement, and adaptive switching.

## 5. Foundation dependencies

- [ ] Added the dependency table from [Foundation architecture](./foundation-architecture.md).
- [ ] Checked every applicable domain against [Foundation registry](./foundation-registry.md).
- [ ] Named the accepted current production owner and canonical library owner for each dependency.
- [ ] Confirmed that every partial or deviated dependency is sufficient for the exact supported surface.
- [ ] Used `blocked` when a required dependency or ownership decision is blocked.
- [ ] Classified every foundation delta as `none`, `additive`, `correction`, `replacement`, or behavior-preserving `library-relocation-only`.
- [ ] Kept an additive delta in the component PR only when all same-PR conditions pass.
- [ ] Added no component-local substitute for a missing theme, token, typography, motion, state, focus, ripple, icon, overlay, unit, density, accessibility, or adaptive capability.
- [ ] Updated the foundation registry, library migration map, owner contract, code, and tests atomically when a foundation owner or contract changed.

## 6. Family blueprint

- [ ] Created or updated the family `README.md` before production code.
- [ ] Kept the blueprint compact and source-backed.
- [ ] Recorded library ownership, family ownership basis, scenarios, non-goals, usage contract, supported and unsupported surface, API, native semantics, invalid combinations, anatomy/DOM ownership, semantic and interaction states, state ownership, foundation dependencies, token ownership, rendered-property matrix, test profile, state-matrix coverage, files, verification, consumers, and deviations.
- [ ] Set `Unresolved: none` and `Readiness: ready` only after every required decision was resolved.
- [ ] For an existing family, changed only required README sections.
- [ ] The implementation introduced no decision absent from the blueprint or ready handoff.

## 7. Minimum architecture profile

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

## 8. Public contract and anatomy

- [ ] Public props are limited to supported configuration, semantic state, required native behavior, and explicit extensions.
- [ ] API names and values use Material vocabulary where applicable.
- [ ] Native elements and `href`, `type`, `disabled`, `tabindex`, `role`, and `aria-*` ownership are explicit.
- [ ] Slots represent only supported consumer-provided anatomy.
- [ ] Emits represent component-owned state changes or actions.
- [ ] Invalid combinations follow official guidance or are blocked for resolution.
- [ ] Each anatomy part and CSS property has one owner.
- [ ] Every interactive or semantic anatomy part records the actual DOM/native owner and native semantics or explicit role.
- [ ] Focus owner, accessible-name source, semantic `aria-*` owner, and disabled/readonly owner are explicit where applicable.
- [ ] Target-area, state-layer, ripple, focus-indicator target, and final rendered-property owners are explicit where applicable.
- [ ] Consumer-provided interactive content is explicitly allowed, prohibited, or isolated for each relevant anatomy part.
- [ ] Parent and child components do not implicitly split native action, focus, accessibility, interaction-surface, or rendering ownership.
- [ ] Parent components do not style child internals through `:deep()`.

## 9. Tokens and routing

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

## 10. State and rendering

- [ ] Every supported state has one explicit source of truth and change path.
- [ ] Consumer-controlled semantic state has no hidden parallel component-owned copy.
- [ ] Browser/foundation interaction facts are acquired by the browser/foundation and mapped by the component rather than reimplemented as product state.
- [ ] Component-owned transient state exists only for owned gesture, overlay, animation, or native coordination lifecycle.
- [ ] Applicable transient state defines acquire, release, cancellation, disabled behavior, and unmount cleanup.
- [ ] Created rendered-property matrix rows only for properties that vary.
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

## 11. Standard component testing

- [ ] Read [Component testing architecture](./component-testing.md).
- [ ] Recorded the same standard test profile used by other new/migrated Material components.
- [ ] Added colocated `<Component>.test.ts` contract tests using Vue Test Utils.
- [ ] Contract tests cover public API, defaults, native owner, ARIA, slots, emits, invalid combinations, and non-browser wiring as applicable.
- [ ] Added exactly one canonical Storybook export named `StateMatrix`.
- [ ] The matrix root uses `data-testid="visual-<component-kebab>-state-matrix"` and the canonical checkerboard backdrop.
- [ ] Visible row, column, and section headings identify every case without reading source code.
- [ ] The matrix covers every supported semantic, interaction, disabled, and other visually distinct state.
- [ ] The matrix covers every distinct state-rendering route and simultaneous-state result from the rendered-property matrix.
- [ ] Equivalent sizes, labels, icons, and content combinations are not multiplied when they share the same state route.
- [ ] The family README maps each supported visual route or valid grouped route to a visible matrix row and column.
- [ ] Transient states use accepted verification-only foundation adapters or real Playwright setup, not test-only public component APIs.
- [ ] Added a Playwright visual assertion for the complete bounded matrix or its visibly labelled sections.
- [ ] Did not create one screenshot per cell.
- [ ] Added Storybook Playwright behavior tests for real focus, keyboard, pointer/touch, drag, overlay, responsive, or other browser-owned behavior as applicable.
- [ ] Behavior tests use real browser input and do not use forced matrix states as proof.
- [ ] Added focused Vitest tests for extracted pure helpers/composables when applicable.
- [ ] Recorded changed-consumer preservation checks.
- [ ] Recorded human Material visual review as `required`, `passed`, or `blocked`; an automated agent did not claim it passed.

## 12. Simplicity

- [ ] Reused existing native semantics, accepted foundation contracts, generic infrastructure, and testing infrastructure.
- [ ] Added no universal base component, runtime token registry, generic resolver, CSS DSL, cross-family state machine, second theme system, broad options object, production state-matrix component, generic component-test DSL, workspace package, or publication infrastructure without a current requirement.
- [ ] Extracted component behavior only for non-trivial testable lifecycle or gesture transitions.
- [ ] Added a component composable only for behavior required by at least two production components now.
- [ ] Added a foundation primitive only when the objective expansion rules are satisfied.
- [ ] Added a shared Storybook matrix helper only after at least two migrated families proved the same concrete need.
- [ ] Added a Material pattern only when the official-composition and current-scenario gate passes.
- [ ] Added no compatibility alias without an existing consumer requirement and removal target.
- [ ] Removed replaced and obsolete logic instead of retaining parallel paths.

## 13. Verification

- [ ] Static validation covers canonical library location, family ownership basis, dependency direction, public exports, no deep imports, state/anatomy ownership, foundation dependencies, selected profile, exact applicable layers, token names/owners, selectors, private boundaries, alias necessity, README consistency, and test-profile completeness.
- [ ] Product integration verifies component choice and composition when applicable.
- [ ] Contract tests cover the supported public contract without asserting browser appearance or behavior.
- [ ] Browser tests cover component-owned real focus, keyboard, pointer, gestures, overlays, adaptivity, computed CSS, public overrides, and actual property owners as applicable.
- [ ] Every reachable rendered-property route and simultaneous-output case is covered by contract, browser, or state-matrix evidence at the owning layer.
- [ ] Storybook documents supported and unsupported surface, usage, extensions, foundation dependencies, deviations, and canonical state-matrix coverage.
- [ ] The state-matrix visual regression passes on the canonical Linux/Chromium surface.
- [ ] Initial or intentionally changed state-matrix baselines are available for human comparison with named official sources.
- [ ] Every changed existing consumer has import and behavior preservation checks.
- [ ] Every foundation correction or replacement has representative checks for distinct consumer paths.
- [ ] Old legacy files and exports are absent after migration unless an approved temporary contract exists.
- [ ] Tests do not verify framework, browser, or generic foundation internals the component does not own.
- [ ] Final verify follows repository rules.

## 14. Completion

- [ ] Family README, library migration map, foundation/component registries, owner contracts, production code, public exports, Storybook, contract/browser/visual tests, risk registration, and snapshots agree.
- [ ] Family boundary, state sources of truth, and anatomy/DOM owners are explicit.
- [ ] Unsupported features and deviations are explicit.
- [ ] No supported visual state route is missing from the state matrix.
- [ ] Human Material visual review is passed or remains an explicit merge blocker.
- [ ] No escalation condition was hidden as a local workaround.
- [ ] No unrequested abstraction or flexibility remains.
- [ ] No hidden controlled-state copy, empty layer, unnecessary private alias, local foundation substitute, cross-family private import, permanent legacy export, family-local forced-state system, or test-only production API remains.
- [ ] The supported surface is complete even if optional Material capabilities remain unsupported.

Do not mark a component `aligned`, migrated, or architecture-complete until every applicable item passes or the missing item is explicitly recorded as unsupported, deviated, blocked, or follow-up verification. Human visual review cannot be replaced by an automated pass.