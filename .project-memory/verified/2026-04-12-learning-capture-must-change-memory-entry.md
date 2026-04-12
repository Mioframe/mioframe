---
scope:
  - scripts/project-memory/reviewProjectMemoryDiff.mjs
  - scripts/project-memory/finishProjectMemoryTask.mjs
  - .project-memory
kind: correction
rule: Do not allow `--learning-resolution record:<memory-path>` for learning capture. A lesson counts only when the current diff changes a real `.project-memory` entry or finish uses `--learning-resolution covered-by:<artifact-path>`.
why: Pointing at an unchanged older memory record lets tasks claim durable learning without recording any new evidence in the current change.
mistake: Treating a reference to an existing memory entry as equivalent to actually updating or creating the entry for the current lesson.
correction: Keep learning capture diff-backed. Either edit a real memory entry in `drafts/`, `verified/`, `promoted/`, or `archive/`, or close with `covered-by` when a stronger artifact already expresses the rule.
applies-when:
  - Tightening project-memory finish and review semantics.
  - Evaluating whether a risky task really persisted a reusable lesson.
  - Reviewing auto-generated learning candidates from `memory:task:finish`; a suggested draft is guidance, not capture by itself.
evidence:
  - type: code
    ref: scripts/project-memory/reviewProjectMemoryDiff.mjs:21
    note: Review CLI help only documents `covered-by` as the explicit learning resolution.
  - type: code
    ref: scripts/project-memory/reviewProjectMemoryDiff.mjs:196
    note: Learning-resolution parsing accepts only `covered-by` and rejects unsupported modes.
  - type: code
    ref: scripts/project-memory/reviewProjectMemoryDiff.mjs:436
    note: Learning capture is satisfied only by changed memory entries in the diff or an explicit `covered-by` resolution.
  - type: code
    ref: scripts/project-memory/finishProjectMemoryTask.mjs:13
    note: Finish CLI help matches review and no longer advertises `record:`.
  - type: doc
    ref: .project-memory/WORKFLOW.md:76
    note: Workflow says unchanged older records do not count as learning capture.
  - type: code
    ref: scripts/project-memory/finishProjectMemoryTask.mjs
    note: Finish can print a suggested learning candidate draft, but capture is still satisfied only by a real entry diff or explicit `covered-by`.
status: verified
confidence: high
promotion-target:
  artifact: project-memory workflow docs plus diff review enforcement
  ref: .project-memory/WORKFLOW.md
  trigger: Promote when another review or bug fix shows this learning-capture rule should become an AGENTS invariant or dedicated test fixture.
review-trigger:
  - When learning-resolution modes change.
  - When finish or review starts accepting new ways to satisfy learning capture.
last-verified-at: 2026-04-12
---

Keep learning capture evidence-first. Suggested candidates can reduce capture friction, but they do not replace the real entry diff or `covered-by` decision that makes the learning durable.
