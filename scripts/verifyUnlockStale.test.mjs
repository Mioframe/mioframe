import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { unlockStaleMachineLock } from './verifyUnlockStale.mjs';

const tempDirs = [];

function createTempLockDir() {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-unlock-stale-test-'));
  const lockDir = path.join(baseDir, 'machine.lock');
  fs.mkdirSync(lockDir, { recursive: true });
  tempDirs.push(baseDir);
  return { baseDir, lockDir, metadataPath: path.join(lockDir, 'metadata.json') };
}

function writeMetadata(metadataPath, metadata) {
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + '\n', 'utf8');
}

afterEach(() => {
  vi.restoreAllMocks();

  for (const dir of tempDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup.
    }
  }

  tempDirs.length = 0;
});

describe('unlockStaleMachineLock', () => {
  it('does not remove an active machine lock', () => {
    const { lockDir, metadataPath } = createTempLockDir();
    const metadata = {
      activeCommand: 'pnpm verify',
      command: 'pnpm verify',
      heartbeatAt: new Date().toISOString(),
      ownerToken: 'active-owner',
      pid: process.pid,
    };
    writeMetadata(metadataPath, metadata);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const exitCode = unlockStaleMachineLock({
      lockPath: lockDir,
      metadata,
      metadataPath,
      state: 'active',
      statusReason: null,
    });

    expect(exitCode).toBe(1);
    expect(fs.existsSync(lockDir)).toBe(true);
  });

  it('does not remove a corrupt machine lock automatically', () => {
    const { lockDir, metadataPath } = createTempLockDir();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const exitCode = unlockStaleMachineLock({
      lockPath: lockDir,
      metadata: null,
      metadataPath,
      state: 'corrupt',
      statusReason: 'metadata missing',
    });

    expect(exitCode).toBe(1);
    expect(fs.existsSync(lockDir)).toBe(true);
  });

  it('removes a stale machine lock with matching owner metadata', () => {
    const { lockDir, metadataPath } = createTempLockDir();
    const metadata = {
      heartbeatAt: new Date(Date.now() - 60_000).toISOString(),
      ownerToken: 'stale-owner',
      pid: 9_999_999,
    };
    writeMetadata(metadataPath, metadata);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const exitCode = unlockStaleMachineLock({
      lockPath: lockDir,
      metadata,
      metadataPath,
      state: 'stale',
      statusReason: null,
    });

    expect(exitCode).toBe(0);
    expect(fs.existsSync(lockDir)).toBe(false);
  });

  it('removes a stale machine lock directory when metadata is unavailable', () => {
    const { lockDir, metadataPath } = createTempLockDir();
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const exitCode = unlockStaleMachineLock({
      lockPath: lockDir,
      metadata: null,
      metadataPath,
      state: 'stale',
      statusReason: 'metadata missing',
    });

    expect(exitCode).toBe(0);
    expect(fs.existsSync(lockDir)).toBe(false);
  });
});
