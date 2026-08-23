import { Buffer } from 'node:buffer';
import { expect, type Page, test } from '@playwright/test';
import {
  addDatabaseItem,
  addDatabaseItemValues,
  addEqualFilter,
  addSorting,
  addView,
  checkUserCheckbox,
  closeBottomSheet,
  closeDocumentPane,
  createDatabaseProperty,
  createRelationProperty,
  createDatabaseDocument,
  createDirectory,
  createStringProperty,
  createUniqueName,
  dismissStorageOnboarding,
  expectDatabaseValuesInOrder,
  findDatabaseRow,
  findListRow,
  launchApp,
  openDirectory,
  openDocumentFromExplorer,
  openEntryAddSheet,
  openEqualFilterDialog,
  openFilterSheet,
  openOpfs,
  openSortSheet,
  openViewsSheet,
  removeSorting,
  renameView,
  selectView,
  toggleSortingDirection,
} from './helpers';

type DatabaseVirtualizationFixture = {
  document: Record<string, unknown>;
  firstLabel: string;
  labelPropertyName: string;
  lastLabel: string;
  lastPropertyName: string;
  widePropertyName: string;
};

const createDatabaseVirtualizationFixture = ({
  name,
  rowCount,
  columnCount,
  shortRowCount = 20,
}: {
  name: string;
  rowCount: number;
  columnCount: number;
  shortRowCount?: number;
}): DatabaseVirtualizationFixture => {
  if (columnCount < 2) {
    throw new Error('Database virtualization fixtures need filter and label properties');
  }

  // The service exposes map keys in canonical lexical order. Zero padding makes the imported
  // fixture's explicit IDs represent the intended production property order instead of relying
  // on JavaScript insertion order.
  const propertyIds = Array.from(
    { length: columnCount },
    (_, index) => `propertyId_${String(index + 1).padStart(3, '0')}`,
  );
  const [filterPropertyId, labelPropertyId] = propertyIds;

  if (!filterPropertyId || !labelPropertyId) {
    throw new Error('Expected filter and label property IDs');
  }

  const properties: Record<string, { name: string; type: 'string' }> = {};
  const widePropertyName = 'ProgressiveWidthProbeXXXXXXXXXXXXXXXXXXXXXXXX';
  const propertyNames = Array.from({ length: columnCount }, (_, index) => {
    const propertyId = propertyIds[index];

    if (!propertyId) {
      throw new Error(`Missing property ID at ${index}`);
    }

    const propertyName =
      index === 0
        ? 'Filter'
        : index === 1
          ? 'Label'
          : index === 2
            ? widePropertyName
            : `Column ${index + 1}`;
    properties[propertyId] = { name: propertyName, type: 'string' };
    return propertyName;
  });

  const data: Record<string, Record<string, string>> = {};
  const firstLabel = 'short row 1';
  const lastLabel = 'full sentinel row';

  for (let index = 0; index < rowCount; index += 1) {
    const isShort = index < shortRowCount;
    data[`itemId_${String(index + 1).padStart(6, '0')}`] = {
      [filterPropertyId]: isShort ? 'short' : 'full',
      [labelPropertyId]:
        index === 0 ? firstLabel : index === rowCount - 1 ? lastLabel : `row ${index + 1}`,
    };
  }

  return {
    document: {
      name,
      type: 'database',
      version: 1,
      body: {
        version: 3,
        data,
        properties,
        views: {
          viewId_full: {
            layout: 'table',
            name: 'Full view',
            order: 0,
          },
          viewId_short: {
            layout: 'table',
            name: 'Short view',
            order: 1,
            filter: {
              [filterPropertyId]: { $eq: 'short' },
            },
          },
        },
      },
    },
    firstLabel,
    labelPropertyName: propertyNames[1] ?? 'Label',
    lastLabel,
    lastPropertyName: propertyNames.at(-1) ?? 'Column',
    widePropertyName,
  };
};

const stubDatabaseJsonImport = async (page: Page, document: Record<string, unknown>) => {
  const encodedDocument = Buffer.from(JSON.stringify(document), 'utf8').toString('base64');

  await page.addInitScript((base64Document: string) => {
    const bytes = Uint8Array.from(atob(base64Document), (character) => character.charCodeAt(0));
    const file = new File([bytes], 'database-virtualization.json', {
      type: 'application/json',
    });

    Reflect.set(globalThis, 'showOpenFilePicker', () =>
      Promise.resolve([{ getFile: () => Promise.resolve(file) }]),
    );
  }, encodedDocument);
};

const importDatabaseJsonDocument = async (page: Page, documentName: string) => {
  const addSheet = await openEntryAddSheet(page);
  await addSheet.getByText(/^import document$/i).click();
  await expect(
    page.getByRole('button', {
      name: new RegExp(`^document ${documentName}$`, 'i'),
    }),
  ).toBeVisible();
  await openDocumentFromExplorer(page, documentName);
};

