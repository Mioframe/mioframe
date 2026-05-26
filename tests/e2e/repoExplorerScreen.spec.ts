import { expect, type Page, test } from '@playwright/test';
import { createUniqueName, dismissStorageOnboarding, launchApp, openDirectory } from './helpers';

const browserStorageLabel = /^browser storage$/i;

const openBrowserStorage = async (page: Page) => {
  await launchApp(page);
  await dismissStorageOnboarding(page);
  const opfsButton = page.getByText(browserStorageLabel).first();
  await expect(opfsButton).toBeVisible();
  await opfsButton.click();
  await expect(page).toHaveURL(/Browser%20Storage/i);
  await expect(page.getByRole('button', { name: /^add$/i })).toBeVisible();
};

const openAddSheet = async (page: Page) => {
  await page.getByRole('button', { name: /^add$/i }).click();
  const addSheet = page.getByRole('dialog', { name: /^add$/i });
  await expect(addSheet).toBeVisible();
  return addSheet;
};

const createDirectoryFromAddSheet = async (page: Page, name: string) => {
  const addSheet = await openAddSheet(page);
  await expect(addSheet.getByText(/^create directory$/i)).toBeVisible();
  await addSheet.getByText(/^create directory$/i).click();

  const dialog = page.getByRole('dialog', { name: /create a new folder/i });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/folder's name/i).fill(name);
  await dialog.getByRole('button', { name: /^create$/i }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
};

test('repo explorer keeps one primary Add flow and preserves directory creation on a compact viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openBrowserStorage(page);

  const directoryName = createUniqueName('workspace');
  await createDirectoryFromAddSheet(page, directoryName);
  await openDirectory(page, directoryName);

  const currentDirectoryMenu = page.getByRole('button', {
    name: new RegExp(`^options ${directoryName}$`, 'i'),
  });

  await expect(currentDirectoryMenu).toBeVisible();
  await expect(page.getByRole('button', { name: /^home$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^all changes saved$/i })).toHaveCount(0);
  await expect(page.getByText(/^storage status$/i)).toHaveCount(0);

  await currentDirectoryMenu.click();
  await expect(page.getByRole('menuitem', { name: /^create directory$/i })).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /^create document$/i })).toHaveCount(0);
  await expect(page.getByRole('menuitem', { name: /^import json$/i })).toHaveCount(0);
  await page.keyboard.press('Escape');

  const addSheet = await openAddSheet(page);
  await expect(addSheet.getByText(/^create document$/i)).toBeVisible();
  await expect(addSheet.getByText(/^import document$/i)).toBeVisible();
  await expect(addSheet.getByText(/^create directory$/i)).toBeVisible();

  await addSheet.getByText(/^create directory$/i).click();
  await expect(addSheet).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: /create a new folder/i })).toBeVisible();
  await page.getByRole('button', { name: /^cancel$/i }).click();

  await openAddSheet(page);
  await page
    .getByRole('dialog', { name: /^add$/i })
    .getByText(/^create document$/i)
    .click();
  const createDocumentDialog = page.getByRole('dialog', { name: /^create document$/i });
  await expect(createDocumentDialog).toBeVisible();
  await createDocumentDialog.getByRole('button', { name: /^cancel$/i }).click();
});

test('repo explorer breadcrumb remains horizontally scrollable on a compact viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await openBrowserStorage(page);

  const pathNames = [
    createUniqueName('workspace collection'),
    createUniqueName('long nested folder'),
    createUniqueName('deeper mobile folder'),
  ];

  for (const pathName of pathNames) {
    // Each step depends on the previous directory being created and opened first.
    // eslint-disable-next-line no-await-in-loop -- each created directory becomes the next navigation target
    await createDirectoryFromAddSheet(page, pathName);
    // eslint-disable-next-line no-await-in-loop -- each directory must open before the next child is created
    await openDirectory(page, pathName);
  }

  const deepestPathName = pathNames.at(-1);

  if (!deepestPathName) {
    throw new Error('Expected a deepest breadcrumb path name');
  }

  const breadcrumb = page.locator('.md-navigation-path');
  await expect(breadcrumb).toBeVisible();
  await expect(page.getByRole('button', { name: /^home$/i })).toHaveCount(1);
  await expect(page.getByRole('button', { name: deepestPathName, exact: true })).toHaveCount(0);

  const breadcrumbLabels = await breadcrumb
    .getByRole('button')
    .evaluateAll((buttons) => buttons.map((button) => button.textContent.trim()));

  expect(breadcrumbLabels.every((label, index) => index === 0 || label.length > 0)).toBe(true);
  expect(breadcrumbLabels).toContain(pathNames[0]);
  expect(breadcrumbLabels).toContain(pathNames[1]);

  const hasHorizontalOverflow = await breadcrumb.evaluate((element) => {
    return element.scrollWidth > element.clientWidth;
  });

  expect(hasHorizontalOverflow).toBe(true);
  await expect(page.getByText(deepestPathName, { exact: true })).toHaveCount(1);
});
