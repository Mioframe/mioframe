import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { loadProjectEnv, mergeProjectEnv } from './projectEnv.mjs';

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'project-env-test-'));
}

function removeTempDir(directoryPath) {
  fs.rmSync(directoryPath, { recursive: true, force: true });
}

describe('loadProjectEnv', () => {
  const directoriesToCleanup = [];

  afterEach(() => {
    for (const directoryPath of directoriesToCleanup) {
      removeTempDir(directoryPath);
    }

    directoriesToCleanup.length = 0;
  });

  it('loads .env.local values when process env is missing them', () => {
    const tempDir = createTempDir();
    directoriesToCleanup.push(tempDir);
    fs.writeFileSync(
      path.join(tempDir, '.env.local'),
      ['VERIFY_BASE=origin/develop', 'PLAIN_SCRIPT_KEY=script-value'].join('\n'),
    );

    const result = loadProjectEnv({ envDir: tempDir, mode: 'development' });

    expect(result.VERIFY_BASE).toBe('origin/develop');
    expect(result.PLAIN_SCRIPT_KEY).toBe('script-value');
  });

  it('loads all keys instead of only VITE-prefixed keys', () => {
    const tempDir = createTempDir();
    directoriesToCleanup.push(tempDir);
    fs.writeFileSync(
      path.join(tempDir, '.env.local'),
      ['SCRIPT_ONLY_KEY=enabled', 'VITE_VISIBLE_KEY=also-enabled'].join('\n'),
    );

    const result = loadProjectEnv({ envDir: tempDir, mode: 'development' });

    expect(result).toMatchObject({
      SCRIPT_ONLY_KEY: 'enabled',
      VITE_VISIBLE_KEY: 'also-enabled',
    });
  });
});

describe('mergeProjectEnv', () => {
  it('preserves existing process env values while filling missing keys', () => {
    const processEnv = {
      VERIFY_BASE: 'origin/current-shell',
      CI: 'true',
      GITHUB_ACTIONS: 'true',
    };

    const merged = mergeProjectEnv({
      loadedEnv: {
        VERIFY_BASE: 'origin/develop',
        CI: 'false',
        GITHUB_ACTIONS: 'false',
        LOCAL_ONLY_KEY: 'present',
      },
      processEnv,
    });

    expect(merged).toBe(processEnv);
    expect(processEnv).toMatchObject({
      VERIFY_BASE: 'origin/current-shell',
      CI: 'true',
      GITHUB_ACTIONS: 'true',
      LOCAL_ONLY_KEY: 'present',
    });
  });
});
