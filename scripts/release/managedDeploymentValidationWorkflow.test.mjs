// @vitest-environment node
// This test only reads and pattern-matches workflow files on disk; the
// default happy-dom environment's URL implementation rejects the resulting
// file:// URL (see config/viteConfigFixtureImport.test.ts).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Every managed production deployment path must run
// `validateReleaseConfig({ managed: true })` (VITE_SENTRY_DSN mandatory)
// before its build step — see docs/release.md, "Managed deployment jobs:
// VITE_SENTRY_DSN is mandatory". validateReleaseConfig.test.mjs proves the
// check function itself; this proves each workflow actually wires it in,
// in the right order, with the DSN supplied. The automatic `develop`
// deployment path previously shipped without this gate. GitHub Actions
// workflows cannot be executed in a unit test; this asserts on the workflow
// source text directly, mirroring the pattern-match style in
// buildDateWorkflow.test.mjs (no generic YAML/workflow parser is
// introduced).
const VALIDATION_STEP_NAME = 'Validate managed release config (Sentry DSN required)';
const DSN_FROM_SECRET = 'VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}';

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
 * Extracts one named step's block text from a job block (6-space indented
 * `- name:` list items, matching this repo's workflow indentation), up to
 * the next step at the same indentation.
 * @param jobBlock One job's YAML block text.
 * @param stepName The step's `name:` value.
 * @returns The step's block text.
 */
function extractStep(jobBlock, stepName) {
  const escapedName = stepName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`\\n {6}- name: ${escapedName}\\n([\\s\\S]*?)(?=\\n {6}- |$)`).exec(
    jobBlock,
  );
  if (!match) {
    throw new Error(`Step "${stepName}" not found in job block`);
  }
  return match[1];
}

describe.each([
  {
    workflow: 'release.yml',
    job: 'deploy-stable',
    validationCommand: 'pnpm release:validate-config:managed',
    buildStepName: 'Build release artifact',
  },
  {
    workflow: 'verify.yml',
    job: 'deploy-develop',
    validationCommand: 'node scripts/release/validateReleaseConfig.mjs --managed',
    buildStepName: 'Build develop branch deployment',
  },
])(
  '$workflow $job: managed release validation gates the build',
  ({ workflow, job, validationCommand, buildStepName }) => {
    const source = readFileSync(
      new URL(`../../.github/workflows/${workflow}`, import.meta.url),
      'utf8',
    );
    const jobBlock = extractJob(source, job);
    const validationStep = extractStep(jobBlock, VALIDATION_STEP_NAME);

    it('runs the managed release config validation command', () => {
      expect(validationStep).toContain(`run: ${validationCommand}`);
    });

    it('supplies VITE_SENTRY_DSN from the repository secret', () => {
      expect(validationStep).toContain(DSN_FROM_SECRET);
    });

    it('runs before the production build step', () => {
      const validationIndex = jobBlock.indexOf(`- name: ${VALIDATION_STEP_NAME}`);
      const buildIndex = jobBlock.indexOf(`- name: ${buildStepName}`);
      expect(validationIndex).toBeGreaterThanOrEqual(0);
      expect(buildIndex).toBeGreaterThan(validationIndex);
    });
  },
);

describe('deploy-branch.yml deploy-branch: manual managed develop validation', () => {
  const source = readFileSync(
    new URL('../../.github/workflows/deploy-branch.yml', import.meta.url),
    'utf8',
  );
  const jobBlock = extractJob(source, 'deploy-branch');
  const validationStep = extractStep(jobBlock, VALIDATION_STEP_NAME);
  const buildStep = extractStep(jobBlock, 'Build branch deployment');

  it('runs the managed release config validation command', () => {
    expect(validationStep).toContain(
      'run: node scripts/release/validateReleaseConfig.mjs --managed',
    );
  });

  it('supplies VITE_SENTRY_DSN from the repository secret', () => {
    expect(validationStep).toContain(DSN_FROM_SECRET);
  });

  it('runs before the branch build step', () => {
    const validationIndex = jobBlock.indexOf(`- name: ${VALIDATION_STEP_NAME}`);
    const buildIndex = jobBlock.indexOf('- name: Build branch deployment');
    expect(validationIndex).toBeGreaterThanOrEqual(0);
    expect(buildIndex).toBeGreaterThan(validationIndex);
  });

  it('is guarded to the develop slug only, unlike the unconditional unmanaged build', () => {
    expect(validationStep).toContain("if: steps.slug.outputs.slug == 'develop'");
    // The build step itself must stay unconditional: unmanaged branch slugs
    // must build and publish without ever depending on managed validation.
    expect(buildStep).not.toContain('if:');
  });
});
