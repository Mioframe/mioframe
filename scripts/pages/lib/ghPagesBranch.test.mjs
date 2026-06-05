import { describe, expect, it, vi } from 'vitest';

import { rebaseWithAbort } from './ghPagesBranch.mjs';

describe('rebaseWithAbort', () => {
  it('calls git rebase --abort and rethrows when rebase fails', () => {
    const commands = [];
    const exec = vi.fn((cmd) => {
      commands.push(cmd);
      if (cmd.startsWith('git rebase origin/')) throw new Error('conflict during rebase');
    });

    expect(() => rebaseWithAbort('/tmp/work', 1, exec)).toThrow('Rebase failed');
    expect(commands).toContain('git rebase --abort');
  });

  it('rethrows even when git rebase --abort also fails', () => {
    const exec = vi.fn((cmd) => {
      throw new Error(cmd.includes('abort') ? 'abort failed too' : 'conflict');
    });

    expect(() => rebaseWithAbort('/tmp/work', 2, exec)).toThrow('Rebase failed');
  });

  it('does not call git rebase --abort when rebase succeeds', () => {
    const commands = [];
    const exec = vi.fn((cmd) => {
      commands.push(cmd);
    });

    rebaseWithAbort('/tmp/work', 1, exec);

    expect(commands).not.toContain('git rebase --abort');
  });
});
