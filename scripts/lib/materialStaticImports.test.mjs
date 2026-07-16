import { describe, expect, it } from 'vitest';
import {
  classifySpecifier,
  extractImportSpecifiers,
  extractScriptSource,
  resolveFileImports,
  resolveInternalPath,
  stripComments,
} from './materialStaticImports.mjs';

describe('stripComments', () => {
  it('blanks line comments but keeps string content', () => {
    const source = "import a from 'a'; // import b from 'b'\n";

    expect(stripComments(source)).not.toContain('import b');
    expect(stripComments(source)).toContain("import a from 'a';");
  });

  it('blanks block comments spanning multiple lines', () => {
    const source = "/* import b from 'b' */\nimport a from 'a';";

    expect(stripComments(source)).not.toContain('import b');
    expect(stripComments(source)).toContain("import a from 'a';");
  });

  it('preserves quote characters inside string and template literals', () => {
    const source = "const x = `hello ${1}`; import a from 'a';";

    expect(stripComments(source)).toContain("import a from 'a';");
  });

  it('does not treat an escaped quote as a string terminator', () => {
    const source = String.raw`const s = 'it\'s fine'; import a from 'a';`;

    expect(stripComments(source)).toContain("import a from 'a';");
  });
});

describe('extractScriptSource', () => {
  it('returns raw content unchanged for non-.vue files', () => {
    const source = "import a from 'a';";

    expect(extractScriptSource('src/foo.ts', source)).toBe(source);
  });

  it('extracts a single <script setup> block from a Vue SFC', () => {
    const sfc = [
      '<template><div /></template>',
      '<script setup lang="ts">',
      "import a from 'a';",
      '</script>',
      '<style scoped>.x { color: red; }</style>',
    ].join('\n');

    expect(extractScriptSource('src/Foo.vue', sfc)).toContain("import a from 'a';");
    expect(extractScriptSource('src/Foo.vue', sfc)).not.toContain('color: red');
  });

  it('concatenates multiple script blocks', () => {
    const sfc = [
      '<script lang="ts">',
      "import a from 'a';",
      '</script>',
      '<script setup lang="ts">',
      "import b from 'b';",
      '</script>',
    ].join('\n');
    const result = extractScriptSource('src/Foo.vue', sfc);

    expect(result).toContain("import a from 'a';");
    expect(result).toContain("import b from 'b';");
  });
});

describe('extractImportSpecifiers', () => {
  it('extracts a default import specifier', () => {
    expect(extractImportSpecifiers("import Foo from './Foo.vue';")).toEqual(['./Foo.vue']);
  });

  it('extracts named and type-only imports', () => {
    const source = [
      "import { a, b } from './ab';",
      "import type { C } from './c';",
      "import * as ns from './ns';",
    ].join('\n');

    expect(extractImportSpecifiers(source)).toEqual(['./ab', './c', './ns']);
  });

  it('extracts a bare side-effect import', () => {
    expect(extractImportSpecifiers("import './styles.css';")).toEqual(['./styles.css']);
  });

  it('extracts named and star re-exports', () => {
    const source = ["export { a } from './a';", "export * from './b';"].join('\n');

    expect(extractImportSpecifiers(source)).toEqual(['./a', './b']);
  });

  it('extracts export * as namespace re-exports', () => {
    expect(extractImportSpecifiers("export * as ns from './ns';")).toEqual(['./ns']);
  });

  it('extracts a static dynamic import()', () => {
    expect(extractImportSpecifiers("const m = import('./lazy');")).toEqual(['./lazy']);
  });

  it('ignores a dynamic import() with a non-static specifier', () => {
    expect(extractImportSpecifiers('const m = import(path);')).toEqual([]);
  });

  it('extracts a require() call', () => {
    expect(extractImportSpecifiers("const m = require('./legacy');")).toEqual(['./legacy']);
  });

  it('ignores specifiers mentioned only in comments', () => {
    const source = ["// import x from './should-not-appear';", "import a from './a';"].join('\n');

    expect(extractImportSpecifiers(source)).toEqual(['./a']);
  });

  it('does not runaway-match a bare import across an unrelated later "from"', () => {
    const source = ["import './a';", 'const from = 1;', "import b from './b';"].join('\n');

    expect(extractImportSpecifiers(source)).toEqual(['./a', './b']);
  });

  it('de-duplicates repeated specifiers', () => {
    const source = ["import a from './a';", "import { x } from './a';"].join('\n');

    expect(extractImportSpecifiers(source)).toEqual(['./a']);
  });

  it('returns an empty list for source with no imports', () => {
    expect(extractImportSpecifiers('const x = 1;')).toEqual([]);
  });
});