test('creates, renames, selects, and removes views through the view settings sheet', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('view lab'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(page, createUniqueName('view catalog'));
  await openDocumentFromExplorer(page, documentName);

  const propertyName = await createStringProperty(page, createUniqueName('title'));
  const alphaValue = createUniqueName('alpha');
  const betaValue = createUniqueName('beta');

  await addDatabaseItem(page, propertyName, alphaValue);
  await addDatabaseItem(page, propertyName, betaValue);

  const initialViewSheet = await openViewsSheet(page);
  await expect(initialViewSheet.getByRole('button', { name: /default view/i })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await closeBottomSheet(page, /database views sheet/i);

  const secondViewName = await addView(page, createUniqueName('secondary view'));
  const renamedViewName = createUniqueName('focused view');
  await renameView(page, secondViewName, renamedViewName);
  await selectView(page, renamedViewName);
  const selectedViewSheet = await openViewsSheet(page);
  await expect(selectedViewSheet.getByRole('button', { name: renamedViewName })).toHaveAttribute(
    'aria-current',
    'true',
  );

  const selectedViewRow = findListRow(selectedViewSheet, renamedViewName);
  await selectedViewRow.getByRole('button', { name: /settings view/i }).click();
  await page.getByRole('menuitem', { name: /^remove$/i }).click();

  const removeDialog = page.getByRole('dialog', { name: /remove view\?/i });
  await expect(removeDialog).toBeVisible();
  await removeDialog.getByRole('button', { name: /^remove$/i }).click();
  await expect(removeDialog).toHaveCount(0);

  await expect(selectedViewSheet.getByRole('button', { name: /default view/i })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await closeBottomSheet(page, /database views sheet/i);

  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, documentName);
  const reopenedViewSheet = await openViewsSheet(page);
  await expect(reopenedViewSheet.getByRole('button', { name: /default view/i })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await closeBottomSheet(page, /database views sheet/i);
});

test('adds sorting, toggles direction, and removes sorting controls', async ({ page }) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('sorting lab'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(page, createUniqueName('sorting catalog'));
  await openDocumentFromExplorer(page, documentName);

  const propertyName = await createStringProperty(page, createUniqueName('title'));
  const bravoValue = createUniqueName('bravo');
  const alphaValue = createUniqueName('alpha');
  const charlieValue = createUniqueName('charlie');

  await addDatabaseItem(page, propertyName, bravoValue);
  await addDatabaseItem(page, propertyName, alphaValue);
  await addDatabaseItem(page, propertyName, charlieValue);

  await addSorting(page, propertyName);
  await expect
    .poll(() => expectDatabaseValuesInOrder(page, [alphaValue, bravoValue, charlieValue]))
    .toBeUndefined();

  await toggleSortingDirection(page, propertyName);
  await closeBottomSheet(page, /database sort sheet/i);
  await expect
    .poll(() => expectDatabaseValuesInOrder(page, [charlieValue, bravoValue, alphaValue]), {
      message: 'expected row order to reverse after toggling sort direction',
    })
    .toBeUndefined();

  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, documentName);
  const reopenedSortSheet = await openSortSheet(page);
  await expect(
    reopenedSortSheet.getByRole('button', { name: new RegExp(propertyName, 'i') }),
  ).toBeVisible();
  await closeBottomSheet(page, /database sort sheet/i);

  await removeSorting(page, propertyName);
  await closeBottomSheet(page, /database sort sheet/i);
  await expect(page.getByRole('dialog', { name: /database sort sheet/i })).toHaveCount(0);

  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, documentName);
  const reopenedSortSheetAfterRemoval = await openSortSheet(page);
  await expect(
    reopenedSortSheetAfterRemoval.getByRole('button', { name: new RegExp(propertyName, 'i') }),
  ).toHaveCount(0);
});

