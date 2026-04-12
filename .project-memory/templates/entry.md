---
scope:
  - src/path/or/library
kind: correction
rule: Short, project-specific rule stated no stronger than the evidence supports.
why: What breaks, regresses, or becomes misleading if the rule is ignored.
mistake: What the wrong conclusion or action was.
correction: What is correct instead.
applies-when:
  - The helper, boundary, or runtime condition where this lesson matters.
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

Keep the body short.

For `kind: correction`, preserve only the extra context that future retrieval needs:

- what the wrong inference was;
- how to act correctly next time;
- what evidence proved it;
- whether the lesson should later move into a stronger artifact.

For non-correction entries, remove `mistake`, `correction`, and `applies-when` if they do not help retrieval.

If `status: promoted`, keep the body breadcrumb-short and point at `promotion-target` instead of restating the whole rule.