describe('classifySpecifier', () => {
  it('classifies a relative specifier as internal, resolved against the importing directory', () => {
    expect(
      classifySpecifier('./Button.vue', 'src/shared/ui/material/components/button/index.ts'),
    ).toEqual({ kind: 'internal', rawPath: 'src/shared/ui/material/components/button/Button.vue' });
  });

  it('classifies a parent-relative specifier correctly', () => {
    expect(
      classifySpecifier(
        '../switch/Switch.vue',
        'src/shared/ui/material/components/button/Button.vue',
      ),
    ).toEqual({ kind: 'internal', rawPath: 'src/shared/ui/material/components/switch/Switch.vue' });
  });

  it('classifies each project alias to its target directory', () => {
    expect(classifySpecifier('@shared/ui/material', 'src/anything.ts')).toEqual({
      kind: 'internal',
      rawPath: 'src/shared/ui/material',
    });
    expect(classifySpecifier('@feature/foo', 'src/anything.ts')).toEqual({
      kind: 'internal',
      rawPath: 'src/features/foo',
    });
    expect(classifySpecifier('@entity/foo', 'src/anything.ts')).toEqual({
      kind: 'internal',
      rawPath: 'src/entities/foo',
    });
    expect(classifySpecifier('@widget/foo', 'src/anything.ts')).toEqual({
      kind: 'internal',
      rawPath: 'src/widgets/foo',
    });
    expect(classifySpecifier('@page/foo', 'src/anything.ts')).toEqual({
      kind: 'internal',
      rawPath: 'src/pages/foo',
    });
    expect(classifySpecifier('@/app/main', 'src/anything.ts')).toEqual({
      kind: 'internal',
      rawPath: 'src/app/main',
    });
  });

  it('classifies an unresolvable bare specifier as external', () => {
    expect(classifySpecifier('vue', 'src/anything.ts')).toEqual({
      kind: 'external',
      specifier: 'vue',
    });
  });
});

describe('resolveInternalPath', () => {
  const fixtureFsApi = {
    files: new Set([
      '/repo/src/shared/ui/material/components/button/Button.vue',
      '/repo/src/shared/ui/material/components/button/index.ts',
    ]),
    dirs: new Set(['/repo/src/shared/ui/material/components/button']),
    existsSync(target) {
      return this.files.has(target) || this.dirs.has(target);
    },
    statSync(target) {
      return { isFile: () => this.files.has(target), isDirectory: () => this.dirs.has(target) };
    },
  };

  it('resolves an exact existing path', () => {
    expect(
      resolveInternalPath('src/shared/ui/material/components/button/Button.vue', {
        repoRoot: '/repo',
        fsApi: fixtureFsApi,
      }),
    ).toEqual({ path: 'src/shared/ui/material/components/button/Button.vue', exists: true });
  });

  it('resolves an extensionless path by trying known extensions', () => {
    expect(
      resolveInternalPath('src/shared/ui/material/components/button/Button', {
        repoRoot: '/repo',
        fsApi: fixtureFsApi,
      }),
    ).toEqual({ path: 'src/shared/ui/material/components/button/Button.vue', exists: true });
  });

  it('resolves a directory specifier to its index.ts', () => {
    expect(
      resolveInternalPath('src/shared/ui/material/components/button', {
        repoRoot: '/repo',
        fsApi: fixtureFsApi,
      }),
    ).toEqual({ path: 'src/shared/ui/material/components/button/index.ts', exists: true });
  });

  it('reports a non-existent path as unresolved without throwing', () => {
    expect(
      resolveInternalPath('src/shared/ui/material/components/missing', {
        repoRoot: '/repo',
        fsApi: fixtureFsApi,
      }),
    ).toEqual({ path: 'src/shared/ui/material/components/missing', exists: false });
  });
});

describe('resolveFileImports', () => {
  const fsApi = {
    files: new Set(['/repo/src/shared/ui/material/components/switch/Switch.vue']),
    dirs: new Set(),
    existsSync(target) {
      return this.files.has(target) || this.dirs.has(target);
    },
    statSync(target) {
      return { isFile: () => this.files.has(target), isDirectory: () => this.dirs.has(target) };
    },
  };

  it('resolves internal imports and drops external package imports', () => {
    const content = [
      "import { ref } from 'vue';",
      "import Switch from '../switch/Switch.vue';",
      "import './Button.css';",
    ].join('\n');
    const result = resolveFileImports(
      'src/shared/ui/material/components/button/Button.vue',
      `<script setup>${content}</script>`,
      { repoRoot: '/repo', fsApi },
    );

    expect(result).toEqual([
      {
        specifier: '../switch/Switch.vue',
        path: 'src/shared/ui/material/components/switch/Switch.vue',
        exists: true,
      },
      {
        specifier: './Button.css',
        path: 'src/shared/ui/material/components/button/Button.css',
        exists: false,
      },
    ]);
  });
});
