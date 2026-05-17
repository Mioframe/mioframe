# Mioframe UI rules

These rules adapt Material 3 to Mioframe's product constraints: local-first data work, compact/mobile parity, and custom Vue shared components.

## Product principles

- Mobile is not a reduced version of desktop. Compact screens must preserve the same core capabilities.
- Prefer clear entry points over hidden branching inside dialogs.
- Keep user data actions explicit, reversible where possible, and close to the affected content.
- Use Material 3 component hierarchy to guide the user, not to decorate the screen.
- Avoid adding new one-off UI primitives when a shared `MD*` component already exists.

## Component usage

- Shared components belong in `src/shared/ui`.
- Material tokens belong in `src/shared/lib/md/tokens.css` unless a clear split is introduced.
- Product widgets should not redefine Material component internals.
- If a widget needs a reusable Material pattern, extract or improve a shared component first.

## Copy and labeling

- Button labels should describe the resulting action.
- Empty states should explain what the user can do next.
- Error messages should identify the failed operation and recovery path.
- Avoid generic labels such as `OK` when a concrete action label is available.
- Avoid implementation terms in user-facing copy unless the user must understand them.

## Compact layout

- Design and review first at compact width.
- Avoid requiring hover-only discovery.
- Wrap important content instead of truncating it.
- Keep primary action reachable without excessive scrolling when practical.
- Prefer bottom or inline actions only when they do not hide content or conflict with browser UI.

## Deviation rule

If a UI intentionally deviates from Material 3, document:

- what guidance is being overridden;
- why Mioframe needs the deviation;
- whether it is a one-off exception or a reusable project rule.
