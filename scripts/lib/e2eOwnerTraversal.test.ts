import { describe, expect, it } from 'vitest';

import {
  traverseOwnersForChangedPath,
  traverseOwnersForChangedPaths,
  type ReverseDependencyGraph,
} from './e2eOwnerTraversal.ts';

describe('traverseOwnersForChangedPath', () => {
  it('records a widget owner and continues traversal upward to a page owner', () => {
    const graph: ReverseDependencyGraph = {
      'src/entities/databaseData/index.ts': ['src/widgets/DocumentView/DocumentView.vue'],
      'src/widgets/DocumentView/DocumentView.vue': ['src/pages/DocumentViewPane/index.ts'],
    };

    const owners = traverseOwnersForChangedPath('src/entities/databaseData/index.ts', graph);

    expect([...owners].sort()).toEqual(['page/DocumentViewPane', 'widget/DocumentView']);
  });

  it('stops a branch at a page owner without traversing further upward', () => {
    const graph: ReverseDependencyGraph = {
      'src/pages/Settings/Settings.vue': ['src/pages/routes.ts'],
    };

    const owners = traverseOwnersForChangedPath('src/pages/Settings/Settings.vue', graph);

    expect([...owners]).toEqual(['page/Settings']);
  });

  it('applies the owner immediately when the changed file itself is inside a widget/page', () => {
    const graph: ReverseDependencyGraph = {};

    expect([...traverseOwnersForChangedPath('src/widgets/DocumentView/index.ts', graph)]).toEqual([
      'widget/DocumentView',
    ]);
    expect([...traverseOwnersForChangedPath('src/pages/Help/Help.vue', graph)]).toEqual([
      'page/Help',
    ]);
  });

  it('unions multiple widget and page owners reached from one shared change', () => {
    const graph: ReverseDependencyGraph = {
      'src/entities/repository/index.ts': [
        'src/widgets/RepositoryExplorerWidget/index.ts',
        'src/widgets/DocumentView/DocumentView.vue',
      ],
      'src/widgets/RepositoryExplorerWidget/index.ts': ['src/pages/RepoExplorer/index.ts'],
      'src/widgets/DocumentView/DocumentView.vue': ['src/pages/DocumentViewPane/index.ts'],
    };

    const owners = traverseOwnersForChangedPath('src/entities/repository/index.ts', graph);

    expect([...owners].sort()).toEqual([
      'page/DocumentViewPane',
      'page/RepoExplorer',
      'widget/DocumentView',
      'widget/RepositoryExplorerWidget',
    ]);
  });

  it('returns no owners for a change with no reachable owner (dead end)', () => {
    const graph: ReverseDependencyGraph = {
      'src/shared/lib/example.ts': [],
    };

    expect([...traverseOwnersForChangedPath('src/shared/lib/example.ts', graph)]).toEqual([]);
  });

  it('does not loop forever on a cyclic graph', () => {
    const graph: ReverseDependencyGraph = {
      'src/entities/a/index.ts': ['src/entities/b/index.ts'],
      'src/entities/b/index.ts': ['src/entities/a/index.ts', 'src/widgets/DocumentView/index.ts'],
    };

    const owners = traverseOwnersForChangedPath('src/entities/a/index.ts', graph);

    expect([...owners]).toEqual(['widget/DocumentView']);
  });
});

describe('traverseOwnersForChangedPaths', () => {
  it('unions owners across multiple changed source paths', () => {
    const graph: ReverseDependencyGraph = {
      'src/entities/repository/index.ts': ['src/pages/RepoExplorer/index.ts'],
    };

    const result = traverseOwnersForChangedPaths(
      ['src/entities/repository/index.ts', 'src/widgets/DocumentView/index.ts'],
      graph,
    );

    expect([...(result.get('src/entities/repository/index.ts') ?? [])]).toEqual([
      'page/RepoExplorer',
    ]);
    expect([...(result.get('src/widgets/DocumentView/index.ts') ?? [])]).toEqual([
      'widget/DocumentView',
    ]);
  });
});
