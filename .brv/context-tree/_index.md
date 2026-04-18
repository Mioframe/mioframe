---
children_hash: 88c7eec4bc2e20d668529ed0b60645a23a8d4638f894a6f6c55683c5a1354bcc
compression_ratio: 0.7375745526838966
condensation_order: 3
covers: [facts/_index.md]
covers_token_total: 503
summary_level: d3
token_count: 371
type: summary
---
## facts domain

The `facts` domain stores durable, recall-friendly project knowledge: technology choices, architectural facts, testing expectations, environment constraints, and operational preferences. It is meant for stable conventions rather than feature-specific implementation details or personal profile data.

### Structural overview
- **`context.md`** defines the domain boundary and intended usage.
  - Covers project-wide facts, technical choices, and operational preferences.
  - Excludes personal user facts and detailed feature implementation notes.
- **`project/_index.md`** is the testing-focused branch of the domain.
  - It links the domain framing in `context.md` to the testing subtree.
  - It preserves the distinction between high-level overview and detailed testing guidance.
- **`testing_preferences.md`** contains the concrete unit-testing conventions.

### Key facts and decisions
- Unit tests should stay **fast and in-memory**.
- Preferred testing style emphasizes:
  - in-memory isolation,
  - fast feedback,
  - avoiding slow integration-style setup,
  - minimizing external dependencies.
- Common implementation patterns include:
  - in-memory repositories,
  - fake services,
  - pure-function tests.

### Relationships and drill-down
- Start with **`context.md`** for domain scope.
- Use **`project/_index.md`** for the structural bridge into testing guidance.
- Drill into **`testing_preferences.md`** for the full unit-testing rule set and rationale.