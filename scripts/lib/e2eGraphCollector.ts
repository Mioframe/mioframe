import { cruise } from 'dependency-cruiser';

/**
 * Programmatic dependency-cruiser invocation for the E2E affected-owner
 * graph adapter. Run as its own child process (see
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
      // Without this, dependency-cruiser's resolver ignores npm packages'
      // package.json "exports" maps entirely, so real deep-subpath runtime
      // imports (e.g. `@vueuse/integrations/useIDBKeyval`) and types-only
      // packages that only expose a "types" export condition (e.g.
      // `type-fest`) both come back unresolved even though they resolve
      // correctly for the project's actual TypeScript/bundler resolution.
      enhancedResolveOptions: {
        exportsFields: ['exports'],
        conditionNames: ['import', 'require', 'node', 'types', 'default'],
      },
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
