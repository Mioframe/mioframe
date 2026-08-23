import { Buffer } from 'node:buffer';
import { expect, type Page, test } from '@playwright/test';
import {
  addDatabaseItem,
  addDatabaseItemValues,
  closeBottomSheet,
  closeDocumentPane,
  createRelationProperty,
  createDatabaseDocument,
  createDirectory,
  createStringProperty,
  createUniqueName,
  findDatabaseRow,
  findListRow,
  launchApp,
  openDirectory,
  openDocumentFromExplorer,
  openEntryAddSheet,
  openOpfs,
  openPropertiesSheet,
  openSortSheet,
  openViewsSheet,
} from './helpers';

type DatabaseVirtualizationFixture = {
  document: Record<string, unknown>;
  firstLabel: string;
  itemIds: readonly string[];
  labelPropertyName: string;
  lastLabel: string;
  lastPropertyName: string;
  relationPropertyName?: string | undefined;
  widePropertyName: string;
};

const createDatabaseVirtualizationFixture = ({
  name,
  rowCount,
  columnCount,
  relation,
  shortRowCount = 20,
}: {
  name: string;
  rowCount: number;
  columnCount: number;
  relation?:
    | {
        documentId: string;
        itemIds: readonly string[];
        propertyName: string;
      }
    | undefined;
  shortRowCount?: number;
}): DatabaseVirtualizationFixture => {
  if (columnCount < 2) {
    throw new Error('Database virtualization fixtures need filter and label properties');
  }

  if (relation && columnCount < 3) {
    throw new Error('Relation virtualization fixtures need a separate relation property');
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

  const properties: Record<string, Record<string, unknown>> = {};
  const widePropertyName = 'ProgressiveWidthProbeXXXXXXXXXXXXXXXXXXXXXXXX';
  const relationPropertyName = relation?.propertyName;
  const relationPropertyId = relation ? propertyIds[2] : undefined;

  if (relation && !relationPropertyId) {
    throw new Error('Relation virtualization fixtures need a relation property ID');
  }

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

    properties[propertyId] =
      relation && index === 2
        ? {
            name: relationPropertyName,
            relation: { documentId: relation.documentId, viewId: 'viewId_full' },
            type: 'relation',
          }
        : { name: propertyName, type: 'string' };
    return propertyName;
  });

  const data: Record<string, Record<string, unknown>> = {};
  const firstLabel = 'short row 1';
  const lastLabel = 'full sentinel row';
  const itemIds: string[] = [];

  for (let index = 0; index < rowCount; index += 1) {
    const isShort = index < shortRowCount;
    const itemId = `itemId_${String(index + 1).padStart(6, '0')}`;
    itemIds.push(itemId);
    data[itemId] = {
      [filterPropertyId]: isShort ? 'short' : 'full',
      [labelPropertyId]:
        index === 0 ? firstLabel : index === rowCount - 1 ? lastLabel : `row ${index + 1}`,
      ...(relation && relationPropertyId && index === 0
        ? { [relationPropertyId]: relation.itemIds }
        : {}),
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
    itemIds,
    labelPropertyName: propertyNames[1] ?? 'Label',
    lastLabel,
    lastPropertyName: propertyNames.at(-1) ?? 'Column',
    relationPropertyName,
    widePropertyName,
  };
};

const installDatabaseJsonImport = (base64Document: string) => {
  const bytes = Uint8Array.from(atob(base64Document), (character) => character.charCodeAt(0));
  const file = new File([bytes], 'database-virtualization.json', {
    type: 'application/json',
  });

  Reflect.set(globalThis, 'showOpenFilePicker', () =>
    Promise.resolve([{ getFile: () => Promise.resolve(file) }]),
  );
};

const stubDatabaseJsonImport = async (page: Page, document: Record<string, unknown>) => {
  const encodedDocument = Buffer.from(JSON.stringify(document), 'utf8').toString('base64');

  await page.addInitScript(installDatabaseJsonImport, encodedDocument);
};

const setDatabaseJsonImport = async (page: Page, document: Record<string, unknown>) => {
  const encodedDocument = Buffer.from(JSON.stringify(document), 'utf8').toString('base64');

  await page.evaluate(installDatabaseJsonImport, encodedDocument);
};

