import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { writeSpaFallback } from './writeSpaFallback.mjs';

describe('writeSpaFallback', () => {
  let outputDir = '';

  beforeEach(() => {
    outputDir = mkdtempSync(join(tmpdir(), 'spa-fallback-'));
  });

  afterEach(() => {
    rmSync(outputDir, { recursive: true, force: true });
  });

  it('writes a 404.html to the output directory', () => {
    writeSpaFallback(['--output-dir', outputDir]);
    const content = readFileSync(join(outputDir, '404.html'), 'utf8');
    expect(content).toContain('<!doctype html>');
  });

  it('throws when --output-dir is missing', () => {
    expect(() => writeSpaFallback([])).toThrow('Usage:');
  });
});
