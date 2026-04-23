import { describe, expect, it } from 'vitest';
import { PROPERTY_TYPE_RELATION } from '@entity/databaseRelation/model';
import { zodCFRDocumentContent } from '@shared/lib/cfrDocument';
import {
  createPurchaseTypesExampleDocument,
  createShoppingListExampleDocument,
  createStatusesExampleDocument,
  createWeeklyPlanExampleDocument,
  zodDatabaseState,
} from './index';

type RawExampleBody = {
  properties: Record<
    string,
    {
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
      name?: string;
    }
  >;
};

const isRawExampleBody = (value: unknown): value is RawExampleBody =>
  typeof value === 'object' &&
  value !== null &&
  'properties' in value &&
  typeof value.properties === 'object' &&
  value.properties !== null &&
  'views' in value &&
  typeof value.views === 'object' &&
  value.views !== null;

describe('exampleDocuments', () => {
  it('builds valid weekly plan and statuses example documents with linked relation metadata', () => {
    const statuses = createStatusesExampleDocument();
    const statusesDocumentId = 'status-doc-id';
    const weeklyPlan = createWeeklyPlanExampleDocument({
      documentId: statusesDocumentId,
      viewId: statuses.defaultViewId,
      itemIds: statuses.itemIds,
    });

    expect(zodCFRDocumentContent.safeParse(statuses.content).success).toBe(true);
    expect(zodCFRDocumentContent.safeParse(weeklyPlan).success).toBe(true);
    expect(zodDatabaseState.safeParse(statuses.content.body).success).toBe(true);
    expect(zodDatabaseState.safeParse(weeklyPlan.body).success).toBe(true);

    if (!isRawExampleBody(weeklyPlan.body)) {
      throw new Error('Expected raw weekly plan body');
    }

    const relationProperty = Object.values(weeklyPlan.body.properties).find(
      (property) => property.type === PROPERTY_TYPE_RELATION,
    );

    expect(relationProperty).toMatchObject({
      name: 'Status',
      relation: {
        documentId: statusesDocumentId,
        viewId: statuses.defaultViewId,
      },
    });
  });

  it('builds valid shopping and purchase types example documents with multiple store views', () => {
    const purchaseTypes = createPurchaseTypesExampleDocument();
    const purchaseTypesDocumentId = 'purchase-types-doc-id';
    const shoppingList = createShoppingListExampleDocument({
      documentId: purchaseTypesDocumentId,
      viewId: purchaseTypes.defaultViewId,
      itemIds: purchaseTypes.itemIds,
    });

    expect(zodCFRDocumentContent.safeParse(purchaseTypes.content).success).toBe(true);
    expect(zodCFRDocumentContent.safeParse(shoppingList).success).toBe(true);
    expect(zodDatabaseState.safeParse(purchaseTypes.content.body).success).toBe(true);
    expect(zodDatabaseState.safeParse(shoppingList.body).success).toBe(true);

    if (!isRawExampleBody(shoppingList.body)) {
      throw new Error('Expected raw shopping list body');
    }

    const relationProperty = Object.values(shoppingList.body.properties).find(
      (property) => property.type === PROPERTY_TYPE_RELATION,
    );

    expect(relationProperty).toMatchObject({
      name: 'Type',
      relation: {
        documentId: purchaseTypesDocumentId,
        viewId: purchaseTypes.defaultViewId,
      },
    });

    const shoppingViews = Object.values(shoppingList.body.views).map((view) => view.name);

    expect(shoppingViews).toEqual(['All items', 'Supermarket', 'Pharmacy', 'Hardware']);
  });
});
