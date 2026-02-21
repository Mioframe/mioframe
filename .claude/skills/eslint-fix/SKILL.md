---
name: eslint-fix
description: Uses ESLint to identify and automatically fix code quality and formatting issues in a specific file.
argument-hint: [file_path]
---

Please use ESLint to analyze and repair the file located at `$0`.

Follow these steps:
1. Verify that ESLint is configured in the project.
2. Run the command `pnpm eslint "$0" --fix --concurrency auto` to apply automatic fixes.
3. Review any remaining linting errors that were not automatically resolved.
4. Manually edit the file `$0` to fix the remaining issues, ensuring the code adheres to the project's style guide and ESLint rules.
5. Run the linter one last time to confirm all issues are resolved.