test('applies string, boolean, and relation filters and persists them after reload', async ({
  page,
}) => {
  test.slow();

  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('filter persistence lab'));
  await openDirectory(page, directoryName);

  const sourceDocumentName = await createDatabaseDocument(
    page,
    createUniqueName('filtered source'),
  );
  const targetDocumentName = await createDatabaseDocument(
    page,
    createUniqueName('filtered target'),
  );

  await openDocumentFromExplorer(page, targetDocumentName);
  const targetPropertyName = await createStringProperty(page, createUniqueName('target title'));
  const targetAlphaValue = createUniqueName('target alpha');
  const targetBetaValue = createUniqueName('target beta');
  await addDatabaseItem(page, targetPropertyName, targetAlphaValue);
  await addDatabaseItem(page, targetPropertyName, targetBetaValue);

  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, sourceDocumentName);
  const titlePropertyName = await createStringProperty(page, createUniqueName('source title'));
  const categoryPropertyName = await createStringProperty(page, createUniqueName('category'));
  const booleanPropertyName = await createDatabaseProperty(page, {
    name: createUniqueName('ready'),
    type: 'boolean',
  });
  const relationPropertyName = await createRelationProperty(page, targetDocumentName);

  const categoryValue = createUniqueName('release');
  const expectedValue = createUniqueName('expected row');
  const stringMismatchValue = createUniqueName('string mismatch');
  const booleanMismatchValue = createUniqueName('boolean mismatch');
  const relationMismatchValue = createUniqueName('relation mismatch');

  await addDatabaseItemValues(page, {
    [titlePropertyName]: expectedValue,
    [categoryPropertyName]: categoryValue,
    [booleanPropertyName]: true,
    [relationPropertyName]: [targetAlphaValue],
  });
  await addDatabaseItemValues(page, {
    [titlePropertyName]: stringMismatchValue,
    [categoryPropertyName]: createUniqueName('backlog'),
    [booleanPropertyName]: true,
    [relationPropertyName]: [targetAlphaValue],
  });
  await addDatabaseItemValues(page, {
    [titlePropertyName]: booleanMismatchValue,
    [categoryPropertyName]: categoryValue,
    [booleanPropertyName]: false,
    [relationPropertyName]: [targetAlphaValue],
  });
  await addDatabaseItemValues(page, {
    [titlePropertyName]: relationMismatchValue,
    [categoryPropertyName]: categoryValue,
    [booleanPropertyName]: true,
    [relationPropertyName]: [targetBetaValue],
  });

  await addEqualFilter(page, categoryPropertyName, categoryValue);
  await expect(findDatabaseRow(page, expectedValue)).toBeVisible();
  await expect(findDatabaseRow(page, stringMismatchValue)).toHaveCount(0);
  await expect(findDatabaseRow(page, booleanMismatchValue)).toBeVisible();
  await expect(findDatabaseRow(page, relationMismatchValue)).toBeVisible();

  const booleanDialog = await openEqualFilterDialog(page, booleanPropertyName);
  await checkUserCheckbox(
    page,
    booleanDialog.getByRole('checkbox', { name: new RegExp(`^${booleanPropertyName}$`, 'i') }),
  );
  await booleanDialog.getByRole('button', { name: /^apply$/i }).click();
  await expect(booleanDialog).toHaveCount(0);
  await expect(findDatabaseRow(page, expectedValue)).toBeVisible();
  await expect(findDatabaseRow(page, booleanMismatchValue)).toHaveCount(0);
  await expect(findDatabaseRow(page, relationMismatchValue)).toBeVisible();

  const relationDialog = await openEqualFilterDialog(page, relationPropertyName);
  await checkUserCheckbox(
    page,
    findDatabaseRow(relationDialog, targetAlphaValue).getByRole('checkbox'),
  );
  await relationDialog.getByRole('button', { name: /^apply$/i }).click();
  await expect(relationDialog).toHaveCount(0);

  await expect(findDatabaseRow(page, expectedValue)).toBeVisible();
  await expect(findDatabaseRow(page, stringMismatchValue)).toHaveCount(0);
  await expect(findDatabaseRow(page, booleanMismatchValue)).toHaveCount(0);
  await expect(findDatabaseRow(page, relationMismatchValue)).toHaveCount(0);

  await page.reload();
  await dismissStorageOnboarding(page);
  await expect(page.getByRole('button', { name: /rename document/i })).toBeVisible();

  await expect(findDatabaseRow(page, expectedValue)).toBeVisible();
  await expect(findDatabaseRow(page, stringMismatchValue)).toHaveCount(0);
  await expect(findDatabaseRow(page, booleanMismatchValue)).toHaveCount(0);
  await expect(findDatabaseRow(page, relationMismatchValue)).toHaveCount(0);

  const filtersSheet = await openFilterSheet(page);
  await expect(
    filtersSheet.getByRole('button', { name: new RegExp(`^${categoryPropertyName}$`, 'i') }),
  ).toBeVisible();
  await expect(
    filtersSheet.getByRole('button', { name: new RegExp(`^${booleanPropertyName}$`, 'i') }),
  ).toBeVisible();
  await expect(
    filtersSheet.getByRole('button', { name: new RegExp(`^${relationPropertyName}$`, 'i') }),
  ).toBeVisible();
  await expect(filtersSheet.getByText(categoryValue, { exact: true })).toBeVisible();
  await expect(filtersSheet.getByText(targetAlphaValue, { exact: true })).toBeVisible();
});

