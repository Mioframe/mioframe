# Material 3 component conversion checklist

Use this checklist when creating, converting, or materially changing a shared Material component family.

## 1. Source check

- [ ] Checked the relevant Material 3 pages through `material3` MCP.
- [ ] Used `Vyachean/m3-docs-cache` fallback only if MCP was unavailable or incomplete.
- [ ] Recorded checked pages or cache paths in PR notes or Storybook docs.
- [ ] Recorded the verified snapshot.
- [ ] Identified unresolved documentation gaps.

## 2. Architecture contract

- [ ] Classified `Architecture impact` as `none`, `layered-v1`, or `blocked` before production edits.
- [ ] For `layered-v1`, completed the `MATERIAL COMPONENT CONTRACT` from [Component architecture](./component-architecture.md).
- [ ] The contract has `Unresolved: none` and `Readiness: ready`.
- [ ] Change mode is explicitly `architecture-only`, `alignment-only`, or architect-approved `combined-approved`.
- [ ] A first migration supplies the complete initial family contract, or a later change names the current family `README.md` and exact delta.
- [ ] Supported and unsupported Material surfaces are explicit.
- [ ] Public API, native semantics, and invalid combinations are explicit.
- [ ] Every anatomy part has one declared owner.
- [ ] Configuration axes, semantic states, and interaction states are explicit.
- [ ] Every stateful rendered property has its own matrix row with DOM owner, final variable, route sources, interaction inputs, winner order, and simultaneous outputs.
- [ ] Exact production and verification files are explicit.
- [ ] The implementation did not add architecture decisions absent from the ready contract.

## 3. Layered implementation

- [ ] Family `README.md` contains the durable accepted architecture contract.
- [ ] The final README, production implementation, registry, and verification agree.
- [ ] The component has `.vue`, `.tokens.css`, `.routes.css`, `.states.css`, and `.css` files.
- [ ] Optional `<Family>.tokens.css` exists only when the contract assigns exact shared official tokens to at least two public family components.
- [ ] Style layers load in the exact handoff-declared order.
- [ ] `.vue` owns API, runtime state acquisition, native bindings, events, and anatomy only.
- [ ] Component and family token files own canonical `--md-comp-*` defaults only.
- [ ] `.routes.css` owns configuration-to-route-bank mappings only.
- [ ] `.states.css` owns semantic-bank selection and per-property interaction resolution only.
- [ ] `.css` owns rendering and actual DOM property application only.
- [ ] Additional behavior, anatomy, token, or context files were explicitly approved by the ready handoff.
- [ ] Generic foundations read only generic private contracts.

## 4. Registry

- [ ] Added or updated the row in [Component registry](./component-registry.md).
- [ ] Classified the component status honestly.
- [ ] Identified related deprecated or compatibility components.
- [ ] Identified project-specific behavior.

## 5. Tokens

- [ ] Audited existing `--md-*` tokens used by the component.
- [ ] Checked every touched component part/state/property against official Material component token paths.
- [ ] Classified variables as public component tokens, private route variables, private rendered variables, generic foundation bridges, app-specific tokens, compatibility aliases, or obsolete tokens.
- [ ] Added required `--md-comp-*` tokens.
- [ ] Existing official component token paths are exposed as mechanically named `--md-comp-*` tokens.
- [ ] Every canonical component token names exactly one component or family owner file.
- [ ] A family token owner lists exact token paths, applicable roots, and at least two consuming public components.
- [ ] Canonical tokens are declared independently of active variant, size, shape, width, semantic state, and interaction state.
- [ ] Token files contain no configuration modifiers, state selectors, or pseudo-classes.
- [ ] Component CSS uses `--md-comp-*` as the component override surface, resolving them to `--md-sys-*` where appropriate.
- [ ] The component is not implemented as sys-token-only when official component tokens exist.
- [ ] Direct `--md-sys-*` usage inside component internals is limited to values without an official component token path or true foundation-level roles.
- [ ] Missing official component token paths are documented as gaps or deviations.
- [ ] App-specific values use `--app-*` or family-private variables rather than invented `--md-comp-*` tokens.
- [ ] Canonical component tokens are not duplicated.
- [ ] Family-private variables do not escape the owning family.
- [ ] Raw hardcoded colors are absent unless the official spec requires a direct value.

## 6. Public API

- [ ] Public props use Material vocabulary where possible.
- [ ] Prop values use Material value names.
- [ ] Native HTML behavior is not hidden behind Material terminology.
- [ ] Invalid Material combinations are blocked or documented.
- [ ] Deprecated prop aliases have an explicit migration decision.
- [ ] Mioframe extensions are separated from the official Material contract.

## 7. States and accessibility

- [ ] Only handoff-declared states are implemented.
- [ ] Each property resolver matches its matrix row rather than a global or accidental selector order.
- [ ] Independent outputs such as focus indicator, pressed shape, state layer, and elevation coexist exactly as declared.
- [ ] State layers and focus indicators use generic shared primitives where applicable.
- [ ] Accessible names and roles are correct.
- [ ] Keyboard behavior follows native semantics or an explicit documented deviation.
- [ ] Pointer and gesture behavior follows the declared interaction contract.
- [ ] Target area requirements are satisfied or documented as deviations.
- [ ] Contrast-safe Material color role pairings are preserved.

## 8. Layout and adaptivity

- [ ] Component measurements follow Material specs or documented deviations.
- [ ] Compact, medium, and expanded behavior was considered when relevant.
- [ ] Spacing and density decisions follow [Density and spacing](./density-spacing.md).
- [ ] Overlay behavior follows [Overlays](./overlays.md) when applicable.
- [ ] Parent components do not style child internals through `:deep()`.

## 9. Storybook

- [ ] Story hierarchy uses `Material 3/Components/...` or `Project UI/...` appropriately.
- [ ] Stories document variants, configurations, states, accessibility notes, tokens, extensions, and deviations as relevant.
- [ ] Stories use public props and public tokens.
- [ ] Stories are deterministic and fixture-driven.
- [ ] Visual stories are tagged with `visual` only when intended for screenshots.

## 10. Verification

- [ ] Component contract tests cover defaults, props, emits, slots, native semantics, ARIA, invalid combinations, and extensions as applicable.
- [ ] Static architecture verification covers required files and layer boundaries, or missing automation is explicitly reported as remaining work.
- [ ] Token checks cover official names, canonical ownership, approved root selectors, and unknown or escaped variables.
- [ ] Browser checks assert stateful properties on their actual DOM owners.
- [ ] Every reachable property-matrix row and winner combination is verified.
- [ ] Declared simultaneous independent outputs are verified together.
- [ ] Visual regression covers materially different geometry and states without an unnecessary Cartesian screenshot matrix.
- [ ] Every consumer in the blast-radius inventory has the named preservation check.
- [ ] Final repository verification follows `AGENTS.md` requirements.

## 11. Deviations and completion

- [ ] Unsupported official Material features are documented.
- [ ] Project-specific extensions are documented.
- [ ] Temporary compatibility behavior has a migration target.
- [ ] Remaining risks are explicit and not hidden as completed alignment.
- [ ] The final diff matches the ready contract delta and leaves unchanged README sections intact.

A component family must not be marked `aligned` until this checklist is complete or every incomplete item is explicitly recorded as an unsupported feature, deviation, blocked verification, or follow-up risk. A `layered-v1` migration must not be reported complete while the family README, implementation, registry, verification, or known layer boundaries disagree.
