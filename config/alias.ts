import type { AliasOptions } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export const getResolveAlias = (): AliasOptions => ({
  '@': fileURLToPath(new URL('../src', import.meta.url)),
  '@shared': fileURLToPath(new URL('../src/shared', import.meta.url)),
  '@feature': fileURLToPath(new URL('../src/features', import.meta.url)),
  '@entity': fileURLToPath(new URL('../src/entities', import.meta.url)),
  '@widget': fileURLToPath(new URL('../src/widgets', import.meta.url)),
  '@page': fileURLToPath(new URL('../src/pages', import.meta.url)),
});
