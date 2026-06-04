import { describe, expect, it, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  assertNoActiveVerifyLock,
  getVerifyLockStatus,
  releaseOwnedLock,
  withExpensiveCommandLock,
  withVerifyCommandLock,
} from './commandLock.mjs';

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
  it('removes the lock directory when the owner token matches', () => {
    const { lockDir } = createTempLockDir();
    const ownerToken = 'token-abc';
    writeTestMetadata(lockDir, { ownerToken });

    const result = releaseOwnedLock(lockDir, path.join(lockDir, 'metadata.json'), ownerToken);

    expect(result).toBe(true);
    expect(fs.existsSync(lockDir)).toBe(false);
  });

  it('returns false when the owner token does not match current metadata', () => {
    const { lockDir } = createTempLockDir();
    writeTestMetadata(lockDir, { ownerToken: 'actual-owner' });

    const result = releaseOwnedLock(lockDir, path.join(lockDir, 'metadata.json'), 'wrong-owner');

    expect(result).toBe(false);
    expect(fs.existsSync(lockDir)).toBe(true);
  });

  it('returns false when the metadata file is missing', () => {
    const { lockDir } = createTempLockDir();

    const result = releaseOwnedLock(lockDir, path.join(lockDir, 'metadata.json'), 'any-token');

    expect(result).toBe(false);
    expect(fs.existsSync(lockDir)).toBe(true);
  });

  it('returns false when stale metadata was replaced by a fresh owner before releaseOwnedLock reads it', () => {
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
    const result = releaseOwnedLock(lockDir, path.join(lockDir, 'metadata.json'), staleToken);

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

describe('withVerifyCommandLock', () => {
  it('fails fast when another local verify lock is active', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verifylock-dup-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'verify.lock');
    const originalVerifyLockEnv = process.env.MIOFRAME_VERIFY_LOCK_HELD;
    delete process.env.MIOFRAME_VERIFY_LOCK_HELD;
    fs.mkdirSync(lockDir, { recursive: true });
    writeTestMetadata(lockDir, {
      command: 'pnpm verify',
      cwd: '/repo',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      label: 'verify',
      lockPath: lockDir,
      logPath: '.verify/logs',
      ownerToken: 'owner',
      pid: process.pid,
      startedAt: new Date().toISOString(),
    });

    try {
      await expect(
        withVerifyCommandLock(
          {
            command: 'pnpm verify --only type-check',
            label: 'verify',
            logPath: '.verify/logs',
          },
          async () => {},
          {
            lockDirectoryPath: lockDir,
            staleAfterMs: 50_000,
          },
        ),
      ).rejects.toThrow('Another local pnpm verify is already running.');
    } finally {
      if (originalVerifyLockEnv === undefined) {
        delete process.env.MIOFRAME_VERIFY_LOCK_HELD;
      } else {
        process.env.MIOFRAME_VERIFY_LOCK_HELD = originalVerifyLockEnv;
      }
    }
  });

  it('does not skip local verify locking when CI=true outside GitHub Actions', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verifylock-local-ci-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'verify.lock');
    const originalCi = process.env.CI;
    const originalGithubActions = process.env.GITHUB_ACTIONS;
    const originalVerifyLockEnv = process.env.MIOFRAME_VERIFY_LOCK_HELD;
    process.env.CI = 'true';
    delete process.env.GITHUB_ACTIONS;
    delete process.env.MIOFRAME_VERIFY_LOCK_HELD;

    try {
      let lockExistsDuringCallback = false;

      await withVerifyCommandLock(
        {
          command: 'pnpm verify',
          label: 'verify',
          logPath: '.verify/logs',
        },
        async () => {
          lockExistsDuringCallback = fs.existsSync(lockDir);
        },
        {
          lockDirectoryPath: lockDir,
          staleAfterMs: 50_000,
        },
      );

      expect(lockExistsDuringCallback).toBe(true);
    } finally {
      if (originalCi === undefined) {
        delete process.env.CI;
      } else {
        process.env.CI = originalCi;
      }

      if (originalGithubActions === undefined) {
        delete process.env.GITHUB_ACTIONS;
      } else {
        process.env.GITHUB_ACTIONS = originalGithubActions;
      }

      if (originalVerifyLockEnv === undefined) {
        delete process.env.MIOFRAME_VERIFY_LOCK_HELD;
      } else {
        process.env.MIOFRAME_VERIFY_LOCK_HELD = originalVerifyLockEnv;
      }
    }
  });

  it('skips local verify locking in GitHub Actions', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verifylock-gha-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'verify.lock');
    const originalGithubActions = process.env.GITHUB_ACTIONS;
    process.env.GITHUB_ACTIONS = 'true';

    try {
      let lockExistsDuringCallback = false;

      await withVerifyCommandLock(
        {
          command: 'pnpm verify',
          label: 'verify',
          logPath: '.verify/logs',
        },
        async () => {
          lockExistsDuringCallback = fs.existsSync(lockDir);
        },
        {
          lockDirectoryPath: lockDir,
          staleAfterMs: 50_000,
        },
      );

      expect(lockExistsDuringCallback).toBe(false);
    } finally {
      if (originalGithubActions === undefined) {
        delete process.env.GITHUB_ACTIONS;
      } else {
        process.env.GITHUB_ACTIONS = originalGithubActions;
      }
    }
  });
});

