import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';
import pluginVitest from '@vitest/eslint-plugin';
import pluginPlaywright from 'eslint-plugin-playwright';
import pluginOxlint from 'eslint-plugin-oxlint';
import skipFormatting from 'eslint-config-prettier/flat';
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import { jsdoc } from 'eslint-plugin-jsdoc';
import tsdoc from 'eslint-plugin-tsdoc';

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
      'vue/component-api-style': ['warn', ['script-setup']],
      'vue/component-name-in-template-casing': [
        'warn',
        'PascalCase',
        { registeredComponentsOnly: true },
      ],
      'vue/custom-event-name-casing': ['warn', 'camelCase'],
      'vue/define-emits-declaration': ['error', 'type-based'],
      'vue/define-macros-order': [
        'warn',
        {
          order: ['defineOptions', 'defineModel', 'defineProps', 'defineEmits', 'defineSlots'],
          defineExposeLast: true,
        },
      ],
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/html-button-has-type': [
        'error',
        {
          button: true,
          submit: true,
          reset: true,
        },
      ],
      'vue/no-import-compiler-macros': 'error',
      'vue/no-literals-in-template': 'warn',
      'vue/no-multiple-objects-in-class': 'warn',
      'vue/no-ref-object-reactivity-loss': 'error',
      'vue/no-root-v-if': 'warn',
      'vue/no-setup-props-reactivity-loss': 'error',
      'vue/no-static-inline-styles': 'warn',
      'vue/no-template-target-blank': [
        'error',
        {
          allowReferrer: false,
          enforceDynamicLinks: 'always',
        },
      ],
      'vue/no-this-in-before-route-enter': 'error',
      'vue/no-undef-components': 'error',
      'vue/no-undef-directives': 'error',
      'vue/no-undef-properties': 'error',
      'vue/no-unused-emit-declarations': 'error',
      'vue/no-unused-properties': 'warn',
      'vue/no-unused-refs': 'warn',
      'vue/no-use-v-else-with-v-for': 'error',
      'vue/no-useless-mustaches': 'warn',
      'vue/no-useless-v-bind': 'warn',
      'vue/no-v-text': 'warn',
      'vue/prefer-single-event-payload': 'error',
      'vue/prefer-use-template-ref': 'error',
      'vue/require-default-prop': 'off',
      'vue/require-explicit-slots': 'error',
      'vue/v-on-handler-style': ['warn', ['method', 'inline-function']],
      '@typescript-eslint/prefer-promise-reject-errors': 'error',
    },
  },

  comments.recommended,
  { rules: { '@eslint-community/eslint-comments/require-description': ['warn', { ignore: [] }] } },

  jsdoc({
    config: 'flat/recommended-typescript',
    rules: {
      'jsdoc/require-jsdoc': [
        'warn',
        {
          publicOnly: {
            esm: true,
            cjs: false,
            window: false,
          },
          enableFixer: false,
          require: {
            FunctionDeclaration: true,
            ClassDeclaration: true,
            ClassExpression: true,
            MethodDefinition: true,
            ArrowFunctionExpression: true,
            FunctionExpression: true,
          },
          contexts: [
            'TSInterfaceDeclaration',
            'TSTypeAliasDeclaration',
            'TSEnumDeclaration',
            'TSMethodSignature',
            'TSPropertySignature',
          ],
        },
      ],
    },
  }),

  {
    files: ['**/*.{ts,vue}'],
    plugins: {
      tsdoc,
    },
    rules: {
      'tsdoc/syntax': 'warn',
    },
  },

  skipFormatting,
);
