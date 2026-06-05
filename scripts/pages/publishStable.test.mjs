import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { publishStable } from './publishStable.mjs';

let distDir = '';

beforeEach(() => {
  distDir = mkdtempSync(join(tmpdir(), 'pages-dist-'));
});

afterEach(() => {
  rmSync(distDir, { recursive: true, force: true });
});

describe('publishStable distDir validation', () => {
  it('throws before git operations when distDir does not exist', async () => {
    await expect(
      publishStable(['--dist', '/nonexistent/dist-12345'], {
        GITHUB_TOKEN: 'token',
        GITHUB_REPOSITORY: 'owner/repo',
      }),
    ).rejects.toThrow('dist directory does not exist');
  });

  it('throws when --dist argument is missing', async () => {
    await expect(
      publishStable([], {
        GITHUB_TOKEN: 'token',
        GITHUB_REPOSITORY: 'owner/repo',
      }),
    ).rejects.toThrow('Usage:');
  });

  it('throws when GITHUB_TOKEN is missing', async () => {
    await expect(
      publishStable(['--dist', distDir], {
        GITHUB_REPOSITORY: 'owner/repo',
      }),
    ).rejects.toThrow('GITHUB_TOKEN is required');
  });
});
