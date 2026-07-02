import { expect, test } from '@playwright/test';
import {
  addDatabaseItem,
  createDatabaseDocument,
  createDirectory,
  createStringProperty,
  createUniqueName,
  launchApp,
  openDirectory,
  openDocumentFromExplorer,
  openOpfs,
} from '../helpers';

const noCriticalSaveError = /error reading|corrupt|lost changes|failed to open|save failed/i;

// Minimum release smoke coverage for first-user and returning-user
// persistence scenarios, run against the production artifact.
// See docs/release.md#release-smoke-coverage.

test('first-time user creates a space and data, and it survives a reload', async ({ page }) => {
  await launchApp(page);
  await expect(page.getByText(/^browser storage$/i)).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('release smoke space'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(page, createUniqueName('release smoke doc'));
  await openDocumentFromExplorer(page, documentName);

  const propertyName = await createStringProperty(page, createUniqueName('release smoke title'));
  const itemValue = createUniqueName('release smoke row');
  await addDatabaseItem(page, propertyName, itemValue);

  await expect(page.getByText(noCriticalSaveError)).toHaveCount(0);

  await page.reload();

  await expect(page.getByText(documentName, { exact: true }).last()).toBeVisible();
  await expect(page.getByText(itemValue, { exact: true })).toBeVisible();
  await expect(page.getByText(noCriticalSaveError)).toHaveCount(0);
});

test('returning user reopens an existing space and sees prior data without duplicates or lost state', async ({
  page,
  context,
}) => {
  // Test setup: create the "existing space" the returning user will reopen.
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('returning user space'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(page, createUniqueName('returning user doc'));
  await openDocumentFromExplorer(page, documentName);

  const propertyName = await createStringProperty(page, createUniqueName('returning user title'));
  const itemValue = createUniqueName('returning user row');
  await addDatabaseItem(page, propertyName, itemValue);

  // Simulate the user closing and reopening the app (same browser storage
  // profile / origin, new page) rather than an in-place reload.
  await page.close();
  const returningPage = await context.newPage();

  await launchApp(returningPage);
  await expect(returningPage.getByText(/^browser storage$/i)).toBeVisible();
  await expect(returningPage.getByRole('dialog')).toHaveCount(0);

  await openOpfs(returningPage);

  // Previous data is visible without repeated onboarding, and reopening
  // did not create duplicate entries or overlay an empty state on top.
  await expect(returningPage.getByText(directoryName, { exact: true })).toBeVisible();
  await expect(returningPage.getByText(directoryName, { exact: true })).toHaveCount(1);

  await openDirectory(returningPage, directoryName);
  await expect(returningPage.getByText(documentName, { exact: true })).toBeVisible();
  await expect(returningPage.getByText(documentName, { exact: true })).toHaveCount(1);

  await openDocumentFromExplorer(returningPage, documentName);
  await expect(returningPage.getByText(itemValue, { exact: true })).toBeVisible();
  await expect(returningPage.getByText(noCriticalSaveError)).toHaveCount(0);
});
