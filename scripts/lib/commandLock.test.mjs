import { describe, expect, it, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  getExpensiveLockStatus,
  getMachineLockStatus,
  getVerifyLockStatus,
  releaseOwnedLock,
  withExpensiveCommandLock,
  withVerifyCommandLock,
} from './commandLock.mjs';

const tempDirs = [];

async function withProcessEnv(overrides, run) {
  const previousEntries = Object.fromEntries(
    Object.keys(overrides).map((key) => [key, process.env[key]]),
  );

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      Reflect.deleteProperty(process.env, key);
    } else {
      process.env[key] = value;
    }
  }

  try {
    return await run();
  } finally {
    for (const [key, value] of Object.entries(previousEntries)) {
      if (value === undefined) {
        Reflect.deleteProperty(process.env, key);
      } else {
        process.env[key] = value;
      }
    }
  }
}

function createTempLockDir() {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'commandlock-test-'));
  const lockDir = path.join(baseDir, 'machine.lock');
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
const STALE_AFTER_MS = 50;

describe('withExpensiveCommandLock stale recovery', () => {
  it('stays blocked when lock directory is fresh but metadata is missing', async () => {
    const { lockDir } = createTempLockDir();

    await expect(
      withExpensiveCommandLock({ label: 'test', command: 'test' }, async () => 'done', {
        machineLockDirectoryPath: lockDir,
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
        machineLockDirectoryPath: lockDir,
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
        machineLockDirectoryPath: lockDir,
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
        machineLockDirectoryPath: lockDir,
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
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'commandlock-heartbeat-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'machine.lock');

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
          machineLockDirectoryPath: lockDir,
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
          String(call[0]).includes('[machine-lock] heartbeat write failed'),
        ),
      ).toBe(true);

      // Lock directory should be cleaned up after the callback completes
      expect(fs.existsSync(lockDir)).toBe(false);
    } finally {
      vi.restoreAllMocks();
    }
  });
});

// ---------------------------------------------------------------------------
// withVerifyCommandLock
// ---------------------------------------------------------------------------
describe('withVerifyCommandLock', () => {
  it('fails fast when another local verify lock is active', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verifylock-dup-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(lockDir, { recursive: true });
    writeTestMetadata(lockDir, {
      kind: 'verify',
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

    await withProcessEnv(
      {
        GITHUB_ACTIONS: 'false',
        MIOFRAME_MACHINE_LOCK_HELD: undefined,
        MIOFRAME_VERIFY_LOCK_HELD: undefined,
      },
      async () => {
        await expect(
          withVerifyCommandLock(
            {
              command: 'pnpm verify --only type-check',
              label: 'verify',
              logPath: '.verify/logs',
            },
            async () => {},
            {
              forceLock: true,
              machineLockDirectoryPath: lockDir,
              staleAfterMs: 50_000,
            },
          ),
        ).rejects.toThrow('Another local pnpm verify is already running.');
      },
    );
  });

  it('does not skip local verify locking when CI=true outside GitHub Actions', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verifylock-local-ci-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'machine.lock');
    await withProcessEnv(
      {
        CI: 'true',
        GITHUB_ACTIONS: 'false',
        MIOFRAME_MACHINE_LOCK_HELD: undefined,
        MIOFRAME_VERIFY_LOCK_HELD: undefined,
      },
      async () => {
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
            machineLockDirectoryPath: lockDir,
            staleAfterMs: 50_000,
          },
        );

        expect(lockExistsDuringCallback).toBe(true);
      },
    );
  });

  it('skips local verify locking in GitHub Actions', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verifylock-gha-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'machine.lock');
    await withProcessEnv({ GITHUB_ACTIONS: 'true' }, async () => {
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
          machineLockDirectoryPath: lockDir,
          staleAfterMs: 50_000,
        },
      );

      expect(lockExistsDuringCallback).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// Machine lock: verify blocks expensive
