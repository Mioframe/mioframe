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
  await page.getByText(browserStorageLabel).first().waitFor({ state: 'visible' });
  await expect(page.getByText(browserStorageLabel)).toBeVisible();
};

/**
 * No-op kept for backwards compatibility; the storage onboarding dialog was removed.
 * @param _page - Ignored; storage permission is no longer requested at startup.
 */
export const dismissStorageOnboarding = async (_page: Page) => {
  // Storage permission is no longer requested at startup.
};

export const openOpfs = async (page: Page) => {
  await dismissStorageOnboarding(page);

  const opfsButton = page.getByText(browserStorageLabel).first();
  await expect(opfsButton).toBeVisible();
  await opfsButton.click();

  await expect(page).toHaveURL(/Browser%20Storage/i);
  await expect(page.getByRole('button', { name: /^add$/i })).toBeVisible();
};

export const openEntryAddSheet = async (page: Page) => {
  await page.getByRole('button', { name: /^add$/i }).click();
  const addSheet = page.getByRole('dialog', { name: /^add$/i });
  await expect(addSheet).toBeVisible();
  return addSheet;
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

  const closeButton = sheet.getByRole('button', { name: /close sheet/i });
  const canUseCloseButton = await closeButton
    .waitFor({ state: 'visible', timeout: 300 })
    .then(() => true)
    .catch(() => false);

  if (canUseCloseButton) {
    await closeButton.click();
  } else {
    await page.keyboard.press('Escape');
  }

  const isHidden = await sheet
    .waitFor({ state: 'hidden', timeout: 2000 })
    .then(() => true)
    .catch(() => false);

  if (!isHidden) {
    await page.keyboard.press('Escape');
    await sheet.waitFor({ state: 'hidden', timeout: 2000 });
  }
};

const clickUserCheckboxTarget = async (page: Page, checkbox: Locator) => {
  const checkboxHost = checkbox.locator('xpath=ancestor::label[1]');
  if ((await checkboxHost.count()) === 0) {
    await checkbox.click();
    return;
  }

  const target = checkboxHost.first();
  const targetBox = await target.boundingBox();
  if (!targetBox) {
    throw new Error('Checkbox user target is not visible');
  }

  await page.mouse.click(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
};

export const setUserCheckboxState = async (page: Page, checkbox: Locator, checked: boolean) => {
  if ((await checkbox.isChecked()) !== checked) {
    await clickUserCheckboxTarget(page, checkbox);
  }

  if (checked) {
    await expect(checkbox).toBeChecked();
    return;
  }

  await expect(checkbox).not.toBeChecked();
};

export const checkUserCheckbox = async (page: Page, checkbox: Locator) => {
  await setUserCheckboxState(page, checkbox, true);
};

export const createDirectory = async (page: Page, name = createUniqueName('folder')) => {
  const addSheet = await openEntryAddSheet(page);
  await expect(addSheet.getByText(/^create directory$/i)).toBeVisible();
  await addSheet.getByText(/^create directory$/i).click();

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
  const addSheet = await openEntryAddSheet(page);
  await expect(addSheet.getByText(/^create document$/i)).toBeVisible();
  await addSheet.getByText(/^create document$/i).click();

  const dialog = page.getByRole('dialog', { name: /create document/i });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/^name$/i).fill(name);
  await dialog.getByRole('button', { name: /^create$/i }).click();

  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole('button', {
      name: new RegExp(`^document ${escapeRegex(name)}$`, 'i'),
    }),
  ).toBeVisible();
  return name;
};

