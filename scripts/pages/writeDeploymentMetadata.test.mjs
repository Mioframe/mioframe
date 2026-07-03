import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { writeDeploymentMetadata } from './writeDeploymentMetadata.mjs';

let distDir = '';

beforeEach(() => {
  distDir = mkdtempSync(join(tmpdir(), 'pages-dist-'));
});

afterEach(() => {
  rmSync(distDir, { recursive: true, force: true });
});

describe('writeDeploymentMetadata', () => {
  it('writes deployment.json with the given flags', () => {
    writeDeploymentMetadata([
      '--dist',
      distDir,
      '--channel',
      'branch',
      '--channel-id',
      'develop',
      '--base-url',
      '/branch/develop/',
      '--ref',
      'refs/heads/develop',
      '--branch',
      'develop',
      '--slug',
      'develop',
      '--sha',
      'abc123',
      '--app-version',
      '0.1.0',
      '--build-date',
      '2026-07-03T00:00:00.000Z',
    ]);

    const written = JSON.parse(readFileSync(join(distDir, 'deployment.json'), 'utf8'));
    expect(written).toEqual({
      channel: 'branch',
      channelId: 'develop',
      baseUrl: '/branch/develop/',
      buildDate: '2026-07-03T00:00:00.000Z',
      ref: 'refs/heads/develop',
      branch: 'develop',
      slug: 'develop',
      sha: 'abc123',
      appVersion: '0.1.0',
    });
  });

  it('sets tombstone: true when --tombstone is passed', () => {
    writeDeploymentMetadata([
      '--dist',
      distDir,
      '--channel',
      'branch',
      '--channel-id',
      'feature-x',
      '--base-url',
      '/branch/feature-x/',
      '--build-date',
      '2026-07-03T00:00:00.000Z',
      '--tombstone',
    ]);

    const written = JSON.parse(readFileSync(join(distDir, 'deployment.json'), 'utf8'));
    expect(written.tombstone).toBe(true);
  });

  it('throws when --dist is missing', () => {
    expect(() => writeDeploymentMetadata(['--channel', 'stable'])).toThrow('Usage:');
  });

  it('throws when a required buildDeploymentMetadata field is missing', () => {
    expect(() => writeDeploymentMetadata(['--dist', distDir])).toThrow('channel is required');
  });
});
