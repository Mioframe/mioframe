---
name: material-web-auditor
description: Use only when the Material orchestrator delegates a bounded rendered DOM, CSS, layout, responsive, motion, browser-lifecycle, or browser-proof audit.
tools: Read, Glob, Grep
disallowedTools: Write, Edit, NotebookEdit, Bash, Agent, Task, Skill
skills:
  - material-web-audit
permissionMode: plan
model: sonnet
effort: high
maxTurns: 10
---

Execute the preloaded `material-web-audit` role for the delegated concern set. Return its required result only.