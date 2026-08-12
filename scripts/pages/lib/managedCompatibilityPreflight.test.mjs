import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as releasePublishModule from './releasePublish.mjs';
import { runManagedPublicationPreflight } from './managedCompatibilityPreflight.mjs';

// Captured once, before any test installs a spy on releasePublishModule: an
// ordinary reference to the real implementation for tests that only need to
// set up prior releases, unaffected by a later spy in a different test.
const { publishManagedRelease } = releasePublishModule;

let workDir = '';
let distDir = '';

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'compat-preflight-work-'));
  distDir = mkdtempSync(join(tmpdir(), 'compat-preflight-dist-'));
});

afterEach(() => {
  vi.restoreAllMocks();
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
// This module deliberately never exercises the real validateManagedArtifact
// here: writeDist() only produces the minimal shape publishManagedRelease()
// needs, not a full deployment.json/manifest.webmanifest/registerSW.js
// artifact. Real artifact-semantic validation is managedArtifactSemantics.test.mjs's
// responsibility; this file only proves *when* it is invoked in the
// preflight's own ordering.
const stubValidateArtifact = () => vi.fn();

describe('runManagedPublicationPreflight', () => {
  it('resolves "not-applicable" and never runs the compatibility proof when no previous release exists', async () => {
    writeDist('<first/>');
    const runCompatibilityProof = passingProof();
    const validateArtifact = stubValidateArtifact();

    const result = await runManagedPublicationPreflight(
      {
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.0.0',
        buildId: 'sha-1',
        buildDate: '2026-07-24T00:00:00.000Z',
      },
      { runCompatibilityProof, validateArtifact },
    );

    expect(result).toStrictEqual({ decision: 'not-applicable' });
    expect(runCompatibilityProof).not.toHaveBeenCalled();
    // Artifact-semantic validation still runs for release 1, before the
    // 'not-applicable' result is returned.
    expect(validateArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        distDir,
        channel: 'stable',
        appVersion: '1.0.0',
        buildId: 'sha-1',
        buildDate: '2026-07-24T00:00:00.000Z',
      }),
    );
    // Never writes to the real workDir.
    expect(existsSync(join(workDir, 'updates'))).toBe(false);
  });

  it('resolves "idempotent" and never runs artifact validation or the compatibility proof for a buildId matching the current latest', async () => {
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
    const validateArtifact = stubValidateArtifact();

    const result = await runManagedPublicationPreflight(
      {
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.0.0',
        buildId: 'sha-1',
        buildDate: '2026-07-24T00:00:00.000Z',
      },
      { runCompatibilityProof, validateArtifact },
    );

    expect(result.decision).toBe('idempotent');
    expect(result.descriptor.buildId).toBe('sha-1');
    expect(runCompatibilityProof).not.toHaveBeenCalled();
    // The idempotent no-op contract requires zero distDir inspection: even
    // artifact-semantic validation must not run for this path.
    expect(validateArtifact).not.toHaveBeenCalled();
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
    const validateArtifact = stubValidateArtifact();

    const result = await runManagedPublicationPreflight(
      {
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.1.0',
        buildId: 'sha-2',
        buildDate: '2026-07-25T00:00:00.000Z',
      },
      { runCompatibilityProof, validateArtifact },
    );

    expect(result.decision).toBe('proved');
    expect(result.previousReleaseNumbers).toStrictEqual([1]);
    expect(result.descriptor.releaseNumber).toBe(2);
    expect(runCompatibilityProof).toHaveBeenCalledTimes(1);
    expect(validateArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        distDir,
        channel: 'stable',
        appVersion: '1.1.0',
        buildId: 'sha-2',
        buildDate: '2026-07-25T00:00:00.000Z',
      }),
    );
    // The real workDir remains exactly as it was before this call: still
    // only release 1, never mutated by preflight itself.
    expect(readdirSync(join(workDir, 'updates', 'releases')).sort()).toStrictEqual(
      releaseEntriesBefore,
    );
  });

  it('runs artifact-semantic validation before staging or the compatibility proof', async () => {
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
    const callOrder = [];
    const validateArtifact = vi.fn().mockImplementation(() => {
      callOrder.push('artifact-semantics');
    });
    const runCompatibilityProof = vi.fn().mockImplementation(async () => {
      callOrder.push('proof');
      return { passed: true };
    });

    await runManagedPublicationPreflight(
      {
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.1.0',
        buildId: 'sha-2',
        buildDate: '2026-07-25T00:00:00.000Z',
      },
      { runCompatibilityProof, validateArtifact },
    );

    expect(callOrder).toEqual(['artifact-semantics', 'proof']);
  });

  it('never stages or runs the compatibility proof when artifact-semantic validation rejects', async () => {
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
    const runCompatibilityProof = passingProof();
    const validateArtifact = vi.fn().mockImplementation(() => {
      throw new Error('Managed artifact validation failed: wrong base');
    });

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
        { runCompatibilityProof, validateArtifact },
      ),
    ).rejects.toThrow('Managed artifact validation failed');

    expect(runCompatibilityProof).not.toHaveBeenCalled();
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
      { runCompatibilityProof, validateArtifact: stubValidateArtifact() },
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
        { runCompatibilityProof, validateArtifact: stubValidateArtifact() },
      ),
    ).rejects.toThrow('data-compatibility proof failed');

    expect(readdirSync(join(workDir, 'updates', 'releases')).sort()).toStrictEqual(
      releaseEntriesBefore,
    );
  });

  it('fails closed on a malformed retained tree before any artifact validation, staging, or compatibility proof', async () => {
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
    const validateArtifact = stubValidateArtifact();

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
        { runCompatibilityProof, validateArtifact },
      ),
    ).rejects.toThrow('byte size mismatch');

    expect(validateArtifact).not.toHaveBeenCalled();
    expect(runCompatibilityProof).not.toHaveBeenCalled();
  });

  it('excludes develop release 2 (unsupported compat target) from previousReleaseNumbers, but keeps releases 1 and 3', async () => {
    writeDist('<develop-release-1/>');
    publishManagedRelease({
      workDir,
      distDir,
      channel: 'develop',
      appVersion: '1.0.0',
      buildId: 'sha-1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });
    writeDist('<develop-release-2/>');
    publishManagedRelease({
      workDir,
      distDir,
      channel: 'develop',
      appVersion: '1.1.0',
      buildId: 'sha-2',
      buildDate: '2026-07-25T00:00:00.000Z',
    });

    writeDist('<develop-release-3/>');
    const runCompatibilityProof = vi.fn().mockImplementation(async (args) => {
      expect(args.previousReleaseNumbers).toStrictEqual([1]);
      expect(args.candidateReleaseNumber).toBe(3);
      return { passed: true };
    });

    const result = await runManagedPublicationPreflight(
      {
        workDir,
        distDir,
        channel: 'develop',
        appVersion: '1.2.0',
        buildId: 'sha-3',
        buildDate: '2026-07-26T00:00:00.000Z',
      },
      { runCompatibilityProof, validateArtifact: stubValidateArtifact() },
    );

    expect(result.decision).toBe('proved');
    expect(result.previousReleaseNumbers).toStrictEqual([1]);
    expect(runCompatibilityProof).toHaveBeenCalledTimes(1);
  });

  it('still integrity-validates develop release 2 even though it is excluded from compat-proof targets', async () => {
    writeDist('<develop-release-1/>');
    publishManagedRelease({
      workDir,
      distDir,
      channel: 'develop',
      appVersion: '1.0.0',
      buildId: 'sha-1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });
    writeDist('<develop-release-2/>');
    publishManagedRelease({
      workDir,
      distDir,
      channel: 'develop',
      appVersion: '1.1.0',
      buildId: 'sha-2',
      buildDate: '2026-07-25T00:00:00.000Z',
    });
    // Corrupt release 2's archived bytes without updating its descriptor.
    writeFileSync(
      join(workDir, 'branch', 'develop', 'updates', 'releases', '2', 'index.html'),
      'corrupted',
    );

    writeDist('<develop-release-3/>');
    const runCompatibilityProof = passingProof();

    await expect(
      runManagedPublicationPreflight(
        {
          workDir,
          distDir,
          channel: 'develop',
          appVersion: '1.2.0',
          buildId: 'sha-3',
          buildDate: '2026-07-26T00:00:00.000Z',
        },
        { runCompatibilityProof, validateArtifact: stubValidateArtifact() },
      ),
    ).rejects.toThrow('byte size mismatch');

    expect(runCompatibilityProof).not.toHaveBeenCalled();
  });

  it('leaves the candidate distDir byte-for-byte unchanged after a successful compatibility proof', async () => {
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
    const distEntriesBefore = readdirSync(distDir).sort();
    const indexHtmlBefore = readFileSync(join(distDir, 'index.html'), 'utf8');
    const runCompatibilityProof = passingProof();

    const result = await runManagedPublicationPreflight(
      {
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.1.0',
        buildId: 'sha-2',
        buildDate: '2026-07-25T00:00:00.000Z',
      },
      { runCompatibilityProof, validateArtifact: stubValidateArtifact() },
    );

    expect(result.decision).toBe('proved');
    expect(readdirSync(distDir).sort()).toStrictEqual(distEntriesBefore);
    expect(readFileSync(join(distDir, 'index.html'), 'utf8')).toBe(indexHtmlBefore);
  });

  it('fails closed and blocks publication when the compatibility proof mutates the candidate distDir', async () => {
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
    // Simulates the exact bug this preflight guards against: the compatibility
    // proof's own webServer rebuilding the candidate dist as a side effect.
    const runCompatibilityProof = vi.fn().mockImplementation(async () => {
      writeFileSync(join(distDir, 'index.html'), '<html>rebuilt with the wrong base</html>');
      return { passed: true };
    });

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
        { runCompatibilityProof, validateArtifact: stubValidateArtifact() },
      ),
    ).rejects.toThrow('was mutated during the managed release data-compatibility proof');
  });

  it('reports a dist mutation even when the compatibility proof itself also failed', async () => {
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
    const runCompatibilityProof = vi.fn().mockImplementation(async () => {
      writeFileSync(join(distDir, 'index.html'), '<html>rebuilt with the wrong base</html>');
      return { passed: false };
    });
    const validateArtifact = stubValidateArtifact();

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
        { runCompatibilityProof, validateArtifact },
      ),
    ).rejects.toThrow('was mutated during the managed release data-compatibility proof');
  });

  // Regression coverage for the fingerprint-timing fix: the baseline is now
  // captured immediately before staging begins (not immediately before the
  // browser proof), so a mutation introduced by staging itself — not only
  // one introduced by the compatibility proof — must also be caught.
  it('detects a candidate dist mutation that happens during staging itself, not only during the compatibility proof', async () => {
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
    vi.spyOn(releasePublishModule, 'publishManagedRelease').mockImplementation((options) => {
      // Simulates a regression where staging itself (not the compatibility
      // proof) mutates the candidate distDir as a side effect.
      const descriptor = publishManagedRelease(options);
      writeFileSync(join(distDir, 'index.html'), '<html>mutated during staging</html>');
      return descriptor;
    });
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
        { runCompatibilityProof, validateArtifact: stubValidateArtifact() },
      ),
    ).rejects.toThrow('was mutated during the managed release data-compatibility proof');

    // The proof itself ran (and reported success): the mutation is only
    // detectable because the fingerprint baseline predates staging, proving
    // this is not merely re-detecting a proof-time mutation.
    expect(runCompatibilityProof).toHaveBeenCalledTimes(1);
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
        { runCompatibilityProof, validateArtifact: stubValidateArtifact() },
      ),
    ).rejects.toThrow('Failed to stage the candidate managed release');

    expect(runCompatibilityProof).not.toHaveBeenCalled();
  });
});