test('uses default relation view inline and switches to a selected relation view', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('relation inline view lab'));
  await openDirectory(page, directoryName);

  const sourceDocumentName = await createDatabaseDocument(page, createUniqueName('inline source'));
  const targetDocumentName = await createDatabaseDocument(page, createUniqueName('inline target'));

  await openDocumentFromExplorer(page, targetDocumentName);
  const targetPropertyName = await createStringProperty(page, createUniqueName('target title'));
  const alphaValue = createUniqueName('alpha target');
  const betaValue = createUniqueName('beta target');
  await addDatabaseItem(page, targetPropertyName, alphaValue);
  await addDatabaseItem(page, targetPropertyName, betaValue);
  await addSorting(page, targetPropertyName);

  const descendingViewName = await addView(page, createUniqueName('descending targets'));
  await selectView(page, descendingViewName);
  await addSorting(page, targetPropertyName);
  await toggleSortingDirection(page, targetPropertyName);
  await closeBottomSheet(page, /database sort sheet/i);

  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, sourceDocumentName);
  const sourcePropertyName = await createStringProperty(page, createUniqueName('source title'));
  const sourceItemValue = createUniqueName('source row');
  await addDatabaseItem(page, sourcePropertyName, sourceItemValue);
  const relationPropertyName = await createRelationProperty(page, targetDocumentName);

  const sourceRow = findDatabaseRow(page, sourceItemValue);
  await sourceRow
    .getByRole('button', { name: new RegExp(`^${relationPropertyName}$`, 'i') })
    .click();
  const relationField = page.getByRole('group', {
    name: new RegExp(`^${relationPropertyName}$`, 'i'),
  });

  await expect(relationField.getByRole('button', { name: /^default view$/i })).toHaveClass(
    /md-chip_selected/,
  );
  await expect
    .poll(() => expectDatabaseValuesInOrder(relationField, [alphaValue, betaValue]))
    .toBeUndefined();

  await relationField
    .getByRole('button', { name: new RegExp(`^${descendingViewName}$`, 'i') })
    .click();
  await expect(
    relationField.getByRole('button', { name: new RegExp(`^${descendingViewName}$`, 'i') }),
  ).toHaveClass(/md-chip_selected/);
  await expect
    .poll(() => expectDatabaseValuesInOrder(relationField, [betaValue, alphaValue]))
    .toBeUndefined();
});

test('uses the default related view in filter settings and persists an explicit relation view override', async ({
  page,
}) => {
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('relation filter lab'));
  await openDirectory(page, directoryName);

  const sourceDocumentName = await createDatabaseDocument(
    page,
    createUniqueName('source database'),
  );
  const targetDocumentName = await createDatabaseDocument(
    page,
    createUniqueName('target database'),
  );

  await openDocumentFromExplorer(page, targetDocumentName);
  const targetPropertyName = await createStringProperty(page, createUniqueName('target title'));
  const targetItemValue = createUniqueName('filter row');
  await addDatabaseItem(page, targetPropertyName, targetItemValue);
  const secondViewName = await addView(page, createUniqueName('filterable linked items'));

  await closeDocumentPane(page);
  await openDocumentFromExplorer(page, sourceDocumentName);
  await createStringProperty(page, createUniqueName('source title'));
  const relationPropertyName = await createRelationProperty(page, targetDocumentName);

  const dialog = await openEqualFilterDialog(page, relationPropertyName);
  await expect(dialog.getByText(targetItemValue, { exact: true })).toBeVisible();

  await dialog.getByRole('button', { name: new RegExp(`^${secondViewName}$`, 'i') }).click();
  await expect(
    dialog.getByRole('button', { name: new RegExp(`^${secondViewName}$`, 'i') }),
  ).toHaveClass(/md-chip_selected/);

  await dialog.getByRole('button', { name: /^cancel$/i }).click();
  await expect(dialog).toHaveCount(0);
  await closeBottomSheet(page, /database filters sheet/i);

  const reopenedDialog = await openEqualFilterDialog(page, relationPropertyName);
  await expect(
    reopenedDialog.getByRole('button', { name: new RegExp(`^${secondViewName}$`, 'i') }),
  ).toHaveClass(/md-chip_selected/);
  await expect(reopenedDialog.getByText(targetItemValue, { exact: true })).toBeVisible();
  await reopenedDialog.getByRole('button', { name: /^cancel$/i }).click();
  await closeBottomSheet(page, /database filters sheet/i);
});