// ---------------------------------------------------------------------------
describe('machine lock: verify blocks expensive command', () => {
  it('blocks a standalone expensive command while verify holds the machine lock', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-verify-blocks-expensive-'));
    tempDirs.push(baseDir);
    const machineLockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(machineLockDir, { recursive: true });
    writeTestMetadata(machineLockDir, {
      kind: 'verify',
      command: 'pnpm verify',
      cwd: '/repo',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      label: 'verify',
      lockPath: machineLockDir,
      logPath: '.verify/logs',
      ownerToken: 'owner',
      pid: process.pid,
      startedAt: new Date().toISOString(),
    });

    await withProcessEnv(
      {
        GITHUB_ACTIONS: 'false',
        MIOFRAME_MACHINE_LOCK_HELD: undefined,
        MIOFRAME_VERIFY_LOCK_HELD: undefined,
      },
      async () => {
        await expect(
          withExpensiveCommandLock(
            { label: 'visual', command: 'pnpm test:visual' },
            async () => 'done',
            {
              machineLockDirectoryPath: machineLockDir,
              staleAfterMs: 50_000,
            },
          ),
        ).rejects.toThrow(
          'Cannot start expensive local verification command while pnpm verify is already running.',
        );
      },
    );
  });
});

// ---------------------------------------------------------------------------
// Machine lock: expensive blocks verify
// ---------------------------------------------------------------------------
describe('machine lock: expensive command blocks verify', () => {
  it('blocks top-level verify while an expensive command holds the machine lock', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-expensive-blocks-verify-'));
    tempDirs.push(baseDir);
    const machineLockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(machineLockDir, { recursive: true });
    writeTestMetadata(machineLockDir, {
      kind: 'expensive',
      command: 'pnpm test:visual',
      cwd: '/repo',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      label: 'visual',
      lockPath: machineLockDir,
      logPath: '.verify/logs',
      ownerToken: 'owner',
      pid: process.pid,
      startedAt: new Date().toISOString(),
    });

    await withProcessEnv(
      {
        GITHUB_ACTIONS: 'false',
        MIOFRAME_MACHINE_LOCK_HELD: undefined,
        MIOFRAME_VERIFY_LOCK_HELD: undefined,
      },
      async () => {
        await expect(
          withVerifyCommandLock(
            { command: 'pnpm verify', label: 'verify', logPath: '.verify/logs' },
            async () => {},
            {
              machineLockDirectoryPath: machineLockDir,
              staleAfterMs: 50_000,
            },
          ),
        ).rejects.toThrow(
          'Cannot start pnpm verify while an expensive local verification command is already running.',
        );
      },
    );
  });

  it('does not block verify when the machine lock is stale', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-stale-expensive-'));
    tempDirs.push(baseDir);
    const machineLockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(machineLockDir, { recursive: true });
    writeTestMetadata(machineLockDir, {
      kind: 'expensive',
      command: 'pnpm test:visual',
      heartbeatAt: new Date(Date.now() - 60_000).toISOString(),
      hostname: os.hostname(),
      ownerToken: 'stale-owner',
      pid: 9_999_999,
      startedAt: new Date(Date.now() - 60_000).toISOString(),
    });

    await withProcessEnv(
      {
        GITHUB_ACTIONS: 'false',
        MIOFRAME_MACHINE_LOCK_HELD: undefined,
        MIOFRAME_VERIFY_LOCK_HELD: undefined,
      },
      async () => {
        let callbackRan = false;

        await withVerifyCommandLock(
          { command: 'pnpm verify', label: 'verify', logPath: '.verify/logs' },
          async () => {
            callbackRan = true;
          },
          {
            machineLockDirectoryPath: machineLockDir,
            staleAfterMs: 50,
          },
        );

        expect(callbackRan).toBe(true);
      },
    );
  });

  it('does not bypass the machine lock when CI=true outside GitHub Actions', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-ci-true-'));
    tempDirs.push(baseDir);
    const machineLockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(machineLockDir, { recursive: true });
    writeTestMetadata(machineLockDir, {
      kind: 'expensive',
      command: 'pnpm test:visual',
      cwd: '/repo',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      label: 'visual',
      lockPath: machineLockDir,
      logPath: '.verify/logs',
      ownerToken: 'owner',
      pid: process.pid,
      startedAt: new Date().toISOString(),
    });

    await withProcessEnv(
      {
        CI: 'true',
        GITHUB_ACTIONS: 'false',
        MIOFRAME_MACHINE_LOCK_HELD: undefined,
        MIOFRAME_VERIFY_LOCK_HELD: undefined,
      },
      async () => {
        await expect(
          withVerifyCommandLock(
            { command: 'pnpm verify', label: 'verify', logPath: '.verify/logs' },
            async () => {},
            {
              machineLockDirectoryPath: machineLockDir,
              staleAfterMs: 50_000,
            },
          ),
        ).rejects.toThrow(
          'Cannot start pnpm verify while an expensive local verification command is already running.',
        );
      },
    );
  });

  it('skips the machine lock check when GITHUB_ACTIONS=true', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-gha-expensive-'));
    tempDirs.push(baseDir);
    const machineLockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(machineLockDir, { recursive: true });
    writeTestMetadata(machineLockDir, {
      kind: 'expensive',
      command: 'pnpm test:visual',
      cwd: '/repo',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      label: 'visual',
      lockPath: machineLockDir,
      logPath: '.verify/logs',
      ownerToken: 'owner',
      pid: process.pid,
      startedAt: new Date().toISOString(),
    });

    await withProcessEnv({ GITHUB_ACTIONS: 'true' }, async () => {
      let callbackRan = false;

      await withVerifyCommandLock(
        { command: 'pnpm verify', label: 'verify', logPath: '.verify/logs' },
        async () => {
          callbackRan = true;
        },
        {
          machineLockDirectoryPath: machineLockDir,
          staleAfterMs: 50_000,
        },
      );

      expect(callbackRan).toBe(true);
    });
  });

  it('verify-child expensive commands do not deadlock when MIOFRAME_MACHINE_LOCK_HELD=1', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-child-no-deadlock-'));
    tempDirs.push(baseDir);
    const machineLockDir = path.join(baseDir, 'machine.lock');

    await withProcessEnv(
      {
        GITHUB_ACTIONS: 'false',
        MIOFRAME_MACHINE_LOCK_HELD: '1',
        MIOFRAME_VERIFY_LOCK_HELD: '1',
      },
      async () => {
        let callbackRan = false;

        await withExpensiveCommandLock(
          { label: 'visual', command: 'pnpm test:visual' },
          async () => {
            callbackRan = true;
          },
          {
            machineLockDirectoryPath: machineLockDir,
            staleAfterMs: 50_000,
          },
        );

        expect(callbackRan).toBe(true);
      },
    );
  });

  it('verify-child expensive commands also skip when only MIOFRAME_VERIFY_LOCK_HELD=1 is set', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-verify-held-child-'));
    tempDirs.push(baseDir);
    const machineLockDir = path.join(baseDir, 'machine.lock');

    await withProcessEnv(
      {
        GITHUB_ACTIONS: 'false',
        MIOFRAME_MACHINE_LOCK_HELD: undefined,
        MIOFRAME_VERIFY_LOCK_HELD: '1',
      },
      async () => {
        let callbackRan = false;

        await withExpensiveCommandLock(
          { label: 'visual', command: 'pnpm test:visual' },
          async () => {
            callbackRan = true;
          },
          {
            machineLockDirectoryPath: machineLockDir,
            staleAfterMs: 50_000,
          },
        );

        expect(callbackRan).toBe(true);
      },
    );
  });
});

