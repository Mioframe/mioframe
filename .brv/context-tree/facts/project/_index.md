---
children_hash: c49cd7e0a9e1838fe035eb2b3eced7b4b53eab28e296e3f96027cdc89efb7f74
compression_ratio: 0.6096997690531177
condensation_order: 1
covers: [context.md, testing_preferences.md]
covers_token_total: 433
summary_level: d1
token_count: 264
type: summary
---

# Project — Testing Constraints & Preferences (d1)

## Scope (from `context.md`)

- Topic captures explicit **testing constraints/preferences** that shape how automated tests are written and maintained.
- Focus areas:
  - **Unit test speed**
  - **In-memory testing**
  - **Test environment constraints**
- Related direction: testing guidance may expand into broader **test architecture/tooling** topics over time.

## Core Rule & Convention (from `testing_preferences.md`)

- **Rule (verbatim):** _“Unit tests should stay fast and in-memory.”_
- **Intent / impact:** unit-test layer should favor **isolated execution** with **minimal external dependencies**, avoiding slow integration-style setup (e.g., real DB/network/service dependencies) in unit tests.
- **Process flow:** `test execution -> in-memory isolation -> fast feedback`
- **Recorded fact:** `unit_test_execution` — Unit tests should stay fast and in-memory (category: convention).
- Provenance metadata:
  - Timestamp: **2026-04-17**
  - Author: **user**
  - Maturity: **core** (importance 85)
