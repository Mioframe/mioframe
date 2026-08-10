import { describe, expect, it, vi } from 'vitest';

import {
  MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL,
  MANAGED_RELEASE_DATA_COMPATIBILITY_SPEC,
  runManagedReleaseDataCompatibilityProof,
} from './runManagedReleaseDataCompatibilityProof.mjs';

function passingResult() {
  return { status: 0, signal: null };
}

describe('runManagedReleaseDataCompatibilityProof', () => {
  it('invokes scripts/e2eReleaseContainer.mjs with the compatibility label and spec', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue(passingResult());

    await runManagedReleaseDataCompatibilityProof(
      {
        stagedWorkDir: `${process.cwd()}/.verify/managed-compat-staged-x`,
        channel: 'stable',
        previousReleaseNumbers: [1],
        candidateReleaseNumber: 2,
      },
      { runLocalCommand },
    );

    expect(runLocalCommand).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        command: 'node',
        args: [
          'scripts/e2eReleaseContainer.mjs',
          '--label',
          MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL,
          MANAGED_RELEASE_DATA_COMPATIBILITY_SPEC,
        ],
      }),
    );
  });

  it('forwards the staged work directory as a path relative to the repository root, never an absolute host path', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue(passingResult());

    await runManagedReleaseDataCompatibilityProof(
      {
        stagedWorkDir: `${process.cwd()}/.verify/managed-compat-staged-x`,
        channel: 'stable',
        previousReleaseNumbers: [1],
        candidateReleaseNumber: 2,
      },
      { runLocalCommand },
    );

    const { env } = runLocalCommand.mock.calls[0][0];
    expect(env.MANAGED_COMPAT_WORK_DIR).toBe('.verify/managed-compat-staged-x');
  });

  it('forwards channel, every previous release number joined by comma, and the candidate release number', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue(passingResult());

    await runManagedReleaseDataCompatibilityProof(
      {
        stagedWorkDir: `${process.cwd()}/.verify/managed-compat-staged-x`,
        channel: 'develop',
        previousReleaseNumbers: [1, 2, 3],
        candidateReleaseNumber: 4,
      },
      { runLocalCommand },
    );

    const { env } = runLocalCommand.mock.calls[0][0];
    expect(env.MANAGED_COMPAT_CHANNEL).toBe('develop');
    expect(env.MANAGED_COMPAT_PREVIOUS_RELEASES).toBe('1,2,3');
    expect(env.MANAGED_COMPAT_CANDIDATE_RELEASE).toBe('4');
  });

  it('reports passed only when the container process exits 0 with no signal', async () => {
    const passingRun = vi.fn().mockResolvedValue({ status: 0, signal: null });
    const failingRun = vi.fn().mockResolvedValue({ status: 1, signal: null });
    const terminatedRun = vi.fn().mockResolvedValue({ status: null, signal: 'SIGTERM' });
    const args = {
      stagedWorkDir: `${process.cwd()}/.verify/managed-compat-staged-x`,
      channel: 'stable',
      previousReleaseNumbers: [1],
      candidateReleaseNumber: 2,
    };

    await expect(
      runManagedReleaseDataCompatibilityProof(args, { runLocalCommand: passingRun }),
    ).resolves.toEqual({ passed: true });
    await expect(
      runManagedReleaseDataCompatibilityProof(args, { runLocalCommand: failingRun }),
    ).resolves.toEqual({ passed: false });
    await expect(
      runManagedReleaseDataCompatibilityProof(args, { runLocalCommand: terminatedRun }),
    ).resolves.toEqual({ passed: false });
  });
});
