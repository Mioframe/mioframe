import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const srcRoot = join(process.cwd(), 'src');

const collectProductionFiles = async (directoryPath: string): Promise<string[]> => {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const nextPath = join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        return collectProductionFiles(nextPath);
      }

      if ((nextPath.endsWith('.ts') || nextPath.endsWith('.vue')) && !nextPath.includes('.test.')) {
        return [nextPath];
      }

      return [];
    }),
  );

  return files.flat();
};

describe('read recovery import boundaries', () => {
  it('keeps removed read recovery layers out of production imports', async () => {
    const files = await collectProductionFiles(srcRoot);
    const fileChecks = await Promise.all(
      files.map(async (filePath) => ({
        filePath,
        source: await readFile(filePath, 'utf8'),
      })),
    );
    const violations = fileChecks
      .filter(
        ({ source }) =>
          source.includes('@entity/deviceDirectoryAccess') ||
          source.includes('@feature/deviceDirectoryAccessRecovery'),
      )
      .map(({ filePath }) => filePath.replace(`${process.cwd()}/`, ''));

    expect(violations).toEqual([]);
  });
});