test('uses the explicit nested relation overflow root for independent two-axis ranges', async ({
  page,
}) => {
  const targetDocumentName = createUniqueName('virtualized relation target');
  const fixture = createDatabaseVirtualizationFixture({
    name: targetDocumentName,
    rowCount: 160,
    columnCount: 24,
  });
  await stubDatabaseJsonImport(page, fixture.document);
  await page.setViewportSize({ width: 640, height: 480 });
  await launchApp(page);
  await openOpfs(page);
  await importDatabaseJsonDocument(page, targetDocumentName);

  await closeDocumentPane(page);
  const sourceDocumentName = await createDatabaseDocument(
    page,
    createUniqueName('virtualized relation source'),
  );
  await openDocumentFromExplorer(page, sourceDocumentName);
  const sourcePropertyName = await createStringProperty(page, createUniqueName('source label'));
  const sourceValue = createUniqueName('source relation row');
  await addDatabaseItem(page, sourcePropertyName, sourceValue);
  const relationPropertyName = await createRelationProperty(page, targetDocumentName);

  const sourceRow = findDatabaseRow(page, sourceValue);
  await sourceRow
    .getByRole('button', { name: new RegExp(`^${relationPropertyName}$`, 'i') })
    .click();
  const relationField = page.getByRole('group', {
    name: new RegExp(`^${relationPropertyName}$`, 'i'),
  });
  const relationRoot = relationField.locator('.relation-value-field__data');
  const relationTable = relationRoot.getByRole('table');

  await expect(relationRoot).toBeVisible();
  await expect(relationTable).toHaveAttribute('aria-rowcount', '161');
  await expect(relationTable).toHaveAttribute('aria-colcount', '25');

  const relationScroll = await relationRoot.evaluate((rootElement) => ({
    clientHeight: rootElement.clientHeight,
    clientWidth: rootElement.clientWidth,
    scrollHeight: rootElement.scrollHeight,
    scrollWidth: rootElement.scrollWidth,
  }));
  expect(relationScroll.scrollHeight).toBeGreaterThan(relationScroll.clientHeight);
  expect(relationScroll.scrollWidth).toBeGreaterThan(relationScroll.clientWidth);

  await relationRoot.evaluate((rootElement) => {
    rootElement.scrollTop = Number.MAX_SAFE_INTEGER;
    rootElement.scrollLeft = Number.MAX_SAFE_INTEGER;
  });
  await expect(relationTable.locator('tbody > tr[aria-rowindex="161"]')).toBeVisible();
  await expect(
    relationTable.getByRole('columnheader', { name: fixture.lastPropertyName, exact: true }),
  ).toBeVisible();
  await expect(relationTable.locator('tbody td.db-data-table__actions').first()).toBeVisible();
});

test('keeps the production Database table mounted work below its logical row-property cross product', async ({
  page,
}) => {
  await page.setViewportSize({ width: 480, height: 400 });
  await launchApp(page);
  await openOpfs(page);

  const directoryName = await createDirectory(page, createUniqueName('virtualized database lab'));
  await openDirectory(page, directoryName);

  const documentName = await createDatabaseDocument(page, createUniqueName('virtualized data'));
  await openDocumentFromExplorer(page, documentName);

  const propertyNames: string[] = [];
  for (const index of Array.from({ length: 8 }, (_, itemIndex) => itemIndex)) {
    // Property creation is a user flow with one shared sheet/dialog surface, so setup stays
    // deliberately serial.
    // eslint-disable-next-line no-await-in-loop -- Property dialogs share one product sheet.
    propertyNames.push(await createStringProperty(page, createUniqueName(`column ${index + 1}`)));
  }
  const [titlePropertyName] = propertyNames;

  if (!titlePropertyName) {
    throw new Error('Expected the deterministic title property');
  }

  const rowValues = Array.from({ length: 12 }, (_, index) => createUniqueName(`row ${index + 1}`));

  for (const rowValue of rowValues) {
    // The product add-item flow is the public setup boundary. A virtualized row may no longer be
    // visible after this dialog closes, so visibility is intentionally not part of the data setup.
    // eslint-disable-next-line no-await-in-loop -- Item dialogs share one product surface.
    await addDatabaseItemValues(page, { [titlePropertyName]: rowValue });
  }

  const table = page.getByRole('table');
  await expect(table).toHaveAttribute('aria-rowcount', '13');
  await expect(table).toHaveAttribute('aria-colcount', '9');
  await expect(table.locator('tbody')).not.toHaveAttribute('role', 'list');

  const expensiveCells = table.locator(
    'tbody > tr:not([aria-hidden="true"]) > td.db-data-table__value',
  );

  await expect
    .poll(() => expensiveCells.count(), {
      message:
        'mounted value cells must stay below the complete logical row-property cross product',
    })
    .toBeLessThan(rowValues.length * propertyNames.length);
});

test('derives a non-zero vertical table surface offset from real preceding Database content', async ({
  page,
}) => {
  await launchApp(page);
  await page.getByRole('button', { name: /weekly planning/i }).click();

  await expect(page.getByText('Example created', { exact: true })).toBeVisible();
  const root = page.locator('.database-view');
  const table = root.locator(
    ':scope > .database-view-layout > .database-view-layout__table-surface > table',
  );
  await expect(root).toBeVisible();
  await expect(table).toBeVisible();

  const surfaceOffset = await root.evaluate((rootElement) => {
    const tableElement = rootElement.querySelector('.db-data-table');
    const rootRect = rootElement.getBoundingClientRect();
    const tableRect = tableElement?.getBoundingClientRect();

    return {
      horizontal:
        (tableRect?.left ?? 0) - rootRect.left - rootElement.clientLeft + rootElement.scrollLeft,
      vertical:
        (tableRect?.top ?? 0) - rootRect.top - rootElement.clientTop + rootElement.scrollTop,
    };
  });

  expect(surfaceOffset.horizontal).toBeGreaterThan(0);
  expect(surfaceOffset.vertical).toBeGreaterThan(0);
});

