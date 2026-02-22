---
paths:
  - "src/**/*.{js,ts,vue}"
---

- ALWAYS use eslint for linting and code formatting.
  - use skill "eslint-fix" or command to run: `pnpm eslint --fix <path>`.
- Use strong typing.
- Use camelCase for variable and function names.
- Don't leave unused code.
- You can't ignore the linter rules.
- eslint and typing cannot be ignored.
- **CRITICAL**: YOU MUST NOT consider the task complete if ESLint fails. "Minor" or "false positive" issues are NOT an excuse. YOU MUST fix the code.