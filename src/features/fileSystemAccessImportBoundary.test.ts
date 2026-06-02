import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const featureRoot = join(process.cwd(), 'src/features');

const collectFeatureFiles = async (directoryPath: string): Promise<string[]> => {
  const entries = await readdir(directoryPath, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const nextPath = join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        return collectFeatureFiles(nextPath);
      }

      if ((nextPath.endsWith('.ts') || nextPath.endsWith('.vue')) && !nextPath.includes('.test.')) {
        return [nextPath];
      }

      return [];
    }),
  );

  return files.flat();
};

describe('feature file-system recovery boundaries', () => {
  it('keeps provider-specific browser file-system imports out of features', async () => {
    const files = await collectFeatureFiles(featureRoot);
    const fileChecks = await Promise.all(
      files.map(async (filePath) => ({
        filePath,
        source: await readFile(filePath, 'utf8'),
      })),
    );
    const violations = fileChecks
      .filter(({ source }) => source.includes('@shared/lib/webFileSystemProvider'))
      .map(({ filePath }) => filePath.replace(`${process.cwd()}/`, ''));

    expect(violations).toEqual([]);
  });
});
