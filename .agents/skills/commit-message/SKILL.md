---
name: commit-message-generator
description: 'Generate strictly formatted git commit messages based on explicit rules and provided changes.'
---

Generate exactly ONE Git commit message in Conventional Commits format.

RULES:

1. Format: <type>[optional scope]: <subject> [optional body]
2. Subject: Max 50 chars, lowercase, no period, imperative mood ("add", not "added").
3. Output: Raw text only. No markdown blocks, no quotes, no explanations.
4. Consolidation: Exactly ONE subject line. If multiple changes, use bullet points in body.
5. Body: Wrap at 72 chars. Explain "what" and "why" of the change.
6. Priority:
   - Files in `tests/`, `*.test.*`, `*.spec.*` -> type 'test'.
   - README/docs -> type 'docs'.
   - User-facing features (prod code) -> type 'feat'.
   - Bug fixes (prod code) -> type 'fix'.

TYPES: feat, fix, docs, style, refactor, perf, test, build, ci, chore.

EXAMPLE:
test: add hooks and filesystem tests

- add useReorderSurface event validation
- fix useLastHover state tracking
- improve MemoryFileSystem mock coverage
