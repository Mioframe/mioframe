# src/shared/ui - Component Library

**Scope:** Reusable UI components, layouts, and generic design system elements. 37 component directories, 163 files.

## COMPONENTS (30+)

- **Button/**: MDButton, MDFab, MDIconButton, MDSegmentedButtons, UIButton
- **Dialog/**: MDDialog, Alert, DialogForm, useDialog
- **TextField/**: MDTextField, MDFieldContainer
- **Select/**: Select with options, defineSelectOptions
- **Table/**: MDTable
- **Menu/**: MenuButton, MenuDivider, MenuItem
- **Layout/**: SplitLayout, Pane, ViewWithPanelLayout
- **Lists/**: List, ListItem
- **Chips/**: MDChip, MDChipGroup
- **Navigation/**: NavigationRail, NavigationDrawer, NavigationPath
- **Toolbar/**: AppBar, Toolbar, ToolbarGroup
- **State/**: State, StateTransition
- **Overlay/**: Overlay, SlidingPanel
- **Progress/**: ProgressIndicator, CircularProgress
- **Message/**: Message, MessageProvider
- **Snackbars/**: Snackbar, useSnackbar
- **Tooltips/**: Tooltip, TooltipTrigger
- **Icons/**: Icon
- **Divider/**: MDDivider
- **EmptySymbol/**: EmptySymbol
- **AriaHidden/**: AriaHidden
- **Performance/**: PerformanceMonitor
- **Views/**: FormLayout
- **Query/**: Renderless query wrappers

## CONVENTIONS

- **Naming**: Material Design `MD*` prefix for components
- **Composables**: `use*` prefix (useDialog, useSnackbar, useSelect)
- **Styling**: Scoped CSS with custom units (rpx, step, pt, dp)
- **Types**: Strict TypeScript, props/emits explicitly typed
- **Accessibility**: ARIA attributes on all interactive elements
- **Props**: Pass data via props, never bind to business models
- **Emit**: Define emit types for all user-triggered events

## ANTI-PATTERNS

- **NEVER** bind components directly to business models/entities
- **NEVER** import from `features` or `entities` - lowest UI layer only
- **NEVER** use `any` type or `@ts-ignore`
- **NEVER** leave empty catch blocks
- **NEVER** bypass scoped styling (no global styles in components)
- **AVOID** cross-layer circular dependencies

## STYLING

- Custom CSS units via PostCSS: `rpx`, `step`, `pt`, `dp`
- Scoped CSS with `<style scoped>`
- CSS variables for theme tokens
- No external CSS dependencies

## TESTING

- Unit tests with Vitest + happy-dom
- E2E tests with Cypress for critical paths
- Accessibility testing with axe-core

## PATH ALIASES

- `@shared/*` -> `./src/shared/*`
- `@feature/*` -> `./src/features/*`
- `@entity/*` -> `./src/entities/*`
- `@widget/*` -> `./src/widgets/*`
- `@page/*` -> `./src/pages/*`