const getOpenDocumentId = (page: Page) => {
  const documentId = [...new URL(page.url()).searchParams].find(([key]) =>
    key.endsWith('[documentId]'),
  )?.[1];

  if (!documentId) {
    throw new Error(`Expected an open document ID in ${page.url()}`);
  }

  return documentId;
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

test('keeps normal and teleported recursive relation tables inside their widget-owned scroll roots', async ({
  page,
}) => {
  const placeholderDocumentName = createUniqueName('recursive relation placeholder');
  const nestedDocumentName = createUniqueName('recursive relation nested');
  const outerDocumentName = createUniqueName('recursive relation outer');
  const relationPropertyName = createUniqueName('linked recursive rows');

  await page.setViewportSize({ width: 640, height: 480 });
  await launchApp(page);
  await openOpfs(page);

  await createDatabaseDocument(page, placeholderDocumentName);
  await openDocumentFromExplorer(page, placeholderDocumentName);
  const placeholderDocumentId = getOpenDocumentId(page);
  await closeDocumentPane(page);

  const nestedFixture = createDatabaseVirtualizationFixture({
    name: nestedDocumentName,
    rowCount: 160,
    columnCount: 24,
    relation: {
      documentId: placeholderDocumentId,
      itemIds: Array.from(
        { length: 160 },
        (_, index) => `itemId_${String(index + 1).padStart(6, '0')}`,
      ),
      propertyName: relationPropertyName,
    },
  });
  await setDatabaseJsonImport(page, nestedFixture.document);
  await importDatabaseJsonDocument(page, nestedDocumentName);
  const nestedDocumentId = getOpenDocumentId(page);

  const propertiesSheet = await openPropertiesSheet(page);
  const nestedRelationRow = findListRow(propertiesSheet, relationPropertyName);
  await nestedRelationRow.getByRole('button', { name: /options/i }).click();
  await page.getByRole('menuitem', { name: /^edit$/i }).click();
  const relationPropertyDialog = page.getByRole('dialog', { name: /edit property/i });
  await expect(relationPropertyDialog).toBeVisible();
  await relationPropertyDialog.getByRole('combobox', { name: /database document/i }).click();
  await page.getByRole('option', { name: new RegExp(`^${nestedDocumentName}$`, 'i') }).click();
  await relationPropertyDialog.getByRole('button', { name: /^edit$/i }).click();
  await expect(relationPropertyDialog).toHaveCount(0);
  await closeBottomSheet(page, /database properties sheet/i);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /rename document/i })).toBeVisible();
  await closeDocumentPane(page);

  const outerFixture = createDatabaseVirtualizationFixture({
    name: outerDocumentName,
    rowCount: 160,
    columnCount: 24,
    relation: {
      documentId: nestedDocumentId,
      itemIds: nestedFixture.itemIds,
      propertyName: relationPropertyName,
    },
  });
  await setDatabaseJsonImport(page, outerFixture.document);
  await importDatabaseJsonDocument(page, outerDocumentName);

  const outerTable = page.locator('.database-view > .database-view-layout > .db-data-table');
  const firstOuterRow = outerTable.locator('tbody > tr[aria-rowindex="2"]');
  const normalRoot = firstOuterRow.locator('.database-relation-value-inline__scroll-root');
  const normalTable = normalRoot.getByRole('table');

  await expect(normalRoot).toBeVisible();
  await expect(normalTable).toHaveAttribute('aria-rowcount', '161');
  await expect(normalTable).toHaveAttribute('aria-colcount', '24');

  const readRoot = (root: typeof normalRoot) =>
    root.evaluate((rootElement) => ({
      clientHeight: rootElement.clientHeight,
      clientWidth: rootElement.clientWidth,
      containsTable: rootElement.contains(rootElement.querySelector('table')),
      scrollHeight: rootElement.scrollHeight,
      scrollWidth: rootElement.scrollWidth,
    }));
  const readMountedWork = (table: typeof normalTable) =>
    table.evaluate((tableElement) => ({
      cells: tableElement.querySelectorAll('tbody td.db-data-table__value').length,
      headers: tableElement.querySelectorAll('thead th[aria-colindex]:not(.db-data-table__actions)')
        .length,
      rows: tableElement.querySelectorAll('tbody > tr:not([aria-hidden="true"])').length,
    }));
  const expectBoundedTable = async (table: typeof normalTable) => {
    const mountedWork = await readMountedWork(table);

    expect(mountedWork.rows).toBeGreaterThan(0);
    expect(mountedWork.headers).toBeGreaterThan(0);
    expect(mountedWork.rows).toBeLessThan(160);
    expect(mountedWork.headers).toBeLessThan(24);
    expect(mountedWork.cells).toBe(mountedWork.rows * mountedWork.headers);
    expect(mountedWork.cells).toBeLessThan(160 * 24);
  };

  const normalScroll = await readRoot(normalRoot);
  expect(normalScroll.containsTable).toBe(true);
  expect(normalScroll.scrollHeight).toBeGreaterThan(normalScroll.clientHeight);
  expect(normalScroll.scrollWidth).toBeGreaterThan(normalScroll.clientWidth);
  await expectBoundedTable(normalTable);

  await normalRoot.evaluate((rootElement) => {
    rootElement.scrollTop = Number.MAX_SAFE_INTEGER;
    rootElement.scrollLeft = Number.MAX_SAFE_INTEGER;
  });
  await expect(normalTable.locator('tbody > tr[aria-rowindex="161"]')).toBeVisible();
  await expect(
    normalTable.getByRole('columnheader', { name: nestedFixture.lastPropertyName, exact: true }),
  ).toBeVisible();
  await expectBoundedTable(normalTable);

  await normalRoot.evaluate((rootElement) => {
    rootElement.scrollTop = 0;
    rootElement.scrollLeft = 0;
  });
  const recursiveToggle = normalTable
    .locator('tbody > tr[aria-rowindex="2"]')
    .getByRole('button', { name: /^show value$/i });
  await expect(recursiveToggle).toBeVisible();
  await recursiveToggle.click();

  const relationRoots = page.locator('.database-relation-value-inline__scroll-root');
  await expect(relationRoots).toHaveCount(2);
  const recursiveRoot = relationRoots.last();
  const recursiveTable = recursiveRoot.getByRole('table');
  await expect(recursiveRoot).toBeVisible();
  await expect(recursiveTable).toHaveAttribute('aria-rowcount', '161');
  await expect(recursiveTable).toHaveAttribute('aria-colcount', '24');

  const recursiveScroll = await readRoot(recursiveRoot);
  expect(recursiveScroll.containsTable).toBe(true);
  expect(recursiveScroll.scrollHeight).toBeGreaterThan(recursiveScroll.clientHeight);
  expect(recursiveScroll.scrollWidth).toBeGreaterThan(recursiveScroll.clientWidth);
  await expectBoundedTable(recursiveTable);

  await recursiveRoot.evaluate((rootElement) => {
    rootElement.scrollTop = Number.MAX_SAFE_INTEGER;
    rootElement.scrollLeft = Number.MAX_SAFE_INTEGER;
  });
  await expect(recursiveTable.locator('tbody > tr[aria-rowindex="161"]')).toBeVisible();
  await expect(
    recursiveTable.getByRole('columnheader', {
      name: nestedFixture.lastPropertyName,
      exact: true,
    }),
  ).toBeVisible();
  await expectBoundedTable(recursiveTable);
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

