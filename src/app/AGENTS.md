# src/app KNOWLEDGE BASE

## OVERVIEW
Application entry point. Handles initialization, global configuration, and root layout. Sets up router, styles, and error tracking.

## STRUCTURE
```
src/app/
├── MainApp.vue           # Root component, global UI containers
├── router.ts             # Vue Router setup with qs parsing
├── setupApp.ts           # Async initialization logic
├── setupSentry.ts        # Sentry error tracking
├── playgroundPages.ts    # Dev playground routes
└── styles/
    └── styles.css        # Global CSS variables, reset, base styles
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| App bootstrap | `setupApp.ts` | Main async setup chain |
| Router config | `router.ts` | Custom query parsing logic |
| Root layout | `MainApp.vue` | Global overlays and error capture |
| Global styles | `styles/styles.css` | Theme variables and resets |
| Error tracking | `setupSentry.ts` | Production error reporting |

## CONVENTIONS
- Follows FSD App layer responsibilities.
- Initialization is async.
- Router uses `qs` for complex query parameters.
- Global UI elements like Snackbars and Dialogs live in `MainApp.vue`.
- Use `createWebHistory` only when `BASE_URL` is set.
- Hash history works for local development.

## ANTI-PATTERNS
- **NEVER** add heavy sync logic to `setupApp.ts`.
- **DON'T** bypass `MainApp.vue` for global UI containers.
- **AVOID** importing features directly into `setupApp.ts` unless for initialization.
