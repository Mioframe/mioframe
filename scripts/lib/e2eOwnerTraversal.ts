/**
 * Pure reverse-dependency-graph traversal for structural E2E affected-owner
 * discovery (see docs/testing/verify-redesign-pass-d-implementation.md's
 * "Reverse-owner traversal"). Consumes a plain reverse-dependency graph
 * object so unit tests can use small explicit fixtures without invoking
 * dependency-cruiser; real graph acquisition lives in
 * `scripts/lib/e2eGraph.ts`.
 */

import { getPageOwnerIdForSourcePath, getWidgetOwnerIdForSourcePath } from './e2eOwner.ts';

/**
 * Reverse-dependency graph: maps a production module path to the module
 * paths that import it directly.
 */
export type ReverseDependencyGraph = Readonly<Record<string, readonly string[]>>;

/**
 * Traverse the reverse-dependency graph upward from one changed production
 * path, recording widget owners and continuing past them, and recording
 * page owners while stopping that branch there.
 * @param startPath Changed production path to traverse from.
 * @param graph Reverse-dependency graph.
 * @returns The set of owner ids reached from `startPath`.
 */
export function traverseOwnersForChangedPath(
  startPath: string,
  graph: ReverseDependencyGraph,
): Set<string> {
  const owners = new Set<string>();
  const visited = new Set<string>([startPath]);
  const queue: string[] = [startPath];

  while (queue.length > 0) {
    const node = queue.shift();

    if (node === undefined) {
      break;
    }

    const pageOwnerId = getPageOwnerIdForSourcePath(node);

    if (pageOwnerId) {
      owners.add(pageOwnerId);
      continue;
    }

    const widgetOwnerId = getWidgetOwnerIdForSourcePath(node);

    if (widgetOwnerId) {
      owners.add(widgetOwnerId);
    }

    for (const dependent of graph[node] ?? []) {
      if (!visited.has(dependent)) {
        visited.add(dependent);
        queue.push(dependent);
      }
    }
  }

  return owners;
}

/**
 * Traverse and union owners reached from every changed production path.
 * @param changedPaths Changed production paths relevant to E2E ownership.
 * @param graph Reverse-dependency graph.
 * @returns Map from each changed path to the owner ids reached from it.
 */
export function traverseOwnersForChangedPaths(
  changedPaths: readonly string[],
  graph: ReverseDependencyGraph,
): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();

  for (const changedPath of changedPaths) {
    result.set(changedPath, traverseOwnersForChangedPath(changedPath, graph));
  }

  return result;
}