test('virtualizes the real Database root across deep native-table row and property ranges', async ({
  page,
}) => {
  const documentName = createUniqueName('virtualized imported database');
  const fixture = createDatabaseVirtualizationFixture({
    name: documentName,
    rowCount: 160,
    columnCount: 24,
  });
  await stubDatabaseJsonImport(page, fixture.document);
  await page.setViewportSize({ width: 640, height: 480 });
  await launchApp(page);
  await openOpfs(page);
  await importDatabaseJsonDocument(page, documentName);

  const root = page.locator('.database-view');
  const table = page.getByRole('table');
  await expect(root).toBeVisible();
  await expect(table).toHaveAttribute('aria-rowcount', '161');
  await expect(table).toHaveAttribute('aria-colcount', '25');
  await expect(table.locator('tbody')).not.toHaveAttribute('role', 'list');
  await expect(table.locator('tfoot')).toHaveCount(0);
  await expect(page.locator('.database-view-layout__after')).toHaveCount(1);

  const readMountedIntersection = () =>
    table.evaluate((tableElement) => {
      const rows = tableElement.querySelectorAll('tbody > tr:not([aria-hidden="true"])');
      const propertyHeaders = tableElement.querySelectorAll(
        'thead th[aria-colindex]:not(.db-data-table__actions)',
      );
      const cells = tableElement.querySelectorAll('tbody td.db-data-table__value');

      return {
        rows: rows.length,
        headers: propertyHeaders.length,
        cells: cells.length,
      };
    });

  let initialIntersection: Awaited<ReturnType<typeof readMountedIntersection>> | undefined;
  await expect
    .poll(async () => {
      const snapshot = await readMountedIntersection();
      const isSettled =
        snapshot.rows > 0 &&
        snapshot.headers > 0 &&
        snapshot.cells === snapshot.rows * snapshot.headers;
      if (isSettled) {
        initialIntersection = snapshot;
      }
      return isSettled;
    })
    .toBe(true);

  if (!initialIntersection) {
    throw new Error('Expected a settled mounted Database intersection');
  }

  expect(initialIntersection.rows).toBeLessThan(160);
  expect(initialIntersection.headers).toBeLessThan(24);
  expect(initialIntersection.cells).toBeLessThan(160 * 24);
  await expect(
    table.locator('tbody > tr:not([aria-hidden="true"]) .database-view-layout__action').first(),
  ).toHaveClass(/_elevation/);

  const initialSurfaceOffset = await root.evaluate((rootElement) => {
    const tableElement = rootElement.querySelector('.db-data-table');
    const rootRect = rootElement.getBoundingClientRect();
    const tableRect = tableElement?.getBoundingClientRect();

    return {
      horizontal:
        (tableRect?.left ?? 0) - rootRect.left - rootElement.clientLeft + rootElement.scrollLeft,
      vertical:
        (tableRect?.top ?? 0) - rootRect.top - rootElement.clientTop + rootElement.scrollTop,
    };
  });

  // The real root's horizontal padding creates a non-zero collection-surface offset. The vertical
  // value is kept in the same public DOM measurement because content before the table can change
  // it without a different geometry owner.
  expect(initialSurfaceOffset.horizontal).toBeGreaterThan(0);
  expect(initialSurfaceOffset.vertical).toBeGreaterThanOrEqual(0);

  await root.evaluate((rootElement) => {
    rootElement.scrollTop = Number.MAX_SAFE_INTEGER;
  });
  await expect(table.locator('tbody > tr[aria-rowindex="161"]')).toBeVisible();

  // Horizontal virtualization is independent, so restore the mounted label property before
  // asserting the row's persisted sentinel content at the deep vertical range.
  await root.evaluate((rootElement) => {
    rootElement.scrollLeft = 0;
  });
  await expect(
    table.getByRole('columnheader', { name: fixture.labelPropertyName, exact: true }),
  ).toBeVisible();
  await expect(page.getByText(fixture.lastLabel, { exact: true })).toBeVisible();

  await root.evaluate((rootElement) => {
    rootElement.scrollLeft = Number.MAX_SAFE_INTEGER;
  });
  await expect(
    table.getByRole('columnheader', { name: fixture.lastPropertyName, exact: true }),
  ).toBeVisible();
  await expect(
    table.locator('tbody > tr:not([aria-hidden="true"]) .database-view-layout__action').first(),
  ).not.toHaveClass(/_elevation/);

  const deepIntersection = await readMountedIntersection();
  expect(deepIntersection.rows).toBeGreaterThan(0);
  expect(deepIntersection.headers).toBeGreaterThan(0);
  expect(deepIntersection.cells).toBe(deepIntersection.rows * deepIntersection.headers);
  expect(deepIntersection.rows).toBeLessThan(160);
  expect(deepIntersection.headers).toBeLessThan(24);
  expect(deepIntersection.cells).toBeLessThan(160 * 24);

  const deepIndices = await table.evaluate((tableElement) => {
    const headerIndices = Array.from(
      tableElement.querySelectorAll('thead th[aria-colindex]:not(.db-data-table__actions)'),
    ).map((cell) => Number(cell.getAttribute('aria-colindex')));
    const firstRow = tableElement.querySelector('tbody > tr:not([aria-hidden="true"])');
    const cellIndices = Array.from(firstRow?.querySelectorAll('td.db-data-table__value') ?? []).map(
      (cell) => Number(cell.getAttribute('aria-colindex')),
    );

    return { cellIndices, headerIndices };
  });

  expect(deepIndices.cellIndices).toEqual(deepIndices.headerIndices);
  expect(Math.max(...deepIndices.headerIndices)).toBe(24);
  await expect(table.locator('thead th.db-data-table__actions')).toHaveAttribute(
    'aria-colindex',
    '25',
  );
  await expect(table.locator('tbody td.db-data-table__actions').first()).toBeVisible();

  const rootScroll = await root.evaluate((rootElement) => ({
    clientHeight: rootElement.clientHeight,
    clientWidth: rootElement.clientWidth,
    scrollHeight: rootElement.scrollHeight,
    scrollLeft: rootElement.scrollLeft,
    scrollTop: rootElement.scrollTop,
    scrollWidth: rootElement.scrollWidth,
  }));
  expect(rootScroll.scrollHeight).toBeGreaterThan(rootScroll.clientHeight);
  expect(rootScroll.scrollWidth).toBeGreaterThan(rootScroll.clientWidth);
  expect(rootScroll.scrollTop).toBeGreaterThan(0);
  expect(rootScroll.scrollLeft).toBeGreaterThan(0);
});

