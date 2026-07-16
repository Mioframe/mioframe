import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

import {
  CODES,
  formatFinding,
  getFilesAtRef,
  MATERIAL_ROOT,
  validateMaterialLibrary,
} from './materialStaticValidation.mjs';

const SCRIPT_PATH = path.resolve(process.cwd(), 'scripts/materialStaticValidation.mjs');

/**
 * Create a minimal temp repository with the given files.
 * @param files Map of repository-relative path to content; `null` creates a directory.
 * @returns Absolute temp repository root.
 */
function makeTempRepo(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'material-static-test-'));

  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

    if (content === null) {
      fs.mkdirSync(absolutePath, { recursive: true });
    } else {
      fs.writeFileSync(absolutePath, content, 'utf8');
    }
  }

  return root;
}

/**
 * Fake `spawnSync` reporting a fixed set of files "at the base ref".
 * @param fileList Repository-relative paths to report as existing at the ref.
 * @returns A `spawnSync`-shaped function.
 */
function fakeSpawnWithFiles(fileList) {
  return () => ({ status: 0, stdout: fileList.join('\n') });
}

const tempRoots = [];

function tempRepo(files) {
  const root = makeTempRepo(files);
  tempRoots.push(root);
  return root;
}

afterEach(() => {
  while (tempRoots.length > 0) {
    fs.rmSync(tempRoots.pop(), { recursive: true, force: true });
  }
});

function findingCodes(findings) {
  return findings.map((item) => item.code);
}

describe('new official component placement (diff-aware)', () => {
  it('accepts a new component created under the canonical components directory', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/MDButton.vue': '<template><button /></template>\n',
    });
    const findings = validateMaterialLibrary({
      repoRoot: root,
      baseRef: 'HEAD',
      spawn: fakeSpawnWithFiles([]),
    });

    expect(findingCodes(findings)).not.toContain(CODES.MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY);
  });

  it('rejects a new component created outside the canonical components directory', () => {
    const root = tempRepo({
      'src/shared/ui/Button/MDButton.vue': '<template><button /></template>\n',
    });
    const findings = validateMaterialLibrary({
      repoRoot: root,
      baseRef: 'HEAD',
      spawn: fakeSpawnWithFiles([]),
    });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY);
    expect(findings[0].path).toBe('src/shared/ui/Button/MDButton.vue');
  });

  it('grandfathers a pre-existing legacy component that already existed at the base ref', () => {
    const root = tempRepo({
      'src/shared/ui/Button/MDButton.vue': '<template><button /></template>\n',
    });
    const findings = validateMaterialLibrary({
      repoRoot: root,
      baseRef: 'HEAD',
      spawn: fakeSpawnWithFiles(['src/shared/ui/Button/MDButton.vue']),
    });

    expect(findingCodes(findings)).not.toContain(CODES.MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY);
  });

  it('disables the check entirely when no base ref is provided', () => {
    const root = tempRepo({
      'src/shared/ui/Button/MDButton.vue': '<template><button /></template>\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).not.toContain(CODES.MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY);
  });
});

describe('empty canonical directories', () => {
  it('rejects an empty canonical component directory', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button': null,
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_EMPTY_DIRECTORY);
    expect(findings[0].path).toBe('src/shared/ui/material/components/button');
  });

  it('accepts a component directory containing real content', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/MDButton.vue': '<template><button /></template>\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).not.toContain(CODES.MATERIAL_EMPTY_DIRECTORY);
  });

  it('reports only the outermost empty directory for nested empty directories', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/nested/deeper': null,
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });
    const emptyDirFindings = findings.filter(
      (item) => item.code === CODES.MATERIAL_EMPTY_DIRECTORY,
    );

    expect(emptyDirFindings).toHaveLength(1);
    expect(emptyDirFindings[0].path).toBe('src/shared/ui/material/components/button');
  });

  it('rejects a .gitkeep placeholder file', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/.gitkeep': '',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_PLACEHOLDER_ARTIFACT);
  });

  it('rejects an empty non-governance production file', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/MDButton.vue': '   \n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_PLACEHOLDER_ARTIFACT);
  });

  it('allows a governance-only directory without flagging it as empty', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/README.md': '# Button blueprint\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).not.toContain(CODES.MATERIAL_EMPTY_DIRECTORY);
  });
});

