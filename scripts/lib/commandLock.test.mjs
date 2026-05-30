import { describe, expect, it, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { releaseOwnedLock, withExpensiveCommandLock } from './commandLock.mjs';

const tempDirs = [];

function createTempLockDir() {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'commandlock-test-'));
  const lockDir = path.join(baseDir, 'lock');
  fs.mkdirSync(lockDir, { recursive: true });
  tempDirs.push(baseDir);
  return { baseDir, lockDir };
}

function writeTestMetadata(lockDir, metadata) {
  fs.writeFileSync(
    path.join(lockDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2) + '\n',
    'utf8',
  );
}

afterEach(() => {
  for (const dir of tempDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup.
    }
  }
  tempDirs.length = 0;
});

describe('releaseOwnedLock', () => {
  it('removes the lock directory when the owner token matches', async () => {
    const { lockDir } = createTempLockDir();
    const ownerToken = 'token-abc';
    writeTestMetadata(lockDir, { ownerToken });

    const result = await releaseOwnedLock(lockDir, path.join(lockDir, 'metadata.json'), ownerToken);

    expect(result).toBe(true);
    expect(fs.existsSync(lockDir)).toBe(false);
  });

  it('returns false when the owner token does not match current metadata', async () => {
    const { lockDir } = createTempLockDir();
    writeTestMetadata(lockDir, { ownerToken: 'actual-owner' });

    const result = await releaseOwnedLock(
      lockDir,
      path.join(lockDir, 'metadata.json'),
      'wrong-owner',
    );

    expect(result).toBe(false);
    expect(fs.existsSync(lockDir)).toBe(true);
  });

  it('returns false when the metadata file is missing', async () => {
    const { lockDir } = createTempLockDir();

    const result = await releaseOwnedLock(
      lockDir,
      path.join(lockDir, 'metadata.json'),
      'any-token',
    );

    expect(result).toBe(false);
    expect(fs.existsSync(lockDir)).toBe(true);
  });

  it('returns false when stale metadata was replaced by a fresh owner before releaseOwnedLock reads it', async () => {
    const { lockDir } = createTempLockDir();
    const staleToken = 'stale-owner';
    const freshToken = 'fresh-owner';

    // Create stale lock
    writeTestMetadata(lockDir, {
      ownerToken: staleToken,
      heartbeatAt: new Date(Date.now() - 3600000).toISOString(),
    });

    // Another process replaces with a fresh lock (the race)
    writeTestMetadata(lockDir, {
      ownerToken: freshToken,
      heartbeatAt: new Date().toISOString(),
    });

    // Original process tries to release using the stale token
    const result = await releaseOwnedLock(lockDir, path.join(lockDir, 'metadata.json'), staleToken);

    expect(result).toBe(false);
    expect(fs.existsSync(lockDir)).toBe(true);

    // Verify the fresh metadata is still intact
    const currentMetadata = JSON.parse(
      fs.readFileSync(path.join(lockDir, 'metadata.json'), 'utf8'),
    );
    expect(currentMetadata.ownerToken).toBe(freshToken);
  });
});

// ---------------------------------------------------------------------------
// Stale recovery for missing / corrupted metadata
// ---------------------------------------------------------------------------
// These tests use isolated temp directories and forceLock so they exercise
// real lock acquisition/recovery behavior regardless of the CI environment.
const STALE_AFTER_MS = 50;

