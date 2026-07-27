import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { withVerifyCommandLock } from './commandLock.mjs';
import { resolveVerifyInvocation } from './verifyInvocation.mjs';

const tempDirs = [];

afterEach(() => {
  for (const directory of tempDirs) {
    fs.rmSync(directory, { recursive: true, force: true });
  }

  tempDirs.length = 0;
});

describe('verify lock invocation persistence', () => {
  it('writes the structured invocation through the real machine-lock writer', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-invocation-lock-'));
    const lockDir = path.join(baseDir, 'machine.lock');
    const metadataPath = path.join(lockDir, 'metadata.json');
    tempDirs.push(baseDir);

    const invocation = resolveVerifyInvocation(
      ['--base', 'origin/develop', '--profile', 'github-actions', '--only', 'e2e'],
      { GITHUB_ACTIONS: 'false' },
    );
    let persistedMetadata = null;

    await withVerifyCommandLock(
      {
        command: 'pnpm verify --base origin/develop --profile github-actions --only e2e',
        label: 'verify',
        logPath: '.verify/logs',
        verifyInvocation: invocation,
      },
      async () => {
        persistedMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      },
      {
        forceLock: true,
        machineLockDirectoryPath: lockDir,
        staleAfterMs: 50_000,
      },
    );

    expect(persistedMetadata.verifyInvocation).toEqual(invocation);
    expect(persistedMetadata.kind).toBe('verify');
    expect(persistedMetadata.command).toContain('--base origin/develop');
    expect(fs.existsSync(lockDir)).toBe(false);
  });
});
