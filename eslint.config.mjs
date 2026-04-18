import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';
import pluginVitest from '@vitest/eslint-plugin';
import pluginPlaywright from 'eslint-plugin-playwright';
import pluginOxlint from 'eslint-plugin-oxlint';
import skipFormatting from 'eslint-config-prettier/flat';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfigWithVueTs(
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
  },

  {
    files: ['**/*.{vue,ts,mts,tsx}'],
    name: 'app/files-to-lint',
  },

  includeIgnoreFile(gitignorePath),

  ...pluginVue.configs['flat/recommended'],
  vueTsConfigs.strictTypeChecked,

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*', 'src/**/*.test.ts'],
    rules: {
      'vitest/expect-expect': 'off',
    },
  },

  ...pluginOxlint.buildFromOxlintConfigFile('.oxlintrc.json'),

  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['tests/e2e/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json'],
        projectService: false,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'playwright/no-conditional-in-test': 'off',
    },
  },

  {
    files: ['**/*.{ts,vue}'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'never',
        },
      ],
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],
      'no-await-in-loop': 'warn',
      'vue/camelcase': 'off',
      'vue/require-default-prop': 'off',
      '@typescript-eslint/prefer-promise-reject-errors': 'error',
    },
  },

  skipFormatting,
);
