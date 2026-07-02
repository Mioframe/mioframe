import { describe, expect, it, vi } from 'vitest';

import {
  buildCommands,
  getCliFilesOverride,
  getAllSiblingTestFiles,
  getVerifyBaseRef,
  runVerifyCli,
} from './verify.mjs';

describe('getAllSiblingTestFiles', () => {
  it('maps scripts production .mjs files to sibling .test.mjs', () => {
    const result = getAllSiblingTestFiles('scripts/lib/commandLock.mjs');

    expect(result).toContain('scripts/lib/commandLock.test.mjs');
  });

  it('returns already-test scripts .test.mjs files', () => {
    const result = getAllSiblingTestFiles('scripts/lib/commandLock.test.mjs');

    expect(result).toEqual(['scripts/lib/commandLock.test.mjs']);
  });

  it('still discovers src/ sibling tests', () => {
    const result = getAllSiblingTestFiles('src/shared/lib/cache/index.ts');

    expect(result).toContain('src/shared/lib/cache/index.test.ts');
  });

  it('returns empty for non-src non-scripts files', () => {
    const result = getAllSiblingTestFiles('config/tooling.json');

    expect(result).toEqual([]);
  });
});

describe('getCliFilesOverride', () => {
  it('rejects bare --files with no paths', () => {
    expect(() => getCliFilesOverride(['--files'])).toThrow(
      'Missing value for --files. Example: pnpm verify --only eslint --files src/foo.ts',
    );
  });

  it('rejects --only with an empty --files list', () => {
    expect(() => getCliFilesOverride(['--only', 'eslint', '--files'])).toThrow(
      'Missing value for --files. Example: pnpm verify --only eslint --files src/foo.ts',
    );
  });

  it('rejects empty comma-delimited --files values', () => {
    expect(() => getCliFilesOverride(['--files=,'])).toThrow(
      'Missing value for --files. Example: pnpm verify --only eslint --files src/foo.ts',
    );
    expect(() => getCliFilesOverride(['--files= , '])).toThrow(
      'Missing value for --files. Example: pnpm verify --only eslint --files src/foo.ts',
    );
  });

  it('keeps explicit file lists working', () => {
    expect(getCliFilesOverride(['--only', 'eslint', '--files', 'scripts/verify.mjs'])).toEqual([
      'scripts/verify.mjs',
    ]);
  });

  it('keeps comma-delimited file lists working', () => {
    expect(
      getCliFilesOverride(['--files=scripts/verify.mjs,scripts/playwrightContainer.mjs']),
    ).toEqual(['scripts/playwrightContainer.mjs', 'scripts/verify.mjs']);
  });
});

describe('getVerifyBaseRef', () => {
  it('reads VERIFY_BASE from process env', () => {
    expect(getVerifyBaseRef({ VERIFY_BASE: 'origin/develop' })).toBe('origin/develop');
  });
});

describe('buildCommands full mode', () => {
  it('never skips a check for empty changed-file scope in full mode', () => {
    const commands = buildCommands([], { fullMode: true });
    const runByLabel = Object.fromEntries(commands.map((entry) => [entry.label, entry.kind]));

    expect(runByLabel.format).toBe('run');
    expect(runByLabel.oxlint).toBe('run');
    expect(runByLabel.eslint).toBe('run');
    expect(runByLabel['type-check']).toBe('run');
    expect(runByLabel['unit-tests']).toBe('run');
    expect(runByLabel.e2e).toBe('run');
    expect(runByLabel.visual).toBe('run');
    expect(runByLabel.mutation).toBe('run');
  });

  it('targets the whole project instead of a changed-file list', () => {
    const commands = buildCommands([], { fullMode: true });
    const byLabel = Object.fromEntries(commands.map((entry) => [entry.label, entry]));

    expect(byLabel.format.args).toContain('.');
    expect(byLabel.format.args).not.toContain('src/app/main.ts');
    expect(byLabel.oxlint.args).toContain('.');
    expect(byLabel.eslint.args).toContain('.');
    expect(byLabel['unit-tests'].args).toEqual(['exec', 'vitest', 'run']);
    expect(byLabel.mutation.args).toEqual(['exec', 'stryker', 'run']);
  });

  it('adds the release-only checks with their own labels and commands', () => {
    const commands = buildCommands([], { fullMode: true });
    const byLabel = Object.fromEntries(commands.map((entry) => [entry.label, entry]));

    expect(byLabel['release-version'].args).toEqual(['scripts/release/validateVersion.mjs']);
    expect(byLabel.build.args).toEqual(['scripts/release/buildArtifact.mjs']);
    expect(byLabel.artifact.args).toEqual([
      'e2e:release',
      '--label',
      'artifact',
      'tests/e2e/release/productionArtifactSmoke.spec.ts',
    ]);
    expect(byLabel['release-smoke'].args).toEqual([
      'e2e:release',
      '--label',
      'release-smoke',
      'tests/e2e/release/firstUserAndReturningUserSmoke.spec.ts',
    ]);
  });

  it('does not add release-only checks outside full mode', () => {
    const commands = buildCommands([], { fullMode: false });
    const labels = commands.map((entry) => entry.label);

    expect(labels).not.toContain('release-version');
    expect(labels).not.toContain('build');
    expect(labels).not.toContain('artifact');
    expect(labels).not.toContain('release-smoke');
  });
});

describe('runVerifyCli', () => {
  it('fails before running checks when verify lock acquisition is blocked', async () => {
    const runMain = vi.fn();

    await expect(
      runVerifyCli({
        runMain,
        withVerifyLock: vi.fn(async () => {
          throw new Error('Another local pnpm verify is already running.');
        }),
      }),
    ).rejects.toThrow('Another local pnpm verify is already running.');

    expect(runMain).not.toHaveBeenCalled();
  });
});