// ---------------------------------------------------------------------------
// Machine lock bypass: env-flag combinations
// ---------------------------------------------------------------------------
describe('machine lock bypass: env-flag combinations', () => {
  it('MIOFRAME_MACHINE_LOCK_HELD=1 alone does not bypass local machine lock', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-held-alone-'));
    tempDirs.push(baseDir);
    const machineLockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(machineLockDir, { recursive: true });
    writeTestMetadata(machineLockDir, {
      kind: 'expensive',
      command: 'pnpm test:visual',
      cwd: '/repo',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      label: 'visual',
      lockPath: machineLockDir,
      logPath: '.verify/logs',
      ownerToken: 'owner',
      pid: process.pid,
      startedAt: new Date().toISOString(),
    });

    await withProcessEnv(
      {
        GITHUB_ACTIONS: 'false',
        MIOFRAME_MACHINE_LOCK_HELD: '1',
        MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD: undefined,
        MIOFRAME_VERIFY_LOCK_HELD: undefined,
      },
      async () => {
        await expect(
          withExpensiveCommandLock(
            { label: 'child', command: 'pnpm test:visual' },
            async () => 'done',
            { machineLockDirectoryPath: machineLockDir, staleAfterMs: 50_000 },
          ),
        ).rejects.toThrow('already running');
      },
    );
  });

  it('MIOFRAME_MACHINE_LOCK_HELD=1 + MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD=1 bypasses for expensive children', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-held-expensive-'));
    tempDirs.push(baseDir);
    const machineLockDir = path.join(baseDir, 'machine.lock');

    await withProcessEnv(
      {
        GITHUB_ACTIONS: 'false',
        MIOFRAME_MACHINE_LOCK_HELD: '1',
        MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD: '1',
        MIOFRAME_VERIFY_LOCK_HELD: undefined,
      },
      async () => {
        let callbackRan = false;

        await withExpensiveCommandLock(
          { label: 'storybook:build', command: 'node scripts/storybook.mjs build' },
          async () => {
            callbackRan = true;
          },
          { machineLockDirectoryPath: machineLockDir, staleAfterMs: 50_000 },
        );

        expect(callbackRan).toBe(true);
      },
    );
  });

  it('MIOFRAME_MACHINE_LOCK_HELD=1 + MIOFRAME_VERIFY_LOCK_HELD=1 still bypasses for verify children', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-held-verify-child-'));
    tempDirs.push(baseDir);
    const machineLockDir = path.join(baseDir, 'machine.lock');

    await withProcessEnv(
      {
        GITHUB_ACTIONS: 'false',
        MIOFRAME_MACHINE_LOCK_HELD: '1',
        MIOFRAME_VERIFY_LOCK_HELD: '1',
        MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD: undefined,
      },
      async () => {
        let callbackRan = false;

        await withExpensiveCommandLock(
          { label: 'visual', command: 'pnpm test:visual' },
          async () => {
            callbackRan = true;
          },
          { machineLockDirectoryPath: machineLockDir, staleAfterMs: 50_000 },
        );

        expect(callbackRan).toBe(true);
      },
    );
  });

  it('MIOFRAME_MACHINE_LOCK_HELD=1 + MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD=1 does not bypass for a verify command', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-held-expensive-verify-'));
    tempDirs.push(baseDir);
    const machineLockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(machineLockDir, { recursive: true });
    writeTestMetadata(machineLockDir, {
      kind: 'expensive',
      command: 'node scripts/storybook.mjs build',
      cwd: '/repo',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      label: 'storybook:build',
      lockPath: machineLockDir,
      logPath: '.verify/logs',
      ownerToken: 'owner',
      pid: process.pid,
      startedAt: new Date().toISOString(),
    });

    await withProcessEnv(
      {
        GITHUB_ACTIONS: 'false',
        MIOFRAME_MACHINE_LOCK_HELD: '1',
        MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD: '1',
        MIOFRAME_VERIFY_LOCK_HELD: undefined,
      },
      async () => {
        // A verify run must never inherit an expensive parent's bypass: it must still
        // try to acquire the machine lock and fail fast against the active expensive lock.
        await expect(
          withVerifyCommandLock(
            { command: 'pnpm verify', label: 'verify', logPath: '.verify/logs' },
            async () => {},
            { machineLockDirectoryPath: machineLockDir, staleAfterMs: 50_000 },
          ),
        ).rejects.toThrow(
          'Cannot start pnpm verify while an expensive local verification command is already running.',
        );
      },
    );
  });

  it('MIOFRAME_VERIFY_LOCK_HELD=1 alone (legacy) still bypasses expensive verify children', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-verify-legacy-'));
    tempDirs.push(baseDir);
    const machineLockDir = path.join(baseDir, 'machine.lock');

    await withProcessEnv(
      {
        GITHUB_ACTIONS: 'false',
        MIOFRAME_MACHINE_LOCK_HELD: undefined,
        MIOFRAME_VERIFY_LOCK_HELD: '1',
        MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD: undefined,
      },
      async () => {
        let callbackRan = false;

        await withExpensiveCommandLock(
          { label: 'visual', command: 'pnpm test:visual' },
          async () => {
            callbackRan = true;
          },
          { machineLockDirectoryPath: machineLockDir, staleAfterMs: 50_000 },
        );

        expect(callbackRan).toBe(true);
      },
    );
  });

  it('GITHUB_ACTIONS=true still bypasses the machine lock', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-gha-bypass-'));
    tempDirs.push(baseDir);
    const machineLockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(machineLockDir, { recursive: true });
    writeTestMetadata(machineLockDir, {
      kind: 'expensive',
      command: 'pnpm test:visual',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      ownerToken: 'owner',
      pid: process.pid,
    });

    await withProcessEnv(
      {
        GITHUB_ACTIONS: 'true',
        MIOFRAME_MACHINE_LOCK_HELD: undefined,
        MIOFRAME_VERIFY_LOCK_HELD: undefined,
      },
      async () => {
        let callbackRan = false;

        await withExpensiveCommandLock(
          { label: 'child', command: 'pnpm test:visual' },
          async () => {
            callbackRan = true;
          },
          { machineLockDirectoryPath: machineLockDir, staleAfterMs: 50_000 },
        );

        expect(callbackRan).toBe(true);
      },
    );
  });

  it('local CI=true does not bypass the machine lock', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-ci-no-bypass-'));
    tempDirs.push(baseDir);
    const machineLockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(machineLockDir, { recursive: true });
    writeTestMetadata(machineLockDir, {
      kind: 'expensive',
      command: 'pnpm test:visual',
      cwd: '/repo',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      label: 'visual',
      lockPath: machineLockDir,
      logPath: '.verify/logs',
      ownerToken: 'owner',
      pid: process.pid,
      startedAt: new Date().toISOString(),
    });

    await withProcessEnv(
      {
        CI: 'true',
        GITHUB_ACTIONS: 'false',
        MIOFRAME_MACHINE_LOCK_HELD: undefined,
        MIOFRAME_VERIFY_LOCK_HELD: undefined,
      },
      async () => {
        await expect(
          withExpensiveCommandLock(
            { label: 'child', command: 'pnpm test:visual' },
            async () => 'done',
            { machineLockDirectoryPath: machineLockDir, staleAfterMs: 50_000 },
          ),
        ).rejects.toThrow('already running');
      },
    );
  });
});

