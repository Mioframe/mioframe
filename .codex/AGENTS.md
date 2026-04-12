# .codex

Inherits the rules from `/AGENTS.md`. Applies to `.codex` and its descendants.

## Contains

- Repo-local Codex configuration and hooks that automate `.project-memory` discovery and lifecycle review.

## Patterns

- Keep hook behavior thin: repo-local hooks should call `scripts/project-memory` logic instead of re-implementing lookup or diff review rules.
- Treat `.codex/hooks.json` as wiring only. Put behavior in versioned scripts where it can be smoke-tested and reviewed with the rest of the memory tooling.
- Bias hooks toward additive context, precise Bash guardrails, and at most one stop-loop continuation request. Leave durable enforcement to `memory:task:finish`, pre-commit, and CI.
- Keep the hook error policy explicit by event: `SessionStart` and `UserPromptSubmit` may fail-soft because they only add context, but `PreToolUse` and `Stop` must fail-closed on internal errors so broken guardrails do not masquerade as success.

## Constraints

- Only use documented Codex hook events and output shapes.
- Assume `PreToolUse` and `PostToolUse` currently intercept Bash only; do not describe them as complete coverage for non-shell tools.
- When an enforcement hook hits an internal error, let Codex see a non-zero hook exit instead of treating the failure as an allow or clean stop.
- Run `pnpm memory:validate` after editing `.codex/config.toml`, `.codex/hooks.json`, or the repo-local hook scripts they call.
