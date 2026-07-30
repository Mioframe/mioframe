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

| Stage          | Artifact                                   | Current status            |
| -------------- | ------------------------------------------ | ------------------------- |
| Design         | [`DESIGN.md`](./DESIGN.md)                 | missing                   |
| Architecture   | [`ARCHITECTURE.md`](./ARCHITECTURE.md)     | blocked by design         |
| Implementation | [`IMPLEMENTATION.md`](./IMPLEMENTATION.md) | blocked by architecture   |
| Migration      | [`MIGRATION.md`](./MIGRATION.md)           | blocked by implementation |
| Review         | [`REVIEW.md`](./REVIEW.md)                 | blocked by migration      |

This README is an index only. It does not define the official Material contract, selected Vue API, token surface, renderer mapping, implementation completion, migration status, or review verdict.

Existing code, tests, stories, tokens, snapshots, and git history are implementation evidence to inspect during later stages. They do not bypass missing stage artifacts.

Current known blockers and the next action are owned by [`docs/roadmap.md`](../../docs/roadmap.md).

Run:

```text
material-component Button
```

The router must execute exactly one next stage and stop.
