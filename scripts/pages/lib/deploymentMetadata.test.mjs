import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildDeploymentMetadata, writeDeploymentMetadataFile } from './deploymentMetadata.mjs';

describe('buildDeploymentMetadata', () => {
  it('builds a minimal stable record', () => {
    const metadata = buildDeploymentMetadata({
      channel: 'stable',
      channelId: 'main',
      baseUrl: '/',
      buildDate: '2026-07-03T00:00:00.000Z',
    });

    expect(metadata).toEqual({
      channel: 'stable',
      channelId: 'main',
      baseUrl: '/',
      buildDate: '2026-07-03T00:00:00.000Z',
    });
  });

  it('includes optional fields only when provided', () => {
    const metadata = buildDeploymentMetadata({
      channel: 'branch',
      channelId: 'develop',
      baseUrl: '/branch/develop/',
      ref: 'refs/heads/develop',
      branch: 'develop',
      slug: 'develop',
      sha: 'abc123',
      buildDate: '2026-07-03T00:00:00.000Z',
      appVersion: '0.1.0',
    });

    expect(metadata).toEqual({
      channel: 'branch',
      channelId: 'develop',
      baseUrl: '/branch/develop/',
      ref: 'refs/heads/develop',
      branch: 'develop',
      slug: 'develop',
      sha: 'abc123',
      buildDate: '2026-07-03T00:00:00.000Z',
      appVersion: '0.1.0',
    });
  });

  it('sets tombstone: true only when tombstone is truthy', () => {
    const metadata = buildDeploymentMetadata({
      channel: 'branch',
      channelId: 'feature-x',
      baseUrl: '/branch/feature-x/',
      buildDate: '2026-07-03T00:00:00.000Z',
      tombstone: true,
    });

    expect(metadata.tombstone).toBe(true);
  });

  it('omits tombstone when falsy', () => {
    const metadata = buildDeploymentMetadata({
      channel: 'stable',
      channelId: 'main',
      baseUrl: '/',
      buildDate: '2026-07-03T00:00:00.000Z',
      tombstone: false,
    });

    expect(metadata.tombstone).toBeUndefined();
  });

  it('defaults buildDate to now when not provided', () => {
    const before = Date.now();
    const metadata = buildDeploymentMetadata({
      channel: 'stable',
      channelId: 'main',
      baseUrl: '/',
    });
    const after = Date.now();

    const parsed = Date.parse(metadata.buildDate);
    expect(parsed).toBeGreaterThanOrEqual(before);
    expect(parsed).toBeLessThanOrEqual(after);
  });

  it('throws when channel is missing', () => {
    expect(() => buildDeploymentMetadata({ channelId: 'main', baseUrl: '/' })).toThrow(
      'channel is required',
    );
  });

  it('throws when channelId is missing', () => {
    expect(() => buildDeploymentMetadata({ channel: 'stable', baseUrl: '/' })).toThrow(
      'channelId is required',
    );
  });

  it('throws when baseUrl is missing', () => {
    expect(() => buildDeploymentMetadata({ channel: 'stable', channelId: 'main' })).toThrow(
      'baseUrl is required',
    );
  });
});

describe('writeDeploymentMetadataFile', () => {
  let distDir = '';

  beforeEach(() => {
    distDir = mkdtempSync(join(tmpdir(), 'deployment-metadata-'));
  });

  afterEach(() => {
    rmSync(distDir, { recursive: true, force: true });
  });

  it('writes deployment.json with the given metadata', () => {
    const metadata = buildDeploymentMetadata({
      channel: 'stable',
      channelId: 'main',
      baseUrl: '/',
      buildDate: '2026-07-03T00:00:00.000Z',
    });

    writeDeploymentMetadataFile(distDir, metadata);

    const written = JSON.parse(readFileSync(join(distDir, 'deployment.json'), 'utf8'));
    expect(written).toEqual(metadata);
  });
});
