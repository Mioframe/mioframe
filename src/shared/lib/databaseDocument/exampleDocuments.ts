import type { CFRDocumentContent } from '@shared/lib/cfrDocument';
import { zodCFRDocumentContent } from '@shared/lib/cfrDocument';
import { DB_VIEW_LAYOUT } from './migrations/versions';
import type { DataBaseStateLatest } from './types';
import { DATABASE_DOCUMENT_TYPE } from './types';

type StatusKey = 'backlog' | 'planned' | 'doing' | 'waiting' | 'done';
type PurchaseTypeKey = 'produce' | 'pantry' | 'pharmacy' | 'household' | 'hardware';

type RelatedDocumentSeed<TKey extends string> = {
  content: CFRDocumentContent;
  defaultViewId: string;
  itemIds: Record<TKey, string>;
};

type RelatedDocumentReference<TKey extends string> = {
  documentId: string;
  viewId: string;
  itemIds: Record<TKey, string>;
};

type ExampleProperty = {
  default?: unknown;
  name: string;
  relation?: {
    documentId: string;
    viewId: string;
  };
  type: string;
};

type ExampleDatabaseState = Omit<DataBaseStateLatest, 'properties'> & {
  properties: Record<string, ExampleProperty>;
};

const PROPERTY_TYPE_BOOLEAN = 'boolean';
const PROPERTY_TYPE_DATE = 'date';
const PROPERTY_TYPE_NUMBER = 'number';
const PROPERTY_TYPE_RELATION = 'relation';
const PROPERTY_TYPE_STRING = 'string';

const createDatabaseExampleDocument = (name: string, body: ExampleDatabaseState) =>
  zodCFRDocumentContent.parse({
    body,
    name,
    type: DATABASE_DOCUMENT_TYPE,
    version: 1,
  });

export const createStatusesExampleDocument = (): RelatedDocumentSeed<StatusKey> => {
  const itemIds: Record<StatusKey, string> = {
    backlog: 'itemId_backlog',
    planned: 'itemId_planned',
    doing: 'itemId_doing',
    waiting: 'itemId_waiting',
    done: 'itemId_done',
  };

  return {
    content: createDatabaseExampleDocument('Statuses', {
      data: {
        [itemIds.backlog]: { propertyId_focus: 1, propertyId_status: 'Backlog' },
        [itemIds.planned]: { propertyId_focus: 2, propertyId_status: 'Planned' },
        [itemIds.doing]: { propertyId_focus: 3, propertyId_status: 'Doing' },
        [itemIds.waiting]: { propertyId_focus: 1, propertyId_status: 'Waiting' },
        [itemIds.done]: { propertyId_focus: 0, propertyId_status: 'Done' },
      },
      properties: {
        propertyId_focus: { name: 'Focus', type: PROPERTY_TYPE_NUMBER },
        propertyId_status: { name: 'Status', type: PROPERTY_TYPE_STRING },
      },
      version: 3,
      views: {
        viewId_statusLibrary: {
          layout: DB_VIEW_LAYOUT.TABLE,
          name: 'Status library',
          order: 0,
          sorting: {
            propertyId_focus: { direction: 1, priority: 0 },
          },
        },
      },
    }),
    defaultViewId: 'viewId_statusLibrary',
    itemIds,
  };
};

export const createWeeklyPlanExampleDocument = (
  relation: RelatedDocumentReference<StatusKey>,
): CFRDocumentContent =>
  createDatabaseExampleDocument('Plan Week', {
    data: {
      itemId_plan_1: {
        propertyId_done: false,
        propertyId_due: '2026-04-27',
        propertyId_priority: 3,
        propertyId_status: [relation.itemIds.planned],
        propertyId_task: 'Review weekly goals and trim the backlog',
      },
      itemId_plan_2: {
        propertyId_done: false,
        propertyId_due: '2026-04-29',
        propertyId_priority: 3,
        propertyId_status: [relation.itemIds.doing],
        propertyId_task: 'Prepare the Wednesday team update',
      },
      itemId_plan_3: {
        propertyId_done: false,
        propertyId_due: '2026-05-01',
        propertyId_priority: 2,
        propertyId_status: [relation.itemIds.waiting],
        propertyId_task: 'Book a dentist appointment',
      },
      itemId_plan_4: {
        propertyId_done: false,
        propertyId_due: '2026-05-02',
        propertyId_priority: 1,
        propertyId_status: [relation.itemIds.backlog],
        propertyId_task: 'Refill the monthly budget sheet',
      },
      itemId_plan_5: {
        propertyId_done: true,
        propertyId_due: '2026-04-26',
        propertyId_priority: 2,
        propertyId_status: [relation.itemIds.done],
        propertyId_task: 'Confirm dinner with parents',
      },
    },
    properties: {
      propertyId_done: { default: false, name: 'Done', type: PROPERTY_TYPE_BOOLEAN },
      propertyId_due: { name: 'Due', type: PROPERTY_TYPE_DATE },
      propertyId_priority: { name: 'Priority', type: PROPERTY_TYPE_NUMBER },
      propertyId_status: {
        name: 'Status',
        relation: {
          documentId: relation.documentId,
          viewId: relation.viewId,
        },
        type: PROPERTY_TYPE_RELATION,
      },
      propertyId_task: { name: 'Task', type: PROPERTY_TYPE_STRING },
    },
    version: 3,
    views: {
      viewId_thisWeek: {
        layout: DB_VIEW_LAYOUT.TABLE,
        name: 'This week',
        order: 0,
        sorting: {
          propertyId_done: { direction: 0, priority: 0 },
          propertyId_due: { direction: 0, priority: 1 },
        },
      },
    },
  });

