# State Layer Contract

- `MDStateLayer` is visual-only. It renders the Material state overlay and does not own host semantics.
- `useStateLayer` only collects hover, focus-visible, pressed, and dragged state from the host element.
- `useRipple` is an explicit opt-in host behavior. Hosts decide whether ripple is enabled.
- Touch target sizing is not part of `MDStateLayer`.
- Host components own native element choice, semantics, roles, keyboard behavior, disabled behavior, event propagation policy, and touch target or layout policy.
- Native interactive hosts must keep valid DOM. Do not render block wrapper elements or nested interactive controls inside native buttons.
