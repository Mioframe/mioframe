## Key points
- The document defines a project testing preference: **unit tests should stay fast and in-memory**.
- The goal is to keep unit tests **lightweight**, with **fast feedback** and **in-memory isolation**.
- It discourages slow or external dependencies in the unit-test layer, favoring **isolated execution**.
- Recommended implementations include **in-memory repositories**, **fake services**, and **pure-function tests**.
- The preference is framed as a guidance that influences **test design choices** and reduces reliance on integration-style setup.
- The core fact is recorded as a convention: `unit_test_execution`.

## Structure / sections summary
- **Metadata**: Title, summary, tags, keywords, importance, recency, maturity, and timestamps.
- **Reason**: States the document’s purpose is to curate a concise project preference from probe context.
- **Raw Concept**: Captures the task, the specific change made, the intended flow (`test execution -> in-memory isolation -> fast feedback`), and author/timestamp details.
- **Narrative**: Explains the preference, its dependencies, highlights, rules, and examples.
- **Facts**: Records the canonical convention for unit test execution.

## Notable entities, patterns, or decisions
- **Decision**: Unit tests should be **fast and in-memory**.
- **Pattern**: Prefer **in-memory isolation** over external dependencies for unit-test scope.
- **Design implication**: Use **fake services** and **in-memory repositories** instead of real databases.
- **Testing strategy**: Favor **pure-function tests** for unit coverage.
- **Conceptual flow**: `test execution -> in-memory isolation -> fast feedback`