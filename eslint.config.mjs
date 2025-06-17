import { defineConfig } from 'eslint/config';
import { config } from '@vyachean/eslint-config';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const eslintConfig = defineConfig([
  ...config({
    tsParserOptions: {
      projectService: true,
      tsconfigRootDir: currentDirectory,
    },
    vue: true,
  }),
  {
    rules: {
      'no-console': 'warn',
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],
      'vue/camelcase': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
    },
  },
  {
    files: ['**/*.story.vue'],
    rules: {
      'vue/no-undef-components': [
        'error',
        {
          ignorePatterns: ['Story', 'Variant', 'Hst*'],
        },
      ],
    },
  },
]);

export default eslintConfig;
