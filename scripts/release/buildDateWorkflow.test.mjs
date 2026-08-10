// @vitest-environment node
// This test only reads and pattern-matches workflow files on disk; the
// default happy-dom environment's URL implementation rejects the resulting
// file:// URL (see config/viteConfigFixtureImport.test.ts).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Managed stable/develop publication requires one canonical UTC committer
// timestamp of the checked-out commit to reach Vite (__BUILD_DATE__),
// deployment.json, and the publisher — never workflow execution time (see
// docs/managed-pinned-updates.md, "Deterministic build inputs", and
// AGENTS.md ownership: release.yml/verify.yml own the source SHA and
// committer timestamp input). GitHub Actions workflows cannot be executed
// in a unit test; this asserts on the workflow source text directly,
// mirroring the existing pattern-match style in
// config/viteConfigFixtureImport.test.ts (no generic YAML/workflow parser
// is introduced).
//
// TZ=UTC is required in the command itself: format-local:'...Z' formats the
// committer date in the process's local timezone but only *labels* it Z, so
// without TZ=UTC pinning the process to UTC the resulting timestamp is
// wrong while still looking like a valid UTC value.
const COMMITTER_TIMESTAMP_COMMAND =
  "TZ=UTC git show -s --date=format-local:'%Y-%m-%dT%H:%M:%SZ' --format=%cd ${{ github.sha }}";
const CANONICAL_DATE_REF = '${{ steps.build-date.outputs.date }}';
const CANONICAL_SHA_REF = '${{ steps.selected-commit.outputs.sha }}';

/**
 * Extracts one top-level job's YAML block (2-space indented job name, e.g.
 * `  deploy-stable:`) up to the next job at the same indentation.
 * @param source Full workflow file contents.
 * @param jobName The job's key under `jobs:`.
 * @returns The job's block text.
 */
function extractJob(source, jobName) {
  const match = new RegExp(`\\n {2}${jobName}:\\n([\\s\\S]*?)(?=\\n {2}[\\w-]+:\\n|$)`).exec(
    source,
  );
  if (!match) {
    throw new Error(`Job "${jobName}" not found in workflow source`);
  }
  return match[1];
}

/**
 * Extracts the value passed to `flag` on the line following the first
 * occurrence of `marker` in `jobBlock` (each CLI flag is authored on its own
 * source line in these workflows' folded `run: >-` blocks).
 * @param jobBlock One job's YAML block text.
 * @param marker A unique substring identifying the step's command (e.g. a script filename).
 * @param flag The CLI flag to capture the value of, e.g. `--build-date`.
 * @returns The captured flag value, or `undefined` when absent.
 */
function extractFlagValue(jobBlock, marker, flag) {
  const match = new RegExp(`${marker}[\\s\\S]*?${flag}\\s+(.+)`).exec(jobBlock);
  return match?.[1].trim();
}

/**
 * Extracts the value passed to `--build-date` on the line immediately
 * following `marker` in `jobBlock`.
 * @param jobBlock One job's YAML block text.
 * @param marker A unique substring identifying the step's command (e.g. a script filename).
 * @returns The captured `--build-date` value, or `undefined` when absent.
 */
function extractBuildDateArg(jobBlock, marker) {
  return extractFlagValue(jobBlock, marker, '--build-date');
}

describe.each([
  { workflow: 'release.yml', job: 'deploy-stable' },
  { workflow: 'verify.yml', job: 'deploy-develop' },
])('$workflow $job: canonical committer build date', ({ workflow, job }) => {
  const source = readFileSync(
    new URL(`../../.github/workflows/${workflow}`, import.meta.url),
    'utf8',
  );
  const jobBlock = extractJob(source, job);

  it('derives the build date from the checked-out commit committer timestamp under TZ=UTC, not execution time', () => {
    expect(jobBlock).toContain(COMMITTER_TIMESTAMP_COMMAND);
    // No wall-clock `date` invocation stands in for the committer timestamp.
    expect(jobBlock).not.toMatch(/\bdate\s+-u\b/);
  });

  it('passes the exact same resolved value to Vite, deployment metadata, and the publisher', () => {
    const viteBuildDate = /VITE_BUILD_DATE:\s*(.+)/.exec(jobBlock)?.[1].trim();
    const deploymentMetadataBuildDate = extractBuildDateArg(
      jobBlock,
      'writeDeploymentMetadata\\.mjs',
    );
    const publisherBuildDate = extractBuildDateArg(jobBlock, 'publish(?:Stable|Branch)\\.mjs');

    expect(viteBuildDate).toBe(CANONICAL_DATE_REF);
    expect(deploymentMetadataBuildDate).toBe(CANONICAL_DATE_REF);
    expect(publisherBuildDate).toBe(CANONICAL_DATE_REF);
  });
});

