import { expect, test } from '@playwright/test';
import { openStory } from './storybook.testUtils';

test('MDButton default story renders an interactive, focusable button', async ({ page }) => {
  await openStory(page, 'shared-ui-mdbutton--default');

  const button = page.getByRole('button', { name: 'Save' });

  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();

  await button.focus();

  await expect(button).toBeFocused();
});