export const openDocumentFromExplorer = async (page: Page, name: string) => {
  await page
    .getByRole('button', {
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
  const row = findListRow(sheet, currentName);
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
  const row = findListRow(sheet, name);
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
    await setUserCheckboxState(page, checkbox, value);
    return;
  }

  if (Array.isArray(value)) {
    for (const relationItemValue of value) {
      // Relation rows are rendered inside the item dialog; each selected row has its own checkbox.
      // eslint-disable-next-line no-await-in-loop
      await checkUserCheckbox(
        page,
        findDatabaseRow(dialog, relationItemValue).getByRole('checkbox'),
      );
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

export const findListRow = (root: Page | Locator, value: string | RegExp): Locator =>
  root.getByRole('list').locator(':scope > *').filter({ hasText: value }).first();

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
  const row = findListRow(sheet, currentName);
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
  const row = findListRow(sheet, name);
  await row.click();
  await expect(sheet.getByRole('button', { name })).toHaveAttribute('aria-current', 'true');
  await closeBottomSheet(page, /database views sheet/i);
};

export const removeView = async (page: Page, name: string) => {
  const sheet = await openViewsSheet(page);
  const row = findListRow(sheet, name);
  await row.getByRole('button', { name: /settings view/i }).click();
  await page.getByRole('menuitem', { name: /^remove$/i }).click();

  const dialog = page.getByRole('dialog', { name: /remove view\?/i });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /^remove$/i }).click();
};

// Ranks the given view names by their row's vertical position in the sheet, rather than
// reading row text: rows also render a leading checkbox and a trailing context-menu icon
// as sibling content, and the sheet additionally renders a fixed "default view" row that
// is not part of the reorderable set, so scraping row text would need to filter both out.
export const getViewRowOrder = async (sheet: Locator, viewNames: readonly string[]) => {
  const boxes = await Promise.all(
    viewNames.map(async (name) => ({
      name,
      y: (await findListRow(sheet, name).boundingBox())?.y ?? Number.POSITIVE_INFINITY,
    })),
  );

  return boxes.toSorted((a, b) => a.y - b.y).map(({ name }) => name);
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
  await expect(findListRow(sheet, propertyName)).toBeVisible();
  await closeBottomSheet(page, /database sort sheet/i);
};

export const toggleSortingDirection = async (page: Page, propertyName: string) => {
  const sheet = await openSortSheet(page);
  await findListRow(sheet, propertyName).click();
};

export const removeSorting = async (page: Page, propertyName: string) => {
  const sheet = await openSortSheet(page);
  const row = findListRow(sheet, propertyName);
  await row.getByRole('button', { name: /^remove$/i }).click();
};

export const openFilterSheet = async (page: Page) => {
  const sheet = page.getByRole('dialog', { name: /database filters sheet/i });
  const alreadyVisible = await sheet
    .waitFor({ state: 'visible', timeout: 500 })
    .then(() => true)
    .catch(() => false);
  if (!alreadyVisible) {
    await page.getByRole('button', { name: /^filter$/i }).click();
  }
  await expect(sheet).toBeVisible();
  return sheet;
};

/**
 * Wait until a locator's bounding box stops changing between polls, so the
 * following pointer interaction cannot race an ongoing scroll or transition.
 * @param target - Locator that must settle before the next pointer interaction.
 */
const expectStablePosition = async (target: Locator) => {
  let previousBox = '';

  await expect
    .poll(async () => {
      const box = JSON.stringify(await target.boundingBox());
      const isStable = box === previousBox && box !== 'null';
      previousBox = box;
      return isStable;
    })
    .toBe(true);
};

/**
 * Resolve a menuitem inside the visible menu surface that actually contains
 * it. Menus teleport to a shared overlay container, so a bare
 * `page.getByRole('menu')` could also match a stale, hidden, or unrelated
 * menu surface. Filtering menus by visibility and by the target item pins the
 * interaction to the active menu of the current flow. A nested submenu
 * surface resolves to the same menuitem element as its parent menu, so the
 * result stays strict-mode unambiguous.
 * @param page - Page hosting the teleported menu overlay container.
 * @param itemName - Accessible name of the required menuitem.
 * @returns Locator for the menuitem scoped to its active visible menu.
 */
const findActiveMenuItem = (page: Page, itemName: RegExp) =>
  page
    .getByRole('menu')
    .filter({ visible: true })
    .filter({ has: page.getByRole('menuitem', { name: itemName }) })
    .getByRole('menuitem', { name: itemName });

export const openEqualFilterDialog = async (page: Page, propertyName: string) => {
  const sheet = await openFilterSheet(page);
  const addFilterButton = sheet.getByRole('button', { name: /^and$/i });
  const propertyItem = findActiveMenuItem(page, new RegExp(`^${escapeRegex(propertyName)}$`, 'i'));

  // The bottom sheet positions its content with smooth scrolling and scroll
  // snapping, so on small mobile viewports the add-filter button can still be
  // moving right after the sheet reports visible. A click dispatched during
  // that movement can land beside the button and no menu opens.
  await expect(addFilterButton).toBeVisible();
  await expectStablePosition(addFilterButton);

  // Only re-click when the active menu with the target property item really
  // failed to appear; the add-filter button is in the menu's outside-ignore
  // list, so a repeated click keeps an already-open menu open.
  await expect(async () => {
    if (!(await propertyItem.isVisible())) {
      await addFilterButton.click();
    }
    await expect(propertyItem).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });

  await propertyItem.click();

  // Selecting a property opens its operator submenu as a nested menu surface
  // inside the same active menu, so the same scoped lookup resolves the `=`
  // item without positional guessing.
  const equalOperatorItem = findActiveMenuItem(page, /^(=|equal)$/i);
  await expect(equalOperatorItem).toBeVisible();
  await equalOperatorItem.click();

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
    await setUserCheckboxState(page, checkbox, value);
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
