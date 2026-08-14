import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

// Reused across cases: constructing the type-aware project service is the
// slow part, and only needs to happen once for this file's assertions.
const eslint = new ESLint({ cwd: import.meta.dirname });

const lint = async (code: string, filePath: string) => {
  const [result] = await eslint.lintText(code, { filePath });
  return result;
};

// The first call pays the cost of building the type-aware TS project
// service; later calls reuse it and are fast.
const typeAwareLintTimeout = 120_000;

const ruleIds = (result: ESLint.LintResult) => result.messages.map((message) => message.ruleId);

const m3eImportSource = "import { M3eButtonElement } from '@m3e/web/button';\n";
const m3eRootImportSource = "import '@m3e/web';\n";
const m3eTemplate =
  '<script setup lang="ts"></script>\n<template>\n  <m3e-button></m3e-button>\n</template>\n';
const selectedM3eElementTemplate = (tag: string) =>
  `<script setup lang="ts"></script>\n<template>\n  <!-- eslint-disable-next-line vue/no-undef-components -- ${tag} is selected by config/vueCustomElements.ts. -->\n  <${tag}></${tag}>\n</template>\n`;
const m3eElementTemplate = (tag: string) =>
  `<script setup lang="ts"></script>\n<template>\n  <${tag}></${tag}>\n</template>\n`;
const useAttrsTemplate =
  '<script setup lang="ts">\nimport { useAttrs } from \'vue\';\nuseAttrs();\n</script>\n<template>\n  <div />\n</template>\n';
const inlineArrowHandlerTemplate =
  '<script setup lang="ts"></script>\n<template>\n  <button type="button" @click="() => {}" />\n</template>\n';
const legacyPrivateVerifierDocumentationSource = `
/**
 * @param [value] Internal verifier value.
 */
export function useVerifierValue(value?: string): void {
  void value;
}

export interface InternalVerifierPlan {
  label: string;
}
`;

// Representative existing repository paths, one on each side of the
// src/shared/ui/material boundary, so type-aware linting has a real
// TS project to resolve without adding fixture files for this test.
const outsideMaterialTsFile = 'src/shared/lib/objectEntries.ts';
const outsideMaterialConfigFile = 'config/vueCustomElements.ts';
const insideMaterialTsFile = 'src/shared/ui/material/index.ts';
const outsideMaterialVueFile = 'src/shared/ui/Dialog/DialogForm.vue';
const insideMaterialVueFile = 'src/shared/ui/material/components/button/MDButton.vue';

describe('eslint.config.mjs m3e renderer boundary', () => {
  it(
    'rejects a @m3e/web import from repository configuration',
    async () => {
      const result = await lint(m3eImportSource, outsideMaterialConfigFile);

      expect(ruleIds(result)).toContain('no-restricted-imports');
    },
    typeAwareLintTimeout,
  );

  it(
    'rejects a @m3e/web subpath import outside Material',
    async () => {
      const result = await lint(m3eImportSource, outsideMaterialTsFile);

      expect(ruleIds(result)).toContain('no-restricted-imports');
    },
    typeAwareLintTimeout,
  );

  it(
    'rejects the @m3e/web package root import outside Material',
    async () => {
      const result = await lint(m3eRootImportSource, outsideMaterialTsFile);

      expect(ruleIds(result)).toContain('no-restricted-imports');
    },
    typeAwareLintTimeout,
  );

  it(
    'rejects a raw <m3e-button> element outside Material',
    async () => {
      const result = await lint(m3eTemplate, outsideMaterialVueFile);

      expect(ruleIds(result)).toContain('vue/no-restricted-syntax');
    },
    typeAwareLintTimeout,
  );

  it(
    'allows the same @m3e/web import inside Material',
    async () => {
      const result = await lint(m3eImportSource, insideMaterialTsFile);

      expect(ruleIds(result)).not.toContain('no-restricted-imports');
    },
    typeAwareLintTimeout,
  );

  it(
    'allows the same raw <m3e-button> element inside Material',
    async () => {
      const result = await lint(m3eTemplate, insideMaterialVueFile);

      expect(ruleIds(result)).not.toContain('vue/no-restricted-syntax');
    },
    typeAwareLintTimeout,
  );

  it.each(['m3e-button', 'm3e-checkbox', 'm3e-loading-indicator', 'm3e-switch'])(
    'accepts the selected <%s> renderer element in Material',
    async (tag) => {
      const result = await lint(selectedM3eElementTemplate(tag), insideMaterialVueFile);

      expect(ruleIds(result)).not.toContain('vue/no-undef-components');
    },
    typeAwareLintTimeout,
  );

  it.each([
    'm3e-buton',
    'm3e-icon-button',
    'm3e-button-extra',
    'x-m3e-button',
    'M3eButton',
    'M3eLoadingIndicator',
    'm3e-arbitrary-element',
  ])(
    'rejects the unselected <%s> renderer element in Material',
    async (tag) => {
      const result = await lint(m3eElementTemplate(tag), insideMaterialVueFile);

      expect(ruleIds(result)).toContain('vue/no-undef-components');
    },
    typeAwareLintTimeout,
  );

  it(
    'still rejects useAttrs in its existing documented scope',
    async () => {
      const result = await lint(useAttrsTemplate, outsideMaterialVueFile);

      expect(ruleIds(result)).toContain('no-restricted-imports');
    },
    typeAwareLintTimeout,
  );

  it(
    'still rejects an anonymous inline arrow handler in a Vue template',
    async () => {
      const result = await lint(inlineArrowHandlerTemplate, outsideMaterialVueFile);

      expect(ruleIds(result)).toContain('vue/no-restricted-syntax');
    },
    typeAwareLintTimeout,
  );
});

describe('eslint.config.mjs private verifier implementation documentation', () => {
  it(
    'keeps TypeScript-only documentation rules off private verifier implementation declarations',
    async () => {
      const result = await lint(
        legacyPrivateVerifierDocumentationSource,
        'scripts/lib/commandWeight.ts',
      );

      expect(ruleIds(result)).not.toContain('jsdoc/require-jsdoc');
      expect(ruleIds(result)).not.toContain('tsdoc/syntax');
    },
    typeAwareLintTimeout,
  );

  it(
    'keeps TypeScript-only documentation rules enabled outside private verifier implementation',
    async () => {
      const result = await lint(
        legacyPrivateVerifierDocumentationSource,
        outsideMaterialConfigFile,
      );

      expect(ruleIds(result)).toContain('jsdoc/require-jsdoc');
      expect(ruleIds(result)).toContain('tsdoc/syntax');
    },
    typeAwareLintTimeout,
  );
});
