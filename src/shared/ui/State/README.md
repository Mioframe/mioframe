# State Layer Contract

- `MDStateLayer` is the only state-layer primitive. There is no separate private layer component.
- `MDStateLayer` is visual-only. It renders the Material state overlay and does not own host semantics.
- `useStateLayer` only collects hover, focus-visible, pressed, and dragged state from the host element.
- `useRipple` is an explicit opt-in host behavior. Hosts decide whether ripple is enabled.
- Only one state layer should be visually active at a time unless a component intentionally combines states according to Material 3.
- State layer color is derived from host content color via `--md-content-color`.
- Default state-layer opacities are hover `0.08`, focus `0.1`, pressed `0.1`, and dragged `0.16`.
- Disabled components suppress interactive state layers.
- Touch target sizing is not part of `MDStateLayer`.
- Host components own native element choice, semantics, roles, keyboard behavior, disabled semantics, event propagation policy, accessibility behavior, and touch target or layout policy.
- FAB disabled state is not a Material inherited disabled state. If a FAB action is unavailable, do not render the FAB.
- Native interactive hosts must keep valid DOM. Do not render block wrapper elements or nested interactive controls inside native buttons.
