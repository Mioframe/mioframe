// @vitest-environment node
// This test only reads and pattern-matches the workflow file on disk; the
// default happy-dom environment's URL implementation rejects the resulting
// file:// URL (see config/viteConfigFixtureImport.test.ts).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Automatic PR-version materialization (docs/release.md, "Same-repository CI
// materialization") requires verify.yml to: react to label changes, run
// materialization only for same-repository PRs (fork PRs never get write
// credentials), fetch the PR base branch before comparing against it, run
// materialization before the existing autofix fixer pipeline, and keep
// release-version an independent merge gate from implementation verification
// and PR preview. GitHub Actions workflows cannot be executed in a unit
// test; this asserts on the workflow source text directly, mirroring the
// pattern-match style in buildDateWorkflow.test.mjs and
// managedDeploymentValidationWorkflow.test.mjs (no generic YAML/workflow
// parser is introduced).

/**
 * Extracts one top-level job's YAML block (2-space indented job name, e.g.
 * `  autofix:`) up to the next job at the same indentation.
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

const source = readFileSync(new URL('../../.github/workflows/verify.yml', import.meta.url), 'utf8');
const triggerBlock = source.slice(0, source.indexOf('\njobs:'));

describe('verify.yml: pull_request trigger', () => {
  it('listens to labeled and unlabeled in addition to opened/synchronize/reopened', () => {
    const typesBlock = triggerBlock.slice(
      triggerBlock.indexOf('pull_request:'),
      triggerBlock.indexOf('branches-ignore:'),
    );

    expect(typesBlock).toContain('opened');
    expect(typesBlock).toContain('synchronize');
    expect(typesBlock).toContain('reopened');
    expect(typesBlock).toContain('labeled');
    expect(typesBlock).toContain('unlabeled');
  });

  it('never uses pull_request_target', () => {
    expect(source).not.toContain('pull_request_target');
  });
});

describe('verify.yml autofix: same-repository trust boundary and materialization order', () => {
  const jobBlock = extractJob(source, 'autofix');

  it('restricts the job to same-repository PRs', () => {
    expect(jobBlock).toContain(
      'github.event.pull_request.head.repo.full_name == github.repository',
    );
  });

  it('fetches the PR base branch before running materialization', () => {
    const fetchIndex = jobBlock.indexOf('- name: Fetch pull request base branch');
    const materializeIndex = jobBlock.indexOf(
      '- name: Materialize PR version from release-intent label',
    );

    expect(fetchIndex).toBeGreaterThanOrEqual(0);
    expect(materializeIndex).toBeGreaterThan(fetchIndex);
  });

  it('runs version materialization before the existing autofix fixer pipeline', () => {
    const materializeIndex = jobBlock.indexOf(
      '- name: Materialize PR version from release-intent label',
    );
    const autofixIndex = jobBlock.indexOf('- name: Run autofix fixers');

    expect(materializeIndex).toBeGreaterThanOrEqual(0);
    expect(autofixIndex).toBeGreaterThan(materializeIndex);
    expect(jobBlock).toContain('run: node scripts/release/materializePrVersion.mjs');
    expect(jobBlock).toContain('pnpm ci:autofix');
  });

  it('never grants materialization to fork PRs: the job condition requires same-repository', () => {
    const autofixStart = source.indexOf('\n  autofix:\n');
    const jobHeader = source.slice(autofixStart, source.indexOf('    steps:', autofixStart));
    expect(jobHeader).toContain("github.event_name == 'pull_request'");
    expect(jobHeader).toContain(
      'github.event.pull_request.head.repo.full_name == github.repository',
    );
  });
});

describe('verify.yml: release-version stays an independent merge gate', () => {
  const releaseVersionBlock = extractJob(source, 'release-version');
  const verifyBlock = extractJob(source, 'verify');
  const deployPreviewBlock = extractJob(source, 'deploy-preview');
  const deployPreviewHeader = source.slice(
    source.indexOf('\n  deploy-preview:\n'),
    source.indexOf('    runs-on: ubuntu-24.04', source.indexOf('\n  deploy-preview:\n')),
  );

  it('runs release-version independently of the verification aggregate', () => {
    expect(releaseVersionBlock).toContain('run: node scripts/release/validateVersion.mjs');
    expect(releaseVersionBlock).not.toContain('needs.verification');
  });

  it('requires both verification and release-version for the aggregate verify gate', () => {
    expect(verifyBlock).toContain('VERIFICATION_RESULT: ${{ needs.verification.result }}');
    expect(verifyBlock).toContain('VERSION_RESULT: ${{ needs.release-version.result }}');
  });

  it('gates PR preview on implementation verification, not on release-version', () => {
    expect(deployPreviewHeader).toContain('needs: [verification]');
    expect(deployPreviewHeader).not.toContain('release-version');
    expect(deployPreviewBlock).not.toContain('release-version');
  });
});
