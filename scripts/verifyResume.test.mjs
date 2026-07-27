import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveVerifyInvocation } from './lib/verifyInvocation.mjs';
import { getVerifyLockMetadata, runVerifyCli } from './verify.mjs';
import { getRetryInstruction, resumeVerification } from './verifyResume.mjs';

const tempDirs = [];

function createTempVerificationDir() {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-resume-test-'));
  const stateDir = path.join(baseDir, 'machine.lock');
  fs.mkdirSync(stateDir, { recursive: true });
  tempDirs.push(baseDir);
  return { baseDir, stateDir, metadataPath: path.join(stateDir, 'metadata.json') };
}

function writeMetadata(metadataPath, metadata) {
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + '\n', 'utf8');
}

function forbiddenTermsIn(output) {
  return ['unlock', 'stale', 'marker', 'metadata', 'heartbeat', 'lockPath', '.verify/locks'].filter(
    (term) => output.includes(term),
  );
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

describe('getRetryInstruction', () => {
  it('renders the structured recorded verify invocation', () => {
    const invocation = resolveVerifyInvocation(['--base', 'origin/develop', '--only', 'e2e'], {
      GITHUB_ACTIONS: 'true',
      GITHUB_BASE_REF: 'develop',
    });

    expect(getRetryInstruction(getVerifyLockMetadata(invocation))).toBe(
      '  Run `pnpm verify --base origin/develop --profile github-actions --only e2e` again.',
    );
  });

  it('does not trust legacy string-only lock metadata', () => {
    expect(getRetryInstruction({ command: 'pnpm verify --base origin/develop' })).toBe(
      '  Re-run the original task-scope verify command; do not default to plain `pnpm verify`.',
    );
  });

  it('does not invent a plain verify fallback when scope metadata is unavailable', () => {
    expect(getRetryInstruction(null)).toBe(
      '  Re-run the original task-scope verify command; do not default to plain `pnpm verify`.',
    );
  });
});

describe('resumeVerification', () => {
  it('does not interrupt active verification', () => {
    const { stateDir, metadataPath } = createTempVerificationDir();
    const metadata = {
      activeCommand: 'pnpm verify --only unit-tests',
      command: 'pnpm verify --base origin/develop',
      heartbeatAt: new Date().toISOString(),
      ownerToken: 'active-owner',
      pid: process.pid,
    };
    writeMetadata(metadataPath, metadata);
    const errorLogs = [];
    vi.spyOn(console, 'error').mockImplementation((message) => errorLogs.push(message));

    const exitCode = resumeVerification({
      lockPath: stateDir,
      metadata,
      metadataPath,
      state: 'active',
      statusReason: null,
    });

    expect(exitCode).toBe(1);
    expect(fs.existsSync(stateDir)).toBe(true);
    expect(errorLogs.join('\n')).toContain('pnpm verify --only unit-tests');
    expect(forbiddenTermsIn(errorLogs.join('\n'))).toEqual([]);
  });

  it('does not change a user-decision verification state automatically', () => {
    const { stateDir, metadataPath } = createTempVerificationDir();
    const errorLogs = [];
    vi.spyOn(console, 'error').mockImplementation((message) => errorLogs.push(message));

    const exitCode = resumeVerification({
      lockPath: stateDir,
      metadata: null,
      metadataPath,
      state: 'corrupt',
      statusReason: 'metadata missing',
    });

    expect(exitCode).toBe(1);
    expect(fs.existsSync(stateDir)).toBe(true);
    expect(errorLogs.join('\n')).toContain('verification: needs user decision');
    expect(errorLogs.join('\n')).toContain('ask the user before proceeding');
    expect(forbiddenTermsIn(errorLogs.join('\n'))).toEqual([]);
  });

  it('makes a resumable verification state ready to retry with the original scoped command', () => {
    const { stateDir, metadataPath } = createTempVerificationDir();
    const invocation = resolveVerifyInvocation(['--base', 'origin/develop'], {
      GITHUB_ACTIONS: 'true',
      GITHUB_BASE_REF: 'develop',
    });
    const metadata = {
      ...getVerifyLockMetadata(invocation),
      heartbeatAt: new Date(Date.now() - 60_000).toISOString(),
      ownerToken: 'inactive-owner',
      pid: 9_999_999,
    };
    writeMetadata(metadataPath, metadata);
    const logs = [];
    vi.spyOn(console, 'log').mockImplementation((message) => logs.push(message));

    const exitCode = resumeVerification({
      lockPath: stateDir,
      metadata,
      metadataPath,
      state: 'stale',
      statusReason: null,
    });

    expect(exitCode).toBe(0);
    expect(fs.existsSync(stateDir)).toBe(false);
    expect(logs.join('\n')).toContain('verification: ready to retry');
    expect(logs.join('\n')).toContain('pnpm verify --base origin/develop --profile github-actions');
    expect(forbiddenTermsIn(logs.join('\n'))).toEqual([]);
  });

  it('does not recommend plain verify when retry scope is unavailable', () => {
    const { stateDir, metadataPath } = createTempVerificationDir();
    const logs = [];
    vi.spyOn(console, 'log').mockImplementation((message) => logs.push(message));

    const exitCode = resumeVerification({
      lockPath: stateDir,
      metadata: null,
      metadataPath,
      state: 'stale',
      statusReason: 'metadata missing',
    });

    expect(exitCode).toBe(0);
    expect(fs.existsSync(stateDir)).toBe(false);
    expect(logs.join('\n')).toContain('verification: ready to retry');
    expect(logs.join('\n')).toContain('Re-run the original task-scope verify command');
    expect(logs.join('\n')).not.toContain('Run `pnpm verify` again.');
    expect(forbiddenTermsIn(logs.join('\n'))).toEqual([]);
  });
});

describe('effective retry metadata integration', () => {
  it('round-trips runVerifyCli metadata through the public resume consumer', async () => {
    const invocation = resolveVerifyInvocation(['--only', 'e2e'], {
      GITHUB_ACTIONS: 'true',
      GITHUB_BASE_REF: 'develop',
    });
    const runMain = vi.fn();
    let lockMetadata = null;

    await runVerifyCli({
      invocation,
      runMain,
      withVerifyLock: vi.fn(async (metadata, run) => {
        lockMetadata = metadata;
        await run({}, { updateMetadata: vi.fn() });
      }),
    });

    const { stateDir, metadataPath } = createTempVerificationDir();
    const persistedMetadata = {
      ...lockMetadata,
      heartbeatAt: new Date(Date.now() - 60_000).toISOString(),
      ownerToken: 'integration-owner',
      pid: 9_999_999,
    };
    writeMetadata(metadataPath, persistedMetadata);
    const logs = [];
    vi.spyOn(console, 'log').mockImplementation((message) => logs.push(message));

    const exitCode = resumeVerification({
      lockPath: stateDir,
      metadata: persistedMetadata,
      metadataPath,
      state: 'stale',
      statusReason: null,
    });

    expect(runMain).toHaveBeenCalledOnce();
    expect(lockMetadata?.verifyInvocation).toEqual(invocation);
    expect(exitCode).toBe(0);
    expect(fs.existsSync(stateDir)).toBe(false);
    expect(logs.join('\n')).toContain(
      'Run `pnpm verify --base origin/develop --profile github-actions --only e2e` again.',
    );
  });
});
