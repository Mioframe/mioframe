## Anatomy and content roles

- An extended FAB has one rounded-rectangle container, a text label, and an optional icon.
- The container hugs its contents and grows or shrinks with the label length.
- An icon may be omitted, but an icon cannot be used without a text label. When present, the icon and label express one distinct action.
- Label text remains unwrapped and untruncated.
- In left-to-right layouts, the icon precedes the label. In right-to-left layouts, the elements mirror, so the icon follows the label.

## States and state precedence

- Material defines enabled, hovered, focused, and pressed visual states.
- Material defines the states individually, but does not prescribe a combined-state precedence or result for simultaneous hover, focus, and press.
- Tokenized state appearance values are owned exclusively by `tokens.css` and are not repeated here.

## Interaction and input behavior

- The extended FAB provides one actionable surface that people can navigate to and activate.
- It can transform into a FAB when space is limited. A FAB can transform into an extended FAB when an expanded navigation rail provides the space.

## Keyboard behavior

- `Tab` moves focus to the extended FAB.
- `Space` and `Enter` activate the extended FAB.

## Accessibility semantics

- Assistive-technology users must be able to navigate to and activate the extended FAB.
- The visible label and optional icon are one focusable element, not separate focus targets.
- The extended FAB is prioritized appropriately in the overall focus order.
- A tooltip is not required because the label is visible.
- The accessibility label starts with the same first word as the visible label.

## Motion

- When appearing on screen, the extended FAB surface expands using an enter-and-exit transition pattern.
- It can expand and adapt to any shape using a container-transform transition pattern, including into an app-structure surface or a full-screen surface.
- On scroll, it can transform into a FAB while scrolling down and back into an extended FAB while scrolling up. During the FAB-to-extended-FAB transition, the shape changes, the icon moves to the left, and the label fades in.

## Material-unspecified behavior

- Material does not prescribe a scroll threshold, an exact motion duration or easing, or whether an available transformation is automatically enabled.
- Material does not define a disabled state for the extended FAB in the covered component documentation.
- Beyond one focusable, labeled action, Material does not prescribe a DOM element, ARIA role, or ARIA attribute model.
