# src/shared/ui KNOWLEDGE BASE

## OVERVIEW
Reusable UI components, layouts, and generic design system elements (Buttons, Layouts, Menus).

## STRUCTURE
```
src/shared/ui/
├── Button/        # Standard, FAB, and icon buttons
├── Layout/        # Base layout containers
├── Menu/          # Context and dropdown menus
├── Query/         # Renderless or data-fetching wrappers
└── Tooltips/      # Accessibility and rich tooltips
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| App shell layouts | `Layout/` & `AppBar/` | Top-level containers |
| Data display | `Lists/` & `Table/` | Specialized renderers |
| User inputs | `TextField/`, `Select/`, `Checkbox/` | Form controls |

## CONVENTIONS
- UI components MUST be generic and domain-agnostic.
- Props and Emit definitions are strictly typed.
- SCSS/CSS Modules for scoped styling.
- ARIA attributes are required for custom interactive elements (`AriaHidden/`).

## ANTI-PATTERNS
- **NEVER** bind components directly to business models/entities (pass data via props).
- **NEVER** import from `features` or `entities` - this is the lowest UI layer.