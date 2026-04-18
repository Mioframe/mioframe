---
name: commit-message-generator
description: "Generate high-quality Conventional Commits messages following https://www.conventionalcommits.org/en/v1.0.0/."
---

Use this skill when you want a clean, correct git commit message in Conventional Commits format.

Rules:
1. Output only the commit message text, without markdown, quotes, or extra explanation.
2. Follow Conventional Commits v1.0.0 strictly.
3. Use a valid type: feat, fix, docs, style, refactor, perf, test, build, ci, chore.
4. Include a scope only when there is a clear affected module or subsystem.
5. Keep the subject line under 50 characters.
6. Separate subject and body with a blank line.
7. If you include a body, explain why the change was made and what it does.
8. Do not include issue numbers unless explicitly provided.
9. Do not use prefixes like "WIP:" or "Update" in the subject.

Input:
- summary of change
- list of modified files or affected areas
- optional issue or task reference

Example output:
feat(database): add partial index support for relation queries

Improve query performance for large datasets by adding support for partial indexes on relation query fields.