test('keeps real preceding Database content connected to the table-owned surface range', async ({
  page,
}) => {
  await launchApp(page);
  await page.getByRole('button', { name: /weekly planning/i }).click();

  await expect(page.getByText('Example created', { exact: true })).toBeVisible();
  const root = page.locator('.database-view');
  const table = root.locator(':scope > .database-view-layout > .database-view-layout__table');
  await expect(root).toBeVisible();
  await expect(table).toBeVisible();

  const deepRangeRows = Array.from({ length: 40 }, (_, index) =>
    createUniqueName(`surface range row ${index + 1}`),
  );
  for (const task of deepRangeRows) {
    // The real starter-document add-item flow keeps the success card mounted before the table.
    // eslint-disable-next-line no-await-in-loop -- Item dialogs share one product surface.
    await addDatabaseItemValues(page, { Task: task });
  }

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

  // This remains a real table-owned virtual collection even while the success card moves its
  // surface down inside the physical root. Exercise a deep mounted range instead of stopping at
  // a rectangle calculation, then dismiss the card so the same surface moves again.
  const readLogicalRange = () =>
    table.evaluate((tableElement) => {
      const rows = Array.from(
        tableElement.querySelectorAll('tbody > tr:not([aria-hidden="true"])'),
      );
      const indices = rows
        .map((row) => Number(row.getAttribute('aria-rowindex')))
        .filter((index) => Number.isFinite(index));
      const rowCount = Number(tableElement.getAttribute('aria-rowcount'));

      return {
        firstRowIndex: Math.min(...indices),
        lastRowIndex: Math.max(...indices),
        rowCount,
        rows: rows.length,
      };
    });

  await root.evaluate((rootElement) => {
    rootElement.scrollTop = 0;
  });
  const initialRange = await readLogicalRange();
  expect(initialRange.rows).toBeGreaterThan(0);
  expect(initialRange.rows).toBeLessThan(deepRangeRows.length + 5);
  expect(initialRange.firstRowIndex).toBe(2);

  await root.evaluate((rootElement) => {
    rootElement.scrollTop = Number.MAX_SAFE_INTEGER;
  });
  await expect
    .poll(
      async () => {
        const range = await readLogicalRange();
        return range.lastRowIndex === range.rowCount;
      },
      {
        message: 'the success-card-displaced table must reach its logical deep row range',
      },
    )
    .toBe(true);
  const displacedDeepRange = await readLogicalRange();
  expect(displacedDeepRange.rows).toBeLessThan(displacedDeepRange.rowCount - 1);
  expect(displacedDeepRange.lastRowIndex).toBe(displacedDeepRange.rowCount);

  await page.getByRole('button', { name: /^got it$/i }).click();
  await expect(page.getByText('Example created', { exact: true })).toHaveCount(0);

  const dismissedSurfaceOffset = await root.evaluate((rootElement) => {
    const tableElement = rootElement.querySelector('.db-data-table');
    const rootRect = rootElement.getBoundingClientRect();
    const tableRect = tableElement?.getBoundingClientRect();

    return (tableRect?.top ?? 0) - rootRect.top - rootElement.clientTop + rootElement.scrollTop;
  });

  expect(dismissedSurfaceOffset).toBeLessThan(surfaceOffset.vertical);

  await root.evaluate((rootElement) => {
    rootElement.scrollTop = 0;
  });
  const movedInitialRange = await readLogicalRange();
  expect(movedInitialRange.firstRowIndex).toBe(2);
  expect(movedInitialRange.rows).toBeLessThan(movedInitialRange.rowCount - 1);

  await root.evaluate((rootElement) => {
    rootElement.scrollTop = Number.MAX_SAFE_INTEGER;
  });
  await expect
    .poll(
      async () => {
        const range = await readLogicalRange();
        return range.lastRowIndex === range.rowCount;
      },
      {
        message: 'the moved table must reach its logical deep row range again',
      },
    )
    .toBe(true);
  const movedDeepRange = await readLogicalRange();
  expect(movedDeepRange.lastRowIndex).toBe(movedDeepRange.rowCount);
  expect(movedDeepRange.rows).toBeLessThan(movedDeepRange.rowCount - 1);
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

test('preserves a lifted inline draft across virtual eviction and resolves it before view and configuration changes', async ({
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
  const rootTable = root.locator('.db-data-table');
  const rootFirstRow = rootTable.locator('tbody > tr[aria-rowindex="2"]');
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
  const openConfigurationAfterResolvingDraft = async <TSheet>(
    draftLabel: string,
    openConfiguration: () => Promise<TSheet>,
  ) => {
    const draft = createUniqueName(draftLabel);

    await labelButton().click();
    await expect(labelField).toBeVisible();
    await labelField.fill(draft);
    const configuration = await openConfiguration();
    await expect(labelField).toHaveCount(0);
    await expect(rootFirstRow).toContainText(draft);

    return configuration;
  };
  const openToolbarFilterSheet = async () => {
    const sheet = page.getByRole('dialog', { name: /database filters sheet/i });
    const toolbar = page.locator('.md-toolbar').filter({ visible: true });

    await toolbar.getByRole('button', { name: /^filter$/i }).click();
    await expect(sheet).toBeVisible();

    return sheet;
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

  const sortSheet = await openConfigurationAfterResolvingDraft('sort configuration draft', () =>
    openSortSheet(page),
  );
  await expect(sortSheet).toBeVisible();
  await closeBottomSheet(page, /database sort sheet/i);

  const filterSheet = await openConfigurationAfterResolvingDraft(
    'filter configuration draft',
    openToolbarFilterSheet,
  );
  await expect(filterSheet).toBeVisible();
  await closeBottomSheet(page, /database filters sheet/i);

  const propertiesSheet = await openConfigurationAfterResolvingDraft(
    'property configuration draft',
    () => openPropertiesSheet(page),
  );
  await expect(propertiesSheet).toBeVisible();
  await closeBottomSheet(page, /database properties sheet/i);

  const viewRemovalDraft = createUniqueName('view removal configuration draft');
  await labelButton().click();
  await expect(labelField).toBeVisible();
  await labelField.fill(viewRemovalDraft);
  const viewsSheet = await openViewsSheet(page);
  await expect(labelField).toHaveCount(0);
  await expect(rootFirstRow).toContainText(viewRemovalDraft);

  const currentViewRow = findListRow(viewsSheet, 'Short view');
  await expect(viewsSheet.getByRole('button', { name: 'Short view', exact: true })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await currentViewRow.getByRole('button', { name: /settings view/i }).click();
  await page.getByRole('menuitem', { name: /^remove$/i }).click();
  const removeDialog = page.getByRole('dialog', { name: /remove view\?/i });
  await expect(removeDialog).toBeVisible();
  await removeDialog.getByRole('button', { name: /^remove$/i }).click();
  await expect(removeDialog).toHaveCount(0);
  await expect(viewsSheet.getByRole('button', { name: 'Full view', exact: true })).toHaveAttribute(
    'aria-current',
    'true',
  );
  await expect(rootTable).toHaveAttribute('aria-rowcount', '161');
  await expect(rootFirstRow).toContainText(viewRemovalDraft);
  await closeBottomSheet(page, /database views sheet/i);
});
