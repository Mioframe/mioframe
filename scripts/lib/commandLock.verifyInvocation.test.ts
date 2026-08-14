import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { getMachineLockStatus, withVerifyCommandLock, type LockMetadata } from './commandLock.ts';
import { resolveVerifyInvocation } from './verifyInvocation.ts';
import { getRetryInstruction } from '../verifyResume.ts';

const tempDirs: string[] = [];

afterEach(() => {
  for (const directory of tempDirs) {
    fs.rmSync(directory, { recursive: true, force: true });
  }

  tempDirs.length = 0;
});

describe('verify lock invocation persistence', () => {
  it('round-trips the structured invocation through the real lock writer and status reader', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-invocation-lock-'));
    const lockDir = path.join(baseDir, 'machine.lock');
    const metadataPath = path.join(lockDir, 'metadata.json');
    tempDirs.push(baseDir);

    const invocation = resolveVerifyInvocation(
      ['--base', 'origin/develop', '--profile', 'github-actions', '--only', 'e2e'],
      { GITHUB_ACTIONS: 'false' },
    );
    const { persistedMetadata, activeStatus } = await withVerifyCommandLock(
      {
        command: 'pnpm verify --base origin/develop --profile github-actions --only e2e',
        label: 'verify',
        logPath: '.verify/logs',
        verifyInvocation: invocation,
      },
      () => {
        const readMetadata: LockMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

        return {
          persistedMetadata: readMetadata,
          activeStatus: getMachineLockStatus({
            lockDirectoryPath: lockDir,
            staleAfterMs: 50_000,
          }),
        };
      },
      {
        forceLock: true,
        heartbeatIntervalMs: 50_000,
        machineLockDirectoryPath: lockDir,
        staleAfterMs: 50_000,
      },
    );

    expect(persistedMetadata.verifyInvocation).toEqual(invocation);
    expect(activeStatus).toMatchObject({
      state: 'active',
      metadata: { verifyInvocation: invocation },
    });
    expect(getRetryInstruction(activeStatus.metadata)).toBe(
      '  Run `pnpm verify --base origin/develop --profile github-actions --only e2e` again.',
    );
    expect(persistedMetadata.kind).toBe('verify');
    expect(persistedMetadata.command).toContain('--base origin/develop');
    expect(fs.existsSync(lockDir)).toBe(false);
  });
});
