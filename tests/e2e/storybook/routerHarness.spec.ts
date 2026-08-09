import { expect, test } from '@playwright/test';
import { openStory } from './storybook.testUtils';

const STORY_ID = 'shared-lib-router-routerharnessregression--default';

test('starts at the story-declared deterministic route with path, query, hash, and params', async ({
  page,
}) => {
  await openStory(page, STORY_ID);

  await expect(page.getByTestId('router-harness-path')).toHaveText('/detail/42');
  await expect(page.getByTestId('router-harness-query-tab')).toHaveText('overview');
  await expect(page.getByTestId('router-harness-hash')).toHaveText('#top');
  await expect(page.getByTestId('router-harness-param-id')).toHaveText('42');
});

test('RouterLink navigates and back/forward restore the prior and next locations', async ({
  page,
}) => {
  await openStory(page, STORY_ID);

  await page.getByTestId('router-harness-link').click();
  await expect(page.getByTestId('router-harness-path')).toHaveText('/');

  await page.getByTestId('router-harness-back').click();
  await expect(page.getByTestId('router-harness-path')).toHaveText('/detail/42');

  await page.getByTestId('router-harness-forward').click();
  await expect(page.getByTestId('router-harness-path')).toHaveText('/');
});

test('push updates path/query/hash, and reopening the story resets to the deterministic initial location', async ({
  page,
}) => {
  await openStory(page, STORY_ID);

  await page.getByTestId('router-harness-push').click();
  await expect(page.getByTestId('router-harness-path')).toHaveText('/detail/99');
  await expect(page.getByTestId('router-harness-query-tab')).toHaveText('updated');
  await expect(page.getByTestId('router-harness-hash')).toHaveText('#bottom');

  // Reopening the story gets a fresh Vue app and router instance (docs/testing/storybook.md
  // "route/history isolation when switching between stories"), so the previous interaction's
  // navigation state must not leak in.
  await openStory(page, STORY_ID);
  await expect(page.getByTestId('router-harness-path')).toHaveText('/detail/42');
});
