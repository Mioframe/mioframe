import { cruise } from 'dependency-cruiser';

/**
 * Programmatic dependency-cruiser invocation for the E2E affected-owner
 * graph adapter (see docs/testing/verify-redesign-pass-d-implementation.md's
 * "Dependency-cruiser boundary"). Run as its own child process (see
 * `scripts/lib/e2eGraph.ts`) so the synchronous verify planner never awaits a
 * promise directly; this keeps dependency-cruiser's own async programmatic
 * API isolated to exactly one concrete adapter, acquired once per relevant
 * planning invocation, with no persisted/cached graph and no
 * `.dependency-cruiser` rules file.
 */

// Colocated test/story/behavior/visual/browser-integration/performance
// specs and helpers live under src/**, but ownership discovery is a
// production-only import graph.
const NON_PRODUCTION_PATH_PATTERN = '\\.(test|spec|stories|testUtils)\\.(ts|tsx|vue|mjs|js|jsx)$';

async function main() {
  const result = await cruise(
    ['src'],
    {
      outputType: 'json',
      tsConfig: { fileName: 'tsconfig.src.json' },
      exclude: { path: NON_PRODUCTION_PATH_PATTERN },
      doNotFollow: { path: 'node_modules' },
      combinedDependencies: false,
      progress: { type: 'none' },
      validate: false,
    },
    {},
  );

  const output = typeof result.output === 'string' ? JSON.parse(result.output) : result.output;
  process.stdout.write(JSON.stringify(output));
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  process.exitCode = 1;
}
