---
children_hash: 60ef0e3e1c72b1c1947af9fd72f135f9cc17ef7e24def23ae4eb4dc123e5cc85
compression_ratio: 0.8504854368932039
condensation_order: 2
covers: [context.md, project/_index.md]
covers_token_total: 515
summary_level: d2
token_count: 438
type: summary
---
# Level d2 Structural Summary: facts

## Domain purpose and scope
The `facts` domain holds stable, recall-friendly project knowledge: technology choices, architectural facts, testing expectations, environment constraints, and operational preferences. It is intended for concise durable conventions rather than feature-specific implementation detail or personal profile data.

## Structural overview
- **`context.md`** defines the domain boundary and intended usage.
  - Includes project-wide facts, technical choices, and operational preferences.
  - Excludes personal user facts and detailed feature implementation notes.
- **`project/_index.md`** summarizes the testing-related branch of this domain.
  - It points to `context.md` and `testing_preferences.md`.
  - It frames testing as a compact, project-level guidance set centered on fast, isolated, in-memory unit tests.

## Key facts and decisions
- The core testing rule is explicit: **unit tests should stay fast and in-memory** (`testing_preferences.md`).
- The preferred test style emphasizes:
  - in-memory isolation,
  - fast feedback,
  - avoiding slow integration-style setup,
  - minimizing external dependencies.
- Common implementation patterns include:
  - in-memory repositories,
  - fake services,
  - pure-function tests.
- The summary treats these as durable project conventions, not optional examples.

## Relationships and drill-down
- `context.md` provides the domain-level framing for all facts.
- `testing_preferences.md` contains the detailed unit-testing rule set and its rationale.
- `project/_index.md` acts as the structural bridge, linking the general facts domain to the testing preference subtree and preserving the distinction between overview and detailed guidance.