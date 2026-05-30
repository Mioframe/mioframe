import { describe, expect, it, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { releaseOwnedLock } from './commandLock.mjs';

const tempDirs = [];

function createTempLockDir() {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'commandlock-test-'));
  const lockDir = path.join(baseDir, 'lock');
  fs.mkdirSync(lockDir, { recursive: true });
  tempDirs.push(baseDir);
  return { baseDir, lockDir };
}

function writeMetadata(lockDir, metadata) {
  fs.writeFileSync(
    path.join(lockDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2) + '\n',
    'utf8',
  );
}

afterEach(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tempDirs.length = 0;
});

describe('releaseOwnedLock', () => {
  it('removes the lock directory when the owner token matches', async () => {
    const { lockDir } = createTempLockDir();
    const ownerToken = 'token-abc';
    writeMetadata(lockDir, { ownerToken });

    const result = await releaseOwnedLock(lockDir, path.join(lockDir, 'metadata.json'), ownerToken);

    expect(result).toBe(true);
    expect(fs.existsSync(lockDir)).toBe(false);
  });

  it('returns false when the owner token does not match current metadata', async () => {
    const { lockDir } = createTempLockDir();
    writeMetadata(lockDir, { ownerToken: 'actual-owner' });

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

  it('does not delete a fresh lock created after stale metadata was read (race condition)', async () => {
    const { lockDir } = createTempLockDir();
    const staleToken = 'stale-owner';
    const freshToken = 'fresh-owner';

    // Create stale lock
    writeMetadata(lockDir, {
      ownerToken: staleToken,
      heartbeatAt: new Date(Date.now() - 3600000).toISOString(),
    });

    // Another process replaces with a fresh lock (the race)
    writeMetadata(lockDir, {
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
