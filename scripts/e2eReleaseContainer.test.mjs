import { describe, expect, it } from 'vitest';

import { buildContainerExtraEnv, parseArgs } from './e2eReleaseContainer.mjs';

describe('buildContainerExtraEnv', () => {
  it('forwards nothing when neither RELEASE_ARTIFACT_SKIP_BUILD nor MANAGED_COMPAT_WORK_DIR is set', () => {
    expect(buildContainerExtraEnv({})).toEqual({});
  });

  it('forwards RELEASE_ARTIFACT_SKIP_BUILD only when set to exactly "1"', () => {
    expect(buildContainerExtraEnv({ RELEASE_ARTIFACT_SKIP_BUILD: '1' })).toEqual({
      RELEASE_ARTIFACT_SKIP_BUILD: '1',
    });
    expect(buildContainerExtraEnv({ RELEASE_ARTIFACT_SKIP_BUILD: '0' })).toEqual({});
  });

  it('forwards the complete MANAGED_COMPAT_* set, and only that set, when MANAGED_COMPAT_WORK_DIR is present', () => {
    const env = {
      MANAGED_COMPAT_WORK_DIR: '.verify/managed-compat-staged-x',
      MANAGED_COMPAT_CHANNEL: 'develop',
      MANAGED_COMPAT_PREVIOUS_RELEASES: '1,2,3',
      MANAGED_COMPAT_CANDIDATE_RELEASE: '4',
      UNRELATED_HOST_VAR: 'must-not-leak',
    };

    expect(buildContainerExtraEnv(env)).toStrictEqual({
      MANAGED_COMPAT_WORK_DIR: '.verify/managed-compat-staged-x',
      MANAGED_COMPAT_CHANNEL: 'develop',
      MANAGED_COMPAT_PREVIOUS_RELEASES: '1,2,3',
      MANAGED_COMPAT_CANDIDATE_RELEASE: '4',
    });
  });

  it('never forwards arbitrary host env vars on their own', () => {
    expect(buildContainerExtraEnv({ SOME_SECRET: 'x', PATH: '/usr/bin' })).toEqual({});
  });

  it('combines RELEASE_ARTIFACT_SKIP_BUILD and the MANAGED_COMPAT_* set when both are present', () => {
    const env = {
      RELEASE_ARTIFACT_SKIP_BUILD: '1',
      MANAGED_COMPAT_WORK_DIR: '.verify/managed-compat-staged-x',
      MANAGED_COMPAT_CHANNEL: 'stable',
      MANAGED_COMPAT_PREVIOUS_RELEASES: '1',
      MANAGED_COMPAT_CANDIDATE_RELEASE: '2',
    };

    expect(buildContainerExtraEnv(env)).toStrictEqual({
      RELEASE_ARTIFACT_SKIP_BUILD: '1',
      MANAGED_COMPAT_WORK_DIR: '.verify/managed-compat-staged-x',
      MANAGED_COMPAT_CHANNEL: 'stable',
      MANAGED_COMPAT_PREVIOUS_RELEASES: '1',
      MANAGED_COMPAT_CANDIDATE_RELEASE: '2',
    });
  });
});

describe('parseArgs', () => {
  it('defaults to the "release" label and passes every arg through when --label is absent', () => {
    expect(parseArgs(['tests/e2e/release/foo.spec.ts'])).toEqual({
      label: 'release',
      extraArgs: ['tests/e2e/release/foo.spec.ts'],
    });
  });

  it('extracts --label and its value, leaving the remaining args in order', () => {
    expect(
      parseArgs([
        '--label',
        'managed-updates',
        'tests/e2e/release/a.spec.ts',
        'tests/e2e/release/b.spec.ts',
      ]),
    ).toEqual({
      label: 'managed-updates',
      extraArgs: ['tests/e2e/release/a.spec.ts', 'tests/e2e/release/b.spec.ts'],
    });
  });

  it('extracts a --label given in the middle of other args', () => {
    expect(parseArgs(['tests/e2e/release/a.spec.ts', '--label', 'managed-updates'])).toEqual({
      label: 'managed-updates',
      extraArgs: ['tests/e2e/release/a.spec.ts'],
    });
  });
});