export const createPurchaseTypesExampleDocument = (): RelatedDocumentSeed<PurchaseTypeKey> => {
  const itemIds: Record<PurchaseTypeKey, string> = {
    produce: 'itemId_produce',
    pantry: 'itemId_pantry',
    pharmacy: 'itemId_pharmacy',
    household: 'itemId_household',
    hardware: 'itemId_hardware',
  };

  return {
    content: createDatabaseExampleDocument('Purchase Types', {
      data: {
        [itemIds.produce]: { propertyId_bestFor: 'Supermarket', propertyId_type: 'Produce' },
        [itemIds.pantry]: { propertyId_bestFor: 'Supermarket', propertyId_type: 'Pantry' },
        [itemIds.pharmacy]: { propertyId_bestFor: 'Pharmacy', propertyId_type: 'Pharmacy' },
        [itemIds.household]: { propertyId_bestFor: 'Supermarket', propertyId_type: 'Household' },
        [itemIds.hardware]: { propertyId_bestFor: 'Hardware', propertyId_type: 'Hardware' },
      },
      properties: {
        propertyId_bestFor: { name: 'Best for', type: PROPERTY_TYPE_STRING },
        propertyId_type: { name: 'Type', type: PROPERTY_TYPE_STRING },
      },
      version: 3,
      views: {
        viewId_typeLibrary: {
          layout: DB_VIEW_LAYOUT.TABLE,
          name: 'Type library',
          order: 0,
        },
      },
    }),
    defaultViewId: 'viewId_typeLibrary',
    itemIds,
  };
};

export const createShoppingListExampleDocument = (
  relation: RelatedDocumentReference<PurchaseTypeKey>,
): CFRDocumentContent =>
  createDatabaseExampleDocument('Shopping List', {
    data: {
      itemId_shopping_1: {
        propertyId_item: 'Bananas',
        propertyId_purchased: false,
        propertyId_quantity: 6,
        propertyId_store: 'Supermarket',
        propertyId_type: [relation.itemIds.produce],
      },
      itemId_shopping_2: {
        propertyId_item: 'Pasta',
        propertyId_purchased: false,
        propertyId_quantity: 2,
        propertyId_store: 'Supermarket',
        propertyId_type: [relation.itemIds.pantry],
      },
      itemId_shopping_3: {
        propertyId_item: 'Dish soap',
        propertyId_purchased: true,
        propertyId_quantity: 1,
        propertyId_store: 'Supermarket',
        propertyId_type: [relation.itemIds.household],
      },
      itemId_shopping_4: {
        propertyId_item: 'Vitamin D',
        propertyId_purchased: false,
        propertyId_quantity: 1,
        propertyId_store: 'Pharmacy',
        propertyId_type: [relation.itemIds.pharmacy],
      },
      itemId_shopping_5: {
        propertyId_item: 'Wall hooks',
        propertyId_purchased: false,
        propertyId_quantity: 4,
        propertyId_store: 'Hardware',
        propertyId_type: [relation.itemIds.hardware],
      },
    },
    properties: {
      propertyId_item: { name: 'Item', type: PROPERTY_TYPE_STRING },
      propertyId_purchased: {
        default: false,
        name: 'Purchased',
        type: PROPERTY_TYPE_BOOLEAN,
      },
      propertyId_quantity: { name: 'Qty', type: PROPERTY_TYPE_NUMBER },
      propertyId_store: { name: 'Store', type: PROPERTY_TYPE_STRING },
      propertyId_type: {
        name: 'Type',
        relation: {
          documentId: relation.documentId,
          viewId: relation.viewId,
        },
        type: PROPERTY_TYPE_RELATION,
      },
    },
    version: 3,
    views: {
      viewId_allItems: {
        layout: DB_VIEW_LAYOUT.TABLE,
        name: 'All items',
        order: 0,
        sorting: {
          propertyId_purchased: { direction: 0, priority: 0 },
          propertyId_store: { direction: 0, priority: 1 },
        },
      },
      viewId_supermarket: {
        filter: {
          propertyId_store: { $eq: 'Supermarket' },
        },
        layout: DB_VIEW_LAYOUT.TABLE,
        name: 'Supermarket',
        order: 1,
      },
      viewId_pharmacy: {
        filter: {
          propertyId_store: { $eq: 'Pharmacy' },
        },
        layout: DB_VIEW_LAYOUT.TABLE,
        name: 'Pharmacy',
        order: 2,
      },
      viewId_hardware: {
        filter: {
          propertyId_store: { $eq: 'Hardware' },
        },
        layout: DB_VIEW_LAYOUT.TABLE,
        name: 'Hardware',
        order: 3,
      },
    },
  });
