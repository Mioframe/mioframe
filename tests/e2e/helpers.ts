import { expect, type Locator, type Page } from '@playwright/test';
import toolingConfig from '../../config/tooling.json' with { type: 'json' };

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const browserStorageLabel = /^browser storage$/i;
const previewHost = toolingConfig.localServer.host;
const defaultPreviewPort = String(toolingConfig.appPreview.port);

type DatabasePropertyType = 'string' | 'number' | 'boolean' | 'date' | 'relation';
type DatabaseItemFieldValue = string | number | boolean | string[];
type RecordEntries<R extends Record<PropertyKey, unknown>> = [keyof R, R[keyof R]][];

const recordEntries = <R extends Record<PropertyKey, unknown>>(value: R): RecordEntries<R> =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- typed Object.entries wrapper for e2e fixture maps
  Object.entries(value) as RecordEntries<R>;

export const createUniqueName = (prefix: string) =>
  `${prefix} ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getBaseURL = () => {
  const externalBaseURL = process.env.PLAYWRIGHT_EXTERNAL_BASE_URL;
  if (externalBaseURL) {
    return externalBaseURL;
  }

  // Playwright populates this env var from `webServer.wait.stdout` named captures.
  const previewPort = process.env.PLAYWRIGHT_PREVIEW_PORT ?? defaultPreviewPort;
  return `https://${previewHost}:${previewPort}`;
};

export const launchApp = async (page: Page) => {
  await page.goto(getBaseURL());
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
  await expect(
    page.getByRole('listitem', {
      name: new RegExp(`^document ${escapeRegex(name)}$`, 'i'),
    }),
  ).toBeVisible();
  return name;
};

export const openDocumentFromExplorer = async (page: Page, name: string) => {
  await page
    .getByRole('listitem', {
      name: new RegExp(`^document ${escapeRegex(name)}$`, 'i'),
    })
    .click();
  await expect(page.getByRole('button', { name: /rename document/i })).toBeVisible();
};

export const closeDocumentPane = async (page: Page) => {
  await page
    .getByRole('button', { name: /^back$/i })
    .last()
    .click();
  await expect(page.getByRole('button', { name: /rename document/i })).toHaveCount(0);
};

export const expectNoDocumentsInExplorer = async (page: Page) => {
  await expect(page.getByText('Untitled Document', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('listitem', { name: /^document /i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^options unknown document$/i })).toHaveCount(0);
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
  return createDatabaseProperty(page, { name, type: 'string' });
};

export const createDatabaseProperty = async (
  page: Page,
  {
    name,
    relatedDocumentName,
    type,
  }: {
    name: string;
    type: DatabasePropertyType;
    relatedDocumentName?: string | undefined;
  },
) => {
  const sheet = await openPropertiesSheet(page);
  await sheet.getByRole('button', { name: /add property/i }).click();

  const dialog = page.getByRole('dialog', { name: /create property/i });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/^name$/i).fill(name);

  if (type !== 'string') {
    await dialog.getByRole('combobox', { name: /property type/i }).click();
    await page.getByRole('option', { name: new RegExp(`^${type}$`, 'i') }).click();
  }

  if (type === 'relation') {
    if (!relatedDocumentName) {
      throw new Error('relatedDocumentName is required to create a relation property');
    }

    const relationDocumentField = dialog.getByRole('combobox', { name: /database document/i });
    await relationDocumentField.click();
    await page
      .getByRole('option', { name: new RegExp(`^${escapeRegex(relatedDocumentName)}$`, 'i') })
      .click();
  }

  await dialog.getByRole('button', { name: /^create$/i }).click();

  await expect(dialog).toHaveCount(0);
  await closeBottomSheet(page, /database properties sheet/i);
  await expect(
    page.getByRole('columnheader', { name: new RegExp(`^${escapeRegex(name)}$`, 'i') }),
  ).toBeVisible();
  return name;
};

export const createRelationProperty = async (
  page: Page,
  relatedDocumentName: string,
  name = createUniqueName('relation property'),
) => {
  return createDatabaseProperty(page, { name, relatedDocumentName, type: 'relation' });
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
  await addDatabaseItemValues(page, { [propertyName]: value });
  await expect(page.getByText(value, { exact: true })).toBeVisible();
};

const updateDatabaseItemDialogField = async (
  page: Page,
  dialog: Locator,
  propertyName: string,
  value: DatabaseItemFieldValue,
) => {
  const label = new RegExp(`^${escapeRegex(propertyName)}$`, 'i');

  if (typeof value === 'boolean') {
    const checkbox = dialog.getByLabel(label);
    if ((await checkbox.isChecked()) !== value) {
      await checkbox.click();
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const relationItemValue of value) {
      // Relation rows are rendered inside the item dialog; each selected row has its own checkbox.
      // eslint-disable-next-line no-await-in-loop
      await findDatabaseRow(dialog, relationItemValue).getByRole('checkbox').click();
    }
    return;
  }

  await dialog.getByText(propertyName, { exact: true }).click();

  const field = (
    typeof value === 'number'
      ? dialog.getByRole('spinbutton', { name: label })
      : dialog.getByRole('textbox', { name: label })
  ).first();
  await expect(field).toBeFocused();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.insertText(String(value));
};

