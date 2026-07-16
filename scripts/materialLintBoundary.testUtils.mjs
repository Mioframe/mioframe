import realEslintFlatConfig from '../eslint.config.mjs';

// Vitest's module loader does not give `eslint.config.mjs` a real `file:`
// `import.meta.url` (it needs one to resolve `.gitignore`), so this reads
// the actual configured `no-restricted-syntax` dynamic-import rule values
// through a plain Node process instead of an in-process import.
const DYNAMIC_IMPORT_BLOCK_NAMES = [
  'app/material-no-dynamic-product-layer-imports',
  'app/no-dynamic-deep-material-imports',
  'app/shared-lib-no-dynamic-material-imports',
];

const rules = {};

for (const name of DYNAMIC_IMPORT_BLOCK_NAMES) {
  const block = realEslintFlatConfig.find(
    (item) => item !== null && typeof item === 'object' && item.name === name,
  );

  if (!block) {
    console.error(`eslint.config.mjs is missing the "${name}" flat-config block.`);
    process.exit(1);
  }

  rules[name] = block.rules['no-restricted-syntax'];
}

process.stdout.write(JSON.stringify(rules));
