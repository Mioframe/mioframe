# Material library documentation

Read only the documents required by the task:

- [`architecture.md`](./architecture.md) — boundary, ownership, dependency direction, decomposition, and public API;
- [`tokens.md`](./tokens.md) — token taxonomy, ownership, graph, routing, and verification;
- [`sources.md`](./sources.md) — official Material evidence rules;
- [`component-development.md`](./component-development.md) — durable family convergence model;
- [`foundation-development.md`](./foundation-development.md) — durable foundation convergence model;
- [`roadmap.md`](./roadmap.md) — active family, current blocker, and one next action.

Executable procedures live in `.agents/skills`:

- `material-component` and `material-foundation` are the only writers and orchestrators;
- target, semantics, token, Web, correction-review, and family-review skills are bounded read-only specialists;
- contract, implementation, and adoption skills run only inside their orchestrator.

The owning family or foundation README stores compact current truth and durable accepted contracts. Code and proof own exact selectors, declarations, token routes, and runtime details.

Do not create parallel registries, inventories, audits, histories, checklists, scorecards, progress ledgers, or duplicated workflow instructions.
