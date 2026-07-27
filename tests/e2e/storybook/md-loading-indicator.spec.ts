import { expect, test } from '@playwright/test';
import { openStory } from './storybook.testUtils';

test('MDLoadingIndicator resolves the progressbar role and accessible purpose label in the browser accessibility tree', async ({
  page,
}) => {
  await openStory(page, 'material-3-components-loading-indicator-mdloadingindicator--default');

  const indicator = page.getByRole('progressbar', { name: 'Loading' });

  await expect(indicator).toBeVisible();
});
