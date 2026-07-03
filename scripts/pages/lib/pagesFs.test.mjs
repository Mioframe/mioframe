import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  applyBranchPublish,
  applyBranchRemoval,
  applyPrCleanup,
  applyPrPublish,
  applyStablePublish,
} from './pagesFs.mjs';

let workDir = '';
let distDir = '';

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'pages-work-'));
  distDir = mkdtempSync(join(tmpdir(), 'pages-dist-'));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
  rmSync(distDir, { recursive: true, force: true });
});

function write(base, relPath, content = '') {
  const full = join(base, relPath);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, content);
}

function fileExists(base, relPath) {
  try {
    readFileSync(join(base, relPath));
    return true;
  } catch {
    return false;
  }
}

describe('applyStablePublish', () => {
  it('copies dist files to the work directory root', () => {
    write(distDir, 'index.html', '<html/>');
    write(distDir, 'assets/main.js', '// js');

    applyStablePublish(workDir, distDir);

    expect(fileExists(workDir, 'index.html')).toBe(true);
    expect(fileExists(workDir, 'assets/main.js')).toBe(true);
  });

  it('removes stale root files that are not branch/pr directories', () => {
    write(workDir, 'old-file.txt', 'stale');
    write(workDir, 'old-dir/stuff.txt', 'stale');
    write(distDir, 'index.html', '<html/>');

    applyStablePublish(workDir, distDir);

    expect(fileExists(workDir, 'old-file.txt')).toBe(false);
    expect(fileExists(workDir, 'old-dir/stuff.txt')).toBe(false);
  });

  it('preserves the entire branch/ namespace', () => {
    write(workDir, 'branch/develop/index.html', '<develop/>');
    write(workDir, 'branch/feature-x/index.html', '<feature-x/>');
    write(distDir, 'index.html', '<html/>');

    applyStablePublish(workDir, distDir);

    expect(fileExists(workDir, 'branch/develop/index.html')).toBe(true);
    expect(fileExists(workDir, 'branch/feature-x/index.html')).toBe(true);
  });

  it('preserves the entire pr/ namespace', () => {
    write(workDir, 'pr/5/index.html', '<pr5/>');
    write(workDir, 'pr/10/index.html', '<pr10/>');
    write(distDir, 'index.html', '<html/>');

    applyStablePublish(workDir, distDir);

    expect(fileExists(workDir, 'pr/5/index.html')).toBe(true);
    expect(fileExists(workDir, 'pr/10/index.html')).toBe(true);
  });

  it('does not remove the .git directory', () => {
    mkdirSync(join(workDir, '.git'));
    writeFileSync(join(workDir, '.git', 'HEAD'), 'ref: refs/heads/gh-pages');
    write(distDir, 'index.html', '<html/>');

    applyStablePublish(workDir, distDir);

    expect(fileExists(workDir, '.git/HEAD')).toBe(true);
  });

  it('replaces existing root files with the dist content', () => {
    write(workDir, 'index.html', '<old/>');
    write(distDir, 'index.html', '<new/>');

    applyStablePublish(workDir, distDir);

    expect(readFileSync(join(workDir, 'index.html'), 'utf8')).toBe('<new/>');
  });
});

describe('applyBranchPublish', () => {
  it('creates the branch slot from dist', () => {
    write(distDir, 'index.html', '<develop/>');

    applyBranchPublish(workDir, distDir, 'develop');

    expect(fileExists(workDir, 'branch/develop/index.html')).toBe(true);
    expect(readFileSync(join(workDir, 'branch/develop/index.html'), 'utf8')).toBe('<develop/>');
  });

  it('replaces an existing branch slot', () => {
    write(workDir, 'branch/develop/index.html', '<old/>');
    write(distDir, 'index.html', '<new/>');

    applyBranchPublish(workDir, distDir, 'develop');

    expect(readFileSync(join(workDir, 'branch/develop/index.html'), 'utf8')).toBe('<new/>');
  });

  it('does not modify stable root files', () => {
    write(workDir, 'index.html', '<stable/>');
    write(distDir, 'index.html', '<branch/>');

    applyBranchPublish(workDir, distDir, 'develop');

    expect(readFileSync(join(workDir, 'index.html'), 'utf8')).toBe('<stable/>');
  });

  it('does not modify other branch slots', () => {
    write(workDir, 'branch/other/index.html', '<other/>');
    write(distDir, 'index.html', '<develop/>');

    applyBranchPublish(workDir, distDir, 'develop');

    expect(fileExists(workDir, 'branch/other/index.html')).toBe(true);
    expect(readFileSync(join(workDir, 'branch/other/index.html'), 'utf8')).toBe('<other/>');
  });

  it('does not modify pr preview slots', () => {
    write(workDir, 'pr/5/index.html', '<pr5/>');
    write(distDir, 'index.html', '<develop/>');

    applyBranchPublish(workDir, distDir, 'develop');

    expect(fileExists(workDir, 'pr/5/index.html')).toBe(true);
  });

  it('rejects an invalid branch slug', () => {
    expect(() => applyBranchPublish(workDir, distDir, '../etc')).toThrow('Invalid branch slug');
  });

  it('rejects the reserved "pr" slug', () => {
    expect(() => applyBranchPublish(workDir, distDir, 'pr')).toThrow('is reserved');
  });
});

