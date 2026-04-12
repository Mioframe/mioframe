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
If `status: promoted`, keep the body breadcrumb-short and point readers at `promotion-target` instead of restating the full rule. The structured frontmatter still stays in place for validation and search.

Add `supersedes`, `superseded-by`, and `archive-reason` only when the record replaces, merges, or archives another one.
