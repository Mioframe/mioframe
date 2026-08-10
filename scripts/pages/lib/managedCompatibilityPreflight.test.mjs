import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { publishManagedRelease } from './releasePublish.mjs';
import { runManagedPublicationPreflight } from './managedCompatibilityPreflight.mjs';

let workDir = '';
let distDir = '';

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'compat-preflight-work-'));
  distDir = mkdtempSync(join(tmpdir(), 'compat-preflight-dist-'));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
  rmSync(distDir, { recursive: true, force: true });
});

function buildIndexHtml(marker, assetName) {
  return `<html><body>${marker}<script type="module" src="/assets/${assetName}"></script></body></html>`;
}

// Every call uses a distinct, content-hashed-style asset filename, matching
// real builds and avoiding validateNoImmutableCollision (same path,
// different content) across successive "releases" in these tests.
function writeDist(marker, assetName = `app-${marker.replace(/[^a-z0-9]+/gi, '-')}.js`) {
  writeFileSync(join(distDir, 'index.html'), buildIndexHtml(marker, assetName));
  mkdirSync(join(distDir, 'assets'), { recursive: true });
  writeFileSync(join(distDir, 'assets', assetName), `content-${marker}`);
}

const passingProof = () => vi.fn().mockResolvedValue({ passed: true });
const failingProof = () => vi.fn().mockResolvedValue({ passed: false });

