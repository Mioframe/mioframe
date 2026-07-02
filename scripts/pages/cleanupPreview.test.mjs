import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./lib/ghPagesBranch.mjs', () => ({
  withGhPagesBranch: vi.fn(async ({ fn }) => {
    await fn(workDir);
  }),
}));

const { cleanupPreview } = await import('./cleanupPreview.mjs');

let workDir = '';
let outputFile = '';

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'pages-work-'));
  outputFile = join(mkdtempSync(join(tmpdir(), 'pages-output-')), 'github-output.txt');
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
  rmSync(outputFile, { force: true });
});

describe('cleanupPreview argument validation', () => {
  it('throws when --pr argument is missing', async () => {
    await expect(
      cleanupPreview([], {
        GITHUB_TOKEN: 'token',
        GITHUB_REPOSITORY: 'owner/repo',
      }),
    ).rejects.toThrow('Usage:');
  });

  it('throws when GITHUB_TOKEN is missing', async () => {
    await expect(
      cleanupPreview(['--pr', '42'], {
        GITHUB_REPOSITORY: 'owner/repo',
      }),
    ).rejects.toThrow('GITHUB_TOKEN is required');
  });

  it('throws when GITHUB_REPOSITORY is missing', async () => {
    await expect(
      cleanupPreview(['--pr', '42'], {
        GITHUB_TOKEN: 'token',
      }),
    ).rejects.toThrow('GITHUB_REPOSITORY is required');
  });
});

describe('cleanupPreview changed output', () => {
  it('resolves true and writes changed=true when the preview slot existed', async () => {
    mkdirSync(join(workDir, 'pr-42'), { recursive: true });
    writeFileSync(join(workDir, 'pr-42', 'index.html'), '<preview/>');

    const removed = await cleanupPreview(['--pr', '42'], {
      GITHUB_TOKEN: 'token',
      GITHUB_REPOSITORY: 'owner/repo',
      GITHUB_OUTPUT: outputFile,
    });

    expect(removed).toBe(true);
    expect(readFileSync(outputFile, 'utf8')).toBe('changed=true\n');
  });

  it('resolves false and writes changed=false when the preview slot did not exist', async () => {
    const removed = await cleanupPreview(['--pr', '99'], {
      GITHUB_TOKEN: 'token',
      GITHUB_REPOSITORY: 'owner/repo',
      GITHUB_OUTPUT: outputFile,
    });

    expect(removed).toBe(false);
    expect(readFileSync(outputFile, 'utf8')).toBe('changed=false\n');
  });

  it('does not write to GITHUB_OUTPUT when it is not set', async () => {
    await expect(
      cleanupPreview(['--pr', '99'], {
        GITHUB_TOKEN: 'token',
        GITHUB_REPOSITORY: 'owner/repo',
      }),
    ).resolves.toBe(false);
  });
});
