---
paths:
  - "src/**/*.{js,ts,vue}"
---

- **CRITICAL**: YOU MUST NOT consider the task complete if ESLint fails. "Minor" or "false positive" issues are NOT an excuse. YOU MUST fix the code.
- ALWAYS use eslint.
  - use skill "eslint-fix" or command to run: `pnpm eslint --fix <path>`.
- Use strong typing.
- Use camelCase for variable and function names.
- Don't leave unused code.
- You can't ignore the linter rules.
- eslint and typing cannot be ignored.
- never use `any` type.
- never use `as` keyword for type assertion.
- never use `// @ts-ignore` to ignore TypeScript errors.
- never use `// eslint-disable` to ignore ESLint errors.