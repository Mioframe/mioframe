# .codex

Inherits the rules from `/AGENTS.md`. Applies to `.codex` and its descendants.

## Contains

- Repo-local Codex configuration and hook wiring for optional `.project-memory` automation.

## Patterns

- Keep hook behavior thin: when project-memory automation is re-enabled, repo-local hooks should call `scripts/project-memory` logic instead of re-implementing lookup or diff review rules.
- Treat `.codex/hooks.json` as wiring only. Put behavior in versioned scripts where it can be smoke-tested and reviewed with the rest of the memory tooling.
- ByteRover is the primary memory path right now, so `.codex/config.toml` may intentionally suspend repo-local project-memory hooks with `codex_hooks = false`.
- When hooks are enabled again, bias them toward additive context, precise Bash guardrails, and early guidance. Leave durable enforcement to `memory:task:finish` and repo-local validation, not to `git commit`, `git push`, or stop-time traps.
- Keep the hook error policy explicit by event: `SessionStart`, `UserPromptSubmit`, and `Stop` may fail-soft because they add context or reminders, but `PreToolUse` must still fail-closed on internal errors so broken guardrails do not masquerade as success.

## Constraints

- Only use documented Codex hook events and output shapes.
- Assume `PreToolUse` and `PostToolUse` currently intercept Bash only; do not describe them as complete coverage for non-shell tools.
- When `PreToolUse` hits an internal error, let Codex see a non-zero hook exit instead of treating the failure as an allow.
- Run `pnpm memory:validate` after editing `.codex/config.toml`, `.codex/hooks.json`, or the repo-local hook scripts they call. In the current suspended mode, validation should pass without active hook wiring.
