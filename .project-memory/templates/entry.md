---
scope:
  - src/path/or/library
kind: lesson
rule: Short, project-specific rule stated no stronger than the evidence supports.
why: What breaks, regresses, or becomes misleading if the rule is ignored.
evidence:
  - type: test
    ref: src/path/example.test.ts:10
    note: Focused proof for the rule.
status: draft
confidence: medium
promotion-target:
  artifact: test
  ref: src/path/example.test.ts
  trigger: Promote when the same lesson repeats or becomes enforceable.
review-trigger:
  - When this scope changes again.
last-verified-at: 2026-04-12
---

Keep the body short. Add only the context that is still hard to infer from the evidence.
