import { describe, expect, it } from 'vitest';

import { validateProjectMemoryCodexHooks } from './codexHookValidation.mjs';

describe('project-memory codex hook validation', () => {
  it('treats codex_hooks=false as a suspended mode', () => {
    const result = validateProjectMemoryCodexHooks({
      codexDirectoryExists: true,
      codexDirectoryIsDirectory: true,
      configExists: true,
      configContent: '[features]\ncodex_hooks = false\n',
      hooksExists: false,
      hooksContent: undefined,
    });

    expect(result.errors).toEqual([]);
    expect(result.hooksEnabled).toBe(false);
    expect(result.warnings.join('\n')).toContain('intentionally suspended');
  });

  it('ignores malformed hooks.json when project-memory hooks are suspended', () => {
    const result = validateProjectMemoryCodexHooks({
      codexDirectoryExists: true,
      codexDirectoryIsDirectory: true,
      configExists: true,
      configContent: '[features]\ncodex_hooks = false\n',
      hooksExists: true,
      hooksContent: '{not valid json',
    });

    expect(result.errors).toEqual([]);
    expect(result.hooksEnabled).toBe(false);
  });

  it('still validates hook wiring when codex_hooks=true', () => {
    const result = validateProjectMemoryCodexHooks({
      codexDirectoryExists: true,
      codexDirectoryIsDirectory: true,
      configExists: true,
      configContent: '[features]\ncodex_hooks = true\n',
      hooksExists: true,
      hooksContent: JSON.stringify({ hooks: {} }),
    });

    expect(result.hooksEnabled).toBe(true);
    expect(result.errors.join('\n')).toContain('SessionStart hook wiring is required');
  });
});
