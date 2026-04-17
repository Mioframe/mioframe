---
children_hash: 0cdb645074dc8fd14850ef112fbb264ba36e219ad4e095a01e305a0df10bdac3
compression_ratio: 0.7488262910798122
condensation_order: 1
covers: [context.md, testing_preferences.md]
covers_token_total: 426
summary_level: d1
token_count: 319
type: summary
---
# Project Testing Preferences

A compact project-level testing guidance set focused on keeping unit tests fast, isolated, and in-memory. The `context.md` topic establishes the broader scope, while `testing_preferences.md` captures the concrete rule and its implications for test design.

## Core rule
- **Unit tests should stay fast and in-memory** (`testing_preferences.md`).
- This is an explicit project preference, not just an example or suggestion.

## Structural implications
- Test execution should favor **in-memory isolation** and **fast feedback** (`testing_preferences.md`).
- Unit-test layers should avoid slow integration-style setup and minimize external dependencies (`testing_preferences.md`).
- Preferred implementations include **in-memory repositories**, **fake services**, and **pure-function tests** rather than real databases or end-to-end setup (`testing_preferences.md`).

## Key concepts
- **Unit test speed**
- **In-memory testing**
- **Test environment constraints**

## Drill-down references
- `context.md` — high-level overview of the testing constraints and the intended expansion toward test architecture/tooling guidance.
- `testing_preferences.md` — detailed preference, rationale, rules, and examples for the fast in-memory unit-test approach.