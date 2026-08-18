# Extended FABs

Extended FABs are prominent floating actions with visible text labels for a screen's most common or important action.

## Purpose

Use an extended FAB to keep a page's primary action visible, especially above long, scrolling content. Its label can clarify the action or add emphasis where an icon alone is ambiguous.

## When to use

- Provide persistent access to one primary action in a long, scrolling view.
- Choose it when the action needs a visible label to be understood or needs more emphasis than a standard FAB.
- Use only one extended FAB on a screen so the primary action remains clear.

## When not to use

- Do not use multiple extended FABs, because they compete for attention.
- Do not use one as an option in a set of actions. Use filled buttons for a similarly emphasized action in that situation.
- Do not pair it with another floating component, such as a floating toolbar.

Put additional high-level actions in other buttons elsewhere on the page.

## Placement

Place an extended FAB above the rest of the UI. Do not place it on a toolbar or app bar, on a card, inside another container, or over another actionable element. On mobile, keep it out of the upper half of the screen.

## Choosing variants and configurations

Choose from the small, medium, and large extended FABs according to the emphasis the action needs. A large extended FAB can suit a compact window with one prominent action; at larger breakpoints, use a medium or large extended FAB.

The baseline extended FAB is no longer recommended; use the small extended FAB instead. Surface extended FAB styling is also no longer recommended. Where Material color mappings offer equivalent contrast and function, choose the mapping that fits the intended visual style.

## Content guidance

Use a label that clearly describes the action, with one or two words at most. Account for localization expansion, and do not wrap or truncate the label.

An icon is optional. If present, it should intuitively represent the action and clearly relate to the label. Never use an icon without a text label.

## Consumer accessibility responsibilities

Ensure people using assistive technology can navigate to and activate the action. Make the extended FAB easy to reach without obscuring other actions, and give it an appropriate priority in the overall focus order. Treat its visible label and icon as one focusable action.

Use consistent icon and label text that express one distinct purpose. The accessibility label must begin with the same first word as the visible label. A separate tooltip is not needed because the action already has a visible label.

## Related components and choosing alternatives

Choose a standard FAB when an icon alone makes the action clear. Use filled buttons instead when presenting a set of actions rather than one persistent primary action.

## Adaptive or platform guidance

Let a standard FAB and extended FAB transform into each other as available space and layout change; for example, use a FAB with a collapsed navigation rail and an extended FAB with an expanded rail.

At compact and medium breakpoints, place the extended FAB at the bottom of the screen, centered or aligned to the trailing edge. For small windows, Material accessibility guidance identifies the lower-right region as an easy-to-reach position. At expanded and larger breakpoints, place it at the bottom-right edge or within a navigation rail. For large web screens, an expanded navigation rail can place the action in the upper-left region.

Mirror the icon and label in right-to-left layouts: place the icon before the label in left-to-right layouts and after it in right-to-left layouts.