describe('runManagedPublicationPreflight', () => {
  it('resolves "not-applicable" and never runs the compatibility proof when no previous release exists', async () => {
    writeDist('<first/>');
    const runCompatibilityProof = passingProof();

    const result = await runManagedPublicationPreflight(
      {
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.0.0',
        buildId: 'sha-1',
        buildDate: '2026-07-24T00:00:00.000Z',
      },
      { runCompatibilityProof },
    );

    expect(result).toStrictEqual({ decision: 'not-applicable' });
    expect(runCompatibilityProof).not.toHaveBeenCalled();
    // Never writes to the real workDir.
    expect(existsSync(join(workDir, 'updates'))).toBe(false);
  });

  it('resolves "idempotent" and never runs the compatibility proof for a buildId matching the current latest', async () => {
    writeDist('<release-1/>');
    publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      appVersion: '1.0.0',
      buildId: 'sha-1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });
    const runCompatibilityProof = passingProof();

    const result = await runManagedPublicationPreflight(
      {
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.0.0',
        buildId: 'sha-1',
        buildDate: '2026-07-24T00:00:00.000Z',
      },
      { runCompatibilityProof },
    );

    expect(result.decision).toBe('idempotent');
    expect(result.descriptor.buildId).toBe('sha-1');
    expect(runCompatibilityProof).not.toHaveBeenCalled();
  });

  it('stages the candidate into a temporary copy and resolves "proved" when the compatibility proof passes, leaving the real workDir untouched', async () => {
    writeDist('<release-1/>');
    publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      appVersion: '1.0.0',
      buildId: 'sha-1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });
    const releaseEntriesBefore = readdirSync(join(workDir, 'updates', 'releases')).sort();

    writeDist('<release-2/>');
    const runCompatibilityProof = vi.fn().mockImplementation(async (args) => {
      // Proves staging happened in a directory distinct from the real workDir,
      // and that the real workDir was not mutated before this resolves.
      expect(args.stagedWorkDir).not.toBe(workDir);
      expect(existsSync(join(args.stagedWorkDir, 'updates', 'releases', '2.json'))).toBe(true);
      expect(readdirSync(join(workDir, 'updates', 'releases')).sort()).toStrictEqual(
        releaseEntriesBefore,
      );
      expect(args.previousReleaseNumbers).toStrictEqual([1]);
      expect(args.candidateReleaseNumber).toBe(2);
      expect(args.channel).toBe('stable');
      return { passed: true };
    });

    const result = await runManagedPublicationPreflight(
      {
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.1.0',
        buildId: 'sha-2',
        buildDate: '2026-07-25T00:00:00.000Z',
      },
      { runCompatibilityProof },
    );

    expect(result.decision).toBe('proved');
    expect(result.previousReleaseNumbers).toStrictEqual([1]);
    expect(result.descriptor.releaseNumber).toBe(2);
    expect(runCompatibilityProof).toHaveBeenCalledTimes(1);
    // The real workDir remains exactly as it was before this call: still
    // only release 1, never mutated by preflight itself.
    expect(readdirSync(join(workDir, 'updates', 'releases')).sort()).toStrictEqual(
      releaseEntriesBefore,
    );
  });

  it('proves compatibility against every retained previous release, not only the immediately preceding one', async () => {
    writeDist('<release-1/>');
    publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      appVersion: '1.0.0',
      buildId: 'sha-1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });
    writeDist('<release-2/>');
    publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      appVersion: '1.1.0',
      buildId: 'sha-2',
      buildDate: '2026-07-25T00:00:00.000Z',
    });
    writeDist('<release-3/>');
    publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      appVersion: '1.2.0',
      buildId: 'sha-3',
      buildDate: '2026-07-26T00:00:00.000Z',
    });

    writeDist('<release-4/>');
    const runCompatibilityProof = vi.fn().mockImplementation(async (args) => {
      // release 1 is a non-immediate old release (candidate is 4, N-1 is 3):
      // this proves every retained release is collected, not only N-1.
      expect(args.previousReleaseNumbers).toStrictEqual([1, 2, 3]);
      expect(args.candidateReleaseNumber).toBe(4);
      return { passed: true };
    });

    const result = await runManagedPublicationPreflight(
      {
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.3.0',
        buildId: 'sha-4',
        buildDate: '2026-07-27T00:00:00.000Z',
      },
      { runCompatibilityProof },
    );

    expect(result.decision).toBe('proved');
    expect(result.previousReleaseNumbers).toStrictEqual([1, 2, 3]);
    expect(runCompatibilityProof).toHaveBeenCalledTimes(1);
  });

  it('fails closed before publication when the compatibility proof reports non-pass, leaving the real workDir untouched', async () => {
    writeDist('<release-1/>');
    publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      appVersion: '1.0.0',
      buildId: 'sha-1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });
    const releaseEntriesBefore = readdirSync(join(workDir, 'updates', 'releases')).sort();

    writeDist('<release-2/>');
    const runCompatibilityProof = failingProof();

    await expect(
      runManagedPublicationPreflight(
        {
          workDir,
          distDir,
          channel: 'stable',
          appVersion: '1.1.0',
          buildId: 'sha-2',
          buildDate: '2026-07-25T00:00:00.000Z',
        },
        { runCompatibilityProof },
      ),
    ).rejects.toThrow('data-compatibility proof failed');

    expect(readdirSync(join(workDir, 'updates', 'releases')).sort()).toStrictEqual(
      releaseEntriesBefore,
    );
  });

  it('fails closed on a malformed retained tree before any staging or compatibility proof', async () => {
    writeDist('<release-1/>');
    publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      appVersion: '1.0.0',
      buildId: 'sha-1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });
    // Corrupt the retained release's archived index bytes without updating
    // its descriptor's recorded byte size/SHA-256 — the exact "unavailable
    // previous release metadata" failure mode `resolvePublicationPlan`
    // already validates against.
    writeFileSync(join(workDir, 'updates', 'releases', '1', 'index.html'), 'corrupted');

    writeDist('<release-2/>');
    const runCompatibilityProof = passingProof();

    await expect(
      runManagedPublicationPreflight(
        {
          workDir,
          distDir,
          channel: 'stable',
          appVersion: '1.1.0',
          buildId: 'sha-2',
          buildDate: '2026-07-25T00:00:00.000Z',
        },
        { runCompatibilityProof },
      ),
    ).rejects.toThrow('byte size mismatch');

    expect(runCompatibilityProof).not.toHaveBeenCalled();
  });

  it('fails closed and cleans up staging when the candidate itself fails to stage', async () => {
    writeDist('<release-1/>');
    publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      appVersion: '1.0.0',
      buildId: 'sha-1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });

    // A dist containing the reserved `updates/` namespace is rejected by
    // the real publisher during staging (see releasePublish.test.mjs).
    writeDist('<release-2/>');
    mkdirSync(join(distDir, 'updates'), { recursive: true });
    writeFileSync(join(distDir, 'updates', 'latest.json'), '{}');
    const runCompatibilityProof = passingProof();

    await expect(
      runManagedPublicationPreflight(
        {
          workDir,
          distDir,
          channel: 'stable',
          appVersion: '1.1.0',
          buildId: 'sha-2',
          buildDate: '2026-07-25T00:00:00.000Z',
        },
        { runCompatibilityProof },
      ),
    ).rejects.toThrow('Failed to stage the candidate managed release');

    expect(runCompatibilityProof).not.toHaveBeenCalled();
  });
});
