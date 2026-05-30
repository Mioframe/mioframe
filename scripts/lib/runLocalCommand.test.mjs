import { EventEmitter } from 'node:events';

import { describe, expect, it, vi } from 'vitest';

import { runLocalCommand } from './runLocalCommand.mjs';

describe('runLocalCommand', () => {
  it('returns a normalized status result for normal exits', async () => {
    const child = new EventEmitter();
    const spawn = vi.fn(() => child);

    const promise = runLocalCommand({
      args: ['exec', 'eslint', '.'],
      command: 'pnpm',
      env: { PATH: '/tmp/bin' },
      spawnProcess: spawn,
    });

    child.emit('close', 7, null);

    await expect(promise).resolves.toEqual({
      signal: null,
      status: 7,
    });
    expect(spawn).toHaveBeenCalledWith('pnpm', ['exec', 'eslint', '.'], {
      env: { PATH: '/tmp/bin' },
      stdio: 'inherit',
    });
  });

  it('returns a normalized signal result without mutating the current process', async () => {
    const child = new EventEmitter();
    const spawn = vi.fn(() => child);
    const processKillSpy = vi.spyOn(process, 'kill');
    const originalExitCode = process.exitCode;

    try {
      const promise = runLocalCommand({
        args: ['exec', 'stryker', 'run'],
        command: 'pnpm',
        spawnProcess: spawn,
      });

      child.emit('close', null, 'SIGTERM');

      await expect(promise).resolves.toEqual({
        signal: 'SIGTERM',
        status: null,
      });
      expect(processKillSpy).not.toHaveBeenCalled();
      expect(process.exitCode).toBe(originalExitCode);
    } finally {
      processKillSpy.mockRestore();
      process.exitCode = originalExitCode;
    }
  });

  it('rejects when spawn fails', async () => {
    const child = new EventEmitter();
    const spawn = vi.fn(() => child);
    const error = new Error('spawn failed');
    const promise = runLocalCommand({
      args: ['exec', 'eslint', '.'],
      command: 'pnpm',
      spawnProcess: spawn,
    });

    child.emit('error', error);

    await expect(promise).rejects.toThrow('spawn failed');
  });
});
