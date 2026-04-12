import { expect, test } from '@playwright/test';
import { createDirectory, createUniqueName, openOpfs, removeEntry, renameEntry } from './helpers';

test('creates, renames, and removes a directory through the explorer UI', async ({ page }) => {
  await page.goto('/');
  await openOpfs(page);

  const originalName = await createDirectory(page, createUniqueName('folder'));
  const renamedName = createUniqueName('renamed folder');

  await renameEntry(page, originalName, renamedName);
  await expect(page.getByText(originalName, { exact: true })).toHaveCount(0);

  await removeEntry(page, renamedName);
});
