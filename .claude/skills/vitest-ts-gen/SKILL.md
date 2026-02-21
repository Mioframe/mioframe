---
name: vitest-ts-gen
description: Generates high-quality Vitest unit tests for TypeScript code, adhering to AAA and FIRST principles, including type-level assertions.
argument-hint: [file_path]
---

Please generate comprehensive Vitest unit tests for the TypeScript file located at `$0`.

### Technical Guidelines:
1. **Framework**: Use Vitest syntax (`import { describe, it, expect, vi } from 'vitest'`).
2. **Type Safety**: 
   - Ensure all test data, mocks, and spies are strictly typed using TypeScript.
   - Use `vi.mocked()` for type-safe interaction with mocked dependencies.
   - If applicable, include type-level tests using `expectTypeOf` or `assertType` to verify complex TypeScript utility types.
3. **AAA Pattern (Arrange, Act, Assert)**:
   - **Arrange**: Setup the environment, initialize the System Under Test (SUT), and prepare typed mocks.
   - **Act**: Execute the function or method being tested.
   - **Assert**: Verify the results match expectations using Vitest's matchers like `toBe`, `toEqual`, or `toMatchSnapshot`.
4. **Mocking**: Use `vi.mock()` for external modules and `vi.fn()` for function spies to ensure isolation.
5. **Principles**: Follow **FIRST** (Fast, Independent, Repeatable, Self-Validating, Timely) and prioritize testing the **Public API** over private implementation details.

Choose the appropriate mocking strategy (Mocks, Stubs, or Fakes) based on whether you need to verify behavior, provide fixed outputs, or use simplified logic.
