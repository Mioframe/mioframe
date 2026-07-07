import { expect, test } from '@playwright/test';
import {
  closeDocumentPane,
  createDatabaseDocument,
  createDirectory,
  createUniqueName,
  launchApp,
  openDirectory,
  openDocumentFromExplorer,
  openOpfs,
  renameOpenDocument,
} from './helpers';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const savedExportsKey = 'savedJsonExportsForTest';

test('exports the current Browser Storage document as non-empty JSON from the document menu', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const savedExports: string[] = [];
    Reflect.set(globalThis, 'savedJsonExportsForTest', savedExports);
    Reflect.set(globalThis, 'showSaveFilePicker', () =>
      Promise.resolve({
        createWritable: () =>
          Promise.resolve({
            write: async (blob: Blob) => {
              savedExports.push(await blob.text());
            },
            close: () => Promise.resolve(undefined),
            abort: () => Promise.resolve(undefined),
          }),
      }),
    );
  });

  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('records'));
  await openDirectory(page, directoryName);

  const originalDocumentName = await createDatabaseDocument(page, createUniqueName('catalog'));
  await openDocumentFromExplorer(page, originalDocumentName);

  const renamedDocumentName = createUniqueName('exported catalog');
  await renameOpenDocument(page, renamedDocumentName);
  await closeDocumentPane(page);

  await page
    .getByRole('button', {
      name: new RegExp(`^options ${escapeRegex(renamedDocumentName)}$`, 'i'),
    })
    .click();
  await page.getByRole('menuitem', { name: /^export json$/i }).click();

  await expect(
    page.getByText('JSON exported. It can be imported as a new document.', { exact: true }),
  ).toBeVisible();

  const savedExports = await page.evaluate((key) => {
    const savedValue = Reflect.get(globalThis, key);

    if (!Array.isArray(savedValue)) {
      throw new Error('Expected saved exports array');
    }

    return savedValue;
  }, savedExportsKey);

  expect(savedExports).toHaveLength(1);
  expect(savedExports[0]?.length ?? 0).toBeGreaterThan(0);

  const exportedDocument = JSON.parse(savedExports[0] ?? 'null');
  expect(exportedDocument.name).toBe(renamedDocumentName);
  expect(exportedDocument).toHaveProperty('body');
});
