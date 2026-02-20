import { defineConfig } from 'eslint/config';
import { config, createGlobFileList } from '@vyachean/eslint-config';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import compat from 'eslint-plugin-compat';
import { includeIgnoreFile } from '@eslint/compat';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

const eslintConfig = defineConfig([
  includeIgnoreFile(gitignorePath, 'Imported .gitignore patterns'),
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
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'never',
        },
      ],
    },
  },
  compat.configs['flat/recommended'],
]);

export default eslintConfig;