describe('getVerifyLockStatus', () => {
  it('reports an active verify lock with metadata', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verifylock-status-active-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'verify.lock');
    fs.mkdirSync(lockDir, { recursive: true });
    writeTestMetadata(lockDir, {
      command: 'pnpm verify',
      cwd: '/repo',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      label: 'verify',
      lockPath: lockDir,
      logPath: '.verify/logs',
      ownerToken: 'owner',
      pid: process.pid,
      startedAt: new Date().toISOString(),
    });

    const status = getVerifyLockStatus({
      lockDirectoryPath: lockDir,
      staleAfterMs: 50_000,
    });

    expect(status.state).toBe('active');
    expect(status.metadata?.command).toBe('pnpm verify');
    expect(status.lockPath).toBe(lockDir);
  });

  it('reports a stale verify lock when the heartbeat is old', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verifylock-status-stale-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'verify.lock');
    fs.mkdirSync(lockDir, { recursive: true });
    writeTestMetadata(lockDir, {
      command: 'pnpm verify',
      heartbeatAt: new Date(Date.now() - 60_000).toISOString(),
      hostname: os.hostname(),
      ownerToken: 'owner',
      pid: 9_999_999,
      startedAt: new Date(Date.now() - 60_000).toISOString(),
    });

    const status = getVerifyLockStatus({
      lockDirectoryPath: lockDir,
      staleAfterMs: 50,
    });

    expect(status.state).toBe('stale');
  });
});

describe('withExpensiveCommandLock verify coordination', () => {
  it('blocks a standalone expensive command while verify is active', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expensive-blocked-by-verify-'));
    tempDirs.push(baseDir);
    const verifyLockDir = path.join(baseDir, 'verify.lock');
    fs.mkdirSync(verifyLockDir, { recursive: true });
    writeTestMetadata(verifyLockDir, {
      command: 'pnpm verify',
      cwd: '/repo',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      label: 'verify',
      lockPath: verifyLockDir,
      logPath: '.verify/logs',
      ownerToken: 'owner',
      pid: process.pid,
      startedAt: new Date().toISOString(),
    });
    const originalVerifyLockEnv = process.env.MIOFRAME_VERIFY_LOCK_HELD;
    delete process.env.MIOFRAME_VERIFY_LOCK_HELD;

    try {
      await expect(
        withExpensiveCommandLock(
          { label: 'visual', command: 'pnpm test:visual' },
          async () => 'done',
          {
            lockDirectoryPath: path.join(baseDir, 'expensive.lock'),
            staleAfterMs: 50_000,
            verifyLockDirectoryPath: verifyLockDir,
          },
        ),
      ).rejects.toThrow('Another local pnpm verify is already running.');
    } finally {
      if (originalVerifyLockEnv === undefined) {
        delete process.env.MIOFRAME_VERIFY_LOCK_HELD;
      } else {
        process.env.MIOFRAME_VERIFY_LOCK_HELD = originalVerifyLockEnv;
      }
    }
  });
});

