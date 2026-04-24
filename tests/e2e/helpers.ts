import { expect, type Locator, type Page } from '@playwright/test';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const browserStorageLabel = /^browser storage$/i;

export const createUniqueName = (prefix: string) =>
  `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const launchApp = async (page: Page) => {
  await page.goto('/');
  await Promise.race([
    page.getByRole('button', { name: /^ok$/i }).first().waitFor({ state: 'visible' }),
    page.getByText(browserStorageLabel).first().waitFor({ state: 'visible' }),
  ]).catch(() => undefined);
  await expect(page.getByText(browserStorageLabel)).toBeVisible();
};

export const dismissStorageOnboarding = async (page: Page) => {
  for (let step = 0; step < 6; step += 1) {
    const onboardingDialog = page
      .getByRole('dialog')
      .filter({ hasText: /temporary|stored files|deletion|protect/i })
      .first();
    // The onboarding can only advance one dialog at a time after the previous click settles.
    // eslint-disable-next-line no-await-in-loop
    const isVisible = await onboardingDialog
      .waitFor({ state: 'visible', timeout: step === 0 ? 1500 : 300 })
      .then(() => true)
      .catch(() => false);
    if (!isVisible) {
      return;
    }

    const okButton = onboardingDialog.getByRole('button', { name: /^ok$/i });
    // Each confirmation reveals the next onboarding step, so this click must remain sequential.
    // eslint-disable-next-line no-await-in-loop
    await okButton.click();
  }
};

export const openOpfs = async (page: Page) => {
  await dismissStorageOnboarding(page);

  const opfsButton = page.getByText(browserStorageLabel).first();
  await expect(opfsButton).toBeVisible();
  await opfsButton.click();

  await expect(page).toHaveURL(/Browser%20Storage/i);
  await expect(page.getByRole('button', { name: /create directory/i })).toBeVisible();
};

export const closeBottomSheet = async (page: Page, label: string | RegExp) => {
  const sheet = page.getByRole('dialog', { name: label });
  const isVisible = await sheet
    .waitFor({ state: 'visible', timeout: 500 })
    .then(() => true)
    .catch(() => false);
  if (!isVisible) {
    return;
  }
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
};

export const createDirectory = async (page: Page, name = createUniqueName('folder')) => {
  await page.getByRole('button', { name: /create directory/i }).click();

  const dialog = page.getByRole('dialog', { name: /create a new folder/i });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/folder's name/i).fill(name);
  await dialog.getByRole('button', { name: /^create$/i }).click();

  await expect(page.getByText(name, { exact: true })).toBeVisible();
  return name;
};

export const openDirectory = async (page: Page, name: string) => {
  await page.getByText(name, { exact: true }).click();
  await expect(page).toHaveURL(new RegExp(escapeRegex(encodeURIComponent(name))));
};

export const renameExplorerEntry = async (page: Page, currentName: string, nextName: string) => {
  await page
    .getByRole('button', { name: new RegExp(`^options ${escapeRegex(currentName)}$`, 'i') })
    .click();
  await page.getByRole('menuitem', { name: /^rename$/i }).click();

  const dialog = page.getByRole('dialog', { name: /^rename/i });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/^name$/i).fill(nextName);
  await dialog.getByRole('button', { name: /^rename$/i }).click();

  await expect(page.getByText(nextName, { exact: true })).toBeVisible();
};

export const removeExplorerEntry = async (page: Page, name: string) => {
  await page
    .getByRole('button', { name: new RegExp(`^options ${escapeRegex(name)}$`, 'i') })
    .click();
  await page.getByRole('menuitem', { name: /^remove$/i }).click();

  const dialog = page.getByRole('dialog', {
    name: new RegExp(`remove "${escapeRegex(name)}"`, 'i'),
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /^remove$/i }).click();

  await expect(page.getByText(name, { exact: true })).toHaveCount(0);
};

export const createDatabaseDocument = async (
  page: Page,
  name = createUniqueName('database document'),
) => {
  await page.getByRole('button', { name: /create document/i }).click();

  const dialog = page.getByRole('dialog', { name: /create document/i });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/^name$/i).fill(name);
  await dialog.getByRole('button', { name: /^create$/i }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  return name;
};

export const openDocumentFromExplorer = async (page: Page, name: string) => {
  await page.getByText(name, { exact: true }).click();
  await expect(page.getByRole('button', { name: /rename document/i })).toBeVisible();
};

export const closeDocumentPane = async (page: Page) => {
  await page
    .getByRole('button', { name: /^back$/i })
    .last()
    .click();
  await expect(page.getByRole('button', { name: /rename document/i })).toHaveCount(0);
};

export const renameOpenDocument = async (page: Page, nextName: string) => {
  await page.getByRole('button', { name: /rename document/i }).click();

  const dialog = page.getByRole('dialog', { name: /rename ".*" document/i });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/^name$/i).fill(nextName);
  await dialog.getByRole('button', { name: /^rename$/i }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: /rename document/i })).toBeVisible();
};

export const openPropertiesSheet = async (page: Page) => {
  await page.getByRole('button', { name: /configure properties/i }).click();
  const sheet = page.getByRole('dialog', { name: /database properties sheet/i });
  await expect(sheet).toBeVisible();
  return sheet;
};

export const createStringProperty = async (
  page: Page,
  name = createUniqueName('string property'),
) => {
  const sheet = await openPropertiesSheet(page);
  await sheet.getByRole('button', { name: /add property/i }).click();

  const dialog = page.getByRole('dialog', { name: /create property/i });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/^name$/i).fill(name);
  await dialog.getByRole('button', { name: /^create$/i }).click();

  await expect(dialog).toHaveCount(0);
  await closeBottomSheet(page, /database properties sheet/i);
  await expect(
    page.getByRole('columnheader', { name: new RegExp(`^${escapeRegex(name)}$`, 'i') }),
  ).toBeVisible();
  return name;
};

export const renameProperty = async (page: Page, currentName: string, nextName: string) => {
  const sheet = await openPropertiesSheet(page);
  const row = sheet.getByRole('listitem').filter({ hasText: currentName }).first();
  await row
    .getByRole('button', { name: new RegExp(`^options ${escapeRegex(currentName)}$`, 'i') })
    .click();
  await page.getByRole('menuitem', { name: /^edit$/i }).click();

  const dialog = page.getByRole('dialog', { name: /edit property/i });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/^name$/i).fill(nextName);
  await dialog.getByRole('button', { name: /^edit$/i }).click();

  await expect(dialog).toHaveCount(0);
  await closeBottomSheet(page, /database properties sheet/i);
  await expect(
    page.getByRole('columnheader', { name: new RegExp(`^${escapeRegex(nextName)}$`, 'i') }),
  ).toBeVisible();
};

export const removeProperty = async (page: Page, name: string) => {
  const sheet = await openPropertiesSheet(page);
  const row = sheet.getByRole('listitem').filter({ hasText: name }).first();
  await row
    .getByRole('button', { name: new RegExp(`^options ${escapeRegex(name)}$`, 'i') })
    .click();
  await page.getByRole('menuitem', { name: /^remove$/i }).click();

  const dialog = page.getByRole('dialog', { name: /remove property\?/i });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /^remove$/i }).click();

  await expect(dialog).toHaveCount(0);
  await closeBottomSheet(page, /database properties sheet/i);
  await expect(
    page.getByRole('columnheader', { name: new RegExp(`^${escapeRegex(name)}$`, 'i') }),
  ).toHaveCount(0);
};

export const addDatabaseItem = async (page: Page, propertyName: string, value: string) => {
  await page.getByRole('button', { name: /add item/i }).click();

  const dialog = page.getByRole('dialog', { name: /add item/i });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(new RegExp(`^${escapeRegex(propertyName)}$`, 'i')).fill(value);
  await dialog.getByRole('button', { name: /^add$/i }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.getByText(value, { exact: true })).toBeVisible();
};

export const findDatabaseRow = (page: Page, value: string): Locator =>
  page.locator('tbody[role="list"] > tr').filter({ hasText: value }).first();

export const editDatabaseItem = async (
  page: Page,
  previousValue: string,
  propertyName: string,
  nextValue: string,
) => {
  const row = findDatabaseRow(page, previousValue);
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: /^options$/i }).click();
  await page.getByRole('menuitem', { name: /^edit$/i }).click();

  const dialog = page.getByRole('dialog', { name: /edit item/i });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(new RegExp(`^${escapeRegex(propertyName)}$`, 'i')).fill(nextValue);
  await dialog.getByRole('button', { name: /^edit$/i }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page.getByText(nextValue, { exact: true })).toBeVisible();
};

export const removeDatabaseItem = async (page: Page, value: string) => {
  const row = findDatabaseRow(page, value);
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: /^options$/i }).click();
  await page.getByRole('menuitem', { name: /^remove$/i }).click();

  await expect(page.getByText(value, { exact: true })).toHaveCount(0);
};

export const openViewsSheet = async (page: Page) => {
  await page.getByRole('button', { name: /view settings/i }).click();
  const sheet = page.getByRole('dialog', { name: /database views sheet/i });
  await expect(sheet).toBeVisible();
  return sheet;
};

export const addView = async (page: Page, name = createUniqueName('view')) => {
  const sheet = await openViewsSheet(page);
  await sheet.getByRole('button', { name: /add view/i }).click();

  const dialog = page.getByRole('dialog', { name: /add view/i });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/^name$/i).fill(name);
  await dialog.getByRole('button', { name: /^create$/i }).click();

  await expect(dialog).toHaveCount(0);
  await closeBottomSheet(page, /database views sheet/i);
  return name;
};

export const renameView = async (page: Page, currentName: string, nextName: string) => {
  const sheet = await openViewsSheet(page);
  const row = sheet.getByRole('listitem').filter({ hasText: currentName }).first();
  await row.getByRole('button', { name: /settings view/i }).click();
  await page.getByRole('menuitem', { name: /^rename$/i }).click();

  const dialog = page.getByRole('dialog', { name: /rename data view/i });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/^name$/i).fill(nextName);
  await dialog.getByRole('button', { name: /^rename$/i }).click();

  await expect(dialog).toHaveCount(0);
  await closeBottomSheet(page, /database views sheet/i);
};

export const selectView = async (page: Page, name: string | RegExp) => {
  const sheet = await openViewsSheet(page);
  const target =
    name instanceof RegExp ? sheet.getByText(name).first() : sheet.getByText(name, { exact: true });
  await target.click();
  await closeBottomSheet(page, /database views sheet/i);
};

export const removeView = async (page: Page, name: string) => {
  const sheet = await openViewsSheet(page);
  const row = sheet.getByRole('listitem').filter({ hasText: name }).first();
  await row.getByRole('button', { name: /settings view/i }).click();
  await page.getByRole('menuitem', { name: /^remove$/i }).click();

  const dialog = page.getByRole('dialog', { name: /remove view\?/i });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /^remove$/i }).click();
};

export const openSortSheet = async (page: Page) => {
  const sheet = page.getByRole('dialog', { name: /database sort sheet/i });
  const alreadyVisible = await sheet.isVisible().catch(() => false);
  if (!alreadyVisible) {
    await page.getByRole('button', { name: /^sort$/i }).click();
  }
  await expect(sheet).toBeVisible();
  return sheet;
};

export const addSorting = async (page: Page, propertyName: string) => {
  const sheet = await openSortSheet(page);
  await sheet.getByRole('button', { name: /add sorting/i }).click();
  await page
    .getByRole('menuitem', { name: new RegExp(`^${escapeRegex(propertyName)}$`, 'i') })
    .click();
  await expect(sheet.getByRole('listitem').filter({ hasText: propertyName }).first()).toBeVisible();
  await closeBottomSheet(page, /database sort sheet/i);
};

export const toggleSortingDirection = async (page: Page, propertyName: string) => {
  const sheet = await openSortSheet(page);
  await sheet.getByRole('listitem').filter({ hasText: propertyName }).first().click();
};

export const removeSorting = async (page: Page, propertyName: string) => {
  const sheet = await openSortSheet(page);
  const row = sheet.getByRole('listitem').filter({ hasText: propertyName }).first();
  await row.getByRole('button', { name: /^remove$/i }).click();
};

export const openFilterSheet = async (page: Page) => {
  await page.getByRole('button', { name: /^filter$/i }).click();
  const sheet = page.getByRole('dialog', { name: /database filters sheet/i });
  await expect(sheet).toBeVisible();
  return sheet;
};

export const addEqualFilter = async (page: Page, propertyName: string, value: string) => {
  const sheet = await openFilterSheet(page);
  await sheet.getByRole('button', { name: /^and$/i }).click();
  const propertyMenu = page.getByRole('menu').last();
  await propertyMenu
    .getByRole('menuitem', { name: new RegExp(`^${escapeRegex(propertyName)}$`, 'i') })
    .click();

  const operatorMenu = page.getByRole('menu').last();
  await operatorMenu.getByRole('menuitem', { name: /^equal$/i }).click();

  const dialog = page.getByRole('dialog', { name: /filter settings/i });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(new RegExp(`^${escapeRegex(propertyName)}$`, 'i')).fill(value);
  await dialog.getByRole('button', { name: /^apply$/i }).click();

  await expect(dialog).toHaveCount(0);
};

export const removeFirstFilter = async (page: Page) => {
  const sheet = await openFilterSheet(page);
  await sheet
    .getByRole('button', { name: /remove object/i })
    .first()
    .click();
};

export const getDatabaseRowTexts = async (page: Page) => {
  const rows = page.locator('tbody[role="list"] > tr');
  const rowCount = await rows.count();
  const values = await Promise.all(
    Array.from({ length: rowCount }, async (_, index) => rows.nth(index).innerText()),
  );

  return values.map((value) => value.trim());
};

export const expectDatabaseValuesInOrder = async (page: Page, values: string[]) => {
  const rowTexts = await getDatabaseRowTexts(page);
  const joined = rowTexts.join(' | ');

  let searchStartIndex = 0;
  for (const value of values) {
    const nextIndex = joined.indexOf(value, searchStartIndex);
    expect(nextIndex, `expected "${value}" in row text order: ${joined}`).toBeGreaterThanOrEqual(0);
    searchStartIndex = nextIndex + value.length;
  }
};
