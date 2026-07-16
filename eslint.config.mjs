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
import { localRulesPlugin } from './scripts/lib/noRestrictedDynamicImportsRule.mjs';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

const vueUiCommunicationFiles = [
  'src/**/*.vue',
  'src/shared/ui/**/*.{ts,mts,tsx}',
  'src/{app,pages,widgets,features,entities}/**/use*.{ts,mts,tsx}',
  'src/{app,pages,widgets,features,entities}/**/setup*.{ts,mts,tsx}',
];

export default defineConfigWithVueTs(
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },

  {
    files: ['**/*.{vue,ts,mts,tsx}'],
    name: 'app/files-to-lint',
  },

  {
    plugins: { local: localRulesPlugin },
    name: 'app/local-rules',
  },

  includeIgnoreFile(gitignorePath),

  ...pluginVue.configs['flat/recommended'],
  vueTsConfigs.strictTypeChecked,

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'scripts/**/*.test.mjs'],
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
    files: vueUiCommunicationFiles,
    ignores: ['**/*.test.{ts,mts,tsx}', '**/*.testUtils.{ts,mts,tsx}', '**/*.stories.{ts,mts,tsx}'],
    name: 'app/vue-ui-imperative-dom-communication',
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='dispatchEvent']",
          message:
            'Do not use dispatchEvent for Vue component communication. Use typed emits, props, slots, or provide/inject.',
        },
        {
          selector: 'CallExpression[callee.property.name=/^querySelector(All)?$/]',
          message:
            'Do not use querySelector/querySelectorAll to coordinate Vue components. Use template refs for justified DOM APIs, or props/emits/slots/provide-inject for component communication.',
        },
      ],
    },
  },

  {
    files: ['src/**/*.vue'],
    name: 'app/vue-component-contract-v-bind',
    rules: {
      'vue/no-restricted-v-bind': [
        'error',
        {
          argument: null,
          element: '/^[A-Z]/',
          message:
            'Do not spread broad object prop bags into Vue components. Spell out component props, except for documented transparent forwarding contracts.',
        },
      ],
    },
  },

  {
    files: ['src/**/*.vue'],
    ignores: ['**/*.test.vue', '**/*.stories.vue'],
    name: 'app/vue-no-attrs-forwarding-by-default',
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'vue',
              importNames: ['useAttrs'],
              message:
                'Do not use useAttrs as a default forwarding escape hatch. Use explicit props/emits/slots, or document a transparent host/adaptor contract with a local lint exception.',
            },
          ],
        },
      ],
    },
  },

  {
    files: ['src/shared/ui/material/**/*.{ts,mts,tsx,vue}'],
    name: 'app/material-no-dynamic-product-layer-imports',
    rules: {
      'local/no-restricted-dynamic-imports': [
        'error',
        [
          {
            regex:
              '^(?:@(?:feature|entity|widget|page)/|@/(?:app|pages|widgets|features|entities|processes)(?:/|$))',
            message:
              'The Material library must not import product layers (app, pages, widgets, features, entities, processes) by alias.',
          },
        ],
      ],
    },
  },

  {
    files: ['src/**/*.{ts,mts,tsx,vue}', 'tests/**/*.ts'],
    ignores: ['src/shared/ui/material/**', 'src/shared/lib/**'],
    name: 'app/no-dynamic-deep-material-imports',
    rules: {
      'local/no-restricted-dynamic-imports': [
        'error',
        [
          {
            regex: '^(?:@shared/ui/material/|(?:\\.\\./)+shared/ui/material/)',
            message:
              "Import the Material library's public entry point (@shared/ui/material) instead of a deep internal path.",
          },
        ],
      ],
    },
  },

  {
    files: ['src/shared/lib/**/*.{ts,mts,tsx,vue}'],
    ignores: ['src/shared/lib/md/**'],
    name: 'app/shared-lib-no-dynamic-material-imports',
    rules: {
      'local/no-restricted-dynamic-imports': [
        'error',
        [
          {
            regex: '^(?:@shared/ui/material(?:/|$)|(?:\\.\\./)+shared/ui/material(?:/|$))',
            message:
              'Generic shared/lib infrastructure must not import the Material library or gain component-family ownership.',
          },
        ],
      ],
    },
  },

  {
    files: ['**/*.{ts,mts,tsx,vue}'],
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
      '@typescript-eslint/no-deprecated': 'error',
      'no-await-in-loop': 'warn',
      'vue/camelcase': 'off',
      'vue/component-api-style': ['error', ['script-setup']],
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
      'vue/no-root-v-if': 'error',
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
      'vue/v-on-handler-style': ['error', ['method', 'inline']],
      'vue/no-restricted-syntax': [
        'error',
        {
          selector:
            "VAttribute[directive=true][key.name.name='on'] VExpressionContainer ArrowFunctionExpression",
          message:
            'Do not use anonymous inline arrow handlers in Vue templates. Use a named handler from <script setup>, e.g. @click="onClickItem(item.id)".',
        },
        {
          selector:
            "VAttribute[directive=true][key.name.name='on'] VExpressionContainer FunctionExpression",
          message:
            'Do not use anonymous inline function handlers in Vue templates. Use a named handler from <script setup>.',
        },
        {
          selector:
            "VAttribute[directive=true][key.name.name='on'] VExpressionContainer AssignmentExpression",
          message:
            'Do not mutate state directly inside Vue template event expressions. Move the mutation into a named handler.',
        },
        {
          selector:
            "VAttribute[directive=true][key.name.name='on'] VExpressionContainer UpdateExpression",
          message:
            'Do not mutate state directly inside Vue template event expressions. Move the mutation into a named handler.',
        },
      ],
      '@typescript-eslint/prefer-promise-reject-errors': 'error',
    },
  },

  comments.recommended,
  { rules: { '@eslint-community/eslint-comments/require-description': ['warn', { ignore: [] }] } },

  jsdoc({
    config: 'flat/recommended-typescript',
    rules: {
      'jsdoc/check-param-names': [
        'warn',
        {
          checkDestructured: false,
        },
      ],
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
      'jsdoc/require-param': [
        'warn',
        {
          checkDestructured: false,
          checkDestructuredRoots: true,
        },
      ],
    },
  }),

  {
    files: ['**/*.{ts,mts,tsx,vue}'],
    plugins: {
      tsdoc,
    },
    rules: {
      'tsdoc/syntax': 'warn',
      'jsdoc/require-throws-type': 'off', // TSDoc syntax does not support JSDoc typed @throws tags.
    },
  },

  skipFormatting,
);
