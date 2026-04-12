---
scope:
  - .codex
  - scripts/project-memory/validateProjectMemory.mjs
  - .project-memory
kind: correction
rule: Repo-local project-memory hooks may be intentionally suspended while ByteRover is the primary memory workflow. In that mode, `memory:validate` must keep validating memory entries and only validate hook wiring when `codex_hooks = true`.
why: Treating disabled repo-local hooks as a validation failure prevents the local fallback from being safely suspended and makes unrelated docs or tooling changes fail even when ByteRover is the intended primary memory path.
mistake: Assuming project-memory validation must always require active `.codex` hook wiring and `codex_hooks = true`.
correction: Allow suspended mode with `codex_hooks = false`, keep `.project-memory` and `pnpm memory:*` available as manual fallback, and validate hook wiring only when hooks are explicitly enabled.
applies-when:
  - Switching primary agent memory from repo-local project-memory to ByteRover.
  - Editing `.codex/config.toml`, `.codex/hooks.json`, or `scripts/project-memory/validateProjectMemory.mjs`.
  - Tightening or relaxing project-memory lifecycle automation without deleting the local fallback.
evidence:
  - type: code
    ref: .codex/config.toml
    note: The repo now suspends repo-local hook automation with `codex_hooks = false`.
  - type: code
    ref: scripts/project-memory/codexHookValidation.mjs
    note: Hook validation is conditional on hooks being explicitly enabled.
  - type: code
    ref: .husky/pre-commit
    note: Pre-commit no longer forces `pnpm memory:task:review --staged` while the local fallback is suspended.
  - type: doc
    ref: .project-memory/WORKFLOW.md
    note: The workflow now describes local project-memory as an explicit fallback behind ByteRover.
status: verified
confidence: high
promotion-target:
  artifact: repo memory workflow docs and validator logic
  ref: .project-memory/WORKFLOW.md
  trigger: Promote when ByteRover setup becomes stable enough that local project-memory can be fully removed or when hook suspend mode becomes a stable AGENTS rule.
review-trigger:
  - When project-memory hooks are re-enabled.
  - When `memory:validate` starts enforcing hook wiring again.
  - When ByteRover installation becomes part of the required local environment.
last-verified-at: 2026-04-12
---

Suspended hooks are valid when ByteRover is the primary memory layer. The local project-memory system stays useful as a manual fallback, so validation must keep checking the memory corpus without forcing automatic Codex integration.
