import { expect, type Page, test } from '@playwright/test';
import {
  createUniqueName,
  dismissStorageOnboarding,
  launchApp,
  openDirectory,
  openEntryAddSheet,
  openOpfs,
} from './helpers';

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

test('repo explorer keeps clickable cursors and natural section flow on a wide viewport', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await openBrowserStorage(page);

  const directoryName = createUniqueName('workspace');
  const documentName = createUniqueName('doc');
  await createDirectoryFromAddSheet(page, directoryName);
  const addSheet = await openAddSheet(page);
  await addSheet.getByText(/^create document$/i).click();

  const createDocumentDialog = page.getByRole('dialog', { name: /^create document$/i });
  await expect(createDocumentDialog).toBeVisible();
  await createDocumentDialog.getByLabel(/^name$/i).fill(documentName);
  await createDocumentDialog.getByRole('button', { name: /^create$/i }).click();

  const documentRow = page.getByRole('button', {
    name: new RegExp(`^document ${documentName}$`, 'i'),
  });
  await expect(documentRow).toBeVisible();

  const addFab = page.getByRole('button', { name: /^add$/i });

  await expect(documentRow).toBeVisible();
  await expect(addFab).toHaveCount(1);

  const documentCursor = await documentRow.evaluate(
    (element) => window.getComputedStyle(element).cursor,
  );

  expect(documentCursor).toBe('pointer');

  const documentsTitle = page.getByRole('heading', { level: 2, name: 'Documents' });
  const filesTitle = page.getByRole('heading', { level: 2, name: 'Files' });
  const filesCopy = page.getByText('Regular files and folders. Mioframe service files are hidden.');
  const content = page.locator('.repository-explorer-widget__content');

  await expect(documentsTitle).toBeVisible();
  await expect(filesTitle).toBeVisible();
  await expect(filesCopy).toBeVisible();
  await expect(content).toBeVisible();

  const documentsTitleBox = await documentsTitle.boundingBox();
  const filesTitleBox = await filesTitle.boundingBox();
  const documentRowBox = await documentRow.boundingBox();
  const filesCopyBox = await filesCopy.boundingBox();
  const contentBox = await content.boundingBox();
  const contentScrollHeight = await content.evaluate((element) => element.scrollHeight);

  expect(documentsTitleBox).not.toBeNull();
  expect(filesTitleBox).not.toBeNull();
  expect(documentRowBox).not.toBeNull();
  expect(filesCopyBox).not.toBeNull();
  expect(contentBox).not.toBeNull();

  if (
    documentsTitleBox == null ||
    filesTitleBox == null ||
    documentRowBox == null ||
    filesCopyBox == null ||
    contentBox == null
  ) {
    throw new Error('Missing Repository Explorer layout boxes.');
  }

  const documentsGap = documentRowBox.y - (documentsTitleBox.y + documentsTitleBox.height);
  const filesGap = filesCopyBox.y - (filesTitleBox.y + filesTitleBox.height);

  expect(documentsGap).toBeLessThan(48);
  expect(filesGap).toBeLessThan(64);
  expect(contentBox.height - contentScrollHeight).toBeLessThan(16);

  const fabBox = await addFab.boundingBox();

  expect(fabBox).not.toBeNull();

  if (fabBox == null) {
    throw new Error('Missing Add FAB box.');
  }
  expect(fabBox.height).toBeGreaterThan(0);
});

test('repo explorer clears open context menus and dialogs after navigating home and returning', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openBrowserStorage(page);

  const outerDir = createUniqueName('nav-context-outer');
  const innerDir = createUniqueName('nav-context-inner');

  await createDirectoryFromAddSheet(page, outerDir);
  await openDirectory(page, outerDir);
  await createDirectoryFromAddSheet(page, innerDir);

  const innerOptionsButton = page.getByRole('button', {
    name: new RegExp(`^options ${innerDir}$`, 'i'),
  });
  await expect(innerOptionsButton).toBeVisible();
  await innerOptionsButton.click();

  const renameItem = page.getByRole('menuitem', { name: /^rename$/i });
  await expect(renameItem).toBeVisible();

  await page.getByRole('button', { name: /^home$/i }).click();

  await expect(page).toHaveURL(/home/i);
  await expect(page.getByRole('menuitem', { name: /^rename$/i })).toHaveCount(0);

  await openOpfs(page);
  await openDirectory(page, outerDir);

  await expect(innerOptionsButton).toBeVisible();
  await expect(page.getByRole('menuitem', { name: /^rename$/i })).toHaveCount(0);
});

test('repo explorer clears rename dialog state when navigating to a sibling directory with the same entry name', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openBrowserStorage(page);

  const dirA = createUniqueName('nav-sibling-a');
  const dirB = createUniqueName('nav-sibling-b');
  const sharedEntry = 'shared-entry';

  await createDirectoryFromAddSheet(page, dirA);
  await createDirectoryFromAddSheet(page, dirB);

  await openDirectory(page, dirA);
  const addSheetA = await openEntryAddSheet(page);
  await addSheetA.getByText(/^create directory$/i).click();
  const dialogA = page.getByRole('dialog', { name: /create a new folder/i });
  await dialogA.getByLabel(/folder's name/i).fill(sharedEntry);
  await dialogA.getByRole('button', { name: /^create$/i }).click();
  await expect(page.getByText(sharedEntry, { exact: true })).toBeVisible();

  const optionsButtonInA = page.getByRole('button', {
    name: new RegExp(`^options ${sharedEntry}$`, 'i'),
  });
  await optionsButtonInA.click();
  await page.getByRole('menuitem', { name: /^rename$/i }).click();

  const renameDialog = page.getByRole('dialog', { name: /^rename/i });
  await expect(renameDialog).toBeVisible();
  await renameDialog.getByRole('button', { name: /^cancel$/i }).click();
  await expect(renameDialog).toHaveCount(0);

  await page.getByRole('button', { name: /^home$/i }).click();
  await expect(page).toHaveURL(/home/i);

  await openOpfs(page);
  await openDirectory(page, dirB);
  const addSheetB = await openEntryAddSheet(page);
  await addSheetB.getByText(/^create directory$/i).click();
  const dialogB = page.getByRole('dialog', { name: /create a new folder/i });
  await dialogB.getByLabel(/folder's name/i).fill(sharedEntry);
  await dialogB.getByRole('button', { name: /^create$/i }).click();
  await expect(page.getByText(sharedEntry, { exact: true })).toBeVisible();

  await expect(page.getByRole('dialog', { name: /^rename/i })).toHaveCount(0);
});
