import { describe, expect, it } from 'vitest';

import { acquireProductionReverseGraph } from './e2eGraph.ts';

function stdoutOf(output: unknown) {
  return () => ({ status: 0, stdout: JSON.stringify(output), stderr: '' });
}

describe('acquireProductionReverseGraph', () => {
  it('builds a reverse-dependency graph from dependency-cruiser module output', () => {
    const result = acquireProductionReverseGraph({
      runCollector: stdoutOf({
        modules: [
          {
            source: 'src/widgets/DocumentView/DocumentView.vue',
            dependencies: [
              { resolved: 'src/entities/databaseData/index.ts', couldNotResolve: false },
            ],
          },
          {
            source: 'src/pages/DocumentViewPane/index.ts',
            dependencies: [
              { resolved: 'src/widgets/DocumentView/DocumentView.vue', couldNotResolve: false },
            ],
          },
        ],
      }),
    });

    expect(result).toEqual({
      ok: true,
      graph: {
        'src/entities/databaseData/index.ts': ['src/widgets/DocumentView/DocumentView.vue'],
        'src/widgets/DocumentView/DocumentView.vue': ['src/pages/DocumentViewPane/index.ts'],
      },
    });
  });

  it('fails closed when the collector process exits non-zero', () => {
    const result = acquireProductionReverseGraph({
      runCollector: () => ({ status: 1, stdout: '', stderr: 'boom' }),
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/graph acquisition failed/);
  });

  it('fails closed on unparseable collector output', () => {
    const result = acquireProductionReverseGraph({
      runCollector: () => ({ status: 0, stdout: 'not json', stderr: '' }),
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/could not be parsed/);
  });

  it('fails closed on any unresolved dependency', () => {
    const result = acquireProductionReverseGraph({
      runCollector: stdoutOf({
        modules: [
          {
            source: 'src/widgets/DocumentView/DocumentView.vue',
            dependencies: [{ resolved: undefined, couldNotResolve: true }],
          },
        ],
      }),
    });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/could not resolve/);
  });
});
