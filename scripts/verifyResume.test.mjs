import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { resumeVerification } from './verifyResume.mjs';

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

describe('resumeVerification', () => {
  it('does not interrupt active verification', () => {
    const { stateDir, metadataPath } = createTempVerificationDir();
    const metadata = {
      activeCommand: 'pnpm verify',
      command: 'pnpm verify',
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

  it('makes a resumable verification state ready to retry with matching owner metadata', () => {
    const { stateDir, metadataPath } = createTempVerificationDir();
    const metadata = {
      heartbeatAt: new Date(Date.now() - 60_000).toISOString(),
      ownerToken: 'stale-owner',
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
    expect(logs.join('\n')).toContain('pnpm verify');
    expect(forbiddenTermsIn(logs.join('\n'))).toEqual([]);
  });

  it('makes a resumable verification state ready to retry when metadata is unavailable', () => {
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
    expect(forbiddenTermsIn(logs.join('\n'))).toEqual([]);
  });
});
