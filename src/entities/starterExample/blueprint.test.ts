import { describe, expect, it } from 'vitest';
import { PROPERTY_TYPE_RELATION } from '@entity/databaseRelation/model';
import { zodDatabaseState } from '@shared/lib/databaseDocument';
import {
  createShoppingListStarterExample,
  createWeeklyPlanStarterExample,
  purchaseTypesStarterExample,
  statusesStarterExample,
} from './index';

type RawExampleBody = {
  data: Record<string, Record<string, unknown>>;
  properties: Record<
    string,
    {
      default?: unknown;
      name?: string;
      relation?: {
        documentId: string;
        viewId: string;
      };
      type?: string;
    }
  >;
  views: Record<
    string,
    {
      filter?: Record<string, unknown>;
      layout?: string;
      name?: string;
      order?: number;
      sorting?: Record<string, unknown>;
    }
  >;
};

const isRawExampleBody = (value: unknown): value is RawExampleBody =>
  typeof value === 'object' &&
  value !== null &&
  'data' in value &&
  typeof value.data === 'object' &&
  value.data !== null &&
  'properties' in value &&
  typeof value.properties === 'object' &&
  value.properties !== null &&
  'views' in value &&
  typeof value.views === 'object' &&
  value.views !== null;

describe('starterExample blueprints', () => {
  it('builds valid weekly plan and statuses documents with linked relation metadata', () => {
    const statusesDocumentId = 'status-doc-id';
    const statuses = statusesStarterExample.recipe;
    const weeklyPlan = createWeeklyPlanStarterExample({
      documentId: statusesDocumentId,
      viewId: statusesStarterExample.defaultViewId,
      itemIds: statusesStarterExample.itemIds,
    });

    expect(zodDatabaseState.safeParse(statuses.body).success).toBe(true);
    expect(zodDatabaseState.safeParse(weeklyPlan.body).success).toBe(true);

    if (!isRawExampleBody(weeklyPlan.body)) {
      throw new Error('Expected raw weekly plan body');
    }

    if (!isRawExampleBody(statuses.body)) {
      throw new Error('Expected raw statuses body');
    }

    expect(statuses.name).toBe('Statuses');
    expect(statusesStarterExample.itemIds).toEqual({
      backlog: 'itemId_backlog',
      planned: 'itemId_planned',
      doing: 'itemId_doing',
      waiting: 'itemId_waiting',
      done: 'itemId_done',
    });
    expect(statuses.body.data).toEqual({
      itemId_backlog: { propertyId_focus: 1, propertyId_status: 'Backlog' },
      itemId_planned: { propertyId_focus: 2, propertyId_status: 'Planned' },
      itemId_doing: { propertyId_focus: 3, propertyId_status: 'Doing' },
      itemId_waiting: { propertyId_focus: 1, propertyId_status: 'Waiting' },
      itemId_done: { propertyId_focus: 0, propertyId_status: 'Done' },
    });
    expect(statuses.body.properties).toEqual({
      propertyId_focus: { name: 'Focus', type: 'number' },
      propertyId_status: { name: 'Status', type: 'string' },
    });
    expect(statuses.body.views).toEqual({
      viewId_statusLibrary: {
        layout: 'table',
        name: 'Status library',
        order: 0,
        sorting: {
          propertyId_focus: { direction: 1, priority: 0 },
        },
      },
    });

    const relationProperty = Object.values(weeklyPlan.body.properties).find(
      (property) => property.type === PROPERTY_TYPE_RELATION,
    );

    expect(weeklyPlan.name).toBe('Plan Week');
    expect(weeklyPlan.body.data).toEqual({
      itemId_plan_1: {
        propertyId_done: false,
        propertyId_due: '2026-04-27',
        propertyId_priority: 3,
        propertyId_status: ['itemId_planned'],
        propertyId_task: 'Review weekly goals and trim the backlog',
      },
      itemId_plan_2: {
        propertyId_done: false,
        propertyId_due: '2026-04-29',
        propertyId_priority: 3,
        propertyId_status: ['itemId_doing'],
        propertyId_task: 'Prepare the Wednesday team update',
      },
      itemId_plan_3: {
        propertyId_done: false,
        propertyId_due: '2026-05-01',
        propertyId_priority: 2,
        propertyId_status: ['itemId_waiting'],
        propertyId_task: 'Book a dentist appointment',
      },
      itemId_plan_4: {
        propertyId_done: false,
        propertyId_due: '2026-05-02',
        propertyId_priority: 1,
        propertyId_status: ['itemId_backlog'],
        propertyId_task: 'Refill the monthly budget sheet',
      },
      itemId_plan_5: {
        propertyId_done: true,
        propertyId_due: '2026-04-26',
        propertyId_priority: 2,
        propertyId_status: ['itemId_done'],
        propertyId_task: 'Confirm dinner with parents',
      },
    });
    expect(weeklyPlan.body.properties).toEqual({
      propertyId_done: { default: false, name: 'Done', type: 'boolean' },
      propertyId_due: { name: 'Due', type: 'date' },
      propertyId_priority: { name: 'Priority', type: 'number' },
      propertyId_status: {
        name: 'Status',
        relation: {
          documentId: statusesDocumentId,
          viewId: statusesStarterExample.defaultViewId,
        },
        type: 'relation',
      },
      propertyId_task: { name: 'Task', type: 'string' },
    });
    expect(weeklyPlan.body.views).toEqual({
      viewId_thisWeek: {
        layout: 'table',
        name: 'This week',
        order: 0,
        sorting: {
          propertyId_done: { direction: 0, priority: 0 },
          propertyId_due: { direction: 0, priority: 1 },
        },
      },
    });
    expect(relationProperty).toMatchObject({
      name: 'Status',
      relation: {
        documentId: statusesDocumentId,
        viewId: statusesStarterExample.defaultViewId,
      },
    });
  });

  it('builds valid shopping and purchase types documents with multiple store views', () => {
    const purchaseTypesDocumentId = 'purchase-types-doc-id';
    const purchaseTypes = purchaseTypesStarterExample.recipe;
    const shoppingList = createShoppingListStarterExample({
      documentId: purchaseTypesDocumentId,
      viewId: purchaseTypesStarterExample.defaultViewId,
      itemIds: purchaseTypesStarterExample.itemIds,
    });

    expect(zodDatabaseState.safeParse(purchaseTypes.body).success).toBe(true);
    expect(zodDatabaseState.safeParse(shoppingList.body).success).toBe(true);

    if (!isRawExampleBody(shoppingList.body)) {
      throw new Error('Expected raw shopping list body');
    }

    if (!isRawExampleBody(purchaseTypes.body)) {
      throw new Error('Expected raw purchase types body');
    }

    expect(purchaseTypes.name).toBe('Purchase Types');
    expect(purchaseTypesStarterExample.itemIds).toEqual({
      produce: 'itemId_produce',
      pantry: 'itemId_pantry',
      pharmacy: 'itemId_pharmacy',
      household: 'itemId_household',
      hardware: 'itemId_hardware',
    });
    expect(purchaseTypes.body.data).toEqual({
      itemId_produce: { propertyId_bestFor: 'Supermarket', propertyId_type: 'Produce' },
      itemId_pantry: { propertyId_bestFor: 'Supermarket', propertyId_type: 'Pantry' },
      itemId_pharmacy: { propertyId_bestFor: 'Pharmacy', propertyId_type: 'Pharmacy' },
      itemId_household: { propertyId_bestFor: 'Supermarket', propertyId_type: 'Household' },
      itemId_hardware: { propertyId_bestFor: 'Hardware', propertyId_type: 'Hardware' },
    });
    expect(purchaseTypes.body.properties).toEqual({
      propertyId_bestFor: { name: 'Best for', type: 'string' },
      propertyId_type: { name: 'Type', type: 'string' },
    });
    expect(purchaseTypes.body.views).toEqual({
      viewId_typeLibrary: {
        layout: 'table',
        name: 'Type library',
        order: 0,
      },
    });

    const relationProperty = Object.values(shoppingList.body.properties).find(
      (property) => property.type === PROPERTY_TYPE_RELATION,
    );

    expect(shoppingList.name).toBe('Shopping List');
    expect(shoppingList.body.data).toEqual({
      itemId_shopping_1: {
        propertyId_item: 'Bananas',
        propertyId_purchased: false,
        propertyId_quantity: 6,
        propertyId_type: ['itemId_produce'],
      },
      itemId_shopping_2: {
        propertyId_item: 'Pasta',
        propertyId_purchased: false,
        propertyId_quantity: 2,
        propertyId_type: ['itemId_pantry'],
      },
      itemId_shopping_3: {
        propertyId_item: 'Dish soap',
        propertyId_purchased: true,
        propertyId_quantity: 1,
        propertyId_type: ['itemId_household'],
      },
      itemId_shopping_4: {
        propertyId_item: 'Vitamin D',
        propertyId_purchased: false,
        propertyId_quantity: 1,
        propertyId_type: ['itemId_pharmacy'],
      },
      itemId_shopping_5: {
        propertyId_item: 'Wall hooks',
        propertyId_purchased: false,
        propertyId_quantity: 4,
        propertyId_type: ['itemId_hardware'],
      },
    });
    expect(shoppingList.body.properties).toEqual({
      propertyId_item: { name: 'Item', type: 'string' },
      propertyId_purchased: {
        default: false,
        name: 'Purchased',
        type: 'boolean',
      },
      propertyId_quantity: { name: 'Qty', type: 'number' },
      propertyId_type: {
        name: 'Type',
        relation: {
          documentId: purchaseTypesDocumentId,
          viewId: purchaseTypesStarterExample.defaultViewId,
        },
        type: 'relation',
      },
    });
    expect(shoppingList.body.views).toEqual({
      viewId_allItems: {
        layout: 'table',
        name: 'All items',
        order: 0,
        sorting: {
          propertyId_purchased: { direction: 0, priority: 0 },
          propertyId_type: { direction: 0, priority: 1 },
        },
      },
      viewId_supermarket: {
        filter: {
          $or: [
            { propertyId_type: { $eq: ['itemId_produce'] } },
            { propertyId_type: { $eq: ['itemId_pantry'] } },
            { propertyId_type: { $eq: ['itemId_household'] } },
          ],
        },
        layout: 'table',
        name: 'Supermarket',
        order: 1,
      },
      viewId_pharmacy: {
        filter: {
          propertyId_type: { $eq: ['itemId_pharmacy'] },
        },
        layout: 'table',
        name: 'Pharmacy',
        order: 2,
      },
      viewId_hardware: {
        filter: {
          propertyId_type: { $eq: ['itemId_hardware'] },
        },
        layout: 'table',
        name: 'Hardware',
        order: 3,
      },
    });
    expect(relationProperty).toMatchObject({
      name: 'Type',
      relation: {
        documentId: purchaseTypesDocumentId,
        viewId: purchaseTypesStarterExample.defaultViewId,
      },
    });

    const shoppingViews = Object.values(shoppingList.body.views).map((view) => view.name);

    expect(shoppingViews).toEqual(['All items', 'Supermarket', 'Pharmacy', 'Hardware']);
  });
});
