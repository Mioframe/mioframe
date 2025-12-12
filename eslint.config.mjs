import { defineConfig } from 'eslint/config';
import { config, createGlobFileList } from '@vyachean/eslint-config';
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
    files: createGlobFileList({ ts: true, vue: true }),
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'warn',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],
      'vue/camelcase': 'off',
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
    },
  },
]);

export default eslintConfig;