test('retains dynamic row sizing, sticky native-table surfaces, and measured property width', async ({
  page,
}) => {
  const documentName = createUniqueName('virtualized table geometry');
  const fixture = createDatabaseVirtualizationFixture({
    name: documentName,
    rowCount: 160,
    columnCount: 24,
  });
  await stubDatabaseJsonImport(page, fixture.document);
  await page.setViewportSize({ width: 640, height: 480 });
  await launchApp(page);
  await openOpfs(page);
  await importDatabaseJsonDocument(page, documentName);

  const root = page.locator('.database-view');
  const table = page.getByRole('table');
  const firstRow = table.locator('tbody > tr[aria-rowindex="2"]');
  const labelField = page.getByRole('textbox', { name: fixture.labelPropertyName, exact: true });
  const wideHeader = table.getByRole('columnheader', {
    name: fixture.widePropertyName,
    exact: true,
  });

  await expect(firstRow).toBeVisible();
  await expect(wideHeader).toBeVisible();

  const initialRowHeight = await firstRow.evaluate(
    (rowElement) => rowElement.getBoundingClientRect().height,
  );
  const initialWideHeaderWidth = await wideHeader.evaluate(
    (headerElement) => headerElement.getBoundingClientRect().width,
  );
  expect(initialWideHeaderWidth).toBeGreaterThan(160);

  const readStickySurface = () =>
    root.evaluate((rootElement) => {
      const tableElement = rootElement.querySelector('.db-data-table');
      const header = tableElement?.querySelector(
        'thead th[aria-colindex]:not(.db-data-table__actions)',
      );
      const action = tableElement?.querySelector(
        'tbody > tr:not([aria-hidden="true"]) > td.db-data-table__actions',
      );

      if (!header || !action) {
        throw new Error('Expected a mounted table header and action cell');
      }

      return {
        actionRight: Math.round(action.getBoundingClientRect().right),
        headerTop: Math.round(header.getBoundingClientRect().top),
      };
    });

  const initialStickySurface = await readStickySurface();

  await firstRow
    .locator('td[aria-colindex="2"]')
    .getByRole('button', { name: fixture.labelPropertyName, exact: true })
    .click();
  await expect(labelField).toBeVisible();
  await labelField.fill(Array.from({ length: 48 }, () => 'wrapping').join(' '));
  await labelField.press('Enter');
  await expect(labelField).toHaveCount(0);
  await expect
    .poll(() => firstRow.evaluate((rowElement) => rowElement.getBoundingClientRect().height))
    .toBeGreaterThan(initialRowHeight);

  await root.evaluate((rootElement) => {
    rootElement.scrollLeft = Number.MAX_SAFE_INTEGER;
    rootElement.scrollTop = Number.MAX_SAFE_INTEGER;
  });
  await expect(table.locator('tbody > tr[aria-rowindex="161"]')).toBeVisible();
  await expect(
    table.getByRole('columnheader', { name: fixture.lastPropertyName, exact: true }),
  ).toBeVisible();
  expect(await readStickySurface()).toEqual(initialStickySurface);

  await root.evaluate((rootElement) => {
    rootElement.scrollLeft = 0;
    rootElement.scrollTop = 0;
  });
  await expect(wideHeader).toBeVisible();
  const remountedWideHeaderWidth = await wideHeader.evaluate(
    (headerElement) => headerElement.getBoundingClientRect().width,
  );
  expect(Math.round(remountedWideHeaderWidth)).toBeGreaterThanOrEqual(
    Math.round(initialWideHeaderWidth),
  );
  await expect
    .poll(() => firstRow.evaluate((rowElement) => rowElement.getBoundingClientRect().height))
    .toBeGreaterThan(initialRowHeight);
});