export const addDatabaseItemValues = async (
  page: Page,
  values: Record<string, DatabaseItemFieldValue>,
) => {
  await page.getByRole('button', { name: /add item/i }).click();

  const dialog = page.getByRole('dialog', { name: /add item/i });
  await expect(dialog).toBeVisible();
  for (const [propertyName, value] of recordEntries(values)) {
    // Dialog fields can reveal async relation data, so keep updates sequential.
    // eslint-disable-next-line no-await-in-loop
    await updateDatabaseItemDialogField(page, dialog, propertyName, value);
  }
  await dialog.getByRole('button', { name: /^add$/i }).click();

  await expect(dialog).toHaveCount(0);
};

export const findDatabaseRow = (root: Page | Locator, value: string): Locator =>
  root.locator('tbody[role="list"] > tr').filter({ hasText: value }).first();

export const editDatabaseItem = async (
  page: Page,
  previousValue: string,
  propertyName: string,
  nextValue: string,
) => {
  await editDatabaseItemValues(page, previousValue, { [propertyName]: nextValue });
  await expect(page.getByText(nextValue, { exact: true })).toBeVisible();
};

export const editDatabaseItemValues = async (
  page: Page,
  previousValue: string,
  values: Record<string, DatabaseItemFieldValue>,
) => {
  const row = findDatabaseRow(page, previousValue);
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: /^options$/i }).click();
  await page.getByRole('menuitem', { name: /^edit$/i }).click();

  const dialog = page.getByRole('dialog', { name: /edit item/i });
  await expect(dialog).toBeVisible();
  for (const [propertyName, value] of recordEntries(values)) {
    // Dialog fields can reveal async relation data, so keep updates sequential.
    // eslint-disable-next-line no-await-in-loop
    await updateDatabaseItemDialogField(page, dialog, propertyName, value);
  }
  await dialog.getByRole('button', { name: /^edit$/i }).click();

  await expect(dialog).toHaveCount(0);
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
  const row =
    name instanceof RegExp
      ? sheet.getByRole('listitem').filter({ hasText: name }).first()
      : sheet.getByRole('listitem').filter({ hasText: name }).first();
  await row.click();
  await expect(row.getByRole('checkbox')).toBeChecked();
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
  const sheet = page.getByRole('dialog', { name: /database filters sheet/i });
  const alreadyVisible = await sheet.isVisible().catch(() => false);
  if (!alreadyVisible) {
    await page.getByRole('button', { name: /^filter$/i }).click();
  }
  await expect(sheet).toBeVisible();
  return sheet;
};

export const openEqualFilterDialog = async (page: Page, propertyName: string) => {
  const sheet = await openFilterSheet(page);
  await sheet.getByRole('button', { name: /^and$/i }).click();
  const propertyMenu = page.getByRole('menu').last();
  await propertyMenu
    .getByRole('menuitem', { name: new RegExp(`^${escapeRegex(propertyName)}$`, 'i') })
    .click();

  const operatorMenu = page.getByRole('menu').last();
  await operatorMenu.getByRole('menuitem', { name: /^(=|equal)$/i }).click();

  const dialog = page.getByRole('dialog', { name: /filter settings/i });
  await expect(dialog).toBeVisible();
  return dialog;
};

export const addEqualFilter = async (page: Page, propertyName: string, value: string) => {
  const dialog = await openEqualFilterDialog(page, propertyName);
  await dialog.getByLabel(new RegExp(`^${escapeRegex(propertyName)}$`, 'i')).fill(value);
  await dialog.getByRole('button', { name: /^apply$/i }).click();

  await expect(dialog).toHaveCount(0);
};

export const setInlineDatabaseValue = async (
  page: Page,
  rowValue: string,
  propertyName: string,
  value: string | number | boolean,
) => {
  const row = findDatabaseRow(page, rowValue);
  await expect(row).toBeVisible();

  if (typeof value === 'boolean') {
    const checkbox = row
      .getByRole('checkbox', {
        name: new RegExp(`^${escapeRegex(propertyName)}$`, 'i'),
      })
      .first();
    const isChecked = (await checkbox.getAttribute('aria-checked')) === 'true';
    if (isChecked !== value) {
      await checkbox.click();
    }
    return;
  }

  await row
    .getByRole('button', { name: new RegExp(`^${escapeRegex(propertyName)}$`, 'i') })
    .click();
  const field =
    typeof value === 'number'
      ? page.getByRole('spinbutton', { name: new RegExp(`^${escapeRegex(propertyName)}$`, 'i') })
      : page.getByRole('textbox', { name: new RegExp(`^${escapeRegex(propertyName)}$`, 'i') });
  await expect(field).toBeVisible();
  await field.fill(String(value));
  await field.press('Enter');
  await expect(field).toHaveCount(0);
};

export const removeFirstFilter = async (page: Page) => {
  const sheet = await openFilterSheet(page);
  await sheet
    .getByRole('button', { name: /remove object/i })
    .first()
    .click();
};

export const getDatabaseRowTexts = async (root: Page | Locator) => {
  const rows = root.locator('tbody[role="list"] > tr');
  const rowCount = await rows.count();
  return Promise.all(
    Array.from({ length: rowCount }, async (_, index) =>
      (await rows.nth(index).innerText()).trim(),
    ),
  );
};

export const expectDatabaseValuesInOrder = async (root: Page | Locator, values: string[]) => {
  const rowTexts = await getDatabaseRowTexts(root);
  const joined = rowTexts.join(' | ');

  let searchStartIndex = 0;
  for (const value of values) {
    const nextIndex = joined.indexOf(value, searchStartIndex);
    expect(nextIndex, `expected "${value}" in row text order: ${joined}`).toBeGreaterThanOrEqual(0);
    searchStartIndex = nextIndex + value.length;
  }
};
