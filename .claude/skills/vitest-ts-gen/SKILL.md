---
name: vitest-ts-gen
description: Generates high-quality Vitest unit tests for TypeScript code, adhering to AAA and FIRST principles, including type-level assertions.
argument-hint: [file_path]
---

Please generate comprehensive Vitest unit tests for the TypeScript file located exactly at `$0`.

### CRITICAL RULES (MUST FOLLOW):
- **READ-ONLY SOURCE**: You are STRICTLY FORBIDDEN from editing, rewriting, or modifying `$0` or any other existing source code files in the project.
- **SINGLE FILE OUTPUT**: Create exactly ONE test file. Name it by appending `.test.ts` to the original filename (e.g., `name.test.ts`). Do not create duplicate files with different names.
- **STRICT TYPESCRIPT**: Never ignore TypeScript typing. Do not use `any`, `as any`, or `@ts-ignore`. Use safe type transformations and ensure all mocks (`vi.mocked()`) and test data are strictly typed.
- **RESTRICTED COMMANDS**: To run the test, use ONLY the project's standard test command (e.g., `pnpm eslint`). Do not invent or use incorrect bash scripts.
- **FRAMEWORK & PATTERN**: Use Vitest (`import { describe, it, expect, vi } from 'vitest'`) and strictly follow the AAA (Arrange, Act, Assert) pattern.
- **ERROR HANDLING AND CLARIFICATION**:
If tests fail after code generation, you MUST run the `AskUserQuestion` tool to ask the developer about the correct behavior.
DO NOT attempt to fix tests or code blindly and endlessly if the cause of the failure is unclear. Describe which test failed and the result obtained before asking.