describe('deploy-branch.yml deploy-branch: manual develop deployment build identity', () => {
  const source = readFileSync(
    new URL('../../.github/workflows/deploy-branch.yml', import.meta.url),
    'utf8',
  );
  const jobBlock = extractJob(source, 'deploy-branch');

  it('derives the build date from the selected app-source commit committer timestamp under TZ=UTC, never workflow execution time, the trusted tooling checkout, or the run id/attempt', () => {
    expect(jobBlock).toContain(
      "TZ=UTC git -C app-source show -s --date=format-local:'%Y-%m-%dT%H:%M:%SZ' --format=%cd HEAD",
    );
    expect(jobBlock).not.toMatch(/\bdate\s+-u\b/);
    expect(jobBlock).not.toContain('github.run_id');
    expect(jobBlock).not.toContain('github.run_attempt');
  });

  it('passes the exact same resolved app-source build date to Vite and deployment metadata', () => {
    const viteBuildDate = /VITE_BUILD_DATE:\s*(.+)/.exec(jobBlock)?.[1].trim();
    const deploymentMetadataBuildDate = extractBuildDateArg(
      jobBlock,
      'writeDeploymentMetadata\\.mjs',
    );

    expect(viteBuildDate).toBe(CANONICAL_DATE_REF);
    expect(deploymentMetadataBuildDate).toBe(CANONICAL_DATE_REF);
  });

  it('passes the exact same selected app-source commit SHA to Vite, deployment metadata, and the managed publisher as the build identity', () => {
    const viteBuildId = /VITE_BUILD_ID:\s*(.+)/.exec(jobBlock)?.[1].trim();
    const deploymentMetadataSha = extractFlagValue(
      jobBlock,
      'writeDeploymentMetadata\\.mjs',
      '--sha',
    );
    const PUBLISH_INVOCATION = 'tooling/scripts/pages/publishBranch.mjs';
    const steps = jobBlock.split(/\n {6}- name: /).slice(1);
    const managedPublishStep = steps.find(
      (step) => step.includes(PUBLISH_INVOCATION) && step.includes('--app-version "'),
    );

    if (!managedPublishStep) throw new Error('Expected a managed develop publish step');

    const managedPublisherBuildId = extractFlagValue(
      managedPublishStep,
      PUBLISH_INVOCATION,
      '--build-id',
    );

    expect(viteBuildId).toBe(CANONICAL_SHA_REF);
    expect(deploymentMetadataSha).toBe(CANONICAL_SHA_REF);
    expect(managedPublisherBuildId).toBe(CANONICAL_SHA_REF);
    // Never the trusted tooling checkout's own commit, only the selected app-source commit.
    expect(viteBuildId).not.toBe('${{ github.sha }}');
  });

  it('gates the managed publish call behind the develop slug and supplies app-source-derived identity, distinct from the unmanaged branch publish call', () => {
    // Matches the actual script invocation line, not merely a comment
    // mentioning the script or flag by name.
    const PUBLISH_INVOCATION = 'tooling/scripts/pages/publishBranch.mjs';
    const steps = jobBlock.split(/\n {6}- name: /).slice(1);
    const managedPublishStep = steps.find(
      (step) => step.includes(PUBLISH_INVOCATION) && step.includes('--app-version "'),
    );
    const unmanagedPublishStep = steps.find(
      (step) => step.includes(PUBLISH_INVOCATION) && !step.includes('--app-version'),
    );

    if (!managedPublishStep) throw new Error('Expected a managed develop publish step');
    if (!unmanagedPublishStep) throw new Error('Expected an unmanaged branch publish step');

    expect(managedPublishStep).toMatch(/if:\s*steps\.slug\.outputs\.slug == 'develop'/);
    expect(managedPublishStep).toContain('--build-id ${{ steps.selected-commit.outputs.sha }}');
    expect(managedPublishStep).toContain(`--build-date ${CANONICAL_DATE_REF}`);
    // Never the trusted tooling checkout's own commit, only the selected app-source commit.
    expect(managedPublishStep).not.toContain('${{ github.sha }}');

    expect(unmanagedPublishStep).toMatch(/if:\s*steps\.slug\.outputs\.slug != 'develop'/);
    expect(unmanagedPublishStep).not.toContain('--app-version');
    expect(unmanagedPublishStep).not.toContain('--build-id');
    expect(unmanagedPublishStep).not.toContain('--build-date');
  });
});

describe('verify.yml deploy-preview: unmanaged PR preview build date is unchanged', () => {
  const source = readFileSync(
    new URL('../../.github/workflows/verify.yml', import.meta.url),
    'utf8',
  );
  const jobBlock = extractJob(source, 'deploy-preview');

  it('does not set VITE_BUILD_DATE, keeping the existing wall-clock fallback', () => {
    expect(jobBlock).not.toContain('VITE_BUILD_DATE');
  });

  it('does not derive a committer timestamp', () => {
    expect(jobBlock).not.toContain(COMMITTER_TIMESTAMP_COMMAND);
  });
});
