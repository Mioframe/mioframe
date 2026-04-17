---
title: Testing Preferences
summary: Project testing preference that unit tests should remain fast and in-memory
tags: []
keywords: []
importance: 50
recency: 1
maturity: draft
createdAt: '2026-04-17T13:04:42.117Z'
updatedAt: '2026-04-17T13:04:42.117Z'
---
## Reason
Capture explicit project testing preference from RLM context

## Raw Concept
**Task:**
Document project testing preference for unit test execution

**Changes:**
- Added explicit preference that unit tests should stay fast and in-memory

**Flow:**
testing guidance noted -> stored as project fact -> reused in future implementation decisions

**Timestamp:** 2026-04-17

**Author:** RLM context

## Narrative
### Structure
This topic stores durable project-level testing guidance as concise factual knowledge for future recall and implementation alignment. It focuses on how unit tests are expected to run rather than on any specific test file or framework.

### Dependencies
This guidance influences test design choices, favoring isolated execution, minimal external dependencies, and avoidance of slow integration-style setup in unit-test layers.

### Highlights
The project preference is explicit: unit tests should stay fast and in-memory. This implies a bias toward lightweight mocks, deterministic fixtures, and no dependency on external services for unit-level coverage.

### Rules
Unit tests should stay fast and in-memory.

### Examples
Examples include using in-memory repositories or fake services instead of real databases, and preferring pure-function tests over end-to-end setup for unit coverage.

## Facts
- **unit_test_execution_model**: Unit tests should stay fast and in-memory. [project]
