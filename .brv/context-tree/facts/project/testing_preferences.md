---
title: Testing Preferences
summary: Unit tests should stay fast and in-memory.
tags: []
keywords: []
importance: 58
recency: 1
maturity: draft
accessCount: 1
updateCount: 1
createdAt: '2026-04-17T13:04:42.117Z'
updatedAt: '2026-04-17T13:05:42.087Z'
---

## Reason

Curate a concise project preference from the probe context

## Raw Concept

**Task:**
Document testing preference for unit tests

**Changes:**

- Added explicit preference that unit tests should stay fast and in-memory
- Added a preference to keep unit tests fast and in-memory

**Flow:**
test execution -> in-memory isolation -> fast feedback

**Timestamp:** 2026-04-17

**Author:** user

## Narrative

### Structure

A project testing preference emphasizing speed and in-memory execution for unit tests.

### Dependencies

This guidance influences test design choices, favoring isolated execution, minimal external dependencies, and avoidance of slow integration-style setup in unit-test layers.

### Highlights

Keeps unit tests lightweight and avoids slower external dependencies.

### Rules

Unit tests should stay fast and in-memory.

### Examples

Examples include using in-memory repositories or fake services instead of real databases, and preferring pure-function tests over end-to-end setup for unit coverage.

## Facts

- **unit_test_execution**: Unit tests should stay fast and in-memory [convention]