describe('assertNoActiveVerifyLock', () => {
  it('does nothing when no active verify lock exists', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verifylock-guard-missing-'));
    tempDirs.push(baseDir);

    expect(() =>
      assertNoActiveVerifyLock({
        lockDirectoryPath: path.join(baseDir, 'verify.lock'),
      }),
    ).not.toThrow();
  });

  it('fails fast when another local verify lock is active', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verifylock-guard-active-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'verify.lock');
    fs.mkdirSync(lockDir, { recursive: true });
    writeTestMetadata(lockDir, {
      activeCommand: 'pnpm verify --only type-check',
      command: 'pnpm verify',
      cwd: '/repo',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      label: 'verify',
      lockPath: lockDir,
      logPath: '.verify/logs/verify.log',
      ownerToken: 'owner',
      pid: process.pid,
      startedAt: new Date().toISOString(),
    });

    expect(() =>
      assertNoActiveVerifyLock({
        lockDirectoryPath: lockDir,
        processEnv: {
          ...process.env,
          MIOFRAME_VERIFY_LOCK_HELD: undefined,
        },
        staleAfterMs: 50_000,
      }),
    ).toThrow('Another local pnpm verify is already running.');
    expect(() =>
      assertNoActiveVerifyLock({
        lockDirectoryPath: lockDir,
        processEnv: {
          ...process.env,
          MIOFRAME_VERIFY_LOCK_HELD: undefined,
        },
        staleAfterMs: 50_000,
      }),
    ).toThrow('active command: pnpm verify --only type-check');
    expect(() =>
      assertNoActiveVerifyLock({
        lockDirectoryPath: lockDir,
        processEnv: {
          ...process.env,
          MIOFRAME_VERIFY_LOCK_HELD: undefined,
        },
        staleAfterMs: 50_000,
      }),
    ).toThrow(`pid: ${process.pid}`);
    expect(() =>
      assertNoActiveVerifyLock({
        lockDirectoryPath: lockDir,
        processEnv: {
          ...process.env,
          MIOFRAME_VERIFY_LOCK_HELD: undefined,
        },
        staleAfterMs: 50_000,
      }),
    ).toThrow(`cwd: /repo`);
    expect(() =>
      assertNoActiveVerifyLock({
        lockDirectoryPath: lockDir,
        processEnv: {
          ...process.env,
          MIOFRAME_VERIFY_LOCK_HELD: undefined,
        },
        staleAfterMs: 50_000,
      }),
    ).toThrow(`lockPath: ${lockDir}`);
    expect(() =>
      assertNoActiveVerifyLock({
        lockDirectoryPath: lockDir,
        processEnv: {
          ...process.env,
          MIOFRAME_VERIFY_LOCK_HELD: undefined,
        },
        staleAfterMs: 50_000,
      }),
    ).toThrow('logPath: .verify/logs/verify.log');
  });

  it('does not bypass the guard when only CI=true is set locally', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verifylock-guard-local-ci-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'verify.lock');
    fs.mkdirSync(lockDir, { recursive: true });
    writeTestMetadata(lockDir, {
      command: 'pnpm verify',
      cwd: '/repo',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      label: 'verify',
      lockPath: lockDir,
      logPath: '.verify/logs',
      ownerToken: 'owner',
      pid: process.pid,
      startedAt: new Date().toISOString(),
    });

    expect(() =>
      assertNoActiveVerifyLock({
        lockDirectoryPath: lockDir,
        processEnv: {
          ...process.env,
          CI: 'true',
          GITHUB_ACTIONS: 'false',
          MIOFRAME_VERIFY_LOCK_HELD: undefined,
        },
        staleAfterMs: 50_000,
      }),
    ).toThrow('Another local pnpm verify is already running.');
  });

  it('skips the guard in GitHub Actions', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verifylock-guard-gha-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'verify.lock');
    fs.mkdirSync(lockDir, { recursive: true });
    writeTestMetadata(lockDir, {
      command: 'pnpm verify',
      cwd: '/repo',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      label: 'verify',
      lockPath: lockDir,
      logPath: '.verify/logs',
      ownerToken: 'owner',
      pid: process.pid,
      startedAt: new Date().toISOString(),
    });

    expect(() =>
      assertNoActiveVerifyLock({
        lockDirectoryPath: lockDir,
        processEnv: {
          ...process.env,
          GITHUB_ACTIONS: 'true',
          MIOFRAME_VERIFY_LOCK_HELD: undefined,
        },
        staleAfterMs: 50_000,
      }),
    ).not.toThrow();
  });
});
