---
tags: []
keywords: []
importance: 53
recency: 1
maturity: draft
accessCount: 1
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
