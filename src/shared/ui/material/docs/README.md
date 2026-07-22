# Material library documentation

Read only the documents required by the task:

- [`architecture.md`](./architecture.md) — boundary, ownership, dependency direction, execution roles, decomposition, and public API;
- [`tokens.md`](./tokens.md) — token taxonomy, ownership, graph, routing, and verification;
- [`sources.md`](./sources.md) — official Material evidence rules;
- [`component-development.md`](./component-development.md) — durable family convergence, isolation, and resumption model;
- [`foundation-development.md`](./foundation-development.md) — standalone and delegated foundation convergence model;
- [`roadmap.md`](./roadmap.md) — active root label, alignment status, one continuation stack, one checkpoint reason, external blocker, and one next action.

Executable procedures live in `.agents/skills`:

- `material-component` is the coordination-only root for an official component family;
- `material-foundation` is the coordination-only root for a standalone exact foundation domain;
- `material-component-implementation` is the shared fresh isolated writable owner context for component and foundation corrections;
- `material-component-review` and `material-family-review` are different fresh isolated read-only acceptance contexts;
- target, semantics, token, and Web skills are bounded read-only specialists;
- contract synthesis stays read-only in the owning root; adoption stays inside the owner implementation context.

A foundation prerequisite inside a component operation remains on the component root stack and does not create a second root or roadmap writer.

Owner README files store durable supported surface, API, semantics, ownership, token/style/motion contracts, extensions, unsupported behavior, compatibility, and proof obligations. They do not store current stage, correction state, backlog, completed-unit history, review results, shell output, commit narratives, or future passes.

Code and accepted proof own completed work. `roadmap.md` may retain only one validated root-to-deepest unfinished continuation stack and one allowed physical checkpoint reason so a later session can resume the same root operation.

Do not create parallel registries, inventories, audits, histories, checklists, scorecards, progress ledgers, or duplicated workflow instructions.
