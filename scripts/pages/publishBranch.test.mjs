import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { publishBranch } from './publishBranch.mjs';

let distDir = '';

beforeEach(() => {
  distDir = mkdtempSync(join(tmpdir(), 'pages-dist-'));
});

afterEach(() => {
  rmSync(distDir, { recursive: true, force: true });
});

describe('publishBranch validation', () => {
  it('throws before git operations when distDir does not exist', async () => {
    await expect(
      publishBranch(['--dist', '/nonexistent/dist-12345', '--slug', 'develop'], {
        GITHUB_TOKEN: 'token',
        GITHUB_REPOSITORY: 'owner/repo',
      }),
    ).rejects.toThrow('dist directory does not exist');
  });

  it('throws when --dist argument is missing', async () => {
    await expect(
      publishBranch(['--slug', 'develop'], {
        GITHUB_TOKEN: 'token',
        GITHUB_REPOSITORY: 'owner/repo',
      }),
    ).rejects.toThrow('Usage:');
  });

  it('throws when --slug argument is missing', async () => {
    await expect(
      publishBranch(['--dist', distDir], {
        GITHUB_TOKEN: 'token',
        GITHUB_REPOSITORY: 'owner/repo',
      }),
    ).rejects.toThrow('Usage:');
  });

  it('throws when the slug is invalid', async () => {
    await expect(
      publishBranch(['--dist', distDir, '--slug', '../etc'], {
        GITHUB_TOKEN: 'token',
        GITHUB_REPOSITORY: 'owner/repo',
      }),
    ).rejects.toThrow('Invalid branch slug');
  });

  it('throws when the slug is a reserved namespace', async () => {
    await expect(
      publishBranch(['--dist', distDir, '--slug', 'pr'], {
        GITHUB_TOKEN: 'token',
        GITHUB_REPOSITORY: 'owner/repo',
      }),
    ).rejects.toThrow('is reserved');
  });

  it('throws when GITHUB_TOKEN is missing', async () => {
    await expect(
      publishBranch(['--dist', distDir, '--slug', 'develop'], {
        GITHUB_REPOSITORY: 'owner/repo',
      }),
    ).rejects.toThrow('GITHUB_TOKEN is required');
  });
});