describe('withExpensiveCommandLock stale recovery', () => {
  it('stays blocked when lock directory is fresh but metadata is missing', async () => {
    const { lockDir } = createTempLockDir();

    await expect(
      withExpensiveCommandLock({ label: 'test', command: 'test' }, async () => 'done', {
        lockDirectoryPath: lockDir,
        staleAfterMs: STALE_AFTER_MS,
        forceLock: true,
      }),
    ).rejects.toThrow('already running');
  });

  it('recovers when lock directory is stale and metadata is missing', async () => {
    const { lockDir } = createTempLockDir();
    const staleTime = new Date(Date.now() - 60_000);
    fs.utimesSync(lockDir, staleTime, staleTime);

    const result = await withExpensiveCommandLock(
      { label: 'test', command: 'test' },
      async () => 'done',
      {
        lockDirectoryPath: lockDir,
        staleAfterMs: STALE_AFTER_MS,
        forceLock: true,
      },
    );

    expect(result).toBe('done');
    expect(fs.existsSync(lockDir)).toBe(false);
  });

  it('recovers when lock directory is stale with valid metadata', async () => {
    const { lockDir } = createTempLockDir();
    const staleTime = new Date(Date.now() - 60_000);
    fs.utimesSync(lockDir, staleTime, staleTime);

    writeTestMetadata(lockDir, {
      ownerToken: 'stale-token',
      pid: 9_999_999,
      hostname: os.hostname(),
      heartbeatAt: new Date(Date.now() - 60_000).toISOString(),
    });

    const result = await withExpensiveCommandLock(
      { label: 'test', command: 'test' },
      async () => 'done',
      {
        lockDirectoryPath: lockDir,
        staleAfterMs: STALE_AFTER_MS,
        forceLock: true,
      },
    );

    expect(result).toBe('done');
    expect(fs.existsSync(lockDir)).toBe(false);
  });

  it('stays blocked when lock directory is fresh with valid metadata (not stale)', async () => {
    const { lockDir } = createTempLockDir();

    writeTestMetadata(lockDir, {
      ownerToken: 'fresh-token',
      pid: process.pid,
      hostname: os.hostname(),
      heartbeatAt: new Date().toISOString(),
    });

    await expect(
      withExpensiveCommandLock({ label: 'test', command: 'test' }, async () => 'done', {
        lockDirectoryPath: lockDir,
        staleAfterMs: STALE_AFTER_MS,
        forceLock: true,
      }),
    ).rejects.toThrow('already running');
  });
});

// ---------------------------------------------------------------------------
// Heartbeat write failure lifecycle
// ---------------------------------------------------------------------------
describe('heartbeat write failure handling', () => {
  it('does not crash, logs diagnostic, and cleanup still runs when heartbeat write fails', async () => {
    // Create a temp base directory without pre-creating the lock subdir so
    // acquireLock can create it fresh (the lock dir must not exist yet).
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'commandlock-heartbeat-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'lock');

    // Spy on writeFileSync to throw for metadata writes after the first one
    // (the initial acquireLock write must succeed; subsequent heartbeat writes fail).
    const originalWriteFileSync = fs.writeFileSync.bind(fs);
    let metadataWriteCount = 0;

    vi.spyOn(fs, 'writeFileSync').mockImplementation((filePath, ...args) => {
      const isLockWrite = typeof filePath === 'string' && filePath.startsWith(lockDir + path.sep);

      if (isLockWrite) {
        metadataWriteCount += 1;

        if (metadataWriteCount > 1) {
          throw new Error('Simulated disk full');
        }
      }

      return originalWriteFileSync(filePath, ...args);
    });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      const result = await withExpensiveCommandLock(
        { label: 'test', command: 'test' },
        async () => {
          // Wait long enough for at least one heartbeat interval to fire
          await new Promise((resolve) => setTimeout(resolve, 30));
          return 'callback-result';
        },
        {
          lockDirectoryPath: lockDir,
          forceLock: true,
          heartbeatIntervalMs: 10,
          staleAfterMs: 50000,
        },
      );

      expect(result).toBe('callback-result');

      // A heartbeat write failure diagnostic should have been logged
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(
        consoleErrorSpy.mock.calls.some((call) =>
          String(call[0]).includes('[expensive-lock] heartbeat write failed'),
        ),
      ).toBe(true);

      // Lock directory should be cleaned up after the callback completes
      expect(fs.existsSync(lockDir)).toBe(false);
    } finally {
      vi.restoreAllMocks();
    }
  });
});
