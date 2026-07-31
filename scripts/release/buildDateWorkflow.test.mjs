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
const COMMITTER_TIMESTAMP_COMMAND =
  "git show -s --date=format-local:'%Y-%m-%dT%H:%M:%SZ' --format=%cd";
const CANONICAL_DATE_REF = '${{ steps.build-date.outputs.date }}';

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
 * Extracts the value passed to `--build-date` on the line immediately
 * following `marker` in `jobBlock` (each CLI flag is authored on its own
 * source line in these workflows' folded `run: >-` blocks).
 * @param jobBlock One job's YAML block text.
 * @param marker A unique substring identifying the step's command (e.g. a script filename).
 * @returns The captured `--build-date` value, or `undefined` when absent.
 */
function extractBuildDateArg(jobBlock, marker) {
  const match = new RegExp(`${marker}[\\s\\S]*?--build-date\\s+(.+)`).exec(jobBlock);
  return match?.[1].trim();
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

  it('derives the build date from the checked-out commit committer timestamp, not execution time', () => {
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
