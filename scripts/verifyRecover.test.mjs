import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { recoverVerificationState } from './verifyRecover.mjs';

const tempDirs = [];

function createTempVerificationDir() {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-recover-test-'));
  const stateDir = path.join(baseDir, 'machine.lock');
  fs.mkdirSync(stateDir, { recursive: true });
  tempDirs.push(baseDir);
  return { baseDir, stateDir, metadataPath: path.join(stateDir, 'metadata.json') };
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

describe('recoverVerificationState', () => {
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
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const exitCode = recoverVerificationState({
      lockPath: stateDir,
      metadata,
      metadataPath,
      state: 'active',
      statusReason: null,
    });

    expect(exitCode).toBe(1);
    expect(fs.existsSync(stateDir)).toBe(true);
  });

  it('does not change inconsistent verification state automatically', () => {
    const { stateDir, metadataPath } = createTempVerificationDir();
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const exitCode = recoverVerificationState({
      lockPath: stateDir,
      metadata: null,
      metadataPath,
      state: 'corrupt',
      statusReason: 'metadata missing',
    });

    expect(exitCode).toBe(1);
    expect(fs.existsSync(stateDir)).toBe(true);
  });

  it('recovers a stale verification state with matching owner metadata', () => {
    const { stateDir, metadataPath } = createTempVerificationDir();
    const metadata = {
      heartbeatAt: new Date(Date.now() - 60_000).toISOString(),
      ownerToken: 'stale-owner',
      pid: 9_999_999,
    };
    writeMetadata(metadataPath, metadata);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const exitCode = recoverVerificationState({
      lockPath: stateDir,
      metadata,
      metadataPath,
      state: 'stale',
      statusReason: null,
    });

    expect(exitCode).toBe(0);
    expect(fs.existsSync(stateDir)).toBe(false);
  });

  it('recovers a stale verification state when metadata is unavailable', () => {
    const { stateDir, metadataPath } = createTempVerificationDir();
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const exitCode = recoverVerificationState({
      lockPath: stateDir,
      metadata: null,
      metadataPath,
      state: 'stale',
      statusReason: 'metadata missing',
    });

    expect(exitCode).toBe(0);
    expect(fs.existsSync(stateDir)).toBe(false);
  });
});
