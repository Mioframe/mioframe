import { config } from '@vyachean/eslint-config';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const projectNode = resolve(currentDirectory, './tsconfig.node.json');
const projectApp = resolve(currentDirectory, './tsconfig.app.json');

const eslintConfig = [
  ...config({
    tsParserOptions: {
      project: [projectNode, projectApp],
    },
    vue: true,
  }),
];

export default eslintConfig;
