import { globalIgnores } from 'eslint/config';
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

export default defineConfigWithVueTs(
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },

  {
    files: ['**/*.{vue,ts,mts,tsx}'],
    name: 'app/files-to-lint',
  },

  globalIgnores([
    '**/dist/**',
    '**/dist-ssr/**',
    '**/coverage/**',
    '**/.tmp/**',
    '**/node_modules/**',
    'src/temp/**',
    '/tmp/beaver-vue-ref/**',
  ]),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

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
      'vue/camelcase': 'off',
    },
  },

  skipFormatting,
);
