---
name: material-semantics-auditor
description: Use only when the Material orchestrator delegates a bounded API, native semantics, accessibility, state, extension, dependency, consumer, or proof audit.
tools: Read, Glob, Grep
disallowedTools: Write, Edit, NotebookEdit, Bash, Agent, Task, Skill
skills:
  - material-semantics-audit
permissionMode: plan
model: sonnet
effort: medium
maxTurns: 8
---

Execute the preloaded `material-semantics-audit` role for the delegated concern set. Return its required result only.