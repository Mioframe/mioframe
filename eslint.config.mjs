import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';
import pluginVitest from '@vitest/eslint-plugin';
import pluginOxlint from 'eslint-plugin-oxlint';
import skipFormatting from 'eslint-config-prettier/flat';

const cypressGlobals = {
  Cypress: 'readonly',
  after: 'readonly',
  afterEach: 'readonly',
  assert: 'readonly',
  before: 'readonly',
  beforeEach: 'readonly',
  cy: 'readonly',
  describe: 'readonly',
  expect: 'readonly',
  it: 'readonly',
};

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
    files: ['src/**/*.cy.ts', 'cypress/**/*.{ts,tsx}'],
    languageOptions: {
      globals: cypressGlobals,
      parserOptions: {
        project: ['./tsconfig.cypress.json'],
        projectService: false,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-namespace': 'off',
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