describe('applyBranchRemoval', () => {
  it('removes only the target branch slot', () => {
    write(workDir, 'branch/develop/index.html', '<develop/>');
    write(workDir, 'branch/other/index.html', '<other/>');
    write(workDir, 'index.html', '<stable/>');

    const removed = applyBranchRemoval(workDir, 'develop');

    expect(removed).toBe(true);
    expect(fileExists(workDir, 'branch/develop/index.html')).toBe(false);
    expect(fileExists(workDir, 'branch/other/index.html')).toBe(true);
    expect(fileExists(workDir, 'index.html')).toBe(true);
  });

  it('is a no-op and returns false when the branch slot does not exist', () => {
    write(workDir, 'index.html', '<stable/>');

    const removed = applyBranchRemoval(workDir, 'missing');

    expect(removed).toBe(false);
  });
});

describe('applyPrPublish', () => {
  it('creates the pr slot from dist', () => {
    write(distDir, 'index.html', '<preview/>');

    applyPrPublish(workDir, distDir, '42');

    expect(fileExists(workDir, 'pr/42/index.html')).toBe(true);
    expect(readFileSync(join(workDir, 'pr/42/index.html'), 'utf8')).toBe('<preview/>');
  });

  it('replaces an existing pr slot', () => {
    write(workDir, 'pr/42/index.html', '<old/>');
    write(distDir, 'index.html', '<new/>');

    applyPrPublish(workDir, distDir, '42');

    expect(readFileSync(join(workDir, 'pr/42/index.html'), 'utf8')).toBe('<new/>');
  });

  it('does not modify stable root files', () => {
    write(workDir, 'index.html', '<stable/>');
    write(distDir, 'index.html', '<preview/>');

    applyPrPublish(workDir, distDir, '42');

    expect(readFileSync(join(workDir, 'index.html'), 'utf8')).toBe('<stable/>');
  });

  it('does not modify other pr preview slots', () => {
    write(workDir, 'pr/10/index.html', '<other-preview/>');
    write(distDir, 'index.html', '<preview/>');

    applyPrPublish(workDir, distDir, '42');

    expect(fileExists(workDir, 'pr/10/index.html')).toBe(true);
    expect(readFileSync(join(workDir, 'pr/10/index.html'), 'utf8')).toBe('<other-preview/>');
  });

  it('does not modify branch slots', () => {
    write(workDir, 'branch/develop/index.html', '<develop/>');
    write(distDir, 'index.html', '<preview/>');

    applyPrPublish(workDir, distDir, '42');

    expect(fileExists(workDir, 'branch/develop/index.html')).toBe(true);
  });

  it('rejects an invalid PR number', () => {
    expect(() => applyPrPublish(workDir, distDir, 'bad')).toThrow('Invalid PR number: bad');
  });
});

describe('applyPrCleanup', () => {
  it('removes only the target pr slot', () => {
    write(workDir, 'pr/42/index.html', '<preview/>');
    write(workDir, 'index.html', '<stable/>');
    write(workDir, 'pr/10/index.html', '<other/>');

    const removed = applyPrCleanup(workDir, '42');

    expect(removed).toBe(true);
    expect(fileExists(workDir, 'pr/42/index.html')).toBe(false);
    expect(fileExists(workDir, 'index.html')).toBe(true);
    expect(fileExists(workDir, 'pr/10/index.html')).toBe(true);
  });

  it('is a no-op and returns false when the preview directory does not exist', () => {
    write(workDir, 'index.html', '<stable/>');

    const removed = applyPrCleanup(workDir, '99');

    expect(removed).toBe(false);
    expect(fileExists(workDir, 'index.html')).toBe(true);
  });

  it('rejects an invalid PR number', () => {
    expect(() => applyPrCleanup(workDir, '0')).toThrow('Invalid PR number: 0');
  });

  it('rejects a non-numeric PR number', () => {
    expect(() => applyPrCleanup(workDir, 'abc')).toThrow('Invalid PR number: abc');
  });
});