test('preserves a lifted inline draft across virtual eviction and resolves it before view changes', async ({
  page,
}) => {
  const documentName = createUniqueName('virtualized edit lifecycle');
  const fixture = createDatabaseVirtualizationFixture({
    name: documentName,
    rowCount: 160,
    columnCount: 24,
  });
  await stubDatabaseJsonImport(page, fixture.document);
  await page.setViewportSize({ width: 640, height: 480 });
  await launchApp(page);
  await openOpfs(page);
  await importDatabaseJsonDocument(page, documentName);

  const root = page.locator('.database-view');
  const table = page.getByRole('table');
  const firstRow = table.locator('tbody > tr[aria-rowindex="2"]');
  const labelField = page.getByRole('textbox', { name: fixture.labelPropertyName, exact: true });
  const labelButton = () =>
    firstRow
      .locator('td[aria-colindex="2"]')
      .getByRole('button', { name: fixture.labelPropertyName, exact: true });
  const selectViewAndClose = async (name: string) => {
    const sheet = await openViewsSheet(page);
    const viewButton = sheet.getByRole('button', { name, exact: true });

    await viewButton.click();
    await expect(viewButton).toHaveAttribute('aria-current', 'true');
    await sheet.getByRole('button', { name: /close sheet/i }).click();
    await expect(sheet).toHaveCount(0);
  };

  await expect(firstRow).toContainText(fixture.firstLabel);

  await labelButton().click();
  await expect(labelField).toBeVisible();
  await labelField.fill(createUniqueName('cancelled draft'));
  await labelField.press('Escape');
  await expect(labelField).toHaveCount(0);
  await expect(firstRow).toContainText(fixture.firstLabel);

  const verticalDraft = createUniqueName('vertical eviction draft');
  await labelButton().click();
  await expect(labelField).toBeVisible();
  await labelField.fill(verticalDraft);
  await root.evaluate((rootElement) => {
    rootElement.scrollTop = Number.MAX_SAFE_INTEGER;
  });
  await expect(table.locator('tbody > tr[aria-rowindex="161"]')).toBeVisible();
  await root.evaluate((rootElement) => {
    rootElement.scrollTop = 0;
  });
  await expect(firstRow).toContainText(verticalDraft);

  const horizontalDraft = createUniqueName('horizontal eviction draft');
  await labelButton().click();
  await expect(labelField).toBeVisible();
  await labelField.fill(horizontalDraft);
  await root.evaluate((rootElement) => {
    rootElement.scrollLeft = Number.MAX_SAFE_INTEGER;
  });
  await expect(
    table.getByRole('columnheader', { name: fixture.lastPropertyName, exact: true }),
  ).toBeVisible();
  await root.evaluate((rootElement) => {
    rootElement.scrollLeft = 0;
  });
  await expect(
    table.getByRole('columnheader', { name: fixture.labelPropertyName, exact: true }),
  ).toBeVisible();
  await expect(firstRow).toContainText(horizontalDraft);

  const previousEditDraft = createUniqueName('previous edit resolution');
  await labelButton().click();
  await expect(labelField).toBeVisible();
  await labelField.fill(previousEditDraft);

  await firstRow
    .locator('td[aria-colindex="1"]')
    .getByRole('button', { name: 'Filter', exact: true })
    .click();
  const filterField = page.getByRole('textbox', { name: 'Filter', exact: true });
  await expect(filterField).toBeVisible();
  await expect(firstRow).toContainText(previousEditDraft);
  await filterField.press('Escape');
  await expect(filterField).toHaveCount(0);

  const viewSwitchDraft = createUniqueName('view switch resolution');
  await labelButton().click();
  await expect(labelField).toBeVisible();
  await labelField.fill(viewSwitchDraft);
  await selectViewAndClose('Short view');
  await expect(table).toHaveAttribute('aria-rowcount', '21');
  await expect(firstRow).toContainText(viewSwitchDraft);
  await expect(page.getByText(fixture.lastLabel, { exact: true })).toHaveCount(0);

  await selectViewAndClose('Full view');
  await expect(table).toHaveAttribute('aria-rowcount', '161');
  await root.evaluate((rootElement) => {
    rootElement.scrollTop = Number.MAX_SAFE_INTEGER;
  });
  await expect(page.getByText(fixture.lastLabel, { exact: true })).toBeVisible();

  await root.evaluate((rootElement) => {
    rootElement.scrollTop = 0;
  });
  await selectViewAndClose('Short view');
  await expect(table).toHaveAttribute('aria-rowcount', '21');
  await expect(table.locator('tbody > tr[aria-rowindex="22"]')).toHaveCount(0);
  await expect(page.getByText(fixture.lastLabel, { exact: true })).toHaveCount(0);
});
