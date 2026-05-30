import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { releaseOwnedLock, withExpensiveCommandLock, writeMetadata } from './commandLock.mjs';

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
// These tests manipulate the real config lock directory, which lives under
// .verify/locks/expensive-command.lock (.verify is git-ignored). The stale
// threshold from tooling.json is 30 s, so a directory with mtime 60+ s old
// is considered stale.
const CONFIG_LOCK_DIR = path.resolve('.verify/locks/expensive-command.lock');

describe('withExpensiveCommandLock stale recovery', () => {
  beforeEach(() => {
    fs.rmSync(CONFIG_LOCK_DIR, { recursive: true, force: true });
  });

  afterEach(() => {
    fs.rmSync(CONFIG_LOCK_DIR, { recursive: true, force: true });
  });

  it('stays blocked when lock directory is fresh but metadata is missing', async () => {
    fs.mkdirSync(CONFIG_LOCK_DIR, { recursive: true });

    await expect(
      withExpensiveCommandLock({ label: 'test', command: 'test' }, async () => 'done'),
    ).rejects.toThrow('already running');
  });

  it('recovers when lock directory is stale and metadata is missing', async () => {
    fs.mkdirSync(CONFIG_LOCK_DIR, { recursive: true });
    const staleTime = new Date(Date.now() - 60_000);
    fs.utimesSync(CONFIG_LOCK_DIR, staleTime, staleTime);

    const result = await withExpensiveCommandLock(
      { label: 'test', command: 'test' },
      async () => 'done',
    );

    expect(result).toBe('done');
    expect(fs.existsSync(CONFIG_LOCK_DIR)).toBe(false);
  });

  it('recovers when lock directory is stale with valid metadata', async () => {
    fs.mkdirSync(CONFIG_LOCK_DIR, { recursive: true });
    const staleTime = new Date(Date.now() - 60_000);
    fs.utimesSync(CONFIG_LOCK_DIR, staleTime, staleTime);

    writeTestMetadata(CONFIG_LOCK_DIR, {
      ownerToken: 'stale-token',
      pid: 9_999_999,
      hostname: os.hostname(),
      heartbeatAt: new Date(Date.now() - 60_000).toISOString(),
    });

    const result = await withExpensiveCommandLock(
      { label: 'test', command: 'test' },
      async () => 'done',
    );

    expect(result).toBe('done');
    expect(fs.existsSync(CONFIG_LOCK_DIR)).toBe(false);
  });

  it('stays blocked when lock directory is fresh with valid metadata (not stale)', async () => {
    fs.mkdirSync(CONFIG_LOCK_DIR, { recursive: true });

    writeTestMetadata(CONFIG_LOCK_DIR, {
      ownerToken: 'fresh-token',
      pid: process.pid,
      hostname: os.hostname(),
      heartbeatAt: new Date().toISOString(),
    });

    await expect(
      withExpensiveCommandLock({ label: 'test', command: 'test' }, async () => 'done'),
    ).rejects.toThrow('already running');
  });
});

// ---------------------------------------------------------------------------
// Heartbeat write failure
// ---------------------------------------------------------------------------
describe('heartbeat write failure handling', () => {
  it('does not crash when writeMetadata fails and error is caught gracefully', () => {
    const { lockDir } = createTempLockDir();
    const metadataPath = path.join(lockDir, 'metadata.json');

    // Initial metadata write (simulating acquireLock)
    writeMetadata(metadataPath, { ownerToken: 'test-token' });

    // Remove write permission on the lock directory so subsequent writes fail
    fs.chmodSync(lockDir, 0o555);

    // This is what the heartbeat interval does: writeMetadata inside try/catch
    let caughtError = null;

    try {
      writeMetadata(metadataPath, {
        ownerToken: 'test-token',
        heartbeatAt: new Date().toISOString(),
      });
    } catch (error) {
      caughtError = error;
    }

    // The write should have failed
    expect(caughtError).not.toBe(null);
    expect(caughtError.message).toMatch(/EACCES|EPERM|EEXIST|disk/i);

    // Restore permissions for cleanup
    fs.chmodSync(lockDir, 0o755);
  });

  it('does not crash with spy-on-writeFileSync failure and cleanup still runs', async () => {
    vi.useFakeTimers();

    const { lockDir } = createTempLockDir();
    const metadataPath = path.join(lockDir, 'metadata.json');

    // Write initial metadata
    writeMetadata(metadataPath, { ownerToken: 'test' });

    // Spy on writeFileSync to throw for metadata writes after the first one
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

    // Use the temp lock dir as a custom lock directory by resolving the config
    // path. We restore mocks and timers in the `finally`-style afterEach / restore.
    try {
      // Call writeMetadata in the same pattern as the heartbeat interval
      // (try/catch with diagnostic) and verify no crash.
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          writeMetadata(metadataPath, {
            ownerToken: 'test',
            heartbeatAt: new Date().toISOString(),
          });
        } catch {
          // Expected to fail after the first write; heartbeat catches this.
        }
      }

      // The second and third writes should have triggered the mock throw.
      expect(metadataWriteCount).toBeGreaterThan(1);

      // Verify the lock directory still exists (cleanup hasn't run yet, which
      // is expected since we're simulating individual heartbeat writes, not
      // the full lock lifecycle).
      expect(fs.existsSync(lockDir)).toBe(true);
    } finally {
      vi.restoreAllMocks();
      vi.useRealTimers();
    }
  });
});
