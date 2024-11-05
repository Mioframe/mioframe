import { config } from '@vyachean/eslint-config';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const eslintConfig = [
  ...config({
    tsParserOptions: {
      projectService: true,
      tsconfigRootDir: currentDirectory,
    },
    vue: true,
  }),
  {
    rules: {
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],
    },
  },
];

export default eslintConfig;
