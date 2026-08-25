/**
 * I/O boundary for the production reverse-dependency graph used by
 * structural E2E affected-owner discovery (see
 * docs/testing/verify-redesign-pass-d-implementation.md's
 * "Dependency-cruiser boundary"). Deliberately separated from the pure
 * traversal logic in `scripts/lib/e2eOwnerTraversal.ts` so resolver unit
 * tests use small explicit graph fixtures and never execute
 * dependency-cruiser. The actual `cruise()` call runs in a dedicated child
 * process (`scripts/lib/e2eGraphCollector.ts`) so this synchronous adapter
 * never has to await a promise, matching the rest of the synchronous verify
 * planner.
 */

import { spawnSync } from 'node:child_process';
import type { ReverseDependencyGraph } from './e2eOwnerTraversal.ts';

const COLLECTOR_SCRIPT = 'scripts/lib/e2eGraphCollector.ts';

/** Result of acquiring the production reverse-dependency graph. */
export type AcquireProductionReverseGraphResult =
  | { ok: true; graph: ReverseDependencyGraph }
  | { ok: false; error: string };

/** Raw process result from running the graph collector child process. */
export interface RunGraphCollectorResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

/** Test-only dependencies for {@link acquireProductionReverseGraph}. */
export interface AcquireProductionReverseGraphDeps {
  runCollector?: () => RunGraphCollectorResult;
}

function defaultRunCollector(): RunGraphCollectorResult {
  const result = spawnSync('node', [COLLECTOR_SCRIPT], {
    cwd: process.cwd(),
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

interface DependencyCruiserDependency {
  module?: string;
  resolved?: string;
  couldNotResolve?: boolean;
}

// Extensions dependency-cruiser resolves as ordinary code modules for
// production reachability purposes. An unresolved dependency whose
// specifier clearly names a non-code asset (e.g. a stray `.css` import) can
// never itself be — or lead further to — a widget/page owner, so it cannot
// hide a real code reachability edge. An unresolved dependency with no
// recognizable extension is ambiguous (most extensionless imports in this
// codebase are code modules) and must still fail acquisition closed.
const CODE_MODULE_EXTENSIONS = new Set(['.ts', '.tsx', '.vue', '.js', '.jsx', '.mjs', '.cjs']);

function isUnresolvedNonCodeAsset(moduleSpecifier: string | undefined): boolean {
  if (!moduleSpecifier) {
    return false;
  }

  const lastSegment = moduleSpecifier.split('/').pop() ?? moduleSpecifier;
  const dotIndex = lastSegment.lastIndexOf('.');

  if (dotIndex <= 0) {
    return false;
  }

  return !CODE_MODULE_EXTENSIONS.has(lastSegment.slice(dotIndex));
}

interface DependencyCruiserModule {
  source: string;
  dependencies: readonly DependencyCruiserDependency[];
}

interface DependencyCruiserOutput {
  modules: readonly DependencyCruiserModule[];
}

/**
 * Acquire the production `src/**` reverse-dependency graph once, via one
 * dependency-cruiser invocation in a dedicated child process. An unresolved
 * dependency that could be a code module (see
 * {@link isUnresolvedNonCodeAsset}) fails the whole acquisition closed: an
 * incomplete graph cannot safely prove any changed path's reachability, and
 * uncertainty must widen E2E rather than silently narrow it (see the
 * contract's "unresolved/dynamic/global dependency that prevents safe owner
 * reachability"). An unresolved non-code asset dependency (e.g. a stray
 * `.css` import) is dropped instead: it can never be, or lead to, a
 * widget/page owner, so it cannot hide a real reachability edge.
 * @param [deps] Test-only dependencies.
 * @returns The reverse-dependency graph, or a fail-closed error.
 */
export function acquireProductionReverseGraph({
  runCollector = defaultRunCollector,
}: AcquireProductionReverseGraphDeps = {}): AcquireProductionReverseGraphResult {
  const { status, stdout, stderr } = runCollector();

  if (status !== 0) {
    return {
      ok: false,
      error: `dependency-cruiser graph acquisition failed (exit ${status ?? 'null'}): ${
        stderr.trim() || stdout.trim() || 'no output'
      }`,
    };
  }

  let parsed: DependencyCruiserOutput;

  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    return {
      ok: false,
      error: `dependency-cruiser graph output could not be parsed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  const graph: Record<string, string[]> = {};

  for (const moduleEntry of parsed.modules) {
    for (const dependency of moduleEntry.dependencies) {
      if (dependency.couldNotResolve || !dependency.resolved) {
        if (isUnresolvedNonCodeAsset(dependency.module)) {
          continue;
        }

        return {
          ok: false,
          error: `dependency-cruiser could not resolve a dependency of ${moduleEntry.source}; the production reverse-dependency graph is untrustworthy`,
        };
      }

      (graph[dependency.resolved] ??= []).push(moduleEntry.source);
    }
  }

  return { ok: true, graph };
}
