# Material 3 component conversion checklist

Use this checklist when converting or creating a shared Material component family.

## 1. Source check

- [ ] Checked the relevant Material 3 pages through `material3` MCP.
- [ ] Used `Vyachean/m3-docs-cache` fallback only if MCP was unavailable or incomplete.
- [ ] Recorded checked pages or cache paths in PR notes or Storybook docs.
- [ ] Identified unresolved documentation gaps.

## 2. Registry

- [ ] Added or updated the row in [Component registry](./component-registry.md).
- [ ] Classified the component status.
- [ ] Identified related deprecated or compatibility components.
- [ ] Identified project-specific behavior.

## 3. Tokens

- [ ] Audited existing `--md-*` tokens used by the component.
- [ ] Checked every touched component part/state/property against official Material component token paths.
- [ ] Classified local variables as public component tokens, private implementation variables, compatibility aliases, app-specific tokens, or obsolete tokens.
- [ ] Added required `--md-comp-*` tokens.
- [ ] Existing official component token paths are exposed as mechanically named `--md-comp-*` tokens.
- [ ] Component CSS uses `--md-comp-*` as the component override surface, resolving them to `--md-sys-*` where appropriate.
- [ ] The component is not implemented as sys-token-only when official component tokens exist.
- [ ] Direct `--md-sys-*` usage inside component internals is limited to values without an official component token path or true foundation-level roles.
- [ ] Missing official component token paths are documented as gaps or deviations.
- [ ] Moved app-specific values to `--app-*` where needed.
- [ ] Avoided raw hardcoded colors unless the official spec requires a direct value.

## 4. Public API

- [ ] Public props use Material vocabulary where possible.
- [ ] Prop values use Material value names.
- [ ] Native HTML behavior is not hidden behind Material terminology.
- [ ] Invalid Material combinations are blocked or documented.
- [ ] Deprecated prop aliases have a migration path.

## 5. States and accessibility

- [ ] Enabled, disabled, hover, focused, pressed, selected, dragged, and loading/progress states were considered as applicable.
- [ ] State layers and focus indicators use shared state primitives where possible.
- [ ] Accessible names and roles are correct.
- [ ] Keyboard behavior is correct.
- [ ] Target area requirements are satisfied or documented as deviations.
- [ ] Contrast-safe Material color role pairings are preserved.

## 6. Layout and adaptivity

- [ ] Component measurements follow Material specs or documented deviations.
- [ ] Compact, medium, and expanded behavior was considered when relevant.
- [ ] Spacing and density decisions follow [Density and spacing](./density-spacing.md).
- [ ] Overlay behavior follows [Overlays](./overlays.md) when applicable.

## 7. Storybook

- [ ] Story hierarchy uses `Material 3/Components/...` or `Project UI/...` appropriately.
- [ ] Stories document variants, configurations, states, accessibility notes, tokens, and deviations as relevant.
- [ ] Stories use public props and public tokens.
- [ ] Stories are deterministic and fixture-driven.
- [ ] Visual stories are tagged with `visual` only when intended for screenshots.

## 8. Verification

- [ ] Focused token/unit checks were run when tokens or units changed.
- [ ] TypeScript or contract checks were run when public API changed.
- [ ] Browser smoke checks were run when behavior, focus, keyboard, overlay, or accessibility changed.
- [ ] Visual regression checks were run when visual output or Material states changed.
- [ ] Final repository verification follows `AGENTS.md` requirements.

## 9. Deviations

- [ ] Unsupported official Material features are documented.
- [ ] Project-specific extensions are documented.
- [ ] Temporary compatibility behavior has a migration target.
- [ ] Remaining risks are explicit and not hidden as completed alignment.

A component family should not be marked aligned until this checklist is complete or every incomplete item is documented as a deviation, unsupported feature, or follow-up risk.
