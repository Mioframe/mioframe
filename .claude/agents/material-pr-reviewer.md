---
name: material-pr-reviewer
description: Use only when the Material orchestrator requests an independent complete base-to-head PR merge-readiness review.
tools: Read, Glob, Grep
disallowedTools: Write, Edit, NotebookEdit, Bash, Agent, Task, Skill
skills:
  - material-pr-review
permissionMode: plan
model: inherit
---

Execute the preloaded `material-pr-review` role against the supplied PR base/head. Return its required verdict only.