// ---------------------------------------------------------------------------
// Atomic race: two independent locks cannot pass the race window
// ---------------------------------------------------------------------------
describe('machine lock atomic race prevention', () => {
  it('two concurrent callers cannot both acquire the machine lock', async () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-race-'));
    tempDirs.push(baseDir);
    const machineLockDir = path.join(baseDir, 'machine.lock');

    let successCount = 0;
    let failureCount = 0;

    await withProcessEnv(
      {
        GITHUB_ACTIONS: 'false',
        MIOFRAME_MACHINE_LOCK_HELD: undefined,
        MIOFRAME_VERIFY_LOCK_HELD: undefined,
      },
      async () => {
        const verifyRun = withVerifyCommandLock(
          { command: 'pnpm verify', label: 'verify' },
          async () => {
            successCount += 1;
            // Hold the lock briefly so the concurrent attempt definitely races
            await new Promise((resolve) => setTimeout(resolve, 20));
          },
          { machineLockDirectoryPath: machineLockDir, staleAfterMs: 50_000 },
        ).then(
          () => {},
          () => {
            failureCount += 1;
          },
        );

        const expensiveRun = withExpensiveCommandLock(
          { command: 'pnpm test:visual', label: 'visual' },
          async () => {
            successCount += 1;
          },
          { machineLockDirectoryPath: machineLockDir, staleAfterMs: 50_000, forceLock: true },
        ).then(
          () => {},
          () => {
            failureCount += 1;
          },
        );

        await Promise.all([verifyRun, expensiveRun]);
      },
    );

    // Exactly one must succeed and one must fail — the machine lock is atomic.
    expect(successCount).toBe(1);
    expect(failureCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// withHeldLockEnv (via skip-lock path)
// ---------------------------------------------------------------------------
describe('withHeldLockEnv (via skip-lock path)', () => {
  it('sets MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD and MIOFRAME_MACHINE_LOCK_HELD during callback', async () => {
    await withProcessEnv(
      {
        GITHUB_ACTIONS: 'true',
        MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD: undefined,
        MIOFRAME_MACHINE_LOCK_HELD: undefined,
      },
      async () => {
        let expensiveFlagDuringCallback;
        let machineFlagDuringCallback;

        await withExpensiveCommandLock({ label: 'test', command: 'pnpm test' }, async () => {
          expensiveFlagDuringCallback = process.env.MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD;
          machineFlagDuringCallback = process.env.MIOFRAME_MACHINE_LOCK_HELD;
        });

        expect(expensiveFlagDuringCallback).toBe('1');
        expect(machineFlagDuringCallback).toBe('1');
        expect(process.env.MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD).toBeUndefined();
        expect(process.env.MIOFRAME_MACHINE_LOCK_HELD).toBeUndefined();
      },
    );
  });

  it('restores the previous env value after success when flag was already set', async () => {
    await withProcessEnv(
      { GITHUB_ACTIONS: 'true', MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD: 'previous' },
      async () => {
        await withExpensiveCommandLock({ label: 'test', command: 'pnpm test' }, async () => {});

        expect(process.env.MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD).toBe('previous');
      },
    );
  });

  it('restores the env flag after the callback throws', async () => {
    await withProcessEnv(
      {
        GITHUB_ACTIONS: 'true',
        MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD: undefined,
        MIOFRAME_MACHINE_LOCK_HELD: undefined,
      },
      async () => {
        await expect(
          withExpensiveCommandLock({ label: 'test', command: 'pnpm test' }, async () => {
            throw new Error('callback failure');
          }),
        ).rejects.toThrow('callback failure');

        expect(process.env.MIOFRAME_EXPENSIVE_COMMAND_LOCK_HELD).toBeUndefined();
        expect(process.env.MIOFRAME_MACHINE_LOCK_HELD).toBeUndefined();
      },
    );
  });
});

// ---------------------------------------------------------------------------
// getMachineLockStatus
// ---------------------------------------------------------------------------
describe('getMachineLockStatus', () => {
  it('reports an active machine lock with kind=verify', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-status-verify-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(lockDir, { recursive: true });
    writeTestMetadata(lockDir, {
      kind: 'verify',
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

    const status = getMachineLockStatus({
      lockDirectoryPath: lockDir,
      staleAfterMs: 50_000,
    });

    expect(status.state).toBe('active');
    expect(status.metadata?.kind).toBe('verify');
    expect(status.metadata?.command).toBe('pnpm verify');
    expect(status.lockPath).toBe(lockDir);
  });

  it('reports an active machine lock with kind=expensive', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-status-expensive-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(lockDir, { recursive: true });
    writeTestMetadata(lockDir, {
      kind: 'expensive',
      command: 'pnpm test:visual',
      cwd: '/repo',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      label: 'visual',
      lockPath: lockDir,
      logPath: '.verify/logs',
      ownerToken: 'owner',
      pid: process.pid,
      startedAt: new Date().toISOString(),
    });

    const status = getMachineLockStatus({
      lockDirectoryPath: lockDir,
      staleAfterMs: 50_000,
    });

    expect(status.state).toBe('active');
    expect(status.metadata?.kind).toBe('expensive');
  });

  it('reports missing when no machine lock exists', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-status-missing-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'machine.lock');

    const status = getMachineLockStatus({ lockDirectoryPath: lockDir });

    expect(status.state).toBe('missing');
  });

  it('reports a stale machine lock when the heartbeat is old', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-status-stale-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(lockDir, { recursive: true });
    writeTestMetadata(lockDir, {
      kind: 'verify',
      command: 'pnpm verify',
      heartbeatAt: new Date(Date.now() - 60_000).toISOString(),
      hostname: os.hostname(),
      ownerToken: 'owner',
      pid: 9_999_999,
      startedAt: new Date(Date.now() - 60_000).toISOString(),
    });

    const status = getMachineLockStatus({
      lockDirectoryPath: lockDir,
      staleAfterMs: 50,
    });

    expect(status.state).toBe('stale');
  });

  it('reports corrupt when machine lock directory exists but metadata is missing', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'machine-status-corrupt-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(lockDir, { recursive: true });
    // No metadata.json written

    const status = getMachineLockStatus({
      lockDirectoryPath: lockDir,
      staleAfterMs: 50_000,
    });

    expect(status.state).toBe('corrupt');
    expect(status.statusReason).toBe('metadata missing');
  });
});

