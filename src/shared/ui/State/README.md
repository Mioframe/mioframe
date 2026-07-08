# State Layer Contract

- `MDStateLayer` is the only state-layer primitive. There is no separate private layer component.
- `MDStateLayer` is visual-only. It renders the Material state overlay and does not own host semantics.
- `useStateLayer` only collects hover, focus-visible, pressed, and dragged state from the host element.
- `useRipple` is an explicit opt-in host behavior. Hosts decide whether ripple is enabled.
- Only one state layer should be visually active at a time unless a component intentionally combines states according to Material 3.
- State layer color is resolved from `--md-private-state-layer-color`, falling back to host content color via `--md-content-color` when unset: `var(--md-private-state-layer-color, var(--md-content-color))`. `--md-private-state-layer-color` is `MDStateLayer`'s own generic private contract — it must never read a component-specific variable name (e.g. a List, Menu, or Button token) directly. Components that need a non-default state-layer color (such as List's selected/dragged rows) set `--md-private-state-layer-color` on their own private token first, then let it cascade down to the nested `MDStateLayer`.
- Default hover, focus, and pressed opacities resolve through the public Material system tokens `--md-sys-state-hover-state-layer-opacity`, `--md-sys-state-focus-state-layer-opacity`, and `--md-sys-state-pressed-state-layer-opacity`.
- Dragged defaults to `--md-private-state-dragged-state-layer-opacity` (`0.16`). This is a documented private project extension: the checked Material state-layer docs define the dragged value, but the current project Material cache does not expose a shared `md.sys.state.dragged.*` token name.
- Disabled components suppress interactive state layers.
- `MDStateLayer` also supports a host parent-class protocol for deterministic rendering:
  `md-state_hover`, `md-state_focused`, `md-state_pressed`, and `md-state_dragged`.
- This parent-class protocol is supported for visual stories and host integration checks.
- Real host components should still pass explicit `hover`, `focused`, `pressed`, `dragged`, and
  `disabled` props to `MDStateLayer`.
- Disabled hosts must also expose `md-state_disabled`, native `:disabled`, or
  `aria-disabled="true"` so parent-class state rendering is suppressed.
- Touch target sizing is not part of `MDStateLayer`.
- `MDIconButton` keeps its compact layout footprint tied to container height, icon size, padding, and border width. If a larger touch target is needed, it must not resize the root layout box or require a wrapper around the native button.
- Host components own native element choice, semantics, roles, keyboard behavior, disabled semantics, event propagation policy, accessibility behavior, and touch target or layout policy.
- FAB disabled state is not a Material inherited disabled state. If a FAB action is unavailable, do not render the FAB.
- Native interactive hosts must keep valid DOM. Do not render block wrapper elements or nested interactive controls inside native buttons.
