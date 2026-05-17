# Material 3 UI review checklist

Use this checklist for PRs that change visual UI, shared components, tokens, layout, or interaction states.

## Scope

- Which screen, widget, or shared component changed?
- Is this a product-specific change or a reusable Material component change?
- Does it touch `src/shared/lib/md/tokens.css` or `src/shared/ui`?
- Should this documentation be updated with a new rule or exception?

## Material hierarchy

- Is there one clear primary action per action group?
- Are secondary and low-emphasis actions visually lower than the primary action?
- Are surface roles used before adding shadows or borders?
- Are elevation and overlays used only where layering matters?
- Are shape tokens consistent with the component family?

## Tokens

- Are colors, type, shape, elevation, state, and motion values taken from tokens?
- Are matching `on-*` colors used with their container/background colors?
- Are dark theme values inherited or covered?
- Are component tokens used for component internals instead of vague local variables?

## Typography and content

- Is the type role semantic?
- Does important text wrap instead of truncating unsafely?
- Are labels action-oriented and specific?
- Are helper, error, loading, and empty-state messages actionable?
- Is implementation language hidden from users unless necessary?

## Responsive behavior

- Was the compact/mobile layout checked first?
- Is the same core functionality available on compact and desktop layouts?
- Are touch targets comfortable?
- Is hover-only discovery avoided?
- Do dialogs, menus, and tooltips fit within viewport constraints?

## Accessibility

- Do icon-only controls have accessible names?
- Is keyboard focus visible and ordered logically?
- Do dialogs and menus manage focus predictably?
- Are errors connected to the relevant input or surface?
- Is disabled state explained when the reason is not obvious?

## Component states

Check every applicable state:

- enabled;
- hover;
- focus-visible;
- pressed;
- selected;
- checked;
- disabled;
- error;
- loading;
- empty.

## Testing expectations

- Component contract tests should cover props, emits, state wiring, and accessible labels where practical.
- Visual regression tests should cover important shared component variants and previously broken states.
- E2E tests should cover user flows, focus behavior, overlays, storage prompts, and browser semantics.
- Final gate remains `pnpm verify`.