// ---------------------------------------------------------------------------
// getVerifyLockStatus / getExpensiveLockStatus derived from machine lock
// ---------------------------------------------------------------------------
describe('getVerifyLockStatus', () => {
  it('reports active when machine lock is held by verify', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verifylock-status-active-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(lockDir, { recursive: true });
    writeTestMetadata(lockDir, {
      kind: 'verify',
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

  it('reports missing when machine lock is held by expensive (not verify)', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verifylock-not-verify-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(lockDir, { recursive: true });
    writeTestMetadata(lockDir, {
      kind: 'expensive',
      command: 'pnpm test:visual',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      ownerToken: 'owner',
      pid: process.pid,
    });

    const status = getVerifyLockStatus({
      lockDirectoryPath: lockDir,
      staleAfterMs: 50_000,
    });

    expect(status.state).toBe('missing');
  });

  it('reports a stale verify lock when the heartbeat is old', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verifylock-status-stale-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(lockDir, { recursive: true });
    writeTestMetadata(lockDir, {
      kind: 'verify',
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

describe('getExpensiveLockStatus', () => {
  it('reports active when machine lock is held by expensive command', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expensive-status-active-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(lockDir, { recursive: true });
    writeTestMetadata(lockDir, {
      kind: 'expensive',
      command: 'pnpm test:visual',
      cwd: '/repo',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      label: 'visual',
      lockPath: lockDir,
      logPath: '.verify/logs',
      ownerToken: 'owner',
      pid: process.pid,
      startedAt: new Date().toISOString(),
    });

    const status = getExpensiveLockStatus({
      lockDirectoryPath: lockDir,
      staleAfterMs: 50_000,
    });

    expect(status.state).toBe('active');
    expect(status.metadata?.command).toBe('pnpm test:visual');
    expect(status.lockPath).toBe(lockDir);
  });

  it('reports missing when no machine lock exists', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expensive-status-missing-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'machine.lock');

    const status = getExpensiveLockStatus({ lockDirectoryPath: lockDir });

    expect(status.state).toBe('missing');
  });

  it('reports missing when machine lock is held by verify (not expensive)', () => {
    const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expensive-not-expensive-'));
    tempDirs.push(baseDir);
    const lockDir = path.join(baseDir, 'machine.lock');
    fs.mkdirSync(lockDir, { recursive: true });
    writeTestMetadata(lockDir, {
      kind: 'verify',
      command: 'pnpm verify',
      heartbeatAt: new Date().toISOString(),
      hostname: os.hostname(),
      ownerToken: 'owner',
      pid: process.pid,
    });

    const status = getExpensiveLockStatus({
      lockDirectoryPath: lockDir,
      staleAfterMs: 50_000,
    });

    expect(status.state).toBe('missing');
  });
});