describe('premature or empty root barrel', () => {
  it('rejects a root barrel created before any real artifact is migrated', () => {
    const root = tempRepo({
      'src/shared/ui/material/index.ts': "export { MDButton } from './components/button';\n",
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_PREMATURE_ROOT_BARREL);
  });

  it('rejects an empty root barrel', () => {
    const root = tempRepo({
      'src/shared/ui/material/index.ts': '   \n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_PLACEHOLDER_ARTIFACT);
    expect(findingCodes(findings)).not.toContain(CODES.MATERIAL_PREMATURE_ROOT_BARREL);
  });

  it('accepts a root barrel backed by a real migrated artifact', () => {
    const root = tempRepo({
      'src/shared/ui/material/index.ts': "export { MDButton } from './components/button';\n",
      'src/shared/ui/material/components/button/MDButton.vue': '<template><button /></template>\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).not.toContain(CODES.MATERIAL_PREMATURE_ROOT_BARREL);
  });

  it('does not require a root barrel to exist', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toEqual([]);
  });
});

describe('explicitly listed obsolete paths', () => {
  it('rejects a path on the explicit obsolete-path list', () => {
    const root = tempRepo({
      'src/shared/ui/OldMenu/MDMenu.vue': '<template><div /></template>\n',
    });
    const findings = validateMaterialLibrary({
      repoRoot: root,
      baseRef: null,
      obsoletePaths: ['src/shared/ui/OldMenu'],
    });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_OBSOLETE_PATH);
    expect(findings[0].path).toBe('src/shared/ui/OldMenu');
  });

  it('does not reject a path absent from the explicit list', () => {
    const root = tempRepo({
      'src/shared/ui/OldMenu/MDMenu.vue': '<template><div /></template>\n',
    });
    const findings = validateMaterialLibrary({
      repoRoot: root,
      baseRef: null,
      obsoletePaths: ['src/shared/ui/SomeOtherLegacyOwner'],
    });

    expect(findingCodes(findings)).not.toContain(CODES.MATERIAL_OBSOLETE_PATH);
  });

  it('defaults to an empty obsolete-path list', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toEqual([]);
  });
});

describe('unrelated files', () => {
  it('ignores files outside the Material root and outside the official component naming pattern', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
      'src/features/exampleAction/ExampleAction.vue': '<template><div /></template>\n',
      'src/shared/lib/cache/index.ts': 'export const cache = new Map();\n',
      'docs/material-3/README.md': '# Docs\n',
    });
    const findings = validateMaterialLibrary({
      repoRoot: root,
      baseRef: 'HEAD',
      spawn: fakeSpawnWithFiles([]),
    });

    expect(findings).toEqual([]);
  });
});

describe('deterministic ordering', () => {
  it('sorts findings by path, then code, then message', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/zeta': null,
      'src/shared/ui/material/components/alpha': null,
    });
    const run = () => validateMaterialLibrary({ repoRoot: root, baseRef: null });
    const first = run();
    const second = run();
    const manuallySorted = [...first].sort(
      (left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code),
    );

    expect(first).toEqual(second);
    expect(first.map((item) => item.path)).toEqual(manuallySorted.map((item) => item.path));
  });
});

describe('formatFinding', () => {
  it('formats the required [static-blocking][<CODE>] <path>: block', () => {
    const output = formatFinding({
      code: 'MATERIAL_EMPTY_DIRECTORY',
      path: 'src/shared/ui/material/components/button',
      message: 'Empty speculative directory.',
    });

    expect(output).toBe(
      '[static-blocking][MATERIAL_EMPTY_DIRECTORY] src/shared/ui/material/components/button:\nEmpty speculative directory.',
    );
  });
});

describe('getFilesAtRef', () => {
  it('returns null when the ref cannot be resolved', () => {
    expect(
      getFilesAtRef('nonexistent-ref', {
        repoRoot: '/tmp',
        spawn: () => ({ status: 128, stdout: '' }),
      }),
    ).toBeNull();
  });

  it('returns the file set reported by git', () => {
    const result = getFilesAtRef('HEAD', {
      repoRoot: '/tmp',
      spawn: () => ({ status: 0, stdout: 'a.ts\nb/c.ts\n' }),
    });

    expect(result).toEqual(new Set(['a.ts', 'b/c.ts']));
  });
});

describe('CLI behavior', () => {
  it('exits 0 for a valid repository', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
    });
    const result = spawnSync('node', [SCRIPT_PATH], { cwd: root, encoding: 'utf8' });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('0 architecture findings');
  });

  it('exits 1 and reports findings without an unhandled stack trace', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button': null,
    });
    const result = spawnSync('node', [SCRIPT_PATH], { cwd: root, encoding: 'utf8' });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain(`[static-blocking][${CODES.MATERIAL_EMPTY_DIRECTORY}]`);
    expect(result.stderr).toBe('');
    expect(result.stdout).not.toContain(' at ');
  });

  it('omits the diff-aware placement check when --base-ref is not passed', () => {
    const root = tempRepo({
      'src/shared/ui/Button/MDButton.vue': '<template><button /></template>\n',
    });
    const result = spawnSync('node', [SCRIPT_PATH], { cwd: root, encoding: 'utf8' });

    expect(result.status).toBe(0);
  });
});

describe('MATERIAL_ROOT', () => {
  it('is the canonical Material library boundary', () => {
    expect(MATERIAL_ROOT).toBe('src/shared/ui/material');
  });
});
