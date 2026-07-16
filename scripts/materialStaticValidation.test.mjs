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

  it('rejects a new component created directly under components/ without a family directory', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/MDButton.vue': '<template><button /></template>\n',
    });
    const findings = validateMaterialLibrary({
      repoRoot: root,
      baseRef: 'HEAD',
      spawn: fakeSpawnWithFiles([]),
    });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY);
    expect(findings[0].path).toBe('src/shared/ui/material/components/MDButton.vue');
  });

  it('rejects a new component created directly at the Material root', () => {
    const root = tempRepo({
      'src/shared/ui/material/MDButton.vue': '<template><button /></template>\n',
    });
    const findings = validateMaterialLibrary({
      repoRoot: root,
      baseRef: 'HEAD',
      spawn: fakeSpawnWithFiles([]),
    });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY);
    expect(findings[0].path).toBe('src/shared/ui/material/MDButton.vue');
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

  it('fails instead of silently disabling the check when an explicit base ref cannot be read', () => {
    const root = tempRepo({
      'src/shared/ui/Button/MDButton.vue': '<template><button /></template>\n',
    });

    expect(() =>
      validateMaterialLibrary({
        repoRoot: root,
        baseRef: 'nonexistent-ref',
        spawn: () => ({ status: 128, stdout: '', stderr: 'fatal: bad revision' }),
      }),
    ).toThrow(/nonexistent-ref/);
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

describe('empty governance files', () => {
  it.each(['README.md', 'AGENTS.md', 'CLAUDE.md'])(
    'rejects an empty %s as a placeholder artifact',
    (basename) => {
      const root = tempRepo({
        [`src/shared/ui/material/components/button/${basename}`]: '   \n',
      });
      const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

      expect(findingCodes(findings)).toContain(CODES.MATERIAL_PLACEHOLDER_ARTIFACT);
    },
  );

  it('does not treat a directory containing only an empty governance file as valid content', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/README.md': '',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).not.toEqual([]);
    expect(findingCodes(findings)).toContain(CODES.MATERIAL_PLACEHOLDER_ARTIFACT);
  });
});

describe('namespace root emptiness', () => {
  it.each(['components', 'foundation', 'patterns'])(
    'rejects an empty %s namespace root directly, not only its children',
    (namespace) => {
      const root = tempRepo({
        [`src/shared/ui/material/${namespace}`]: null,
      });
      const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

      expect(findingCodes(findings)).toContain(CODES.MATERIAL_EMPTY_DIRECTORY);
      expect(findings[0].path).toBe(`src/shared/ui/material/${namespace}`);
    },
  );

  it('still reports the deepest empty child, not the namespace root, when the root is non-empty', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button': null,
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });
    const emptyDirFindings = findings.filter(
      (item) => item.code === CODES.MATERIAL_EMPTY_DIRECTORY,
    );

    expect(emptyDirFindings).toHaveLength(1);
    expect(emptyDirFindings[0].path).toBe('src/shared/ui/material/components/button');
  });
});

describe('empty root barrel', () => {
  it('rejects an empty root barrel', () => {
    const root = tempRepo({
      'src/shared/ui/material/index.ts': '   \n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_PLACEHOLDER_ARTIFACT);
  });

  it('accepts a non-empty root barrel', () => {
    const root = tempRepo({
      'src/shared/ui/material/index.ts': "export { MDButton } from './components/button';\n",
      'src/shared/ui/material/components/button/MDButton.vue': '<template><button /></template>\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toEqual([]);
  });

  it('does not require a root barrel to exist', () => {
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
  it('throws a descriptive error naming the ref when it cannot be resolved', () => {
    expect(() =>
      getFilesAtRef('nonexistent-ref', {
        repoRoot: '/tmp',
        spawn: () => ({ status: 128, stdout: '', stderr: 'fatal: Not a valid object name' }),
      }),
    ).toThrow(/nonexistent-ref/);
    expect(() =>
      getFilesAtRef('nonexistent-ref', {
        repoRoot: '/tmp',
        spawn: () => ({ status: 128, stdout: '', stderr: 'fatal: Not a valid object name' }),
      }),
    ).toThrow(/Not a valid object name/);
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

  it('fails closed, without printing a success result, when an explicit --base-ref cannot be read', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
    });
    const result = spawnSync('node', [SCRIPT_PATH, '--base-ref', 'nonexistent-ref'], {
      cwd: root,
      encoding: 'utf8',
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('nonexistent-ref');
    expect(result.stdout).not.toContain('architecture findings');
  });
});

describe('MATERIAL_ROOT', () => {
  it('is the canonical Material library boundary', () => {
    expect(MATERIAL_ROOT).toBe('src/shared/ui/material');
  });
});
