# src/shared/service

Applies to `src/shared/service` and descendants.
Inherits root and shared rules.

## Contains

- Background service implementations.
- Worker wiring and proxy service support.
- Service public contracts.

## Rules

- UI/FSD layers access services only through `@shared/service` and `useMainServiceClient`.
- Keep `@shared/service` narrow.
- `@shared/service` may export only the worker