---
tags: []
keywords: []
importance: 53
recency: 1
maturity: draft
accessCount: 1
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
