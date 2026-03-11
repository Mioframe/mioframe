# src/shared/lib/subscriptions KNOWLEDGE BASE

## OVERVIEW
Subscription-based reactive data system. Provides client wrappers for service worker subscriptions, enabling real-time data updates via Web Workers.

## STRUCTURE
```
src/shared/lib/subscriptions/
├── index.ts               # Main exports
├── subscribeClient.ts     # Client implementations
├── subscribeService.ts   # Service side
├── types.ts             # WatchHandle, SubscribeClient types
└── types.ts             # Additional type definitions
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Query subscriptions | `subscribeClient.ts` | useSubscribeByQueryClient, useSubscribeByKeyClient |
| Service definitions | `subscribeService.ts` | Service worker subscription setup |
| Usage in entities | `@entity/*` | Used for Google session, reactive state |

## CONVENTIONS
- Subscribe by query (most common):
  ```typescript
  const getToken = useSubscribeByQueryClient(subscribeGetToken);
  const token = getToken(); // Returns value reactively
  ```
- Subscribe by key:
  ```typescript
  const reactiveGet = useSubscribeByKeyClient(subscribeValueService);
  const value = reactiveGet(key);
  ```
- Uses JSON serialization for query keys
- Wraps RxJS with Vue reactivity
- Provides default values support

## ANTI-PATTERNS
- **NEVER** skip query serialization (use jsonStringify/jsonParse)
- **NEVER** call subscription getters outside reactive context
- **NEVER** forget to unsubscribe (handled automatically)
