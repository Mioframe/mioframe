---
scope:
  - src/shared/service/databaseDocument/data
  - src/entities/databaseData
kind: pattern
rule: Database filters and sorts must use effective values when a property defines a default. Sparse stored rows still participate through defaults, and `$exists` must check effective presence rather than raw stored keys.
why: Stored-only logic changes row visibility and ordering after reopen or refresh, especially for sparse items and defaulted properties.
evidence:
  - type: code
    ref: src/shared/service/databaseDocument/data/createDatabaseFilterMatcher.ts:95
    note: Field filters resolve values through getDatabaseEffectiveValue before applying unary operators.
  - type: test
    ref: src/shared/service/databaseDocument/data/queryData.test.ts:10
    note: Sparse items match filters through property defaults.
  - type: test
    ref: src/shared/service/databaseDocument/data/queryData.test.ts:69
    note: $exists true uses effective values when defaults make a field present.
  - type: code
    ref: src/shared/service/databaseDocument/data/sortData.ts:57
    note: Sorting also resolves effective values before comparison.
  - type: test
    ref: src/shared/service/databaseDocument/data/sortData.test.ts:57
    note: Sparse items sort through property defaults.
status: verified
confidence: high
promotion-target:
  artifact: integration test or stronger service rule
  ref: src/shared/service/databaseDocument/AGENTS.md
  trigger: Promote when another data-view regression repeats the stored-vs-effective mismatch.
review-trigger:
  - When filter operator semantics, effective-value helpers, or default handling changes.
  - When a database view bug touches sparse items, defaults, or $exists behavior.
last-verified-at: 2026-04-12
---

This is one of the easiest ways to introduce “works in memory, breaks after reopen” bugs in database views.
