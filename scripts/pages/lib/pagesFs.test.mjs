import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  applyPreviewCleanup,
  applyPreviewPublish,
  applyStablePublish,
  validatePrNumber,
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

describe('validatePrNumber', () => {
  it('accepts valid PR numbers', () => {
    expect(validatePrNumber('1')).toBe('1');
    expect(validatePrNumber('42')).toBe('42');
    expect(validatePrNumber('9999')).toBe('9999');
  });

  it('rejects zero', () => {
    expect(() => validatePrNumber('0')).toThrow('Invalid PR number: 0');
  });

  it('rejects non-numeric strings', () => {
    expect(() => validatePrNumber('abc')).toThrow('Invalid PR number: abc');
    expect(() => validatePrNumber('1a')).toThrow('Invalid PR number: 1a');
  });

  it('rejects strings with path separators', () => {
    expect(() => validatePrNumber('../42')).toThrow();
    expect(() => validatePrNumber('1/2')).toThrow();
  });

  it('rejects empty string', () => {
    expect(() => validatePrNumber('')).toThrow();
  });
});

describe('applyStablePublish', () => {
  it('copies dist files to the work directory', () => {
    write(distDir, 'index.html', '<html/>');
    write(distDir, 'assets/main.js', '// js');

    applyStablePublish(workDir, distDir);

    expect(fileExists(workDir, 'index.html')).toBe(true);
    expect(fileExists(workDir, 'assets/main.js')).toBe(true);
  });

  it('removes stale root files that are not preview directories', () => {
    write(workDir, 'old-file.txt', 'stale');
    write(workDir, 'old-dir/stuff.txt', 'stale');
    write(distDir, 'index.html', '<html/>');

    applyStablePublish(workDir, distDir);

    expect(fileExists(workDir, 'old-file.txt')).toBe(false);
    expect(fileExists(workDir, 'old-dir/stuff.txt')).toBe(false);
  });

  it('preserves existing pr-* directories', () => {
    write(workDir, 'pr-5/index.html', '<pr5/>');
    write(workDir, 'pr-10/index.html', '<pr10/>');
    write(distDir, 'index.html', '<html/>');

    applyStablePublish(workDir, distDir);

    expect(fileExists(workDir, 'pr-5/index.html')).toBe(true);
    expect(fileExists(workDir, 'pr-10/index.html')).toBe(true);
  });

  it('does not remove the .git directory', () => {
    mkdirSync(join(workDir, '.git'));
    writeFileSync(join(workDir, '.git', 'HEAD'), 'ref: refs/heads/gh-pages');
    write(distDir, 'index.html', '<html/>');

    applyStablePublish(workDir, distDir);

    expect(fileExists(workDir, '.git/HEAD')).toBe(true);
  });

  it('replaces existing non-pr root files with the dist content', () => {
    write(workDir, 'index.html', '<old/>');
    write(distDir, 'index.html', '<new/>');

    applyStablePublish(workDir, distDir);

    expect(readFileSync(join(workDir, 'index.html'), 'utf8')).toBe('<new/>');
  });
});

describe('applyPreviewPublish', () => {
  it('creates the pr slot from dist', () => {
    write(distDir, 'index.html', '<preview/>');

    applyPreviewPublish(workDir, distDir, '42');

    expect(fileExists(workDir, 'pr-42/index.html')).toBe(true);
    expect(readFileSync(join(workDir, 'pr-42/index.html'), 'utf8')).toBe('<preview/>');
  });

  it('replaces an existing pr slot', () => {
    write(workDir, 'pr-42/index.html', '<old/>');
    write(distDir, 'index.html', '<new/>');

    applyPreviewPublish(workDir, distDir, '42');

    expect(readFileSync(join(workDir, 'pr-42/index.html'), 'utf8')).toBe('<new/>');
  });

  it('does not modify stable root files', () => {
    write(workDir, 'index.html', '<stable/>');
    write(distDir, 'index.html', '<preview/>');

    applyPreviewPublish(workDir, distDir, '42');

    expect(readFileSync(join(workDir, 'index.html'), 'utf8')).toBe('<stable/>');
  });

  it('does not modify other pr preview directories', () => {
    write(workDir, 'pr-10/index.html', '<other-preview/>');
    write(distDir, 'index.html', '<preview/>');

    applyPreviewPublish(workDir, distDir, '42');

    expect(fileExists(workDir, 'pr-10/index.html')).toBe(true);
    expect(readFileSync(join(workDir, 'pr-10/index.html'), 'utf8')).toBe('<other-preview/>');
  });

  it('rejects an invalid PR number', () => {
    expect(() => applyPreviewPublish(workDir, distDir, 'bad')).toThrow('Invalid PR number: bad');
  });
});

describe('applyPreviewCleanup', () => {
  it('removes only the target pr slot', () => {
    write(workDir, 'pr-42/index.html', '<preview/>');
    write(workDir, 'index.html', '<stable/>');
    write(workDir, 'pr-10/index.html', '<other/>');

    const removed = applyPreviewCleanup(workDir, '42');

    expect(removed).toBe(true);
    expect(fileExists(workDir, 'pr-42/index.html')).toBe(false);
    expect(fileExists(workDir, 'index.html')).toBe(true);
    expect(fileExists(workDir, 'pr-10/index.html')).toBe(true);
  });

  it('is a no-op and returns false when the preview directory does not exist', () => {
    write(workDir, 'index.html', '<stable/>');

    const removed = applyPreviewCleanup(workDir, '99');

    expect(removed).toBe(false);
    expect(fileExists(workDir, 'index.html')).toBe(true);
  });

  it('rejects an invalid PR number', () => {
    expect(() => applyPreviewCleanup(workDir, '0')).toThrow('Invalid PR number: 0');
  });

  it('rejects a non-numeric PR number', () => {
    expect(() => applyPreviewCleanup(workDir, 'abc')).toThrow('Invalid PR number: abc');
  });
});
