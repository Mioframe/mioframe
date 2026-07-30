# Button family

Official Material component: Button

Canonical runtime implementation:

```text
src/shared/ui/material/components/button/MDButton.vue
```

Public export:

```ts
import { MDButton } from '@shared/ui/material';
```

## Stage artifacts

- [`DESIGN.md`](./DESIGN.md)
- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`IMPLEMENTATION.md`](./IMPLEMENTATION.md)
- [`MIGRATION.md`](./MIGRATION.md)
- [`REVIEW.md`](./REVIEW.md)

Each artifact owns its own status and source/ref metadata. This README does not duplicate mutable workflow state.

This README is an index only. It does not define the official Material contract, selected Vue API, token surface, renderer mapping, implementation completion, migration status, or review verdict.

Existing code, tests, stories, tokens, snapshots, and git history are implementation evidence to inspect during later stages. They do not bypass stage gates.

Current milestone status and any genuine operator action are owned by [`docs/roadmap.md`](../../docs/roadmap.md).

Normal operator entrypoint:

```text
material-component Button
```

The operator supplies the name once. The orchestrator advances dependencies and all internally actionable stages automatically.